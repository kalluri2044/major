"""
routes/phase6_routes.py
────────────────────────────────────────────────────────────
Phase 6 endpoints:

Notifications:
  GET  /api/notifications          — unread notifications for current user
  PUT  /api/notifications/read-all — mark all read
  PUT  /api/notifications/<id>/read

User Settings:
  PUT  /api/settings/profile       — update name / email
  PUT  /api/settings/password      — change password
  DELETE /api/settings/account     — deactivate own account

Session Results:
  GET  /api/results/<session_id>   — full assembled result for results page

Admin Export:
  GET  /api/admin/export/patients  — download all patients as CSV
"""

import csv
import io
from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from database.db import db
from database.models import (
    User, Notification, Session, CognitiveAssessment,
    MRIScan, ProgressionRecord, Recommendation, Report, Demographic
)
from utils.auth_utils import verify_password, hash_password, admin_required, doctor_or_admin_required

phase6_bp = Blueprint("phase6", __name__)

def _require_uid():
    uid = get_jwt_identity()
    if not uid:
        from flask import jsonify as _jj
        return None, (_jj({"error": "Authentication required."}), 401)
    return int(uid), None


# ─────────────────────────────────────────────────────────────
# NOTIFICATIONS
# ─────────────────────────────────────────────────────────────
@phase6_bp.route("/notifications", methods=["GET"])
@jwt_required()
def get_notifications():
    uid, err = _require_uid()
    if err: return err
    user_id = uid
    notifs  = (
        Notification.query
        .filter_by(user_id=user_id)
        .order_by(Notification.created_at.desc())
        .limit(30).all()
    )
    unread = sum(1 for n in notifs if not n.is_read)
    return jsonify({
        "notifications": [n.to_dict() for n in notifs],
        "unread_count":  unread,
    }), 200


@phase6_bp.route("/notifications/read-all", methods=["PUT"])
@jwt_required()
def mark_all_read():
    user_id = int(get_jwt_identity())
    Notification.query.filter_by(user_id=user_id, is_read=False).update({"is_read": True})
    db.session.commit()
    return jsonify({"message": "All notifications marked as read."}), 200


@phase6_bp.route("/notifications/<int:notif_id>/read", methods=["PUT"])
@jwt_required()
def mark_read(notif_id):
    user_id = int(get_jwt_identity())
    n = Notification.query.filter_by(id=notif_id, user_id=user_id).first()
    if n:
        n.is_read = True
        db.session.commit()
    return jsonify({"message": "Marked as read."}), 200


def create_notification(user_id: int, title: str, message: str,
                        notif_type: str = "info", link: str = None):
    """Helper — call from other services after key events."""
    n = Notification(
        user_id    = user_id,
        title      = title,
        message    = message,
        notif_type = notif_type,
        link       = link,
    )
    db.session.add(n)
    db.session.commit()
    return n


