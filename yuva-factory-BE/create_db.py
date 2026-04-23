import pymysql

try:
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password='jaikeerthi07a'
    )
    cursor = connection.cursor()
    cursor.execute("CREATE DATABASE IF NOT EXISTS m3cars")
    print("Database 'm3cars' created successfully or already exists.")
    cursor.close()
    connection.close()
except Exception as e:
    print(f"Error: {e}")
