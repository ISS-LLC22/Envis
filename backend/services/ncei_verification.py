import httpx
from typing import Optional
from ..config import settings

NCEI_BASE = "https://www.ncdc.noaa.gov/stormevents/csv"
NCEI_API_BASE = "https://www.ncei.noaa.gov/cdo-web/api/v2"


async def fetch_storm_events(
    event_type: str,
    state: Optional[str] = None,
    begin_year: Optional[int] = None,
    end_year: Optional[int] = None,
) -> dict:
    headers = {"token": settings.NCEI_API_KEY} if settings.NCEI_API_KEY else {}

    params: dict = {
        "datasetid": "GHCND",
        "datatypeid": "PRCP",
        "limit": 25,
    }

    if begin_year and end_year:
        params["startdate"] = f"{begin_year}-01-01"
        params["enddate"] = f"{end_year}-12-31"

    # Storm Events Database endpoint
    storm_params = {
        "eventType": event_type,
        "hailSize": "",
        "injuries": "",
        "fatalities": "",
        "damages": "",
        "ranking": "fatalities",
        "sort": "DZ",
        "submitbutton": "Search",
        "statefips": state or "-1",
    }

    if begin_year:
        storm_params["beginYear"] = begin_year
    if end_year:
        storm_params["endYear"] = end_year

    results = {
        "event_type": event_type,
        "state": state,
        "begin_year": begin_year,
        "end_year": end_year,
        "source": "NCEI Storm Events Database",
        "url": "https://www.ncdc.noaa.gov/stormevents/",
    }

    if not settings.NCEI_API_KEY:
        results["note"] = "NCEI_API_KEY not configured — configure in .env for live data"
        results["mock_data"] = _mock_storm_summary(event_type)
        return results

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                f"{NCEI_API_BASE}/data",
                headers=headers,
                params=params,
            )
            resp.raise_for_status()
            results["data"] = resp.json()
    except Exception as e:
        results["error"] = str(e)
        results["mock_data"] = _mock_storm_summary(event_type)

    return results


def _mock_storm_summary(event_type: str) -> dict:
    historical = {
        "Tornado": {"avg_annual_events": 1200, "deadliest_year": 2011, "peak_month": "May"},
        "Hurricane": {"avg_annual_events": 6, "deadliest_year": 2005, "peak_month": "September"},
        "Flood": {"avg_annual_events": 4500, "deadliest_year": 1993, "peak_month": "June"},
        "Blizzard": {"avg_annual_events": 30, "deadliest_year": 1978, "peak_month": "January"},
        "Drought": {"avg_annual_events": 18, "deadliest_year": 1988, "peak_month": "August"},
        "Wildfire": {"avg_annual_events": 55000, "deadliest_year": 2018, "peak_month": "August"},
    }
    return historical.get(event_type, {"note": f"No historical mock data for {event_type}"})


async def calculate_brier_score(
    predicted_probability: float,
    observed_outcome: bool,
) -> float:
    return round((predicted_probability - int(observed_outcome)) ** 2, 4)


async def verify_prediction(
    prediction_text: str,
    confidence_score: float,
    observed_outcome: Optional[str],
) -> dict:
    if not observed_outcome:
        return {"status": "pending", "brier_score": None, "verification_note": "No observed outcome yet"}

    outcome_bool = any(
        word in observed_outcome.lower()
        for word in ["occurred", "confirmed", "yes", "hit", "accurate", "correct"]
    )

    brier = await calculate_brier_score(confidence_score, outcome_bool)
    hit = confidence_score >= 0.5 and outcome_bool or confidence_score < 0.5 and not outcome_bool

    return {
        "status": "verified",
        "brier_score": brier,
        "hit_miss": "hit" if hit else "miss",
        "learning_delta": round(0.5 - brier, 4),
        "verification_note": f"Prediction {'confirmed' if outcome_bool else 'not confirmed'} by observed outcome",
    }
