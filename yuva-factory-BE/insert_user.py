import pymysql

try:
    conn = pymysql.connect(host='localhost', user='root', password='root123', database='m3cars')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO login (username, email, password) VALUES ('admin', 'admin@m3cars.com', 'Admin@2024!')")
    conn.commit()
    print('User inserted successfully')
except Exception as e:
    print(f'Error: {e}')
finally:
    conn.close()
