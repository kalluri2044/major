"""
services/cognitive_service.py
─────────────────────────────────────────────────────────────
25-question cognitive assessment engine.

Questions are modelled after:
  • MMSE  (Mini-Mental State Examination)
  • MoCA  (Montreal Cognitive Assessment)
  • SLUMS (Saint Louis University Mental Status)

Domains covered:
  1. Orientation         (Q1–Q4)   — 8 pts
  2. Memory Registration (Q5–Q7)   — 6 pts
  3. Attention           (Q8–Q11)  — 8 pts
  4. Language            (Q12–Q16) — 10 pts
  5. Visuospatial        (Q17–Q19) — 6 pts
  6. Executive Function  (Q20–Q22) — 6 pts
  7. Memory Recall       (Q23–Q25) — 6 pts
                              Total: 50 pts → normalized to 100
"""

from typing import List, Dict, Any

# ── Question bank ─────────────────────────────────────────────────────────────
QUESTIONS: List[Dict[str, Any]] = [

    # ── DOMAIN 1: Orientation (8 pts) ─────────────────────────────────────────
    {
        "id": 1, "domain": "Orientation", "max_score": 2,
        "question": "What is today's date? (Day and Month)",
        "type": "text_input",
        "instructions": "Enter today's complete date",
        "scoring": "award_2_if_exact_else_1_if_partial",
        "hint": "Both day and month required for full marks"
    },
    {
        "id": 2, "domain": "Orientation", "max_score": 2,
        "question": "What year is it, and what season are we currently in?",
        "type": "text_input",
        "instructions": "Enter the current year and season",
        "scoring": "1_per_correct",
        "hint": "Year and season are scored separately"
    },
    {
        "id": 3, "domain": "Orientation", "max_score": 2,
        "question": "What country, state/province, and city are you currently in?",
        "type": "text_input",
        "instructions": "Enter your current location",
        "scoring": "1_per_correct_max_2",
        "hint": "Country and city/state scored"
    },
    {
        "id": 4, "domain": "Orientation", "max_score": 2,
        "question": "What day of the week is today, and what floor of a building are you on right now (or what building/place are you in)?",
        "type": "text_input",
        "instructions": "Answer both parts",
        "scoring": "1_per_correct",
        "hint": "Day of week and place/floor scored"
    },

    # ── DOMAIN 2: Memory Registration (6 pts) ─────────────────────────────────
    {
        "id": 5, "domain": "Memory Registration", "max_score": 3,
        "question": "I will say 3 words. Please repeat them immediately: APPLE — TABLE — PENNY",
        "type": "word_recall",
        "target_words": ["apple", "table", "penny"],
        "instructions": "Type all 3 words you just heard",
        "scoring": "1_per_word",
        "hint": "Say or type each word you remember"
    },
    {
        "id": 6, "domain": "Memory Registration", "max_score": 2,
        "question": "Read this name and address once, then write it from memory: JOHN BROWN, 42 Market Street, Chicago",
        "type": "text_input",
        "instructions": "Write the name and address from memory",
        "scoring": "partial_credit",
        "hint": "Name and address elements scored separately"
    },
    {
        "id": 7, "domain": "Memory Registration", "max_score": 1,
        "question": "What did you have for your last meal? Name at least two items.",
        "type": "text_input",
        "instructions": "Describe your last meal",
        "scoring": "1_if_2_or_more_items",
        "hint": "Tests recent episodic memory"
    },

    # ── DOMAIN 3: Attention & Concentration (8 pts) ───────────────────────────
    {
        "id": 8, "domain": "Attention", "max_score": 3,
        "question": "Starting from 100, subtract 7 repeatedly. Give me 3 results: 100 → ? → ? → ?",
        "type": "number_sequence",
        "expected": [93, 86, 79],
        "instructions": "Enter three numbers: 100-7, then -7 again, then -7 again",
        "scoring": "1_per_correct",
        "hint": "100 → 93 → 86 → 79"
    },
    {
        "id": 9, "domain": "Attention", "max_score": 2,
        "question": "Spell the word 'WORLD' backwards.",
        "type": "text_input",
        "expected": "dlrow",
        "instructions": "Type the letters of WORLD in reverse order",
        "scoring": "2_if_exact_1_if_4_correct",
        "hint": "W-O-R-L-D reversed"
    },
    {
        "id": 10, "domain": "Attention", "max_score": 2,
        "question": "Listen to these numbers and repeat them back in REVERSE order: 7 — 4 — 2",
        "type": "number_sequence",
        "expected": [2, 4, 7],
        "instructions": "Enter the digits in reverse: 7 4 2 reversed",
        "scoring": "2_if_exact_1_if_2_correct",
        "hint": "Say them backwards"
    },
    {
        "id": 11, "domain": "Attention", "max_score": 1,
        "question": "Count backwards from 20 to 1. How many seconds did it take? (Self-report: Fast <15s, Normal 15-30s, Slow >30s)",
        "type": "single_choice",
        "options": ["Fast (under 15 seconds)", "Normal (15–30 seconds)", "Slow (over 30 seconds)"],
        "instructions": "Select which best describes your speed",
        "scoring": "1_if_fast_or_normal",
        "hint": "Be honest — this assesses processing speed"
    },

    # ── DOMAIN 4: Language (10 pts) ───────────────────────────────────────────
    {
        "id": 12, "domain": "Language", "max_score": 2,
        "question": "Name as many animals as you can in 60 seconds. (Score: ≥11 = 2pts, 7-10 = 1pt, <7 = 0pt)",
        "type": "text_input",
        "instructions": "List as many animals as you can think of",
        "scoring": "2_if_11plus_1_if_7to10",
        "hint": "Verbal fluency test — quantity matters"
    },
    {
        "id": 13, "domain": "Language", "max_score": 2,
        "question": "Repeat this phrase exactly: 'No ifs, ands, or buts about it.'",
        "type": "text_input",
        "expected": "no ifs ands or buts about it",
        "instructions": "Type the phrase exactly as given",
        "scoring": "2_if_exact_1_if_minor_error",
        "hint": "Must be word-for-word"
    },
    {
        "id": 14, "domain": "Language", "max_score": 2,
        "question": "Follow this 3-step instruction: Take the paper, fold it in half, and put it on the floor.",
        "type": "single_choice",
        "options": [
            "Completed all 3 steps correctly",
            "Completed 2 steps",
            "Completed 1 step or none"
        ],
        "instructions": "Select how many steps you completed",
        "scoring": "2_if_all_1_if_two",
        "hint": "Tests command comprehension and execution"
    },
    {
        "id": 15, "domain": "Language", "max_score": 2,
        "question": "Write a complete sentence about anything (must have a subject and verb).",
        "type": "text_input",
        "instructions": "Write any grammatically complete sentence",
        "scoring": "2_if_subject_and_verb_1_if_partial",
        "hint": "Any meaningful sentence counts"
    },
    {
        "id": 16, "domain": "Language", "max_score": 2,
        "question": "What do a watch and a ruler have in common? What about a banana and an orange?",
        "type": "text_input",
        "instructions": "Describe what each pair has in common",
        "scoring": "1_per_correct_category",
        "hint": "Both questions test abstract verbal reasoning"
    },

    # ── DOMAIN 5: Visuospatial (6 pts) ───────────────────────────────────────
    {
        "id": 17, "domain": "Visuospatial", "max_score": 2,
        "question": "Draw an analogue clock showing 11:10. How would you rate the accuracy of your clock?",
        "type": "single_choice",
        "options": [
            "Correct circle, all numbers, hands pointing 11 and 2 (2 pts)",
            "Minor errors — numbers or hand placement slightly off (1 pt)",
            "Significant errors or unable to complete (0 pts)"
        ],
        "instructions": "Draw the clock on paper, then self-rate",
        "scoring": "self_rated_2_1_0",
        "hint": "Clock drawing is a strong visuospatial indicator"
    },
    {
        "id": 18, "domain": "Visuospatial", "max_score": 2,
        "question": "Look at your surroundings. How many windows are in this room? Then count objects on the nearest table.",
        "type": "text_input",
        "instructions": "Report both counts: windows and table objects",
        "scoring": "1_per_reasonable_answer",
        "hint": "Tests environmental awareness and counting ability"
    },
    {
        "id": 19, "domain": "Visuospatial", "max_score": 2,
        "question": "If you are facing North, and you turn right twice and then left once, which direction are you now facing?",
        "type": "single_choice",
        "options": ["North", "South", "East", "West"],
        "instructions": "Select your final facing direction",
        "correct": "East",
        "scoring": "2_if_correct_0_otherwise",
        "hint": "N → turn right → E → turn right → S → turn left → E"
    },

    # ── DOMAIN 6: Executive Function (6 pts) ─────────────────────────────────
    {
        "id": 20, "domain": "Executive Function", "max_score": 2,
        "question": "Continue this alternating sequence: 1 — A — 2 — B — 3 — ? — 4 — ?",
        "type": "text_input",
        "expected": "c 5",
        "instructions": "Fill in the two missing values",
        "scoring": "1_per_correct",
        "hint": "Numbers and letters alternate in order"
    },
    {
        "id": 21, "domain": "Executive Function", "max_score": 2,
        "question": "You have a 3-litre jug and a 5-litre jug. How do you measure exactly 4 litres of water?",
        "type": "text_input",
        "instructions": "Briefly describe your solution steps",
        "scoring": "2_if_correct_solution_1_if_logical_attempt",
        "hint": "Tests problem-solving and working memory"
    },
    {
        "id": 22, "domain": "Executive Function", "max_score": 2,
        "question": "You need to go to the bank, post office, and grocery store. The bank closes at 3pm, the post office is next to the grocery store, and you only have 1 hour. What order do you go in?",
        "type": "text_input",
        "instructions": "Describe your planned order and brief reasoning",
        "scoring": "2_if_bank_first_logical_reason_1_if_partial",
        "hint": "Tests planning, sequencing, and time management"
    },

    # ── DOMAIN 7: Delayed Memory Recall (6 pts) ───────────────────────────────
    {
        "id": 23, "domain": "Delayed Memory Recall", "max_score": 3,
        "question": "Earlier (in Q5) I asked you to remember 3 words: APPLE, TABLE, PENNY. What were they?",
        "type": "word_recall",
        "target_words": ["apple", "table", "penny"],
        "instructions": "Type any of the 3 words you can still recall",
        "scoring": "1_per_word",
        "hint": "No hints given — pure recall test"
    },
    {
        "id": 24, "domain": "Delayed Memory Recall", "max_score": 2,
        "question": "Earlier (in Q6) you read a name and address. Can you recall any part of it?",
        "type": "text_input",
        "instructions": "Write whatever parts of the name/address you remember",
        "scoring": "1_per_correct_element_max_2",
        "hint": "Name, street, number, or city — any correct part counts"
    },
    {
        "id": 25, "domain": "Delayed Memory Recall", "max_score": 1,
        "question": "What were the TWO specific topics we discussed at the very beginning of this assessment?",
        "type": "text_input",
        "instructions": "Describe the two initial topics",
        "scoring": "1_if_at_least_1_correct",
        "hint": "Think back to the first questions"
    },
]

