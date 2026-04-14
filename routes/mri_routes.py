"""
routes/mri_routes.py
─────────────────────────────────────────────────────────────
POST /api/mri/upload   — upload MRI, run ensemble, save result
GET  /api/mri/history  — all MRI scans for current user
GET  /api/mri/<id>     — single scan detail
"""

import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from database.db import db
from database.models import MRIScan, Session, ModelConfig
from services.mri_service import predict_mri

mri_bp = Blueprint("mri", __name__)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".dcm", ".nii", ".gz", ".bmp", ".tiff"}


def _allowed(filename: str) -> bool:
    _, ext = os.path.splitext(filename.lower())
    return ext in ALLOWED_EXTENSIONS


# ─────────────────────────────────────────────
# POST /api/mri/upload
# ─────────────────────────────────────────────
@mri_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_mri():
    user_id = int(get_jwt_identity())

    # ── Validate file ──────────────────────────────────────────────────────────
    if "mri_file" not in request.files:
        return jsonify({"error": "No file uploaded. Field name must be 'mri_file'."}), 400

    file = request.files["mri_file"]
    if not file.filename:
        return jsonify({"error": "Empty filename."}), 400
    if not _allowed(file.filename):
        return jsonify({"error": f"Unsupported file type. Allowed: {ALLOWED_EXTENSIONS}"}), 400

    # ── Validate session ──────────────────────────────────────────────────────
    session_id = request.form.get("session_id")
    if not session_id:
        return jsonify({"error": "session_id is required."}), 400

    session = Session.query.filter_by(id=int(session_id), user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found."}), 404

    if session.is_complete:
        return jsonify({"error": "Session is already complete. Start a new session to upload another MRI."}), 409

    if MRIScan.query.filter_by(session_id=session.id).first():
        return jsonify({"error": "MRI already submitted for this session. Start a new session."}), 409

    # ── Read file bytes ────────────────────────────────────────────────────────
    file_bytes = file.read()
    if len(file_bytes) == 0:
        return jsonify({"error": "Uploaded file is empty."}), 400

    # ── Save raw file to disk ──────────────────────────────────────────────────
    upload_dir = current_app.config.get("UPLOAD_FOLDER",
                     os.path.join(os.path.dirname(__file__), "..", "uploads", "mri"))
    os.makedirs(upload_dir, exist_ok=True)

    safe_name  = f"{user_id}_{session.id}_{uuid.uuid4().hex}{os.path.splitext(file.filename)[1].lower()}"
    save_path  = os.path.join(upload_dir, safe_name)
    with open(save_path, "wb") as f_out:
        f_out.write(file_bytes)

    # ── Get active model config ────────────────────────────────────────────────
    config       = ModelConfig.query.first()
    active_model = config.active_model if config else "ensemble"

    # ── Run inference ──────────────────────────────────────────────────────────
    try:
        result = predict_mri(file_bytes, filename=file.filename, active_model=active_model)
    except Exception as e:
        return jsonify({"error": f"Model inference failed: {str(e)}"}), 500

    # ── Persist result ─────────────────────────────────────────────────────────
    scan = MRIScan(
        user_id              = user_id,
        session_id           = session.id,
        file_path            = save_path,
        vgg16_prediction     = result["vgg16_prediction"],
        vgg16_confidence     = result["vgg16_confidence"],
        resnet50_prediction  = result["resnet50_prediction"],
        resnet50_confidence  = result["resnet50_confidence"],
        ensemble_stage       = result["ensemble_stage"],
        ensemble_confidence  = result["ensemble_confidence"],
        mri_risk_score       = result["mri_risk_score"],
    )
    db.session.add(scan)
    db.session.commit()

    return jsonify({
        "message":            "MRI processed successfully.",
        "scan":               scan.to_dict(),
        "all_probabilities":  result["all_probabilities"],
        "stage_display":      result["ensemble_stage_display"],
        "mock":               result.get("mock", False),
    }), 201


# ─────────────────────────────────────────────
# GET /api/mri/history
# ─────────────────────────────────────────────
@mri_bp.route("/history", methods=["GET"])
@jwt_required()
def mri_history():
    user_id = int(get_jwt_identity())
    scans   = (
        MRIScan.query
        .filter_by(user_id=user_id)
        .order_by(MRIScan.created_at.desc())
        .all()
    )
    return jsonify({"scans": [s.to_dict() for s in scans]}), 200


# ─────────────────────────────────────────────
# GET /api/mri/<scan_id>
# ─────────────────────────────────────────────
@mri_bp.route("/<int:scan_id>", methods=["GET"])
@jwt_required()
def get_scan(scan_id):
    user_id = int(get_jwt_identity())
    scan    = MRIScan.query.filter_by(id=scan_id, user_id=user_id).first()
    if not scan:
        return jsonify({"error": "Scan not found."}), 404
    return jsonify({"scan": scan.to_dict()}), 200
