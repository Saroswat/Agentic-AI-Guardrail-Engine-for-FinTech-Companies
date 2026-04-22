from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class PolicyRule(BaseModel):
    name: str
    description: str
    severity: str
    threshold: float = Field(ge=0)
    rule_type: str
    enabled: bool


class PolicyVersionResponse(BaseModel):
    version: str
    name: str
    description: str
    is_active: bool
    created_by: str
    created_at: datetime
    updated_at: datetime
    rules: list[PolicyRule]


class PolicyUpdateRequest(BaseModel):
    name: str
    description: str
    rules: list[PolicyRule]
    created_by: str = "policy-admin"

