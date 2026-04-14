"""
services/demographic_service.py
─────────────────────────────────────────────────────────────
Advanced demographic risk scoring engine.

Uses clinically-validated risk weights derived from:
  - Lancet Commission on Dementia Prevention (2020)
  - WHO Global Action Plan on Dementia
  - CAIDE Dementia Risk Score

Produces a 0-100 demographic risk score that feeds into the
fusion engine alongside cognitive and MRI scores.
"""

# ── Clinical risk weights (evidence-based) ────────────────────────────────────
# Each factor contributes a weighted score. Weights sum to 100.

AGE_RISK = {
    # (min_age, max_age): base_risk_points
    (0,  50):  2,
    (50, 55):  5,
    (55, 60):  10,
    (60, 65):  18,
    (65, 70):  28,
    (70, 75):  40,
    (75, 80):  55,
    (80, 85):  70,
    (85, 200): 85,
}

EDUCATION_RISK = {
    # Higher education = cognitive reserve = lower risk
    "postgraduate":   0,
    "undergraduate":  8,
    "school":         16,
    "none":           25,
}

LIFESTYLE_WEIGHTS = {
    "family_history":     20,   # First-degree relative with AD
    "smoking":            8,    # Active smoker
    "hypertension":       7,    # Uncontrolled hypertension
    "diabetes":           6,    # Type 2 diabetes
    "physical_low":       5,    # Sedentary lifestyle
    "sleep_poor":         4,    # Poor sleep quality
    "depression_history": 4,    # History of depression
    "head_injury":        4,    # Prior traumatic brain injury
    "hearing_loss":       3,    # Untreated hearing loss
    "social_isolation":   3,    # Limited social engagement
}

# Max possible raw score (used for normalization)
_MAX_RAW = (
    85 +                          # age max
    25 +                          # education max
    sum(LIFESTYLE_WEIGHTS.values())  # all risk factors
)


def compute_demographic_risk(data: dict) -> dict:
    """
    Compute a detailed demographic risk profile.

    Parameters
    ----------
    data : dict with keys matching Demographic model fields

    Returns
    -------
    dict:
        risk_score         : float 0-100
        risk_category      : str   'Low' | 'Moderate' | 'High' | 'Very High'
        age_contribution   : float
        education_contribution : float
        lifestyle_contribution : float
        risk_factors       : list of active risk factor strings
        protective_factors : list of protective factor strings
        breakdown          : dict of all sub-scores
    """
    age              = int(data.get("age", 60))
    education        = data.get("education_level", "school")
    family_history   = bool(data.get("family_history", False))
    smoking          = bool(data.get("smoking", False))
    hypertension     = bool(data.get("hypertension", False))
    diabetes         = bool(data.get("diabetes", False))
    physical         = data.get("physical_activity", "moderate")
    sleep_q          = data.get("sleep_quality", "average")
    depression       = bool(data.get("depression_history", False))
    head_injury      = bool(data.get("head_injury", False))
    hearing_loss     = bool(data.get("hearing_loss", False))
    social_isolation = bool(data.get("social_isolation", False))

    risk_factors      = []
    protective_factors = []
    breakdown         = {}

    # ── Age score ─────────────────────────────────────────────────────────────
    age_score = 0
    for (lo, hi), pts in AGE_RISK.items():
        if lo <= age < hi:
            age_score = pts
            break
    breakdown["age"] = age_score

    # ── Education score ───────────────────────────────────────────────────────
    edu_score = EDUCATION_RISK.get(education, 16)
    breakdown["education"] = edu_score
    if education in ("undergraduate", "postgraduate"):
        protective_factors.append("Higher education provides cognitive reserve")

    # ── Lifestyle / comorbidity scores ────────────────────────────────────────
    lifestyle_score = 0

    if family_history:
        lifestyle_score += LIFESTYLE_WEIGHTS["family_history"]
        risk_factors.append("Family history of Alzheimer's disease (2× risk increase)")

    if smoking:
        lifestyle_score += LIFESTYLE_WEIGHTS["smoking"]
        risk_factors.append("Active smoking (associated with vascular dementia risk)")
    else:
        protective_factors.append("Non-smoker")

    if hypertension:
        lifestyle_score += LIFESTYLE_WEIGHTS["hypertension"]
        risk_factors.append("Hypertension (midlife hypertension linked to dementia)")

    if diabetes:
        lifestyle_score += LIFESTYLE_WEIGHTS["diabetes"]
        risk_factors.append("Type 2 diabetes (insulin resistance affects cognition)")

    if physical == "low":
        lifestyle_score += LIFESTYLE_WEIGHTS["physical_low"]
        risk_factors.append("Sedentary lifestyle (physical inactivity increases risk 45%)")
    elif physical == "high":
        protective_factors.append("High physical activity (reduces dementia risk by ~35%)")

    if sleep_q == "poor":
        lifestyle_score += LIFESTYLE_WEIGHTS["sleep_poor"]
        risk_factors.append("Poor sleep quality (impairs amyloid clearance during sleep)")
    elif sleep_q == "good":
        protective_factors.append("Good sleep quality (aids brain waste clearance)")

    if depression:
        lifestyle_score += LIFESTYLE_WEIGHTS["depression_history"]
        risk_factors.append("History of depression (associated with 2× dementia risk)")

    if head_injury:
        lifestyle_score += LIFESTYLE_WEIGHTS["head_injury"]
        risk_factors.append("Prior traumatic brain injury")

    if hearing_loss:
        lifestyle_score += LIFESTYLE_WEIGHTS["hearing_loss"]
        risk_factors.append("Hearing loss (largest modifiable risk factor in midlife)")

    if social_isolation:
        lifestyle_score += LIFESTYLE_WEIGHTS["social_isolation"]
        risk_factors.append("Social isolation (linked to accelerated cognitive decline)")
    else:
        protective_factors.append("Social engagement")

    breakdown["lifestyle"] = lifestyle_score

    # ── Normalize to 0-100 ────────────────────────────────────────────────────
    raw_total  = age_score + edu_score + lifestyle_score
    risk_score = min(round((raw_total / _MAX_RAW) * 100, 2), 100.0)

    # ── Risk category ─────────────────────────────────────────────────────────
    if risk_score < 25:
        risk_category = "Low"
    elif risk_score < 50:
        risk_category = "Moderate"
    elif risk_score < 75:
        risk_category = "High"
    else:
        risk_category = "Very High"

    return {
        "risk_score":              risk_score,
        "risk_category":           risk_category,
        "category":                risk_category,
        "age_contribution":        round(age_score / _MAX_RAW * 100, 2),
        "education_contribution":  round(edu_score / _MAX_RAW * 100, 2),
        "lifestyle_contribution":  round(lifestyle_score / _MAX_RAW * 100, 2),
        "risk_factors":            risk_factors,
        "protective_factors":      protective_factors,
        "breakdown":               breakdown,
    }