# Maximum total raw score
MAX_RAW_SCORE = sum(q["max_score"] for q in QUESTIONS)   # 50

# Domain max scores (for breakdown)
DOMAIN_MAX = {}
for q in QUESTIONS:
    d = q["domain"]
    DOMAIN_MAX[d] = DOMAIN_MAX.get(d, 0) + q["max_score"]


def get_questions() -> List[Dict]:
    """Return question bank (strip scoring keys for client)."""
    safe_keys = {"id", "domain", "max_score", "question",
                 "type", "options", "instructions", "hint", "target_words", "expected"}
    return [
        {k: v for k, v in q.items() if k in safe_keys}
        for q in QUESTIONS
    ]


def score_answers(answers: List[Dict]) -> Dict:
    """
    Score a submitted answer list.

    Parameters
    ----------
    answers : list of {question_id, raw_answer, awarded_score}
        awarded_score is submitted by the client (self-rated questions)
        or calculated server-side for objective questions.

    Returns
    -------
    dict with full scoring breakdown
    """
    answer_map = {a["question_id"]: a for a in answers}
    domain_scores  = {}
    domain_totals  = {}
    per_question   = []
    total_raw      = 0

    for q in QUESTIONS:
        qid      = q["id"]
        ans_data = answer_map.get(qid, {})
        awarded  = 0
        scoring_type = q.get("scoring")
        raw_ans  = str(ans_data.get("raw_answer", "")).strip().lower()
        q_type   = q.get("type")

        # 1. Exact Match (Choice or Input)
        if scoring_type in ["exact_match", "exact_match_choice"]:
            expected = str(q.get("expected", "")).lower()
            if raw_ans == expected:
                awarded = q["max_score"]

        # 2. Sequence Match (Numbers)
        elif scoring_type == "sequence_match":
            expected = q.get("expected", [])
            try:
                # Extract numbers from input
                import re
                nums = [int(n) for n in re.findall(r'\d+', raw_ans)]
                correct = sum(1 for a, b in zip(nums, expected) if a == b)
                awarded = min(correct, q["max_score"])
            except:
                awarded = 0

        # 3. Keyword Match (Partial logic)
        elif scoring_type == "keyword_match":
            expected = str(q.get("expected", "")).lower().split()
            found = sum(1 for word in expected if word in raw_ans)
            if found >= len(expected): awarded = q["max_score"]
            elif found > 0: awarded = max(1, q["max_score"] - 1)

        # 4. List Count Unique (Animal naming)
        elif scoring_type == "list_count_unique":
            # Split by comma, space, or newline
            import re
            words = set(re.split(r'[,\s\n]+', raw_ans))
            words = [w for w in words if len(w) > 2] # ignore tiny noise
            count = len(words)
            if count >= 12: awarded = 2
            elif count >= 7: awarded = 1
            else: awarded = 0

        # 5. Word Recall (Matches in list)
        elif scoring_type == "list_count_matches":
            targets = [t.lower() for t in q.get("target_words", [])]
            found = sum(1 for t in targets if t in raw_ans)
            awarded = min(found, q["max_score"])

        # 6. Date Check
        elif scoring_type == "date_check":
            from datetime import datetime
            now = datetime.now()
            curr_month = now.strftime("%B").lower()
            curr_day = str(now.day)
            if curr_month in raw_ans and curr_day in raw_ans: awarded = 2
            elif curr_month in raw_ans or curr_day in raw_ans: awarded = 1

        # 7. Location Check
        elif scoring_type == "location_check":
            # This is hard to verify without geocoding, so we check for non-empty/reasonable length
            if len(raw_ans) > 10: awarded = 2
            elif len(raw_ans) > 3: awarded = 1

        # 8. Multi-factor Orientation
        elif scoring_type == "multi_factor_orientation":
            factors = ["friday", "april", "2026", "24", "new york"]
            found = sum(1 for f in factors if f in raw_ans)
            awarded = found # 1 point per factor found, max 5

        # 9. Partial Text Match (Address/Name)
        elif scoring_type == "partial_text_match":
            expected = str(q.get("expected", q.get("hint", ""))).lower()
            if raw_ans == expected: awarded = q["max_score"]
            elif len(raw_ans) > 5:
                # Basic overlap check
                common = set(raw_ans.split()) & set(expected.split())
                if len(common) >= 2: awarded = q["max_score"]
                elif len(common) >= 1: awarded = 1
        
        # 9. Word Input (Immediate Registration)
        elif q_type == "word_input":
            targets = [t.lower() for t in q.get("target_words", [])]
            found = sum(1 for t in targets if t in raw_ans)
            awarded = q["max_score"] # We give full points for confirming they saw it

        # Fallback for older types if any
        else:
            client_score = int(ans_data.get("awarded_score", 0))
            awarded = min(max(client_score, 0), q["max_score"])

        domain = q["domain"]
        domain_scores[domain]  = domain_scores.get(domain, 0) + awarded
        domain_totals[domain]  = DOMAIN_MAX[domain]
        total_raw += awarded

        per_question.append({
            "question_id":    qid,
            "domain":         domain,
            "max_score":      q["max_score"],
            "awarded":        awarded,
            "question_text":  q["question"],
        })

    # Normalize to 0-100
    normalized = round((total_raw / MAX_RAW_SCORE) * 100, 2)

    # Cognitive risk label (inverse — lower score = higher impairment)
    if normalized >= 85:
        impairment_level = "Normal Cognition"
    elif normalized >= 70:
        impairment_level = "Mild Cognitive Concern"
    elif normalized >= 50:
        impairment_level = "Mild Cognitive Impairment"
    elif normalized >= 30:
        impairment_level = "Moderate Impairment"
    else:
        impairment_level = "Severe Impairment"

    # Domain breakdown as percentages
    domain_pct = {
        d: round((domain_scores[d] / domain_totals[d]) * 100, 1)
        for d in domain_scores
    }

    return {
        "raw_score":        total_raw,
        "max_raw":          MAX_RAW_SCORE,
        "normalized_score": normalized,
        "impairment_level": impairment_level,
        "domain_scores":    domain_scores,
        "domain_totals":    domain_totals,
        "domain_percentages": domain_pct,
        "per_question":     per_question,
        "weakest_domains":  sorted(domain_pct, key=lambda d: domain_pct[d])[:2],
        "strongest_domains": sorted(domain_pct, key=lambda d: domain_pct[d], reverse=True)[:2],
    }
