from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, desc, or_
from datetime import datetime, timedelta
from database.db import db
from database.models import (
    User, Session, Demographic, CognitiveAssessment,
    MRIScan, ModelConfig, ProgressionRecord, Report
)
from utils.auth_utils import hash_password, admin_required, doctor_or_admin_required

admin_bp = Blueprint("admin", __name__)

# ── analytics KPIs ────────────────────────────────────────────────────────────
@admin_bp.route("/analytics", methods=["GET"])
@jwt_required()
@doctor_or_admin_required
def analytics():
    total_patients  = User.query.filter_by(role="patient", is_active=True).count()
    total_sessions  = Session.query.filter_by(is_complete=True).count()
    total_reports   = Report.query.count()
    high_risk_count = Session.query.filter(Session.final_ad_percentage > 75, Session.is_complete == True).count()
    thirty_ago      = datetime.utcnow() - timedelta(days=30)
    recent_sessions = Session.query.filter(Session.created_at >= thirty_ago, Session.is_complete == True).count()
    avg_ad          = db.session.query(func.avg(Session.final_ad_percentage)).filter(Session.is_complete == True).scalar() or 0
    avg_cog         = db.session.query(func.avg(CognitiveAssessment.normalized_score)).scalar() or 0

    stage_dist = (
        db.session.query(Session.stage_label, func.count(Session.id))
        .filter(Session.is_complete == True).group_by(Session.stage_label).all()
    )
    monthly_reg = (
        db.session.query(func.strftime("%Y-%m", User.created_at), func.count(User.id))
        .filter(User.role == "patient")
        .group_by(func.strftime("%Y-%m", User.created_at))
        .order_by(func.strftime("%Y-%m", User.created_at).asc()).limit(8).all()
    )
    monthly_sess = (
        db.session.query(func.strftime("%Y-%m", Session.created_at), func.count(Session.id))
        .filter(Session.is_complete == True)
        .group_by(func.strftime("%Y-%m", Session.created_at))
        .order_by(func.strftime("%Y-%m", Session.created_at).asc()).limit(8).all()
    )

    return jsonify({
        "kpis": {
            "total_patients":      total_patients,
            "total_sessions":      total_sessions,
            "total_reports":       total_reports,
            "high_risk_count":     high_risk_count,
            "recent_sessions":     recent_sessions,
            "avg_ad_percentage":   round(float(avg_ad), 1),
            "avg_cognitive_score": round(float(avg_cog), 1),
        },
        "stage_distribution": [{"stage": s or "Unknown", "count": c} for s, c in stage_dist],
        "monthly_registrations": [{"month": m, "count": c} for m, c in monthly_reg],
        "monthly_sessions":      [{"month": m, "count": c} for m, c in monthly_sess],
    }), 200


# ── advanced analytics ────────────────────────────────────────────────────────
@admin_bp.route("/analytics/advanced", methods=["GET"])
@jwt_required()
@doctor_or_admin_required
def analytics_advanced():
    age_ad = (
        db.session.query(func.floor(Demographic.age / 10) * 10, func.avg(Session.final_ad_percentage), func.count(Session.id))
        .join(Session, Session.user_id == Demographic.user_id)
        .filter(Session.is_complete == True)
        .group_by(func.floor(Demographic.age / 10) * 10)
        .order_by(func.floor(Demographic.age / 10) * 10).all()
    )
    gender_split = db.session.query(Demographic.gender, func.count(Demographic.id)).group_by(Demographic.gender).all()
    total_demo   = Demographic.query.count() or 1
    risk_factors = {
        "family_history": round(Demographic.query.filter_by(family_history=True).count() / total_demo * 100, 1),
        "hypertension":   round(Demographic.query.filter_by(hypertension=True).count()   / total_demo * 100, 1),
        "diabetes":       round(Demographic.query.filter_by(diabetes=True).count()       / total_demo * 100, 1),
        "smoking":        round(Demographic.query.filter_by(smoking=True).count()        / total_demo * 100, 1),
    }
    improved = ProgressionRecord.query.filter_by(progression_label="Improved").count()
    stable   = ProgressionRecord.query.filter_by(progression_label="Stable").count()
    worsened = ProgressionRecord.query.filter_by(progression_label="Worsened").count()
    avg_mri_conf = db.session.query(func.avg(MRIScan.ensemble_confidence)).scalar() or 0

    return jsonify({
        "age_ad_breakdown": [{"age_group": f"{int(a)}s", "avg_ad": round(float(v), 1), "count": c} for a, v, c in age_ad if a],
        "gender_split": [{"gender": g or "unknown", "count": c} for g, c in gender_split],
        "risk_factor_prevalence": risk_factors,
        "progression_outcomes": {"improved": improved, "stable": stable, "worsened": worsened},
        "avg_mri_confidence": round(float(avg_mri_conf) * 100, 1),
    }), 200


