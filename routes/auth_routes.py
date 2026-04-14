from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required, get_jwt_identity, create_access_token, get_jwt
)
from database.db import db
from database.models import User
from utils.auth_utils import hash_password, verify_password, generate_tokens

auth_bp = Blueprint("auth", __name__)

# ─────────────────────────────────────────────
# POST /api/auth/register
# ─────────────────────────────────────────────
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    # Validate required fields
    required = ["name", "email", "password"]
    missing  = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    # Check duplicate email
    if User.query.filter_by(email=data["email"].lower().strip()).first():
        return jsonify({"error": "Email already registered."}), 409

    # Only allow 'patient' self-registration
    # Admins/doctors are created by admin via admin routes
    user = User(
        name          = data["name"].strip(),
        email         = data["email"].lower().strip(),
        password_hash = hash_password(data["password"]),
        role          = "patient"
    )
    db.session.add(user)
    db.session.commit()

    tokens = generate_tokens(user.id, user.role)
    return jsonify({
        "message": "Registration successful.",
        "user":    user.to_dict(),
        **tokens
    }), 201


# ─────────────────────────────────────────────
# POST /api/auth/login
# ─────────────────────────────────────────────
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    email    = data.get("email", "").lower().strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not verify_password(password, user.password_hash):
        return jsonify({"error": "Invalid email or password."}), 401

    if not user.is_active:
        return jsonify({"error": "Account is deactivated. Contact admin."}), 403

    tokens = generate_tokens(user.id, user.role)
    return jsonify({
        "message": "Login successful.",
        "user":    user.to_dict(),
        **tokens
    }), 200


# ─────────────────────────────────────────────
# POST /api/auth/refresh
# ─────────────────────────────────────────────
@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    user    = User.query.get(int(user_id))
    if not user:
        return jsonify({"error": "User not found."}), 404

    new_access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role}
    )
    return jsonify({"access_token": new_access_token}), 200


# ─────────────────────────────────────────────
# GET /api/auth/me   — get current user info
# ─────────────────────────────────────────────
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user    = User.query.get(int(user_id)) if user_id else None
    if not user:
        return jsonify({"error": "User not found."}), 404
    return jsonify({"user": user.to_dict()}), 200


# ─────────────────────────────────────────────
# POST /api/auth/change-password
# ─────────────────────────────────────────────
@auth_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user    = User.query.get(int(user_id)) if user_id else None
    if not user: return jsonify({"error":"User not found."}), 404
    data    = request.get_json() or {}

    old_pw  = data.get("old_password", "")
    new_pw  = data.get("new_password", "")

    if not old_pw or not new_pw:
        return jsonify({"error": "Both old and new passwords are required."}), 400

    if not verify_password(old_pw, user.password_hash):
        return jsonify({"error": "Current password is incorrect."}), 401

    if len(new_pw) < 6:
        return jsonify({"error": "New password must be at least 6 characters."}), 400

    user.password_hash = hash_password(new_pw)
    db.session.commit()
    return jsonify({"message": "Password changed successfully."}), 200
