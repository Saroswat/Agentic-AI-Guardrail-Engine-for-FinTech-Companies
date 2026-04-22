import os
import shutil
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

os.environ["DATABASE_URL"] = "sqlite:///./test_agentic_guardrail.db"
os.environ["AUDIT_EXPORT_DIR"] = "./test_audit_exports"
os.environ["SEED_ON_STARTUP"] = "false"

from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models import PolicyVersion  # noqa: E402
from app.utils.demo_policies import build_policy_versions_seed  # noqa: E402


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    db_path = Path("test_agentic_guardrail.db")
    if db_path.exists():
        db_path.unlink()
    shutil.rmtree("test_audit_exports", ignore_errors=True)


@pytest.fixture
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def seeded_policies(db_session):
    if db_session.query(PolicyVersion).count() == 0:
        for policy in build_policy_versions_seed():
            db_session.add(PolicyVersion(**policy))
        db_session.commit()
    return db_session
