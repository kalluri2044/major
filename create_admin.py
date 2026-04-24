from app import create_app
from database.models import User
from database.db import db
from utils.auth_utils import hash_password

def create_admin_user(name, email, password, role="admin"):
    app = create_app()
    with app.app_context():
        # Check if already exists
        existing = User.query.filter_by(email=email.lower()).first()
        if existing:
            print(f"User with email {email} already exists as a {existing.role}.")
            return

        user = User(
            name=name,
            email=email.lower(),
            password_hash=hash_password(password),
            role=role
        )
        db.session.add(user)
        db.session.commit()
        print(f"Successfully created {role}: {name} ({email})")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 4:
        print("Usage: python create_admin.py <name> <email> <password> [role: admin|doctor]")
    else:
        role = sys.argv[4] if len(sys.argv) > 4 else "admin"
        create_admin_user(sys.argv[1], sys.argv[2], sys.argv[3], role)
