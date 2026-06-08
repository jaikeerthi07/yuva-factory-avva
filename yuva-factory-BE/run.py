# run.py
import sys

# Ensure Windows consoles can print route debug logs safely.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import pymysql
from app import create_app, db

def ensure_database_exists():
    """Create the MySQL database if it doesn't already exist."""
    connection = pymysql.connect(
        host="localhost",
        user="root",
        password="root123",
        charset="utf8mb4",
    )
    try:
        with connection.cursor() as cursor:
            cursor.execute("CREATE DATABASE IF NOT EXISTS `Yuva_factory` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        connection.commit()
        print("✅ Database 'Yuva_factory' is ready.")
    finally:
        connection.close()

app = create_app()

if __name__ == '__main__':
    ensure_database_exists()
    with app.app_context():
        db.create_all()
        print("✅ All tables created successfully.")
    app.run(debug=True, port=5000)

