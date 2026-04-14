import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from database.db import db
from config import Config


def create_app():
    # ── Resolve paths ──────────────────────────────────────────────────────────
    BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
    BUILD_DIR  = os.path.join(BASE_DIR, "client", "build")          # React production build
    STATIC_DIR = os.path.join(BUILD_DIR, "static")

    # ── Flask factory ──────────────────────────────────────────────────────────
    app = Flask(
        __name__,
        static_folder   = BUILD_DIR,   # serve React's build/ as static root
        static_url_path = ""
    )
    app.config.from_object(Config)

    # ── Extensions ────────────────────────────────────────────────────────────
    # Allow CORS for /api in dev; React build is served same-origin in prod
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000",
                                                   "http://127.0.0.1:3000"]}})
    JWTManager(app)
    db.init_app(app)

    # ── Upload / report directories ───────────────────────────────────────────
    os.makedirs(app.config.get("UPLOAD_FOLDER", "uploads/mri"),    exist_ok=True)
    os.makedirs(app.config.get("REPORT_FOLDER", "uploads/reports"), exist_ok=True)

    # ── Register all API blueprints ───────────────────────────────────────────
    from routes.auth_routes        import auth_bp
    from routes.user_routes        import user_bp
    from routes.admin_routes       import admin_bp
    from routes.mri_routes         import mri_bp
    from routes.demographic_routes import demographic_bp
    from routes.cognitive_routes   import cognitive_bp
    from routes.fusion_routes      import fusion_bp
    from routes.report_routes      import report_bp
    from routes.phase6_routes      import phase6_bp

    app.register_blueprint(auth_bp,         url_prefix="/api/auth")
    app.register_blueprint(user_bp,         url_prefix="/api/user")
    app.register_blueprint(admin_bp,        url_prefix="/api/admin")
    app.register_blueprint(mri_bp,          url_prefix="/api/mri")
    app.register_blueprint(demographic_bp,  url_prefix="/api/demographics")
    app.register_blueprint(cognitive_bp,    url_prefix="/api/cognitive")
    app.register_blueprint(fusion_bp,       url_prefix="/api/fusion")
    app.register_blueprint(report_bp,       url_prefix="/api/report")
    app.register_blueprint(phase6_bp,       url_prefix="/api")

    # ── Serve React SPA ───────────────────────────────────────────────────────
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_react(path):
        """
        Serve React's production build.
        - API routes are handled by blueprints above (never reach here).
        - Static assets (JS/CSS/images) are served from build/static.
        - All other paths fall through to index.html (SPA client-side routing).
        """
        full_path = os.path.join(BUILD_DIR, path)
        if path and os.path.exists(full_path) and os.path.isfile(full_path):
            return send_from_directory(BUILD_DIR, path)
        # SPA fallback → always return index.html
        index = os.path.join(BUILD_DIR, "index.html")
        if os.path.exists(index):
            return send_from_directory(BUILD_DIR, "index.html")
        # Build not available yet — show helpful message
        return (
            "<h2 style='font-family:sans-serif;padding:40px;color:#0a1628'>"
            "NeuroScan AI -- API Server Running [OK]<br/><br/>"
            "<small style='color:#666'>React build not found.<br/>"
            "Run <code>cd client && npm install && npm run build</code> "
            "then restart this server, or run "
            "<code>npm start</code> separately on port 3000 during development.</small>"
            "</h2>",
            200
        )

    # ── Create DB tables ──────────────────────────────────────────────────────
    with app.app_context():
        db.create_all()
        print("[INFO] Database tables ready.")

    return app


if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV", "development") != "production"
    print(f"\n[INFO] NeuroScan AI running -> http://localhost:{port}")
    print(f"   Mode  : {'development' if debug else 'production'}")
    print(f"   API   : http://localhost:{port}/api/")
    print(f"   React : http://localhost:{port}/\n")
    app.run(debug=debug, host="0.0.0.0", port=port)
