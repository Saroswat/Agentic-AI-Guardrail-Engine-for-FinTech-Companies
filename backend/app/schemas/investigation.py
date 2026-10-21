from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=200)


class DocumentRequest(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    kind: Literal["policy", "transaction", "supporting"] = "supporting"
    text: str = Field(min_length=20, max_length=100000)


class StartRequest(BaseModel):
    case_id: str = Field(min_length=1, max_length=32)
    objective: str = Field(default="Investigate this transaction alert and propose the next analyst action.", min_length=10, max_length=2000)
    provider: Literal["demo", "openai"] = "demo"


class ReviewRequest(BaseModel):
    proposal_hash: str = Field(min_length=64, max_length=64)
    decision: Literal["approve", "request_changes", "reject"]
    note: str = Field(min_length=10, max_length=2000)


class Finding(BaseModel):
    model_config = ConfigDict(extra="forbid")
    claim: str
    evidence_ids: list[str]
    quote: str


class InvestigationBrief(BaseModel):
    model_config = ConfigDict(extra="forbid")
    summary: str
    findings: list[Finding]
    missing_evidence: list[str]
    proposed_action: Literal["close_alert", "request_information", "escalate"]
    rationale: str
