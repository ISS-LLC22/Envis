from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from typing import Optional
from ..database import get_db
from ..models import ISLogEntry, DomainEnum, HitMissEnum
from ..schemas import ISLogCreate, ISLogUpdate, ISLogOut

router = APIRouter(prefix="/islog", tags=["islog"])


@router.post("/", response_model=ISLogOut)
async def create_entry(payload: ISLogCreate, db: AsyncSession = Depends(get_db)):
    entry = ISLogEntry(**payload.model_dump())
    db.add(entry)
    await db.flush()
    await db.refresh(entry)
    return entry


@router.get("/", response_model=list[ISLogOut])
async def list_entries(
    domain: Optional[DomainEnum] = None,
    hit_miss: Optional[HitMissEnum] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    q = select(ISLogEntry).order_by(desc(ISLogEntry.timestamp_issued))
    if domain:
        q = q.where(ISLogEntry.domain == domain)
    if hit_miss:
        q = q.where(ISLogEntry.hit_miss == hit_miss)
    q = q.offset(offset).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/stats")
async def islog_stats(db: AsyncSession = Depends(get_db)):
    total = await db.scalar(select(func.count()).select_from(ISLogEntry))
    hits = await db.scalar(
        select(func.count()).select_from(ISLogEntry).where(ISLogEntry.hit_miss == HitMissEnum.hit)
    )
    misses = await db.scalar(
        select(func.count()).select_from(ISLogEntry).where(ISLogEntry.hit_miss == HitMissEnum.miss)
    )
    avg_confidence = await db.scalar(select(func.avg(ISLogEntry.confidence_score)))
    avg_brier = await db.scalar(
        select(func.avg(ISLogEntry.brier_score)).where(ISLogEntry.brier_score.isnot(None))
    )

    return {
        "total_entries": total or 0,
        "hits": hits or 0,
        "misses": misses or 0,
        "pending": (total or 0) - (hits or 0) - (misses or 0),
        "hit_rate": round((hits or 0) / total, 3) if total else 0,
        "avg_confidence": round(float(avg_confidence or 0), 3),
        "avg_brier_score": round(float(avg_brier or 0), 4) if avg_brier else None,
    }


@router.get("/{entry_id}", response_model=ISLogOut)
async def get_entry(entry_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ISLogEntry).where(ISLogEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="IS-Log entry not found")
    return entry


@router.patch("/{entry_id}", response_model=ISLogOut)
async def update_entry(entry_id: int, payload: ISLogUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ISLogEntry).where(ISLogEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="IS-Log entry not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(entry, field, value)

    await db.flush()
    await db.refresh(entry)
    return entry
