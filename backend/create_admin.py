from backend import create_app, db
from backend.models import User
from werkzeug.security import generate_password_hash

app = create_app()
with app.app_context():
    if not User.query.filter_by(username="admin").first():
        admin = User(username="admin", password=generate_password_hash("admin"), role="admin")
        db.session.add(admin)
        db.session.commit()
        print("Admin user created.")
    else:
        print("Admin user already exists.")
