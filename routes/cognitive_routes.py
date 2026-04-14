"""
routes/cognitive_routes.py
─────────────────────────────────────────────────────────────
GET  /api/cognitive/questions       — fetch 25-question bank
POST /api/cognitive/submit          — score and save assessment
GET  /api/cognitive/history         — all past tests
GET  /api/cognitive/<id>            — single test detail
"""

import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from database.db import db
from database.models import CognitiveAssessment, Session
from services.cognitive_service import get_questions, score_answers

cognitive_bp = Blueprint("cognitive", __name__)


# ─────────────────────────────────────────────
# GET /api/cognitive/questions
# ─────────────────────────────────────────────
@cognitive_bp.route("/questions", methods=["GET"])
@jwt_required()
def questions():
    return jsonify({
        "questions":   get_questions(),
        "total":       25,
        "max_score":   50,
        "domains": [
            "Orientation", "Memory Registration", "Attention",
            "Language", "Visuospatial", "Executive Function", "Delayed Memory Recall"
        ]
    }), 200


# ─────────────────────────────────────────────
# POST /api/cognitive/submit
# Body: { session_id, answers: [{question_id, raw_answer, awarded_score}] }
# ─────────────────────────────────────────────
@cognitive_bp.route("/submit", methods=["POST"])
@jwt_required()
def submit():
    user_id = int(get_jwt_identity())
    data    = request.get_json() or {}

    session_id = data.get("session_id")
    answers    = data.get("answers", [])

    if not session_id:
        return jsonify({"error": "session_id is required."}), 400
    if not answers or len(answers) < 20:
        return jsonify({"error": "At least 20 answers are required."}), 400

    # Validate session belongs to user
    session = Session.query.filter_by(id=int(session_id), user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found."}), 404

    # Check not already submitted for this session
    existing = CognitiveAssessment.query.filter_by(session_id=session.id).first()
    if existing:
        return jsonify({
            "error": "Cognitive assessment already submitted for this session.",
            "assessment": existing.to_dict()
        }), 409

    # Score all answers
    result = score_answers(answers)

    # Persist
    assessment = CognitiveAssessment(
        user_id          = user_id,
        session_id       = session.id,
        raw_score        = result["raw_score"],
        normalized_score = result["normalized_score"],
        answers_json     = json.dumps(answers),
    )
    db.session.add(assessment)
    db.session.commit()

    return jsonify({
        "message":    "Cognitive assessment scored and saved.",
        "assessment": assessment.to_dict(),
        "scoring":    result,
    }), 201


# ─────────────────────────────────────────────
# GET /api/cognitive/history
# ─────────────────────────────────────────────
@cognitive_bp.route("/history", methods=["GET"])
@jwt_required()
def history():
    user_id = int(get_jwt_identity())
    tests   = (
        CognitiveAssessment.query
        .filter_by(user_id=user_id)
        .order_by(CognitiveAssessment.created_at.desc())
        .all()
    )
    return jsonify({
        "history": [t.to_dict() for t in tests],
        "count":   len(tests)
    }), 200


# ─────────────────────────────────────────────
# GET /api/cognitive/<id>
# ─────────────────────────────────────────────
@cognitive_bp.route("/<int:assessment_id>", methods=["GET"])
@jwt_required()
def get_assessment(assessment_id):
    user_id    = int(get_jwt_identity())
    assessment = CognitiveAssessment.query.filter_by(
        id=assessment_id, user_id=user_id
    ).first()

    if not assessment:
        return jsonify({"error": "Assessment not found."}), 404

    # Re-score to get full breakdown
    stored_answers = json.loads(assessment.answers_json or "[]")
    result         = score_answers(stored_answers) if stored_answers else {}

    return jsonify({
        "assessment": assessment.to_dict(),
        "scoring":    result,
    }), 200
