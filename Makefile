# NeuroScan AI — Unified Project Makefile

.PHONY: install build dev start seed clean help

help:
	@echo ""
	@echo "  NeuroScan AI — Available commands"
	@echo "  ─────────────────────────────────────────────────────────"
	@echo "  make install   Install Python + Node dependencies"
	@echo "  make build     Build React frontend (client/build/)"
	@echo "  make start     Run Flask (serves API + React build)"
	@echo "  make dev       Start Flask + React dev server separately"
	@echo "  make seed      Create default admin account"
	@echo "  make clean     Remove build artifacts and database"
	@echo ""

install:
	@echo "→ Installing Python deps..."
	python3 -m venv venv 2>/dev/null || true
	. venv/bin/activate && pip install -q -r requirements.txt
	@echo "→ Installing Node deps..."
	cd client && npm install --silent
	@echo "✅ All dependencies installed."

build:
	@echo "→ Building React frontend..."
	cd client && npm run build
	@echo "✅ Build complete → client/build/"

start: build
	@echo "→ Starting NeuroScan AI on http://localhost:5000"
	. venv/bin/activate && python app.py

dev:
	@echo "→ Starting Flask (port 5000) + React dev server (port 3000)..."
	@(. venv/bin/activate && python app.py &) && (cd client && npm start)

seed:
	. venv/bin/activate && python -c "\
from app import create_app; \
from database.db import db; \
from database.models import User; \
from utils.auth_utils import hash_password; \
app = create_app(); \
ctx = app.app_context(); ctx.push(); \
e = User.query.filter_by(email='admin@neuroscan.ai').first(); \
u = User(name='System Admin', email='admin@neuroscan.ai', password_hash=hash_password('Admin@123'), role='admin') if not e else None; \
db.session.add(u) if u else None; \
db.session.commit() if u else None; \
print('✅ admin@neuroscan.ai / Admin@123') if u else print('Admin already exists'); \
ctx.pop()"

clean:
	find . -name "*.pyc" -delete
	find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	rm -rf client/build
	rm -f neuroscan.db
	@echo "✅ Cleaned."
