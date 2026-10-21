"""Protect legacy APIs as well as the investigation endpoints."""
from fastapi import HTTPException, Request
from app.core.auth import current_account
from app.core.database import SessionLocal
from app.core.config import get_settings


def guard_api(request: Request):
    if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
        origin = request.headers.get("origin")
        if origin and origin not in get_settings().cors_origin_list:
            raise HTTPException(403, "Origin is not allowed.")
    if request.url.path in {"/health", "/auth/login"}:
        return
    with SessionLocal() as db:
        account = current_account(request, db)
        if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            path = request.url.path
            if path.startswith("/policies") and account.role != "admin":
                raise HTTPException(403, "Policy changes require an administrator.")
            if path.startswith("/reviews") and account.role not in {"reviewer", "admin"}:
                raise HTTPException(403, "Case review requires a reviewer.")
            if path.startswith("/cases") and account.role not in {"analyst", "admin"}:
                raise HTTPException(403, "Case changes require an analyst.")
