"""
services/fusion_service.py
─────────────────────────────────────────────────────────────
Multimodal Fusion Engine

Combines demographic risk, cognitive assessment score, and
MRI ensemble prediction into a single Alzheimer's Disease
probability percentage (0–100) with stage classification.

Also handles:
  • Longitudinal progression comparison between sessions
  • Stage labelling with clinical thresholds
  • Confidence interval estimation
"""

from database.models import ModelConfig, Session, CognitiveAssessment, MRIScan, Demographic, ProgressionRecord
from services.demographic_service import compute_demographic_risk


# ── Stage thresholds (default — overridable by admin) ─────────────────────────
DEFAULT_THRESHOLDS = {
    "healthy":   (0,   25),
    "very_mild": (25,  50),
    "mild":      (50,  75),
    "moderate":  (75,  100),
}

STAGE_DISPLAY = {
    "healthy":   "Non-Demented / Healthy",
    "very_mild": "Very Mild Demented (MCI)",
    "mild":      "Mild Alzheimer's Disease",
    "moderate":  "Moderate Alzheimer's Disease",
}

STAGE_COLOR = {
    "healthy":   "#22c55e",
    "very_mild": "#f59e0b",
    "mild":      "#f97316",
    "moderate":  "#ef4444",
}


def _get_weights() -> tuple:
    """
    Fetch current fusion weights from ModelConfig.
    Falls back to defaults if DB not initialised yet.
    """
    try:
        config = ModelConfig.query.first()
        if config:
            return config.weight_demographic, config.weight_cognitive, config.weight_mri
    except Exception:
        pass
    return 0.20, 0.35, 0.45


def _get_thresholds() -> dict:
    try:
        config = ModelConfig.query.first()
        if config:
            mild_t     = config.mild_threshold
            moderate_t = config.moderate_threshold
            return {
                "healthy":   (0,         25.0),
                "very_mild": (25.0,      mild_t),
                "mild":      (mild_t,    moderate_t),
                "moderate":  (moderate_t, 100.0),
            }
    except Exception:
        pass
    return DEFAULT_THRESHOLDS


def classify_stage(ad_pct: float) -> dict:
    """Map AD% to stage label using current thresholds."""
    thresholds = _get_thresholds()
    for stage, (lo, hi) in thresholds.items():
        if lo <= ad_pct < hi:
            return {
                "stage_key":     stage,
                "stage_display": STAGE_DISPLAY[stage],
                "stage_color":   STAGE_COLOR[stage],
            }
    # 100% edge case
    return {
        "stage_key":     "moderate",
        "stage_display": STAGE_DISPLAY["moderate"],
        "stage_color":   STAGE_COLOR["moderate"],
    }


def compute_fusion(
    demographic_data: dict,
    cognitive_normalized: float,   # 0-100
    mri_risk_score: float,         # 0-100
) -> dict:
    """
    Core fusion calculation.

    Formula:
        cognitive_risk = 100 - cognitive_normalized  (inverted)
        AD% = w1*demographic_risk + w2*cognitive_risk + w3*mri_risk

    Returns full breakdown dict.
    """
    w1, w2, w3 = _get_weights()

    # Demographic risk (0-100)
    demo_result   = compute_demographic_risk(demographic_data)
    demo_risk     = demo_result["risk_score"]

    # Cognitive risk (inverted — low score = high risk)
    cog_risk      = round(100.0 - cognitive_normalized, 2)

    # Weighted fusion
    ad_percentage = round(
        (w1 * demo_risk) + (w2 * cog_risk) + (w3 * mri_risk_score),
        2
    )
    ad_percentage = min(max(ad_percentage, 0.0), 100.0)

    stage_info    = classify_stage(ad_percentage)

    # Confidence interval (±2σ heuristic based on data quality)
    ci_margin     = _estimate_ci_margin(demo_result, cognitive_normalized, mri_risk_score)

    # Interpretive summary
    summary = _build_summary(
        ad_percentage, stage_info["stage_key"],
        demo_result, cognitive_normalized, mri_risk_score,
        w1, w2, w3
    )

    return {
        "ad_percentage":       ad_percentage,
        "stage_key":           stage_info["stage_key"],
        "stage_display":       stage_info["stage_display"],
        "stage_color":         stage_info["stage_color"],
        "ci_lower":            round(max(ad_percentage - ci_margin, 0), 2),
        "ci_upper":            round(min(ad_percentage + ci_margin, 100), 2),

        # Component contributions
        "demographic_risk":    demo_risk,
        "demographic_weighted": round(w1 * demo_risk, 2),
        "cognitive_risk":      cog_risk,
        "cognitive_weighted":  round(w2 * cog_risk, 2),
        "mri_risk":            mri_risk_score,
        "mri_weighted":        round(w3 * mri_risk_score, 2),

        # Weights used
        "weights": {"demographic": w1, "cognitive": w2, "mri": w3},

        # Demographic sub-breakdown
        "demographic_detail":  demo_result,

        # Narrative
        "summary":             summary,
    }


