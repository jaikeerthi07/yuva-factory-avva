import pymysql

try:
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password='jaikeerthi07a',
        database='m3cars'
    )
    cursor = connection.cursor(pymysql.cursors.DictCursor)
    cursor.execute("SELECT * FROM login")
    users = cursor.fetchall()
    if users:
        print("Existing Users:")
        for user in users:
            print(f"ID: {user['id']}, Username: {user['username']}, Email: {user['email']}, Password: {user['password']}")
    else:
        print("No users found.")
    cursor.close()
    connection.close()
except Exception as e:
    print(f"Error: {e}")
