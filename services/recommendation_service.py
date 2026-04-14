"""
services/recommendation_service.py
─────────────────────────────────────────────────────────────
Evidence-based personalized recommendation engine.

Generates structured, stage-specific recommendations based on:
  • AD stage (fusion result)
  • Active demographic risk factors
  • Cognitive domain weaknesses
  • MRI findings

Categories: Lifestyle, Medical, Cognitive, Social, Safety, Follow-up
"""

import json

# ── Base recommendations per stage ────────────────────────────────────────────
STAGE_BASE = {

    "healthy": {
        "lifestyle": [
            "Maintain regular aerobic exercise (150 min/week minimum) — shown to reduce dementia risk by up to 35%.",
            "Follow a Mediterranean or MIND diet: leafy greens, berries, nuts, fish, olive oil.",
            "Maintain a consistent sleep schedule of 7–9 hours nightly to support amyloid clearance.",
            "Stay socially active — join clubs, maintain friendships, engage in group activities.",
            "Engage in mentally stimulating activities: reading, puzzles, learning new skills.",
        ],
        "medical": [
            "Schedule annual cognitive screening assessments to track any changes early.",
            "Monitor blood pressure, cholesterol, and blood sugar — manage cardiovascular risk.",
            "Discuss any memory concerns proactively with your primary care physician.",
        ],
        "cognitive": [
            "Practice daily brain exercises: crosswords, Sudoku, memory games, or language learning.",
            "Try dual-tasking activities (e.g., walking while counting) to build cognitive reserve.",
        ],
        "follow_up": "Annual reassessment recommended. Next screening in 12 months.",
        "urgency": "low",
    },

    "very_mild": {
        "lifestyle": [
            "Increase physical activity — aim for 30 minutes of moderate aerobic exercise daily.",
            "Strictly follow the MIND diet: dark leafy greens daily, berries 2x/week, fish weekly.",
            "Prioritise sleep hygiene: dark room, fixed schedule, limit screens before bed.",
            "Reduce alcohol consumption to minimum or abstain — alcohol accelerates cognitive decline.",
            "Manage stress actively: yoga, meditation, or mindfulness practice for 15 min/day.",
        ],
        "medical": [
            "Schedule a formal neuropsychological evaluation with a specialist.",
            "Discuss MCI-specific monitoring protocols with your neurologist.",
            "Review all current medications — some can affect cognition (benzodiazepines, anticholinergics).",
            "Control any vascular risk factors aggressively: hypertension, diabetes, high cholesterol.",
            "Ask your doctor about vitamin D and B12 deficiency testing.",
        ],
        "cognitive": [
            "Begin structured cognitive training: use apps like BrainHQ or Lumosity daily.",
            "Keep a detailed daily journal — this practices memory and provides progression record.",
            "Learn something new each week: a language, musical instrument, or craft.",
            "Practice spaced-repetition learning for memory strengthening.",
        ],
        "social": [
            "Increase social engagement — isolation accelerates MCI progression.",
            "Consider joining a memory support group for early-stage individuals.",
            "Maintain meaningful relationships and regular in-person contact.",
        ],
        "follow_up": "Reassessment in 6 months. Consider specialist referral if score declines.",
        "urgency": "moderate",
    },

    "mild": {
        "lifestyle": [
            "Establish strict daily routines — predictability reduces cognitive load significantly.",
            "Use external memory aids: written calendars, smartphone reminders, labelled storage.",
            "Ensure safe home environment: remove fall hazards, improve lighting, add grab bars.",
            "Maintain physical activity as tolerated — even short daily walks are beneficial.",
            "Reduce cognitive stressors: simplify tasks, break activities into smaller steps.",
        ],
        "medical": [
            "Urgently consult a neurologist for formal Alzheimer's disease evaluation.",
            "Request assessment for FDA-approved Alzheimer's medications (cholinesterase inhibitors).",
            "Consider referral for brain imaging (PET/SPECT) to confirm amyloid pathology.",
            "Arrange a medication review — optimise all medications and remove unnecessary drugs.",
            "Discuss advance care planning while the patient can still actively participate.",
            "Check for and treat any contributing conditions: thyroid disorders, vitamin deficiencies.",
        ],
        "cognitive": [
            "Begin occupational therapy for cognitive rehabilitation strategies.",
            "Use memory notebooks, to-do lists, and written instructions consistently.",
            "Engage in structured reality orientation activities: review of date, place, names.",
            "Consider music therapy — proven effective in mild-stage Alzheimer's.",
        ],
        "social": [
            "Involve family/caregivers in planning and daily support.",
            "Contact the Alzheimer's Association for local support groups and resources.",
            "Begin discussions with family about driving safety assessment.",
            "Arrange regular structured social activities to maintain engagement.",
        ],
        "safety": [
            "Assess driving ability — may need formal driving evaluation or cessation discussion.",
            "Ensure financial and legal affairs are arranged: power of attorney, will, healthcare directive.",
            "Review home safety: lock away medications, check stove safety, assess wandering risk.",
            "Set up medical alert system or GPS tracking device if wandering is a concern.",
        ],
        "follow_up": "Reassessment in 3 months. Specialist appointment within 4 weeks strongly recommended.",
        "urgency": "high",
    },

    "moderate": {
        "lifestyle": [
            "Full-time caregiver support is now essential — arrange care plan immediately.",
            "Structured daily schedule with consistent mealtimes, sleep times, and activities.",
            "Familiar environments are critical — avoid unnecessary relocations.",
            "Sensory stimulation activities: music, gardens, gentle touch — proven to reduce agitation.",
            "Maintain nutrition — cognitive decline can lead to appetite loss and weight decrease.",
        ],
        "medical": [
            "URGENT: Immediate referral to geriatric psychiatry or specialist memory clinic.",
            "Discuss pharmacological management of behavioural and psychological symptoms.",
            "Evaluate for and treat any pain, infection, or delirium that may worsen cognition.",
            "Review and adjust all medications for safety in advanced dementia.",
            "Palliative care consultation to plan for future care transitions.",
            "Consider clinical trial eligibility — multiple active trials available.",
        ],
        "cognitive": [
            "Reminiscence therapy using photos, familiar music, and life history discussions.",
            "Simple, repetitive, structured activities appropriate to current ability level.",
            "Validation therapy — acknowledging feelings rather than correcting confusion.",
            "Avoid activities that cause frustration — match tasks to current ability.",
        ],
        "social": [
            "Enrol in a specialist day-care programme for structured supervised activity.",
            "Caregiver support and respite services are critical — explore local options.",
            "Contact the Alzheimer's Association for caregiver training and support.",
            "Regular contact with familiar family members and friends.",
        ],
        "safety": [
            "CRITICAL: Full safety audit of home — locks, stove guards, door alarms.",
            "Ensure patient does NOT drive — arrange alternative transportation.",
            "All medications must be locked away and administered by carer.",
            "Consider GPS monitoring device to prevent wandering injuries.",
            "Review and update advance directives, healthcare proxy, and financial POA.",
            "Discuss preferred care setting: home care, assisted living, or memory care facility.",
        ],
        "follow_up": "Monthly medical review. Immediate specialist assessment required this week.",
        "urgency": "critical",
    },
}

