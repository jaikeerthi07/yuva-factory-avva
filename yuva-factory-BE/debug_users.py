import pymysql

try:
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password='jaikeerthi07a',
        database='m3cars'
    )
    cursor = connection.cursor(pymysql.cursors.DictCursor)
    
    print("--- Login Table (Admin etc.) ---")
    cursor.execute("SELECT * FROM login")
    for row in cursor.fetchall():
        print(row)
        
    print("\n--- Employee Table (Staff etc.) ---")
    cursor.execute("SELECT id, full_name, email, user_type FROM employees")
    for row in cursor.fetchall():
        print(row)
        
    cursor.close()
    connection.close()
except Exception as e:
    print(f"Error: {e}")
