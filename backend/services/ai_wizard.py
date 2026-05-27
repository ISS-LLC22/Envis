import json
import re
from typing import Optional
import anthropic
from ..config import settings
from ..models import DomainEnum

DISCIPLINE_RULES = """
You are ENVIS AI Wizard — an environmental intelligence assistant bound by 8 strict discipline rules:

1. CITE SOURCES: Always name specific data sources (NWS, NOAA, NCEI, EPA, USGS, etc.) for every claim.
2. SHOW CONFIDENCE: State your confidence level as a numeric probability (0.0–1.0) explicitly.
3. SEPARATE FACT FROM INFERENCE: Clearly label statements as [FACT], [INFERENCE], or [ESTIMATE].
4. NAME DATA GAPS: Explicitly list any missing data that would change your assessment.
5. NO FALSE CERTAINTY: Never say "will" when you mean "may" — use calibrated language.
6. HISTORICAL COMPARISON: Compare current conditions to historical baselines when relevant.
7. AUTO-LOG TO IS-LOG: Structure your response so it can be logged in the IS-Log system.
8. FLAG OUTSIDE CONFIDENCE RANGE: If asked about something beyond available data, explicitly flag it.

Respond in this JSON structure:
{
  "answer": "full narrative response following all 8 rules",
  "confidence_score": 0.0-1.0,
  "uncertainty_band": {"low": 0.0, "high": 0.0},
  "data_sources": ["source1", "source2"],
  "missing_data_flags": ["gap1", "gap2"],
  "era_stratum": "time period of primary data",
  "fact_inference_breakdown": {"facts": [...], "inferences": [...], "estimates": [...]},
  "historical_comparison": "comparison to historical baseline",
  "outside_confidence_range": false,
  "discipline_flags": ["list of any rule violations or warnings"],
  "stakeholder_outputs": {
    "meteorologist": "technical summary",
    "emergency_manager": "actionable summary",
    "hospital": "health impact summary",
    "school": "school safety summary",
    "utility": "infrastructure summary",
    "agriculture": "agricultural impact",
    "family": "plain-language summary",
    "researcher": "research implications"
  }
}
"""


async def run_wizard(
    query: str,
    domain: Optional[DomainEnum] = None,
    context: Optional[str] = None,
) -> dict:
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    domain_context = f"\nPrimary domain: {domain.value}" if domain else ""
    extra_context = f"\nAdditional context: {context}" if context else ""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=DISCIPLINE_RULES,
        messages=[
            {
                "role": "user",
                "content": f"Query: {query}{domain_context}{extra_context}\n\nRespond strictly in the JSON format specified.",
            }
        ],
    )

    raw = message.content[0].text.strip()

    # Extract JSON from the response
    json_match = re.search(r"\{.*\}", raw, re.DOTALL)
    if json_match:
        try:
            parsed = json.loads(json_match.group())
            return _validate_wizard_response(parsed)
        except json.JSONDecodeError:
            pass

    return _fallback_response(query, raw)


def _validate_wizard_response(data: dict) -> dict:
    defaults = {
        "answer": data.get("answer", ""),
        "confidence_score": float(data.get("confidence_score", 0.5)),
        "uncertainty_band": data.get("uncertainty_band", {"low": 0.4, "high": 0.6}),
        "data_sources": data.get("data_sources", []),
        "missing_data_flags": data.get("missing_data_flags", []),
        "era_stratum": data.get("era_stratum"),
        "fact_inference_breakdown": data.get("fact_inference_breakdown", {}),
        "historical_comparison": data.get("historical_comparison", ""),
        "outside_confidence_range": bool(data.get("outside_confidence_range", False)),
        "discipline_flags": data.get("discipline_flags", []),
        "stakeholder_outputs": data.get("stakeholder_outputs", {}),
    }

    cs = defaults["confidence_score"]
    defaults["confidence_score"] = max(0.0, min(1.0, cs))

    if not defaults["data_sources"]:
        defaults["discipline_flags"].append("RULE 1 WARNING: No data sources cited")
    if not defaults["missing_data_flags"]:
        defaults["discipline_flags"].append("RULE 4 NOTE: No data gaps identified")

    return defaults


def _fallback_response(query: str, raw_text: str) -> dict:
    return {
        "answer": raw_text,
        "confidence_score": 0.3,
        "uncertainty_band": {"low": 0.1, "high": 0.5},
        "data_sources": [],
        "missing_data_flags": ["JSON parsing failed — response not structured"],
        "era_stratum": None,
        "fact_inference_breakdown": {},
        "historical_comparison": "",
        "outside_confidence_range": True,
        "discipline_flags": ["PARSE ERROR: Response not in expected JSON format"],
        "stakeholder_outputs": {},
    }
