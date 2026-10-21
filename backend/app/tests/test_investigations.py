from datetime import datetime, timedelta
from unittest.mock import patch

import pytest
from sqlalchemy import select

from app.core.auth import seed_accounts
from app.core.database import SessionLocal
from app.models.investigation import Investigation, InvestigationReview
from app.services.investigation_engine import demo_brief, validate_brief
from app.services.investigation_worker import process_one
from app.services.intake_service import create_case
from app.tests.test_escalation_logic import ensure_policies, make_submission

PASSWORD = "test-password-321!"


def sign_in(client, username):
    response = client.post("/auth/login", json={"username": username, "password": PASSWORD})
    assert response.status_code == 200


@pytest.fixture
def investigation_case(db_session):
    seed_accounts(db_session, PASSWORD)
    ensure_policies(db_session)
    return create_case(db_session, make_submission()).case_id


def start(client, case_id):
    sign_in(client, "analyst")
    response = client.post("/investigations", json={"case_id": case_id})
    assert response.status_code == 202, response.text
    return response.json()["id"]


def test_end_to_end_independent_review_and_export(client, investigation_case):
    run_id = start(client, investigation_case)
    assert process_one()
    run = client.get(f"/investigations/{run_id}").json()
    assert run["status"] == "awaiting_review", run
    assert run["snapshot"]["evidence"]
    payload = {"proposal_hash": run["proposal_hash"], "decision": "approve", "note": "Evidence and control checks reviewed."}
    assert client.post(f"/investigations/{run_id}/review", json=payload).status_code == 403
    sign_in(client, "reviewer")
    assert client.post(f"/investigations/{run_id}/review", json={**payload, "proposal_hash": "0" * 64}).status_code == 409
    assert client.post(f"/investigations/{run_id}/review", json=payload).status_code == 200
    assert client.post(f"/investigations/{run_id}/review", json=payload).status_code == 409
    report = client.get(f"/investigations/{run_id}/export")
    assert report.json()["status"] == "approved"
    assert report.json()["reviews"][0]["reviewer"] == "reviewer"
    assert "attachment" in report.headers["content-disposition"]


def test_request_changes_preserves_snapshot_and_old_review(client, investigation_case):
    run_id = start(client, investigation_case)
    process_one()
    before = client.get(f"/investigations/{run_id}").json()
    sign_in(client, "reviewer")
    response = client.post(f"/investigations/{run_id}/review", json={"proposal_hash": before["proposal_hash"], "decision": "request_changes", "note": "Please clarify the missing transaction evidence."})
    assert response.status_code == 200
    process_one()
    after = client.get(f"/investigations/{run_id}").json()
    assert after["snapshot"] == before["snapshot"]
    assert after["proposal_hash"] != before["proposal_hash"]
    assert after["revision"] == 2
    assert len(after["reviews"]) == 1


def test_auth_and_role_boundaries(client, investigation_case):
    assert client.get("/cases").status_code == 401
    assert client.get("/investigations").status_code == 401
    assert client.post("/auth/login", headers={"Origin": "https://evil.example"}, json={"username": "analyst", "password": PASSWORD}).status_code == 403
    sign_in(client, "reviewer")
    assert client.post("/investigations", json={"case_id": investigation_case}).status_code == 403
    sign_in(client, "analyst")
    assert client.post("/evidence", json={"title": "Test policy", "text": "A policy with sufficient evidence text.", "kind": "policy"}).status_code == 403
    client.post("/auth/logout")
    assert client.get("/auth/me").status_code == 401


def test_worker_failure_retry_and_lease_recovery(client, investigation_case):
    run_id = start(client, investigation_case)
    with patch("app.services.investigation_worker.demo_brief", side_effect=ValueError("Transient failure")):
        process_one()
    assert client.get(f"/investigations/{run_id}").json()["status"] == "failed"
    assert client.post(f"/investigations/{run_id}/retry").status_code == 202
    with SessionLocal() as db:
        run = db.get(Investigation, run_id)
        run.status = "running"
        run.lease_until = datetime.utcnow() - timedelta(seconds=1)
        db.commit()
    process_one()
    assert client.get(f"/investigations/{run_id}").json()["status"] == "awaiting_review"
    assert not process_one()


def test_unknown_citations_and_policy_bypass_are_rejected():
    snapshot = {"hard_decision": "REJECT", "evidence_score": .9, "evidence": [{"id": "case-input", "text": "Facts"}, {"id": "policy-active", "text": "Policy rules"}]}
    brief = demo_brief(snapshot)
    validate_brief(brief, snapshot)
    brief["findings"][0]["evidence_ids"] = ["invented"]
    with pytest.raises(ValueError, match="citation"):
        validate_brief(brief, snapshot)
    brief = demo_brief(snapshot)
    brief["proposed_action"] = "close_alert"
    with pytest.raises(ValueError, match="control"):
        validate_brief(brief, snapshot)


def test_admin_policy_ingestion_is_deduplicated(client, investigation_case):
    sign_in(client, "admin")
    payload = {"title": "Wire evidence requirements", "kind": "policy", "text": "Wire investigations must capture source of funds and beneficiary verification."}
    first = client.post("/evidence", json=payload)
    second = client.post("/evidence", json=payload)
    assert first.status_code == 201
    assert first.json()["id"] == second.json()["id"]
    assert len(client.get("/evidence").json()) == 1
