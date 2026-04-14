"""
routes/fusion_routes.py
─────────────────────────────────────────────────────────────
POST /api/fusion/compute/<session_id>  — run fusion engine, save result
GET  /api/fusion/result/<session_id>   — get saved fusion result
"""

import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from database.db import db
from database.models import (
    Session, CognitiveAssessment, MRIScan,
    Demographic, ProgressionRecord, Recommendation
)
from services.fusion_service import compute_fusion, compute_progression
from services.recommendation_service import generate_recommendations

fusion_bp = Blueprint("fusion", __name__)


# ─────────────────────────────────────────────
# POST /api/fusion/compute/<session_id>
# ─────────────────────────────────────────────
@fusion_bp.route("/compute/<int:session_id>", methods=["POST"])
@jwt_required()
def compute(session_id):
    user_id = int(get_jwt_identity())

    # ── Load session ───────────────────────────────────────────────────────────
    session = Session.query.filter_by(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found."}), 404

    if session.is_complete:
        return jsonify({
            "error":   "Session already completed.",
            "message": "Use GET /api/fusion/result/<session_id> to retrieve results.",
        }), 409

    # ── Check all three modules are present ──────────────────────────────────
    demo       = Demographic.query.filter_by(user_id=user_id).first()
    cognitive  = CognitiveAssessment.query.filter_by(session_id=session_id).first()
    mri        = MRIScan.query.filter_by(session_id=session_id).first()

    missing = []
    if not demo:      missing.append("demographics")
    if not cognitive: missing.append("cognitive_assessment")
    if not mri:       missing.append("mri_scan")

    if missing:
        return jsonify({
            "error":   "Cannot compute fusion — missing data.",
            "missing": missing,
            "hint":    "Complete all three modules before running fusion.",
        }), 422

    # ── Run fusion engine ─────────────────────────────────────────────────────
    fusion_result = compute_fusion(
        demographic_data     = demo.to_dict(),
        cognitive_normalized = cognitive.normalized_score,
        mri_risk_score       = mri.mri_risk_score,
    )

    # ── Save to session ───────────────────────────────────────────────────────
    session.final_ad_percentage = fusion_result["ad_percentage"]
    session.stage_label         = fusion_result["stage_display"]
    session.is_complete         = True

    # ── Progression comparison ────────────────────────────────────────────────
    prog_data = compute_progression(session_id, user_id)

    progression = ProgressionRecord(
        user_id                = user_id,
        session_id_current     = session_id,
        session_id_previous    = prog_data.get("session_id_previous"),
        delta_ad_percentage    = prog_data["delta_ad_percentage"],
        delta_cognitive        = prog_data["delta_cognitive"],
        progression_label      = prog_data["progression_label"],
    )
    db.session.add(progression)

    # ── Generate recommendations ──────────────────────────────────────────────
    demo_detail    = fusion_result["demographic_detail"]
    scoring_detail = json.loads(cognitive.answers_json or "[]")

    # Re-run scoring for domain breakdown
    from services.cognitive_service import score_answers
    cog_scoring = score_answers(scoring_detail) if scoring_detail else {}
    weakest     = cog_scoring.get("weakest_domains", [])

    rec_data = generate_recommendations(
        stage_key      = fusion_result["stage_key"],
        risk_factors   = demo_detail.get("risk_factors", []),
        weakest_domains= weakest,
        ad_percentage  = fusion_result["ad_percentage"],
    )

    recommendation = Recommendation(
        user_id             = user_id,
        session_id          = session_id,
        stage               = fusion_result["stage_key"],
        recommendation_json = json.dumps(rec_data),
    )
    db.session.add(recommendation)
    db.session.commit()

    return jsonify({
        "message":        "Fusion computed successfully. Session completed.",
        "fusion":         fusion_result,
        "progression":    prog_data,
        "recommendation": rec_data,
        "session":        session.to_dict(),
    }), 200


# ─────────────────────────────────────────────
# GET /api/fusion/result/<session_id>
# ─────────────────────────────────────────────
@fusion_bp.route("/result/<int:session_id>", methods=["GET"])
@jwt_required()
def get_result(session_id):
    user_id = int(get_jwt_identity())
    session = Session.query.filter_by(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found."}), 404

    if not session.is_complete:
        return jsonify({"error": "Session not yet complete."}), 404

    cognitive   = CognitiveAssessment.query.filter_by(session_id=session_id).first()
    mri         = MRIScan.query.filter_by(session_id=session_id).first()
    progression = ProgressionRecord.query.filter_by(session_id_current=session_id).first()
    rec         = Recommendation.query.filter_by(session_id=session_id).first()

    return jsonify({
        "session":        session.to_dict(),
        "cognitive":      cognitive.to_dict()   if cognitive   else None,
        "mri":            mri.to_dict()         if mri         else None,
        "progression":    progression.to_dict() if progression else None,
        "recommendation": json.loads(rec.recommendation_json) if rec else None,
    }), 200
