from app import create_app, db
from app.models.usertype import UserType
import json

app = create_app()
with app.app_context():
    user_types = UserType.query.all()
    for ut in user_types:
        print(f"UserType: {ut.name}")
        perms = json.loads(ut.permissions) if ut.permissions else {}
        print(f"Permissions: {json.dumps(perms, indent=2)}")
        print("-" * 20)
