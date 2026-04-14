import os
from datetime import timedelta

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class Config:
    # ── Database ───────────────────────────────────────────────────────────────
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(BASE_DIR, 'neuroscan.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ── JWT ────────────────────────────────────────────────────────────────────
    JWT_SECRET_KEY            = os.getenv("JWT_SECRET_KEY", "neuroscan-secret-change-in-prod")
    JWT_ACCESS_TOKEN_EXPIRES  = timedelta(hours=8)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # ── File uploads ───────────────────────────────────────────────────────────
    UPLOAD_FOLDER      = os.path.join(BASE_DIR, "uploads", "mri")
    REPORT_FOLDER      = os.path.join(BASE_DIR, "uploads", "reports")
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024   # 50 MB

    # ── Fusion weights (admin-configurable at runtime) ─────────────────────────
    FUSION_WEIGHT_DEMOGRAPHIC = 0.20
    FUSION_WEIGHT_COGNITIVE   = 0.35
    FUSION_WEIGHT_MRI         = 0.45

    # ── Flask ──────────────────────────────────────────────────────────────────
    SECRET_KEY = os.getenv("SECRET_KEY", "flask-secret-change-in-prod")
    DEBUG      = os.getenv("FLASK_ENV", "development") == "development"
