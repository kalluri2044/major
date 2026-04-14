"""
routes/demographic_routes.py
─────────────────────────────────────────────────────────────
POST /api/demographics/save     — create or update demographics
GET  /api/demographics          — fetch current user's demographics
GET  /api/demographics/risk     — compute risk score (no DB write)
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from database.db import db
from database.models import Demographic
from services.demographic_service import compute_demographic_risk

demographic_bp = Blueprint("demographics", __name__)

REQUIRED_FIELDS  = ["age", "gender"]
VALID_EDUCATION  = ["none", "school", "undergraduate", "postgraduate"]
VALID_ACTIVITY   = ["low", "moderate", "high"]
VALID_SLEEP      = ["poor", "average", "good"]
VALID_GENDER     = ["male", "female", "other"]


def _validate(data: dict) -> list:
    errors = []
    age = data.get("age")
    if age is None:
        errors.append("age is required.")
    else:
        try:
            age = int(age)
            if not (18 <= age <= 120):
                errors.append("age must be between 18 and 120.")
        except (ValueError, TypeError):
            errors.append("age must be an integer.")

    if data.get("gender") not in VALID_GENDER:
        errors.append(f"gender must be one of: {VALID_GENDER}")
    if data.get("education_level") and data["education_level"] not in VALID_EDUCATION:
        errors.append(f"education_level must be one of: {VALID_EDUCATION}")
    if data.get("physical_activity") and data["physical_activity"] not in VALID_ACTIVITY:
        errors.append(f"physical_activity must be one of: {VALID_ACTIVITY}")
    if data.get("sleep_quality") and data["sleep_quality"] not in VALID_SLEEP:
        errors.append(f"sleep_quality must be one of: {VALID_SLEEP}")
    return errors


# ─────────────────────────────────────────────
# POST /api/demographics/save
# ─────────────────────────────────────────────
@demographic_bp.route("/save", methods=["POST"])
@jwt_required()
def save_demographics():
    user_id = int(get_jwt_identity())
    data    = request.get_json() or {}

    errors = _validate(data)
    if errors:
        return jsonify({"error": "Validation failed.", "details": errors}), 400

    demo = Demographic.query.filter_by(user_id=user_id).first()

    if demo:
        # Update existing record
        demo.age               = int(data["age"])
        demo.gender            = data["gender"]
        demo.family_history    = bool(data.get("family_history",    False))
        demo.education_level   = data.get("education_level",   "school")
        demo.smoking           = bool(data.get("smoking",           False))
        demo.physical_activity = data.get("physical_activity", "moderate")
        demo.sleep_quality     = data.get("sleep_quality",     "average")
        demo.hypertension      = bool(data.get("hypertension",      False))
        demo.diabetes          = bool(data.get("diabetes",          False))
        # Extended fields
        demo.depression_history  = bool(data.get("depression_history", False))
        demo.head_injury         = bool(data.get("head_injury",        False))
        demo.hearing_loss        = bool(data.get("hearing_loss",       False))
        demo.social_isolation    = bool(data.get("social_isolation",   False))
        action = "updated"
    else:
        demo = Demographic(
            user_id           = user_id,
            age               = int(data["age"]),
            gender            = data["gender"],
            family_history    = bool(data.get("family_history",    False)),
            education_level   = data.get("education_level",   "school"),
            smoking           = bool(data.get("smoking",           False)),
            physical_activity = data.get("physical_activity", "moderate"),
            sleep_quality     = data.get("sleep_quality",     "average"),
            hypertension      = bool(data.get("hypertension",      False)),
            diabetes          = bool(data.get("diabetes",          False)),
        )
        db.session.add(demo)
        action = "created"

    db.session.commit()

    # Compute risk immediately and return it
    risk = compute_demographic_risk(demo.to_dict())

    return jsonify({
        "message":     f"Demographics {action} successfully.",
        "demographics": demo.to_dict(),
        "risk_profile": risk,
    }), 200


# ─────────────────────────────────────────────
# GET /api/demographics
# ─────────────────────────────────────────────
@demographic_bp.route("", methods=["GET"])
@jwt_required()
def get_demographics():
    user_id = int(get_jwt_identity())
    demo    = Demographic.query.filter_by(user_id=user_id).first()

    if not demo:
        return jsonify({"demographics": None, "risk_profile": None}), 200

    risk = compute_demographic_risk(demo.to_dict())
    return jsonify({
        "demographics":  demo.to_dict(),
        "risk_profile":  risk,
    }), 200


# ─────────────────────────────────────────────
# POST /api/demographics/risk-preview
# No DB write — just compute risk from submitted data
# ─────────────────────────────────────────────
@demographic_bp.route("/risk-preview", methods=["POST"])
@jwt_required()
def risk_preview():
    data   = request.get_json() or {}
    errors = _validate(data)
    if errors:
        return jsonify({"error": "Validation failed.", "details": errors}), 400

    risk = compute_demographic_risk(data)
    return jsonify({"risk_profile": risk}), 200
