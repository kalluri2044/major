import os
from app import create_app
from services.report_service import generate_pdf
from database.db import db
from database.models import Session

app = create_app()
with app.app_context():
    # Find a complete session
    session = Session.query.filter_by(is_complete=True).first()
    if not session:
        print("No complete session found.")
    else:
        print(f"Generating report for session {session.id}, user {session.user_id}")
        try:
            pdf_bytes = generate_pdf(session.id, session.user_id)
            print(f"Success! PDF size: {len(pdf_bytes)} bytes")
            # Save it locally for me to check if I could (but I can't see files easily unless I list them)
            test_path = "test_report.pdf"
            with open(test_path, "wb") as f:
                f.write(pdf_bytes)
            print(f"Saved to {test_path}")
        except Exception as e:
            print(f"Error: {e}")