# ── patients ──────────────────────────────────────────────────────────────────
@admin_bp.route("/patients", methods=["GET"])
@jwt_required()
@doctor_or_admin_required
def list_patients():
    search = request.args.get("search", "").strip()
    risk   = request.args.get("risk", "").strip()
    sort   = request.args.get("sort", "newest")
    try: page  = max(1, int(request.args.get("page", 1)))
    except (ValueError, TypeError): page = 1
    try: limit = min(100, max(1, int(request.args.get("limit", 20))))
    except (ValueError, TypeError): limit = 20

    query = User.query.filter_by(role="patient")
    if search:
        query = query.filter(or_(User.name.ilike(f"%{search}%"), User.email.ilike(f"%{search}%")))

    total    = query.count()
    patients = query.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    result = []
    for p in patients:
        latest = Session.query.filter_by(user_id=p.id, is_complete=True).order_by(Session.created_at.desc()).first()
        demo   = Demographic.query.filter_by(user_id=p.id).first()
        sc     = Session.query.filter_by(user_id=p.id, is_complete=True).count()
        ad_pct = latest.final_ad_percentage if latest else None

        if risk == "high"     and (ad_pct is None or ad_pct < 75): continue
        if risk == "moderate" and (ad_pct is None or ad_pct < 50 or ad_pct >= 75): continue
        if risk == "low"      and (ad_pct is not None and ad_pct >= 50): continue

        entry = p.to_dict()
        entry.update({
            "latest_ad_percentage": round(ad_pct, 1) if ad_pct else None,
            "latest_stage":         latest.stage_label if latest else None,
            "last_visit":           latest.created_at.isoformat() if latest else None,
            "session_count":        sc,
            "age":                  demo.age if demo else None,
            "gender":               demo.gender if demo else None,
        })
        result.append(entry)

    if sort == "highest_risk": result.sort(key=lambda x: x["latest_ad_percentage"] or 0, reverse=True)
    return jsonify({"patients": result, "total": total, "page": page}), 200


@admin_bp.route("/patients/<int:pid>", methods=["GET"])
@jwt_required()
@doctor_or_admin_required
def get_patient(pid):
    p = User.query.filter_by(id=pid, role="patient").first()
    if not p: return jsonify({"error": "Not found."}), 404
    demo   = Demographic.query.filter_by(user_id=pid).first()
    sess   = Session.query.filter_by(user_id=pid, is_complete=True).order_by(Session.created_at.desc()).all()
    mriscans= MRIScan.query.filter_by(user_id=pid).order_by(MRIScan.created_at.desc()).all()
    cogs   = CognitiveAssessment.query.filter_by(user_id=pid).order_by(CognitiveAssessment.created_at.desc()).all()
    prog   = ProgressionRecord.query.filter_by(user_id=pid).order_by(ProgressionRecord.created_at.desc()).first()
    rpts   = Report.query.filter_by(user_id=pid).order_by(Report.generated_at.desc()).all()
    trend  = [{"session_id": s.id, "ad_percentage": s.final_ad_percentage, "stage": s.stage_label, "date": s.created_at.isoformat()} for s in reversed(sess)]
    return jsonify({"patient": p.to_dict(), "demographics": demo.to_dict() if demo else None, "sessions": [s.to_dict() for s in sess], "mri_scans": [m.to_dict() for m in mriscans], "cognitive_tests": [c.to_dict() for c in cogs], "latest_progression": prog.to_dict() if prog else None, "reports": [r.to_dict() for r in rpts], "trend": trend}), 200


@admin_bp.route("/patients/<int:pid>", methods=["PUT"])
@jwt_required()
@admin_required
def update_patient(pid):
    p = User.query.filter_by(id=pid, role="patient").first()
    if not p: return jsonify({"error": "Not found."}), 404
    data = request.get_json() or {}
    if "is_active" in data: p.is_active = bool(data["is_active"])
    db.session.commit()
    return jsonify({"message": "Updated.", "patient": p.to_dict()}), 200


