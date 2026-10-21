"""Database backed opaque sessions; passwords use salted scrypt, never plaintext."""
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.investigation import Account, LoginSession


def password_hash(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()
    return f"{salt}:{digest}"


def password_matches(password: str, stored: str) -> bool:
    return hmac.compare_digest(password_hash(password, stored.split(":")[0]), stored)


def issue_session(db: Session, account: Account) -> str:
    token = secrets.token_urlsafe(32)
    db.add(LoginSession(token_hash=hashlib.sha256(token.encode()).hexdigest(), account_id=account.id,
                        expires_at=datetime.utcnow() + timedelta(hours=8)))
    db.commit()
    return token


def current_account(request: Request, db: Session = Depends(get_db)) -> Account:
    token = request.cookies.get("guardrail_session", "")
    session = db.get(LoginSession, hashlib.sha256(token.encode()).hexdigest())
    if not session or session.expires_at < datetime.utcnow():
        raise HTTPException(401, "Sign in to continue.")
    account = db.get(Account, session.account_id)
    if not account or not account.active:
        raise HTTPException(401, "Account is unavailable.")
    return account


def require_roles(*roles: str):
    def dependency(account: Account = Depends(current_account)) -> Account:
        if account.role not in roles:
            raise HTTPException(403, "Your role cannot perform this action.")
        return account
    return dependency


def seed_accounts(db: Session, password: str) -> None:
    if not password:
        return
    if len(password) < 12:
        raise ValueError("BOOTSTRAP_PASSWORD must contain at least 12 characters.")
    for name, role in [("analyst", "analyst"), ("reviewer", "reviewer"), ("admin", "admin")]:
        if not db.scalar(select(Account).where(Account.username == name)):
            db.add(Account(username=name, role=role, password_hash=password_hash(password)))
    db.commit()
