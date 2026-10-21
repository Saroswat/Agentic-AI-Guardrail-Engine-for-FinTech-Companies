import json
from unittest.mock import MagicMock, patch

import httpx

from app.models.investigation import Investigation
from app.services.investigation_engine import demo_brief, live_brief, validate_brief


def test_live_provider_executes_scoped_tool_then_parses_structured_output(db_session, monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("OPENAI_MODEL", "test-model")
    snapshot = {"hard_decision": "REJECT", "evidence_score": .9, "evidence": [{"id": "case-input", "text": "Facts", "kind": "case"}, {"id": "policy-active", "text": "Policy rules", "kind": "policy"}]}
    run = Investigation(id="mock-live-run", case_id="mock-case", created_by="analyst", objective="Investigate the alert.", provider="openai", revision=1)
    responses = [
        {"output": [{"type": "function_call", "name": "read_evidence", "arguments": '{"kind":"all"}', "call_id": "call-1"}], "usage": {"total_tokens": 100}},
        {"output": [{"type": "message", "content": [{"type": "output_text", "text": json.dumps(demo_brief(snapshot))}]}], "usage": {"total_tokens": 150}},
    ]
    requests = []
    def handler(request):
        requests.append(json.loads(request.content))
        return httpx.Response(200, json=responses.pop(0))
    mock = httpx.Client(transport=httpx.MockTransport(handler))
    with patch("app.services.investigation_engine.httpx.Client", return_value=mock), patch("app.services.investigation_engine.event"), patch.object(db_session, "commit"):
        brief, usage = live_brief(db_session, run, snapshot)
    assert validate_brief(brief, snapshot).proposed_action == "escalate"
    assert usage["total_tokens"] == 250
    assert requests[0]["tool_choice"] == "required"
    assert any(item.get("type") == "function_call_output" for item in requests[1]["input"])
    assert requests[0]["store"] is False