# ─────────────────────────────────────────────────────────────
# USER SETTINGS
# ─────────────────────────────────────────────────────────────
@phase6_bp.route("/settings/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user: return jsonify({"error":"User not found."}), 404
    data    = request.get_json() or {}

    if "name" in data and data["name"].strip():
        user.name = data["name"].strip()

    if "email" in data and data["email"].strip():
        new_email = data["email"].lower().strip()
        if new_email != user.email:
            if User.query.filter_by(email=new_email).first():
                return jsonify({"error": "Email already in use."}), 409
            user.email = new_email

    db.session.commit()
    return jsonify({"message": "Profile updated.", "user": user.to_dict()}), 200


@phase6_bp.route("/settings/password", methods=["PUT"])
@jwt_required()
def change_password():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user: return jsonify({"error":"User not found."}), 404
    data    = request.get_json() or {}

    old_pw  = data.get("old_password", "")
    new_pw  = data.get("new_password", "")

    if not verify_password(old_pw, user.password_hash):
        return jsonify({"error": "Current password is incorrect."}), 401
    if len(new_pw) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    user.password_hash = hash_password(new_pw)
    db.session.commit()

    create_notification(user_id, "Password Changed",
        "Your account password was successfully updated.", "success")
    return jsonify({"message": "Password changed successfully."}), 200


@phase6_bp.route("/settings/account", methods=["DELETE"])
@jwt_required()
def deactivate_account():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user: return jsonify({"error":"User not found."}), 404
    data    = request.get_json() or {}

    if not verify_password(data.get("password", ""), user.password_hash):
        return jsonify({"error": "Password incorrect — account not deleted."}), 401

    user.is_active = False
    db.session.commit()
    return jsonify({"message": "Account deactivated."}), 200


# ─────────────────────────────────────────────────────────────
# SESSION RESULTS (full assembled view)
# ─────────────────────────────────────────────────────────────
@phase6_bp.route("/results/<int:session_id>", methods=["GET"])
@jwt_required()
def get_results(session_id):
    user_id    = int(get_jwt_identity())
    session    = Session.query.filter_by(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found."}), 404
    if not session.is_complete:
        return jsonify({"error": "Session not yet complete."}), 422

    cognitive   = CognitiveAssessment.query.filter_by(session_id=session_id).first()
    mri         = MRIScan.query.filter_by(session_id=session_id).first()
    progression = ProgressionRecord.query.filter_by(session_id_current=session_id).first()
    rec         = Recommendation.query.filter_by(session_id=session_id).first()
    report      = Report.query.filter_by(session_id=session_id).first()
    demo        = Demographic.query.filter_by(user_id=user_id).first()

    import json as _json
    raw_rec  = _json.loads(rec.recommendation_json) if rec else {}
    flat     = []
    for cat, items in (raw_rec.get("categories") or {}).items():
        for item in (items or []):
            flat.append({"category": cat.title(), "advice": item})
    rec_data = {
        "categories":  raw_rec.get("categories", {}),
        "follow_up":   raw_rec.get("follow_up", ""),
        "flat_list":   flat,
        "total_items": len(flat),
    }

    # All sessions for trend
    all_sessions = (
        Session.query
        .filter_by(user_id=user_id, is_complete=True)
        .order_by(Session.created_at.asc()).all()
    )

    return jsonify({
        "session":      session.to_dict(),
        "cognitive":    cognitive.to_dict()   if cognitive   else None,
        "mri":          mri.to_dict()         if mri         else None,
        "demographics": demo.to_dict()        if demo        else None,
        "progression":  progression.to_dict() if progression else None,
        "recommendation": rec_data,
        "report":       report.to_dict()      if report      else None,
        "session_trend": [
            {"session_id": s.id, "ad_percentage": s.final_ad_percentage,
             "stage": s.stage_label, "date": s.created_at.isoformat()}
            for s in all_sessions
        ],
    }), 200


# ─────────────────────────────────────────────────────────────
# ADMIN CSV EXPORT
# ─────────────────────────────────────────────────────────────
@phase6_bp.route("/admin/export/patients", methods=["GET"])
@jwt_required()
@doctor_or_admin_required
def export_patients_csv():
    patients = User.query.filter_by(role="patient").all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Patient ID", "Name", "Email", "Active",
        "Age", "Gender", "Education", "Family History",
        "Hypertension", "Diabetes", "Smoking",
        "Total Sessions", "Latest AD%", "Latest Stage",
        "Last Visit", "Registered"
    ])

    for p in patients:
        demo   = Demographic.query.filter_by(user_id=p.id).first()
        latest = Session.query.filter_by(user_id=p.id, is_complete=True)\
                    .order_by(Session.created_at.desc()).first()
        sess_count = Session.query.filter_by(user_id=p.id, is_complete=True).count()

        writer.writerow([
            p.id, p.name, p.email, p.is_active,
            demo.age            if demo else "",
            demo.gender         if demo else "",
            demo.education_level if demo else "",
            demo.family_history  if demo else "",
            demo.hypertension    if demo else "",
            demo.diabetes        if demo else "",
            demo.smoking         if demo else "",
            sess_count,
            round(latest.final_ad_percentage, 1) if latest and latest.final_ad_percentage else "",
            latest.stage_label if latest else "",
            latest.created_at.strftime("%Y-%m-%d") if latest else "",
            p.created_at.strftime("%Y-%m-%d"),
        ])

    csv_data = output.getvalue()
    return Response(
        csv_data,
        mimetype="text/csv",
        headers={
            "Content-Disposition":
                f"attachment;filename=neuroscan_patients_{datetime.now().strftime('%Y%m%d')}.csv"
        }
    )
