from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import delete, select
from sqlalchemy.orm import Session
from app.core.auth import current_account, password_hash, password_matches, require_roles
from app.core.database import get_db
from app.models.investigation import Account, LoginSession

router = APIRouter(tags=["accounts"])

class AccountRequest(BaseModel):
    username: str = Field(pattern=r"^[a-zA-Z0-9._-]{3,80}$")
    password: str = Field(min_length=12, max_length=200)
    role: Literal["analyst", "reviewer", "admin"]

class PasswordRequest(BaseModel):
    old_password: str = Field(max_length=200)
    new_password: str = Field(min_length=12, max_length=200)

@router.post("/accounts", status_code=201)
def add_account(payload: AccountRequest, db: Session = Depends(get_db), account: Account = Depends(require_roles("admin"))):
    if db.scalar(select(Account).where(Account.username == payload.username)):
        raise HTTPException(409, "Username already exists.")
    created = Account(username=payload.username, role=payload.role, password_hash=password_hash(payload.password))
    db.add(created)
    db.commit()
    return {"username": created.username, "role": created.role}

@router.post("/auth/password")
def change_password(payload: PasswordRequest, db: Session = Depends(get_db), account: Account = Depends(current_account)):
    if not password_matches(payload.old_password, account.password_hash):
        raise HTTPException(401, "Current password is incorrect.")
    account.password_hash = password_hash(payload.new_password)
    db.execute(delete(LoginSession).where(LoginSession.account_id == account.id))
    db.commit()
    return {"message": "Password changed. Sign in again."}
