"""
routes/report_routes.py
────────────────────────────────────────────────────────────
POST /api/report/generate/<session_id>  — generate PDF
GET  /api/report/download/<session_id>  — download PDF
GET  /api/report/list                   — all user reports
"""

from flask import Blueprint, jsonify, send_file, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.models import Session, Report
from services.report_service import generate_pdf
import io

report_bp = Blueprint("report", __name__)


@report_bp.route("/generate/<int:session_id>", methods=["POST"])
@jwt_required()
def generate(session_id):
    user_id = int(get_jwt_identity())
    session = Session.query.filter_by(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found."}), 404
    if not session.is_complete:
        return jsonify({"error": "Session not complete — run fusion first."}), 422
    try:
        pdf_bytes = generate_pdf(session_id, user_id)
        return jsonify({
            "message":    "Report generated.",
            "session_id": session_id,
            "size_kb":    round(len(pdf_bytes) / 1024, 1),
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@report_bp.route("/download/<int:session_id>", methods=["GET"])
@jwt_required()
def download(session_id):
    user_id = int(get_jwt_identity())
    session = Session.query.filter_by(id=session_id, user_id=user_id).first()
    if not session:
        return jsonify({"error": "Session not found."}), 404
    try:
        pdf_bytes = generate_pdf(session_id, user_id)
        return send_file(
            io.BytesIO(pdf_bytes),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"neuroscan_report_session_{session_id}.pdf",
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@report_bp.route("/list", methods=["GET"])
@jwt_required()
def list_reports():
    user_id = int(get_jwt_identity())
    reports = Report.query.filter_by(user_id=user_id).order_by(Report.generated_at.desc()).all()
    return jsonify({"reports": [r.to_dict() for r in reports]}), 200
