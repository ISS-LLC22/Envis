import httpx
from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models import NWSAlert
from ..config import settings

NWS_BASE = "https://api.weather.gov"


async def fetch_active_alerts(area: Optional[str] = None) -> list[dict]:
    headers = {"User-Agent": settings.NWS_USER_AGENT, "Accept": "application/geo+json"}
    url = f"{NWS_BASE}/alerts/active"
    params = {}
    if area:
        params["area"] = area

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(url, headers=headers, params=params)
        resp.raise_for_status()
        data = resp.json()

    return data.get("features", [])


def _parse_dt(val: Optional[str]) -> Optional[datetime]:
    if not val:
        return None
    try:
        return datetime.fromisoformat(val.replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        return None


async def ingest_alerts(db: AsyncSession, area: Optional[str] = None) -> dict:
    features = await fetch_active_alerts(area)
    new_count = 0
    updated_count = 0

    for feature in features:
        props = feature.get("properties", {})
        alert_id = props.get("id", "")
        if not alert_id:
            continue

        result = await db.execute(select(NWSAlert).where(NWSAlert.alert_id == alert_id))
        existing = result.scalar_one_or_none()

        if existing:
            existing.status = "active"
            updated_count += 1
        else:
            alert = NWSAlert(
                alert_id=alert_id,
                event=props.get("event", "Unknown"),
                headline=props.get("headline"),
                description=props.get("description"),
                instruction=props.get("instruction"),
                severity=props.get("severity"),
                urgency=props.get("urgency"),
                certainty=props.get("certainty"),
                area_desc=props.get("areaDesc"),
                effective=_parse_dt(props.get("effective")),
                expires=_parse_dt(props.get("expires")),
                status="active",
                raw_json=props,
            )
            db.add(alert)
            new_count += 1

    await db.commit()
    return {"new": new_count, "updated": updated_count, "total_fetched": len(features)}


async def get_alert_summary(db: AsyncSession) -> dict:
    result = await db.execute(select(NWSAlert).where(NWSAlert.status == "active"))
    alerts = result.scalars().all()

    by_severity: dict[str, int] = {}
    by_event: dict[str, int] = {}
    for a in alerts:
        sev = a.severity or "Unknown"
        by_severity[sev] = by_severity.get(sev, 0) + 1
        evt = a.event or "Unknown"
        by_event[evt] = by_event.get(evt, 0) + 1

    return {
        "total_active": len(alerts),
        "by_severity": by_severity,
        "by_event": by_event,
        "last_updated": datetime.utcnow().isoformat(),
    }
