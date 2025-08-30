import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + '/..'))
from backend import create_app, db
from backend.models import User
from werkzeug.security import generate_password_hash

app = create_app()
with app.app_context():
    if not User.query.filter_by(username="admin").first():
        admin = User(
            username="admin", 
            password=generate_password_hash("admin"), 
            role="admin",
            MobileNumber=1234567890,
            EmailID="admin@example.com"
        )
        admin.set_access_list(['FULL'])  # Admin gets full access
        db.session.add(admin)
        db.session.commit()
        print("Admin user created with username: admin, password: admin")
    else:
        print("Admin user already exists.")
