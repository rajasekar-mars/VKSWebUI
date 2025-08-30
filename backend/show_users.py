import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + '/..'))
from backend import create_app, db
from backend.models import User

app = create_app()
with app.app_context():
    users = User.query.all()
    for u in users:
        print(f"ID: {u.id}")
        print(f"Username: {u.username}")
        print(f"Role: {u.role}")
        print(f"Mobile Number: {u.MobileNumber}")
        print(f"Email: {u.EmailID}")
        print(f"Access Control: {u.get_access_list()}")
        print("-" * 40)
