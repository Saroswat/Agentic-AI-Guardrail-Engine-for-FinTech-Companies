from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    settings = get_settings()
    if settings.seed_on_startup:
        db = SessionLocal()
        try:
            seed_demo_data(db)
        finally:
            db.close()
    yield


settings = get_settings()
app = FastAPI(title=settings.project_name, lifespan=lifespan)

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
