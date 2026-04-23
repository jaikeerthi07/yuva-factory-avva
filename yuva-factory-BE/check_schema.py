from app import create_app, db
from sqlalchemy import inspect

app = create_app()
with app.app_context():
    inspector = inspect(db.engine)
    columns = inspector.get_columns('bill_items')
    print('bill_items schema:')
    for col in columns:
        nullable_str = 'NULL' if col['nullable'] else 'NOT NULL'
        print(f"  {col['name']}: {col['type']} {nullable_str}")
