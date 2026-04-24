import json
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.db import db
from database.models import User, Session, Demographic, CognitiveAssessment, MRIScan, ProgressionRecord, Recommendation, Report
from utils.auth_utils import hash_password, patient_required


import json as _json

def _build_rec_summary(rec_obj):
    """Parse recommendation JSON and return flat_list + total_items for dashboard."""
    if not rec_obj or not rec_obj.recommendation_json:
        return None
    try:
        data = _json.loads(rec_obj.recommendation_json)
        flat = []
        for cat, items in (data.get("categories") or {}).items():
            for item in (items or []):
                flat.append({"category": cat.title(), "advice": item})
        return {
            "session_id":  rec_obj.session_id,
            "stage":       rec_obj.stage,
            "flat_list":   flat,
            "total_items": len(flat),
            "follow_up":   data.get("follow_up", ""),
            "categories":  data.get("categories", {}),
        }
    except Exception:
        return None

user_bp = Blueprint("user", __name__)
def _require_user():
    """Returns (user_id, None) or (None, 401_response)."""
    uid = get_jwt_identity()
    if not uid:
        return None, (jsonify({"error": "Authentication required."}), 401)
    return int(uid), None



# ─────────────────────────────────────────────
# GET /api/user/dashboard
# ─────────────────────────────────────────────
@user_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    _uid = get_jwt_identity()
    if not _uid:
        return jsonify({"error": "Authentication required."}), 401
    user_id = int(_uid)
    user    = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found."}), 404

    # Absolute latest session (regardless of completion)
    latest_any = (
        Session.query
        .filter_by(user_id=user_id)
        .order_by(Session.id.desc())
        .first()
    )

    # Latest completed session for stats
    latest_complete = (
        Session.query
        .filter_by(user_id=user_id, is_complete=True)
        .order_by(Session.id.desc())
        .first()
    )

    # All completed sessions for trend chart
    all_sessions = (
        Session.query
        .filter_by(user_id=user_id, is_complete=True)
        .order_by(Session.created_at.asc())
        .all()
    )

    # Latest recommendation
    latest_rec = (
        Recommendation.query
        .filter_by(user_id=user_id)
        .order_by(Recommendation.id.desc())
        .first()
    )

    # Latest progression
    latest_prog = (
        ProgressionRecord.query
        .filter_by(user_id=user_id)
        .order_by(ProgressionRecord.id.desc())
        .first()
    )

    return jsonify({
        "user":             user.to_dict(),
        "latest_session":   latest_complete.to_dict() if latest_complete else None,
        "latest_any":       latest_any.to_dict() if latest_any else None,
        "progression":      latest_prog.to_dict()    if latest_prog    else None,
        "recommendation":   _build_rec_summary(latest_rec),
        "session_trend": [
            {
                "session_id":       s.id,
                "ad_percentage":    s.final_ad_percentage,
                "stage":            s.stage_label,
                "date":             s.created_at.isoformat()
            }
            for s in all_sessions
        ]
    }), 200


# ─────────────────────────────────────────────
# GET /api/user/profile
# PUT /api/user/profile
# ─────────────────────────────────────────────
@user_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user: return jsonify({"error":"User not found."}), 404
    demo    = Demographic.query.filter_by(user_id=user_id).first()
    return jsonify({
        "user":         user.to_dict(),
        "demographics": demo.to_dict() if demo else None
    }), 200


@user_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user: return jsonify({"error":"User not found."}), 404
    data    = request.get_json() or {}

    if "name" in data:
        user.name = data["name"].strip()

    db.session.commit()
    return jsonify({"message": "Profile updated.", "user": user.to_dict()}), 200


# ─────────────────────────────────────────────
# GET /api/user/sessions          — all sessions
# POST /api/user/sessions         — start new session
# GET /api/user/sessions/<id>     — single session detail
# ─────────────────────────────────────────────
@user_bp.route("/sessions", methods=["GET"])
@jwt_required()
def list_sessions():
    user_id  = int(get_jwt_identity())
    sessions = (
        Session.query
        .filter_by(user_id=user_id)
        .order_by(Session.created_at.desc())
        .all()
    )
    return jsonify({"sessions": [s.to_dict() for s in sessions]}), 200


@user_bp.route("/sessions", methods=["POST"])
@jwt_required()
def start_session():
    user_id = int(get_jwt_identity())
    data    = request.get_json() or {}
    force   = data.get("force", False)

    # Only resume if not forcing a new one
    if not force:
        incomplete = Session.query.filter_by(user_id=user_id, is_complete=False).first()
        if incomplete:
            return jsonify({
                "message":    "Resuming existing session.",
                "session":    incomplete.to_dict()
            }), 200

    # Start fresh
    new_session = Session(user_id=user_id)
    db.session.add(new_session)
    db.session.commit()
    return jsonify({
        "message": "New session started.",
        "session": new_session.to_dict()
    }), 201


@user_bp.route("/sessions/<int:session_id>", methods=["GET"])
@jwt_required()
def get_session(session_id):
    user_id = int(get_jwt_identity())
    session = Session.query.filter_by(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found."}), 404

    # Assemble full session detail
    cognitive = CognitiveAssessment.query.filter_by(session_id=session_id).first()
    mri       = MRIScan.query.filter_by(session_id=session_id).first()
    rec       = Recommendation.query.filter_by(session_id=session_id).first()
    prog      = ProgressionRecord.query.filter_by(session_id_current=session_id).first()
    report    = Report.query.filter_by(session_id=session_id).first()

    return jsonify({
        "session":    session.to_dict(),
        "cognitive":  cognitive.to_dict() if cognitive else None,
        "mri":        mri.to_dict()       if mri       else None,
        "recommendation": rec.to_dict()   if rec       else None,
        "progression":    prog.to_dict()  if prog      else None,
        "report":     report.to_dict()    if report    else None,
    }), 200


@user_bp.route("/sessions/<int:session_id>", methods=["DELETE"])
@jwt_required()
def delete_session(session_id):
    user_id = int(get_jwt_identity())
    session = Session.query.filter_by(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found."}), 404
    
    # Cascade delete is handled by SQLAlchemy if configured, but let's be safe.
    # Actually, let's just delete the session and let the DB foreign keys handle it or clean up manually.
    db.session.delete(session)
    db.session.commit()
    return jsonify({"message": "Session deleted successfully."}), 200


# ─────────────────────────────────────────────
# GET /api/user/progression   — full history
# ─────────────────────────────────────────────
@user_bp.route("/progression", methods=["GET"])
@jwt_required()
def progression_history():
    user_id  = int(get_jwt_identity())
    records  = (
        ProgressionRecord.query
        .filter_by(user_id=user_id)
        .order_by(ProgressionRecord.created_at.asc())
        .all()
    )
    return jsonify({"progression": [r.to_dict() for r in records]}), 200


# ─────────────────────────────────────────────
# GET /api/user/reports   — list all reports
# ─────────────────────────────────────────────
@user_bp.route("/reports", methods=["GET"])
@jwt_required()
def list_reports():
    user_id = int(get_jwt_identity())
    reports = (
        Report.query
        .filter_by(user_id=user_id)
        .order_by(Report.generated_at.desc())
        .all()
    )
    return jsonify({"reports": [r.to_dict() for r in reports]}), 200
