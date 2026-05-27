from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field
from .models import DomainEnum, HitMissEnum


class ISLogCreate(BaseModel):
    domain: DomainEnum
    prediction: str
    data_sources: list[str] = []
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    uncertainty_band: dict[str, float] = {}
    missing_data_flags: list[str] = []
    era_stratum: Optional[str] = None
    stakeholder_outputs: dict[str, Any] = {}
    cross_domain_chain: list[int] = []


class ISLogUpdate(BaseModel):
    observed_outcome: Optional[str] = None
    hit_miss: Optional[HitMissEnum] = None
    brier_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    gap_flags_post: Optional[list[str]] = None
    learning_delta: Optional[float] = None


class ISLogOut(BaseModel):
    id: int
    domain: DomainEnum
    timestamp_issued: datetime
    prediction: str
    data_sources: list[str]
    confidence_score: float
    uncertainty_band: dict[str, Any]
    missing_data_flags: list[str]
    era_stratum: Optional[str]
    stakeholder_outputs: dict[str, Any]
    observed_outcome: Optional[str]
    hit_miss: HitMissEnum
    brier_score: Optional[float]
    gap_flags_post: list[str]
    learning_delta: Optional[float]
    cross_domain_chain: list[int]
    created_at: datetime

    model_config = {"from_attributes": True}


class NWSAlertOut(BaseModel):
    id: int
    alert_id: str
    event: str
    headline: Optional[str]
    severity: Optional[str]
    urgency: Optional[str]
    certainty: Optional[str]
    area_desc: Optional[str]
    effective: Optional[datetime]
    expires: Optional[datetime]
    status: str
    ingested_at: datetime

    model_config = {"from_attributes": True}


class WizardRequest(BaseModel):
    query: str
    domain: Optional[DomainEnum] = None
    context: Optional[str] = None
    auto_log: bool = True


class WizardResponse(BaseModel):
    answer: str
    confidence_score: float
    uncertainty_band: dict[str, float]
    data_sources: list[str]
    missing_data_flags: list[str]
    era_stratum: Optional[str]
    stakeholder_outputs: dict[str, str]
    is_log_id: Optional[int]
    outside_confidence_range: bool
    discipline_flags: list[str]


class StakeholderViewRequest(BaseModel):
    is_log_id: int
    stakeholder: str


class NCEIVerificationRequest(BaseModel):
    event_type: str
    state: Optional[str] = None
    begin_year: Optional[int] = None
    end_year: Optional[int] = None