@admin_bp.route("/patients/<int:pid>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_patient(pid):
    p = User.query.filter_by(id=pid, role="patient").first()
    if not p: return jsonify({"error": "Not found."}), 404
    p.is_active = False
    db.session.commit()
    return jsonify({"message": "Patient deactivated."}), 200


# ── flagged ───────────────────────────────────────────────────────────────────
@admin_bp.route("/flagged", methods=["GET"])
@jwt_required()
@doctor_or_admin_required
def flagged():
    threshold = float(request.args.get("threshold", 75))
    sessions  = Session.query.filter(Session.final_ad_percentage > threshold, Session.is_complete == True).order_by(Session.final_ad_percentage.desc()).limit(50).all()
    result, seen = [], set()
    for s in sessions:
        if s.user_id in seen: continue
        seen.add(s.user_id)
        u = User.query.get(s.user_id)
        if not u: continue
        d = Demographic.query.filter_by(user_id=s.user_id).first()
        result.append({"user": u.to_dict(), "ad_percentage": round(s.final_ad_percentage or 0, 1), "stage": s.stage_label, "last_visit": s.created_at.isoformat(), "age": d.age if d else None})
    return jsonify({"flagged_patients": result, "count": len(result)}), 200


# ── recent activity ───────────────────────────────────────────────────────────
@admin_bp.route("/recent-activity", methods=["GET"])
@jwt_required()
@doctor_or_admin_required
def recent_activity():
    sessions = Session.query.filter_by(is_complete=True).order_by(Session.created_at.desc()).limit(20).all()
    result   = []
    for s in sessions:
        u = User.query.get(s.user_id)
        if not u: continue
        result.append({"session_id": s.id, "user_name": u.name, "user_id": s.user_id, "ad_percentage": round(s.final_ad_percentage or 0, 1), "stage": s.stage_label, "date": s.created_at.isoformat()})
    return jsonify({"activity": result}), 200


# ── global search ─────────────────────────────────────────────────────────────
@admin_bp.route("/search", methods=["GET"])
@jwt_required()
@doctor_or_admin_required
def global_search():
    q = request.args.get("q", "").strip()
    if len(q) < 2: return jsonify({"results": []}), 200
    patients = User.query.filter(User.role == "patient", or_(User.name.ilike(f"%{q}%"), User.email.ilike(f"%{q}%"))).limit(8).all()
    return jsonify({"results": [{"type": "patient", "id": p.id, "label": p.name, "sub": p.email} for p in patients]}), 200


# ── staff ─────────────────────────────────────────────────────────────────────
@admin_bp.route("/doctors", methods=["POST"])
@jwt_required()
@admin_required
def create_doctor():
    data = request.get_json() or {}
    for f in ["name", "email", "password", "role"]:
        if not data.get(f): return jsonify({"error": f"'{f}' required."}), 400
    if data["role"] not in ("doctor", "admin"): return jsonify({"error": "Role must be doctor or admin."}), 400
    if User.query.filter_by(email=data["email"].lower()).first(): return jsonify({"error": "Email taken."}), 409
    u = User(name=data["name"].strip(), email=data["email"].lower().strip(), password_hash=hash_password(data["password"]), role=data["role"])
    db.session.add(u); db.session.commit()
    return jsonify({"message": "Created.", "user": u.to_dict()}), 201


@admin_bp.route("/doctors", methods=["GET"])
@jwt_required()
@admin_required
def list_doctors():
    staff = User.query.filter(User.role.in_(["doctor", "admin"])).order_by(User.created_at.desc()).all()
    return jsonify({"staff": [u.to_dict() for u in staff]}), 200


@admin_bp.route("/doctors/<int:did>", methods=["PUT"])
@jwt_required()
@admin_required
def update_doctor(did):
    u = User.query.filter(User.id == did, User.role.in_(["doctor", "admin"])).first()
    if not u: return jsonify({"error": "Not found."}), 404
    data = request.get_json() or {}
    if "is_active" in data: u.is_active = bool(data["is_active"])
    if "role" in data and data["role"] in ("doctor", "admin"): u.role = data["role"]
    db.session.commit()
    return jsonify({"message": "Updated.", "user": u.to_dict()}), 200


@admin_bp.route("/doctors/<int:did>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_doctor(did):
    u = User.query.filter(User.id == did, User.role.in_(["doctor", "admin"])).first()
    if not u: return jsonify({"error": "Not found."}), 404
    u.is_active = False; db.session.commit()
    return jsonify({"message": "Deactivated."}), 200


# ── model config ──────────────────────────────────────────────────────────────
@admin_bp.route("/model-config", methods=["GET"])
@jwt_required()
@doctor_or_admin_required
def get_model_config():
    c = ModelConfig.query.first()
    if not c: c = ModelConfig(); db.session.add(c); db.session.commit()
    return jsonify({"config": c.to_dict()}), 200


@admin_bp.route("/model-config", methods=["PUT"])
@jwt_required()
@admin_required
def update_model_config():
    data = request.get_json() or {}
    c    = ModelConfig.query.first()
    if not c: c = ModelConfig(); db.session.add(c)
    w1 = float(data.get("weight_demographic", c.weight_demographic))
    w2 = float(data.get("weight_cognitive",   c.weight_cognitive))
    w3 = float(data.get("weight_mri",         c.weight_mri))
    if abs(w1 + w2 + w3 - 1.0) > 0.02:
        return jsonify({"error": f"Weights must sum to 1.0 (got {w1+w2+w3:.2f})"}), 400
    c.weight_demographic = round(w1, 3); c.weight_cognitive = round(w2, 3); c.weight_mri = round(w3, 3)
    if "active_model" in data:
        if data["active_model"] not in ("vgg16", "resnet50", "ensemble"):
            return jsonify({"error": "active_model must be vgg16, resnet50, or ensemble."}), 400
        c.active_model = data["active_model"]
    if "mild_threshold"     in data: c.mild_threshold     = float(data["mild_threshold"])
    if "moderate_threshold" in data: c.moderate_threshold = float(data["moderate_threshold"])
    c.updated_by = int(get_jwt_identity())
    db.session.commit()
    return jsonify({"message": "Config updated.", "config": c.to_dict()}), 200
