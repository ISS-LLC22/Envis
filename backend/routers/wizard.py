from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..schemas import WizardRequest, WizardResponse
from ..services.ai_wizard import run_wizard
from ..models import ISLogEntry, DomainEnum
from ..config import settings

router = APIRouter(prefix="/wizard", tags=["wizard"])


@router.post("/query", response_model=WizardResponse)
async def wizard_query(payload: WizardRequest, db: AsyncSession = Depends(get_db)):
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY not configured")

    result = await run_wizard(
        query=payload.query,
        domain=payload.domain,
        context=payload.context,
    )

    is_log_id = None
    if payload.auto_log and result.get("answer"):
        entry = ISLogEntry(
            domain=payload.domain or DomainEnum.multi_domain,
            prediction=result["answer"][:2000],
            data_sources=result.get("data_sources", []),
            confidence_score=result.get("confidence_score", 0.5),
            uncertainty_band=result.get("uncertainty_band", {}),
            missing_data_flags=result.get("missing_data_flags", []),
            era_stratum=result.get("era_stratum"),
            stakeholder_outputs=result.get("stakeholder_outputs", {}),
        )
        db.add(entry)
        await db.flush()
        await db.refresh(entry)
        is_log_id = entry.id

    return WizardResponse(
        answer=result.get("answer", ""),
        confidence_score=result.get("confidence_score", 0.5),
        uncertainty_band=result.get("uncertainty_band", {"low": 0.4, "high": 0.6}),
        data_sources=result.get("data_sources", []),
        missing_data_flags=result.get("missing_data_flags", []),
        era_stratum=result.get("era_stratum"),
        stakeholder_outputs=result.get("stakeholder_outputs", {}),
        is_log_id=is_log_id,
        outside_confidence_range=result.get("outside_confidence_range", False),
        discipline_flags=result.get("discipline_flags", []),
    )
