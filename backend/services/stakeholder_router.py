from typing import Any


STAKEHOLDER_TEMPLATES = {
    "meteorologist": {
        "label": "Meteorologist",
        "focus": ["technical_accuracy", "model_data", "synoptic_analysis", "ensemble_spread"],
        "jargon_level": "technical",
        "priority_fields": ["confidence_score", "uncertainty_band", "data_sources", "era_stratum"],
    },
    "emergency_manager": {
        "label": "Emergency Manager",
        "focus": ["threat_level", "timeline", "affected_area", "recommended_actions"],
        "jargon_level": "operational",
        "priority_fields": ["severity", "urgency", "instructions", "coordination_needs"],
    },
    "hospital": {
        "label": "Hospital / Healthcare",
        "focus": ["health_impacts", "patient_surge", "supply_chain", "facility_safety"],
        "jargon_level": "medical_operational",
        "priority_fields": ["injuries_expected", "hospital_capacity", "triage_needs"],
    },
    "school": {
        "label": "School Administrator",
        "focus": ["safety_threshold", "closure_criteria", "transportation", "shelter_in_place"],
        "jargon_level": "administrative",
        "priority_fields": ["wind_speed", "road_conditions", "air_quality_index"],
    },
    "utility": {
        "label": "Utility / Infrastructure",
        "focus": ["power_outage_risk", "grid_stress", "repair_crews", "restoration_timeline"],
        "jargon_level": "engineering_operational",
        "priority_fields": ["wind_gusts", "ice_accumulation", "flood_zones"],
    },
    "agriculture": {
        "label": "Agriculture",
        "focus": ["crop_impact", "soil_moisture", "frost_risk", "harvest_window"],
        "jargon_level": "agronomic",
        "priority_fields": ["temperature", "precipitation", "humidity", "growing_degree_days"],
    },
    "family": {
        "label": "Family / General Public",
        "focus": ["plain_language", "what_to_do", "safety_steps", "supplies_needed"],
        "jargon_level": "plain_english",
        "priority_fields": ["severity", "what_to_expect", "actions_to_take"],
    },
    "researcher": {
        "label": "Researcher / Academic",
        "focus": ["methodology", "data_gaps", "historical_baseline", "brier_scores"],
        "jargon_level": "scientific",
        "priority_fields": ["confidence_score", "brier_score", "learning_delta", "cross_domain_chain"],
    },
}


def route_for_stakeholder(is_log_data: dict, stakeholder: str) -> dict:
    template = STAKEHOLDER_TEMPLATES.get(stakeholder)
    if not template:
        return {"error": f"Unknown stakeholder type: {stakeholder}"}

    stakeholder_outputs = is_log_data.get("stakeholder_outputs", {})
    specific_output = stakeholder_outputs.get(stakeholder, "")

    confidence = is_log_data.get("confidence_score", 0.5)
    uncertainty = is_log_data.get("uncertainty_band", {"low": 0.4, "high": 0.6})
    missing = is_log_data.get("missing_data_flags", [])

    confidence_label = _confidence_label(confidence)
    urgency_color = _urgency_color(confidence, is_log_data.get("hit_miss", "pending"))

    return {
        "stakeholder": stakeholder,
        "label": template["label"],
        "urgency_color": urgency_color,
        "confidence_label": confidence_label,
        "confidence_score": confidence,
        "uncertainty_band": uncertainty,
        "primary_message": specific_output or is_log_data.get("prediction", ""),
        "data_sources": is_log_data.get("data_sources", []),
        "missing_data_flags": missing,
        "era_stratum": is_log_data.get("era_stratum"),
        "focus_areas": template["focus"],
        "jargon_level": template["jargon_level"],
        "domain": is_log_data.get("domain", ""),
        "timestamp_issued": is_log_data.get("timestamp_issued", ""),
        "brier_score": is_log_data.get("brier_score"),
        "hit_miss": is_log_data.get("hit_miss", "pending"),
        "caveats": _build_caveats(missing, confidence, is_log_data),
    }


def get_all_stakeholder_views(is_log_data: dict) -> dict:
    return {
        stakeholder: route_for_stakeholder(is_log_data, stakeholder)
        for stakeholder in STAKEHOLDER_TEMPLATES
    }


def _confidence_label(score: float) -> str:
    if score >= 0.85:
        return "HIGH"
    elif score >= 0.65:
        return "MODERATE-HIGH"
    elif score >= 0.45:
        return "MODERATE"
    elif score >= 0.25:
        return "LOW-MODERATE"
    return "LOW"


def _urgency_color(confidence: float, hit_miss: str) -> str:
    if hit_miss == "miss":
        return "red"
    if confidence >= 0.75:
        return "green"
    if confidence >= 0.5:
        return "yellow"
    return "orange"


def _build_caveats(missing_flags: list, confidence: float, data: dict) -> list[str]:
    caveats = []
    if missing_flags:
        caveats.append(f"Data gaps present: {', '.join(missing_flags[:3])}")
    if confidence < 0.4:
        caveats.append("Low confidence — treat as early signal only")
    if data.get("outside_confidence_range"):
        caveats.append("Query outside reliable confidence range")
    return caveats
