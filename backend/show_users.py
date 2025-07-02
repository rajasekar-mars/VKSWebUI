from backend import create_app, db
from backend.models import User

app = create_app()
with app.app_context():
    users = User.query.all()
    for u in users:
        print(f"id={u.id}, username={u.username}, password={u.password}, role={u.role}")
