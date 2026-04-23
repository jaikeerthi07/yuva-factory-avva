import pymysql

try:
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password='root123',
        database='m3cars'
    )
    cursor = connection.cursor()
    
    # Check if user already exists
    cursor.execute("SELECT * FROM login WHERE email='admin@m3cars.com'")
    if cursor.fetchone():
        # Update existing user's password
        cursor.execute("UPDATE login SET password='Admin@2024!' WHERE email='admin@m3cars.com'")
        connection.commit()
        print("Default user 'admin@m3cars.com' password updated to 'Admin@2024!'.")
    else:
        cursor.execute("INSERT INTO login (username, email, password) VALUES ('admin', 'admin@m3cars.com', 'Admin@2024!')")
        connection.commit()
        print("Default user 'admin@m3cars.com' created with password 'Admin@2024!'.")
    
    cursor.close()
    connection.close()
except Exception as e:
    print(f"Error: {e}")
