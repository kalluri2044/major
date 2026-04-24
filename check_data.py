from app import create_app
from database.models import Session, Demographic, CognitiveAssessment, MRIScan, ProgressionRecord, Recommendation
from database.db import db
import json

app = create_app()
with app.app_context():
    s = Session.query.get(1)
    if not s:
        print("Session 1 not found")
    else:
        print(f"Session 1: {s.to_dict()}")
        d = Demographic.query.filter_by(user_id=1).first()
        print(f"Demo: {d.to_dict() if d else 'None'}")
        c = CognitiveAssessment.query.filter_by(session_id=1).first()
        print(f"Cog: {c.normalized_score if c else 'None'}")
        m = MRIScan.query.filter_by(session_id=1).first()
        print(f"MRI: {m.ensemble_stage if m else 'None'}")
        p = ProgressionRecord.query.filter_by(session_id_current=1).first()
        print(f"Prog: {p.progression_label if p else 'None'}")
        r = Recommendation.query.filter_by(session_id=1).first()
        print(f"Rec: {len(r.recommendation_json) if r else 'None'}")
