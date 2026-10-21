from datetime import datetime, timedelta
from sqlalchemy import select
from app.models.investigation import Account, LoginSession
from app.tests.test_investigations import PASSWORD, sign_in
from app.core.auth import seed_accounts


def test_password_rotation_revokes_sessions_and_admin_creates_users(client, db_session):
    seed_accounts(db_session, PASSWORD)
    sign_in(client, "admin")
    response = client.post("/accounts", json={"username": "new-analyst", "password": "different-test-password", "role": "analyst"})
    assert response.status_code == 201
    assert client.post("/accounts", json={"username": "new-analyst", "password": "different-test-password", "role": "analyst"}).status_code == 409
    assert client.post("/auth/password", json={"old_password": PASSWORD, "new_password": "replacement-password-321"}).status_code == 200
    assert client.get("/auth/me").status_code == 401
    assert client.post("/auth/login", json={"username": "admin", "password": PASSWORD}).status_code == 401
    assert client.post("/auth/login", json={"username": "admin", "password": "replacement-password-321"}).status_code == 200


def test_expired_session_cannot_read_cases(client, db_session):
    seed_accounts(db_session, PASSWORD)
    sign_in(client, "analyst")
    for session in db_session.scalars(select(LoginSession)):
        session.expires_at = datetime.utcnow() - timedelta(seconds=1)
    db_session.commit()
    assert client.get("/cases").status_code == 401
