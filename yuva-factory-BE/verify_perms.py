import pymysql
import json

try:
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password='jaikeerthi07a',
        database='m3cars'
    )
    cursor = connection.cursor(pymysql.cursors.DictCursor)
    cursor.execute("SELECT name, permissions FROM user_types WHERE name IN ('staff', 'Admin')")
    results = cursor.fetchall()
    for row in results:
        perms = json.loads(row['permissions'])
        print(f"User Type: {row['name']}, Permission Count: {len(perms)}")
    cursor.close()
    connection.close()
except Exception as e:
    print(f"Error: {e}")
