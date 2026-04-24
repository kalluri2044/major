from app import create_app
from database.models import Session
from services.report_service import generate_pdf

app = create_app()
with app.app_context():
    sessions = Session.query.filter_by(is_complete=True).all()
    print(f"Testing {len(sessions)} sessions...")
    for s in sessions:
        try:
            pdf = generate_pdf(s.id, s.user_id)
            print(f"Session {s.id}: SUCCESS ({len(pdf)} bytes)")
        except Exception as e:
            print(f"Session {s.id}: FAILED -> {e}")
            import traceback
            traceback.print_exc()