# ── Risk-factor-specific add-ons ──────────────────────────────────────────────
RISK_ADDON = {
    "smoking":          "Smoking cessation is strongly recommended — it is the single most impactful modifiable cardiovascular risk factor.",
    "hypertension":     "Strict blood pressure control (target <130/80 mmHg in midlife) is critical for brain health.",
    "diabetes":         "Optimise glycaemic control — HbA1c target <7% helps protect cognitive function.",
    "sleep_poor":       "Seek sleep medicine evaluation — untreated sleep apnoea dramatically accelerates cognitive decline.",
    "family_history":   "Given family history, consider APOE genotype testing and discuss with a genetic counsellor.",
    "depression_history": "Depression treatment is a priority — undertreated depression independently worsens cognitive outcomes.",
    "social_isolation": "Structured social prescription (volunteering, clubs, community groups) should be formally arranged.",
    "physical_low":     "Exercise referral scheme recommended — target 150 min moderate aerobic activity per week.",
}

# ── Cognitive domain-specific add-ons ────────────────────────────────────────
DOMAIN_ADDON = {
    "Memory Registration":   "Focus on memory encoding strategies: chunking, visual association, and spaced repetition.",
    "Delayed Memory Recall": "Practice delayed recall daily — read a short text, wait 20 minutes, then write what you remember.",
    "Attention":             "Mindfulness meditation (10 min/day) and attention training apps can improve sustained focus.",
    "Language":              "Daily verbal fluency exercises: name 10 items in a category each morning.",
    "Visuospatial":          "Jigsaw puzzles, 3D drawing, and spatial navigation exercises target visuospatial decline.",
    "Executive Function":    "Strategy games (chess, bridge), planning exercises, and sequencing tasks strengthen executive control.",
    "Orientation":           "Daily orientation practice: write today's date, location, and 3 current events each morning.",
}


def generate_recommendations(
    stage_key: str,
    risk_factors: list,
    weakest_domains: list,
    ad_percentage: float,
) -> dict:
    """
    Generate full structured recommendation plan.

    Returns a dict suitable for JSON storage in Recommendation.recommendation_json
    """
    base  = STAGE_BASE.get(stage_key, STAGE_BASE["healthy"])

    # Build category lists
    rec = {
        "stage":      stage_key,
        "urgency":    base["urgency"],
        "follow_up":  base["follow_up"],
        "categories": {}
    }

    for cat in ["lifestyle", "medical", "cognitive", "social", "safety"]:
        if cat in base:
            rec["categories"][cat] = list(base[cat])

    # Add risk-factor specific recommendations
    risk_additions = []
    for factor_text in risk_factors:
        for key, addon in RISK_ADDON.items():
            if key in factor_text.lower() and addon not in risk_additions:
                risk_additions.append(addon)

    if risk_additions:
        rec["categories"].setdefault("medical", [])
        rec["categories"]["medical"].extend(risk_additions)

    # Add cognitive domain weaknesses
    domain_additions = []
    for domain in weakest_domains:
        if domain in DOMAIN_ADDON:
            domain_additions.append(DOMAIN_ADDON[domain])

    if domain_additions:
        rec["categories"].setdefault("cognitive", [])
        rec["categories"]["cognitive"].extend(domain_additions)

    # Flatten to a simple numbered list for the report
    flat_list = []
    priority_order = ["medical", "safety", "lifestyle", "cognitive", "social"]
    for cat in priority_order:
        if cat in rec["categories"]:
            for item in rec["categories"][cat]:
                flat_list.append({"category": cat.title(), "advice": item})

    rec["flat_list"]    = flat_list
    rec["total_items"]  = len(flat_list)
    rec["ad_percentage"] = ad_percentage

    return rec
