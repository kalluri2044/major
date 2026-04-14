from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, create_refresh_token
from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from flask import jsonify
from database.models import User

# ── Password helpers ───────────────────────────────────────────────────────────
def hash_password(plain: str) -> str:
    return generate_password_hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return check_password_hash(hashed, plain)

# ── Token helpers ──────────────────────────────────────────────────────────────
def generate_tokens(user_id: int, role: str) -> dict:
    identity = str(user_id)
    additional_claims = {"role": role}
    return {
        "access_token":  create_access_token(identity=identity,  additional_claims=additional_claims),
        "refresh_token": create_refresh_token(identity=identity, additional_claims=additional_claims),
    }

# ── Role-based decorators ──────────────────────────────────────────────────────
def role_required(*roles):
    """Usage: @role_required('admin') or @role_required('admin','doctor')"""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            # Try DB lookup first; fall back to JWT claims
            user = User.query.get(int(user_id)) if user_id else None
            if user:
                role = user.role
                if not user.is_active:
                    return jsonify({"error": "Account is deactivated."}), 403
            else:
                # Fallback: read role from JWT claims (handles test/stub environments)
                try:
                    claims = get_jwt()
                    role = claims.get("role", "")
                except Exception:
                    role = ""
            if role not in roles:
                return jsonify({"error": "Access denied. Insufficient permissions."}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def patient_required(fn):
    return role_required("patient")(fn)

def admin_required(fn):
    return role_required("admin")(fn)

def doctor_or_admin_required(fn):
    return role_required("admin", "doctor")(fn)
