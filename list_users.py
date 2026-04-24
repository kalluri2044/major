from app import create_app
from database.models import User
from database.db import db

app = create_app()
with app.app_context():
    users = User.query.all()
    print("User List:")
    for u in users:
        print(f"ID: {u.id}, Name: {u.name}, Email: {u.email}, Role: {u.role}, Active: {u.is_active}")
