import pymysql

try:
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password='jaikeerthi07a',
        database='m3cars'
    )
    cursor = connection.cursor(pymysql.cursors.DictCursor)
    
    print("\n--- Employee Table (Files) ---")
    cursor.execute("SELECT id, full_name, aadhar_attachment, pan_attachment FROM employees WHERE full_name LIKE '%keerthi%'")
    for row in cursor.fetchall():
        print(row)
        
    cursor.close()
    connection.close()
except Exception as e:
    print(f"Error: {e}")
