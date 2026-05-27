from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    Text, JSON, Enum as SAEnum
)
import enum
from .database import Base


class DomainEnum(str, enum.Enum):
    meteorology = "meteorology"
    hydrology = "hydrology"
    air_quality = "air_quality"
    wildfire = "wildfire"
    public_health = "public_health"
    infrastructure = "infrastructure"
    agriculture = "agriculture"
    multi_domain = "multi_domain"


class HitMissEnum(str, enum.Enum):
    hit = "hit"
    miss = "miss"
    partial = "partial"
    pending = "pending"


class ISLogEntry(Base):
    __tablename__ = "is_log"

    id = Column(Integer, primary_key=True, index=True)
    domain = Column(SAEnum(DomainEnum), nullable=False, index=True)
    timestamp_issued = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    prediction = Column(Text, nullable=False)
    data_sources = Column(JSON, default=list)          # list of source strings
    confidence_score = Column(Float, nullable=False)   # 0.0–1.0
    uncertainty_band = Column(JSON, default=dict)      # {"low": x, "high": y}
    missing_data_flags = Column(JSON, default=list)    # list of gap strings
    era_stratum = Column(String(64), nullable=True)    # e.g. "1950-1979", "2000-present"
    stakeholder_outputs = Column(JSON, default=dict)   # keyed by stakeholder type
    observed_outcome = Column(Text, nullable=True)
    hit_miss = Column(SAEnum(HitMissEnum), default=HitMissEnum.pending)
    brier_score = Column(Float, nullable=True)         # probabilistic accuracy 0–1
    gap_flags_post = Column(JSON, default=list)        # gaps identified after the fact
    learning_delta = Column(Float, nullable=True)      # improvement signal
    cross_domain_chain = Column(JSON, default=list)    # linked IS-Log IDs
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class NWSAlert(Base):
    __tablename__ = "nws_alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(256), unique=True, index=True)
    event = Column(String(128), nullable=False)
    headline = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    instruction = Column(Text, nullable=True)
    severity = Column(String(32), nullable=True)
    urgency = Column(String(32), nullable=True)
    certainty = Column(String(32), nullable=True)
    area_desc = Column(Text, nullable=True)
    effective = Column(DateTime, nullable=True)
    expires = Column(DateTime, nullable=True)
    status = Column(String(32), default="active")
    raw_json = Column(JSON, nullable=True)
    ingested_at = Column(DateTime, default=datetime.utcnow)
