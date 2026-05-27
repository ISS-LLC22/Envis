from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import ISLogEntry
from ..services.stakeholder_router import route_for_stakeholder, get_all_stakeholder_views, STAKEHOLDER_TEMPLATES

router = APIRouter(prefix="/stakeholders", tags=["stakeholders"])

VALID_STAKEHOLDERS = list(STAKEHOLDER_TEMPLATES.keys())


@router.get("/types")
async def list_stakeholder_types():
    return [
        {"id": k, "label": v["label"], "focus": v["focus"], "jargon_level": v["jargon_level"]}
        for k, v in STAKEHOLDER_TEMPLATES.items()
    ]


@router.get("/islog/{entry_id}/{stakeholder}")
async def stakeholder_view(
    entry_id: int,
    stakeholder: str,
    db: AsyncSession = Depends(get_db),
):
    if stakeholder not in VALID_STAKEHOLDERS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid stakeholder. Valid options: {VALID_STAKEHOLDERS}",
        )

    result = await db.execute(select(ISLogEntry).where(ISLogEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="IS-Log entry not found")

    entry_dict = {
        "id": entry.id,
        "domain": entry.domain,
        "prediction": entry.prediction,
        "confidence_score": entry.confidence_score,
        "uncertainty_band": entry.uncertainty_band,
        "data_sources": entry.data_sources,
        "missing_data_flags": entry.missing_data_flags,
        "era_stratum": entry.era_stratum,
        "stakeholder_outputs": entry.stakeholder_outputs,
        "hit_miss": entry.hit_miss,
        "brier_score": entry.brier_score,
        "timestamp_issued": entry.timestamp_issued.isoformat() if entry.timestamp_issued else None,
        "outside_confidence_range": False,
    }

    return route_for_stakeholder(entry_dict, stakeholder)


@router.get("/islog/{entry_id}/all")
async def all_stakeholder_views(entry_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ISLogEntry).where(ISLogEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="IS-Log entry not found")

    entry_dict = {
        "id": entry.id,
        "domain": entry.domain,
        "prediction": entry.prediction,
        "confidence_score": entry.confidence_score,
        "uncertainty_band": entry.uncertainty_band,
        "data_sources": entry.data_sources,
        "missing_data_flags": entry.missing_data_flags,
        "era_stratum": entry.era_stratum,
        "stakeholder_outputs": entry.stakeholder_outputs,
        "hit_miss": entry.hit_miss,
        "brier_score": entry.brier_score,
        "timestamp_issued": entry.timestamp_issued.isoformat() if entry.timestamp_issued else None,
        "outside_confidence_range": False,
    }

    return get_all_stakeholder_views(entry_dict)
