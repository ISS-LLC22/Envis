from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..database import get_db
from ..models import ISLogEntry, HitMissEnum
from ..schemas import NCEIVerificationRequest
from ..services.ncei_verification import fetch_storm_events, verify_prediction

router = APIRouter(prefix="/verification", tags=["verification"])


@router.get("/storm-events")
async def storm_events(
    event_type: str = "Tornado",
    state: str = None,
    begin_year: int = None,
    end_year: int = None,
):
    return await fetch_storm_events(event_type, state, begin_year, end_year)


@router.post("/verify/{entry_id}")
async def verify_islog_entry(entry_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ISLogEntry).where(ISLogEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="IS-Log entry not found")

    verification = await verify_prediction(
        prediction_text=entry.prediction,
        confidence_score=entry.confidence_score,
        observed_outcome=entry.observed_outcome,
    )

    if verification["status"] == "verified":
        entry.brier_score = verification.get("brier_score")
        entry.hit_miss = HitMissEnum(verification.get("hit_miss", "pending"))
        entry.learning_delta = verification.get("learning_delta")
        await db.flush()

    return verification


@router.get("/leaderboard")
async def accuracy_leaderboard(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func
    from ..models import DomainEnum

    rows = []
    for domain in DomainEnum:
        q = select(
            func.count(ISLogEntry.id).label("count"),
            func.avg(ISLogEntry.confidence_score).label("avg_confidence"),
            func.avg(ISLogEntry.brier_score).label("avg_brier"),
        ).where(ISLogEntry.domain == domain)
        result = await db.execute(q)
        row = result.one()
        if row.count:
            rows.append({
                "domain": domain.value,
                "count": row.count,
                "avg_confidence": round(float(row.avg_confidence or 0), 3),
                "avg_brier_score": round(float(row.avg_brier or 0), 4) if row.avg_brier else None,
            })

    return sorted(rows, key=lambda r: (r["avg_brier_score"] or 1), reverse=False)
