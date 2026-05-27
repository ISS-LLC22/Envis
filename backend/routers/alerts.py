from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Optional
from ..database import get_db
from ..models import NWSAlert
from ..schemas import NWSAlertOut
from ..services.nws_ingest import ingest_alerts, get_alert_summary

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.post("/ingest")
async def trigger_ingest(
    area: Optional[str] = Query(None, description="Two-letter state code, e.g. TX"),
    db: AsyncSession = Depends(get_db),
):
    result = await ingest_alerts(db, area)
    return result


@router.get("/active", response_model=list[NWSAlertOut])
async def list_active_alerts(
    limit: int = Query(50, le=200),
    offset: int = 0,
    severity: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(NWSAlert).where(NWSAlert.status == "active").order_by(desc(NWSAlert.ingested_at))
    if severity:
        q = q.where(NWSAlert.severity == severity)
    q = q.offset(offset).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/summary")
async def alert_summary(db: AsyncSession = Depends(get_db)):
    return await get_alert_summary(db)


@router.get("/{alert_id}", response_model=NWSAlertOut)
async def get_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(NWSAlert).where(NWSAlert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert
