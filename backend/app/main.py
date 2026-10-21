from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import Base, SessionLocal, engine
from app.routes.audit import router as audit_router
from app.routes.cases import router as cases_router
from app.routes.dashboard import router as dashboard_router
from app.routes.health import router as health_router
from app.routes.policies import router as policies_router
from app.routes.reviews import router as reviews_router
from app.seed import seed_demo_data
from app.core.access import guard_api
from app.core.auth import seed_accounts
from app.routes.investigations import router as investigations_router
from app.routes.accounts import router as accounts_router
from app.models import investigation  # register durable workflow tables
import os


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    if settings.app_env != "production":
        Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_accounts(db, os.getenv("BOOTSTRAP_PASSWORD", ""))
    if settings.seed_on_startup:
        db = SessionLocal()
        try:
            seed_demo_data(db)
        finally:
            db.close()
    yield


settings = get_settings()
app = FastAPI(title=settings.project_name, lifespan=lifespan, dependencies=[Depends(guard_api)])

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(dashboard_router)
app.include_router(cases_router)
app.include_router(reviews_router)
app.include_router(policies_router)
app.include_router(audit_router)
app.include_router(investigations_router)
app.include_router(accounts_router)