def compute_progression(
    current_session_id: int,
    user_id: int
) -> dict:
    """
    Compare current session against the most recent previous completed session.

    Returns progression dict for ProgressionRecord model.
    """
    # Get all completed sessions for this user, ordered oldest→newest
    all_sessions = (
        Session.query
        .filter_by(user_id=user_id, is_complete=True)
        .order_by(Session.created_at.asc())
        .all()
    )

    current_session = Session.query.get(current_session_id)

    # Find previous session (the one just before current)
    prev_session = None
    for s in all_sessions:
        if s.id == current_session_id:
            break
        prev_session = s

    # First visit
    if prev_session is None:
        return {
            "session_id_current":  current_session_id,
            "session_id_previous": None,
            "delta_ad_percentage": 0.0,
            "delta_cognitive":     0.0,
            "delta_mri_risk":      0.0,
            "progression_label":   "First Visit",
            "trend_direction":     "neutral",
            "trend_details":       "This is the first assessment. Baseline established.",
            "percentage_change":   0.0,
        }

    # Current scores
    curr_cog  = CognitiveAssessment.query.filter_by(session_id=current_session_id).first()
    curr_mri  = MRIScan.query.filter_by(session_id=current_session_id).first()

    # Previous scores
    prev_cog  = CognitiveAssessment.query.filter_by(session_id=prev_session.id).first()
    prev_mri  = MRIScan.query.filter_by(session_id=prev_session.id).first()

    # Deltas
    delta_ad  = round(
        (current_session.final_ad_percentage or 0) -
        (prev_session.final_ad_percentage or 0),
        2
    )
    delta_cog = round(
        (curr_cog.normalized_score if curr_cog else 0) -
        (prev_cog.normalized_score if prev_cog else 0),
        2
    )
    delta_mri = round(
        (curr_mri.mri_risk_score if curr_mri else 0) -
        (prev_mri.mri_risk_score if prev_mri else 0),
        2
    )

    # Progression label
    if delta_ad <= -5:
        label     = "Improved"
        direction = "down"
        details   = f"AD risk decreased by {abs(delta_ad):.1f}% since last visit."
    elif delta_ad >= 5:
        label     = "Worsened"
        direction = "up"
        details   = f"AD risk increased by {delta_ad:.1f}% since last visit."
    else:
        label     = "Stable"
        direction = "neutral"
        details   = f"AD risk changed by {delta_ad:+.1f}% — condition is stable."

    # Add cognitive context
    if delta_cog <= -5:
        details += f" Cognitive score declined by {abs(delta_cog):.1f} points."
    elif delta_cog >= 5:
        details += f" Cognitive score improved by {delta_cog:.1f} points."

    pct_change = 0.0
    if prev_session.final_ad_percentage and prev_session.final_ad_percentage > 0:
        pct_change = round(
            (delta_ad / prev_session.final_ad_percentage) * 100, 1
        )

    return {
        "session_id_current":  current_session_id,
        "session_id_previous": prev_session.id,
        "delta_ad_percentage": delta_ad,
        "delta_cognitive":     delta_cog,
        "delta_mri_risk":      delta_mri,
        "progression_label":   label,
        "trend_direction":     direction,
        "trend_details":       details,
        "percentage_change":   pct_change,
        "prev_ad_percentage":  prev_session.final_ad_percentage,
        "curr_ad_percentage":  current_session.final_ad_percentage,
        "prev_cognitive":      prev_cog.normalized_score if prev_cog else None,
        "curr_cognitive":      curr_cog.normalized_score if curr_cog else None,
        "prev_mri_stage":      prev_mri.ensemble_stage   if prev_mri else None,
        "curr_mri_stage":      curr_mri.ensemble_stage   if curr_mri else None,
        "prev_date":           prev_session.created_at.isoformat(),
    }


# ── Private helpers ────────────────────────────────────────────────────────────

def _estimate_ci_margin(demo_result, cog_normalized, mri_risk) -> float:
    """
    Heuristic confidence interval margin.
    Wider CI when data quality is lower (e.g. no MRI, borderline scores).
    """
    margin = 4.0  # base ±4%
    if mri_risk in (10.0, 35.0, 65.0, 90.0):  # exact map values = high confidence
        margin -= 1.0
    if len(demo_result.get("risk_factors", [])) > 3:
        margin += 1.0
    return round(margin, 1)


def _build_summary(ad_pct, stage_key, demo_result, cog_norm, mri_risk, w1, w2, w3) -> str:
    """Build a human-readable interpretive summary."""
    lines = []
    lines.append(
        f"The combined multimodal assessment yields an Alzheimer's Disease risk score of "
        f"{ad_pct:.1f}%, placing this patient in the '{STAGE_DISPLAY[stage_key]}' category."
    )

    dominant = max(
        [("demographic", w1 * demo_result['risk_score']),
         ("cognitive",   w2 * (100 - cog_norm)),
         ("MRI",         w3 * mri_risk)],
        key=lambda x: x[1]
    )
    lines.append(
        f"The {dominant[0]} component is the strongest contributor to the overall risk score."
    )

    if demo_result.get("risk_factors"):
        top_factors = demo_result["risk_factors"][:3]
        lines.append(
            "Key modifiable risk factors identified: " + "; ".join(top_factors) + "."
        )

    if demo_result.get("protective_factors"):
        lines.append(
            "Protective factors noted: " + ", ".join(demo_result["protective_factors"][:3]) + "."
        )

    return " ".join(lines)
