from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import PolicyVersion
from app.schemas.policies import PolicyUpdateRequest, PolicyVersionResponse
from app.services.policy_engine import get_active_policy_version, increment_policy_version

router = APIRouter(prefix="/policies", tags=["policies"])


@router.get("", response_model=PolicyVersionResponse)
def get_policies(db: Session = Depends(get_db)) -> PolicyVersionResponse:
    policy = get_active_policy_version(db)
    return PolicyVersionResponse(
        version=policy.version,
        name=policy.name,
        description=policy.description,
        is_active=policy.is_active,
        created_by=policy.created_by,
        created_at=policy.created_at,
        updated_at=policy.updated_at,
        rules=policy.rules_json,
    )


@router.post("/update", response_model=PolicyVersionResponse)
def update_policies(payload: PolicyUpdateRequest, db: Session = Depends(get_db)) -> PolicyVersionResponse:
    try:
        current = get_active_policy_version(db)
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    db.execute(update(PolicyVersion).where(PolicyVersion.id == current.id).values(is_active=False))
    new_policy = PolicyVersion(
        version=increment_policy_version(current.version),
        name=payload.name,
        description=payload.description,
        rules_json=[rule.model_dump() for rule in payload.rules],
        is_active=True,
        created_by=payload.created_by,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)

    return PolicyVersionResponse(
        version=new_policy.version,
        name=new_policy.name,
        description=new_policy.description,
        is_active=new_policy.is_active,
        created_by=new_policy.created_by,
        created_at=new_policy.created_at,
        updated_at=new_policy.updated_at,
        rules=new_policy.rules_json,
    )

