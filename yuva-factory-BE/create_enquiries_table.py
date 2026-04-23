"""Create enquiries table manually"""
import pymysql

DDL = """
CREATE TABLE IF NOT EXISTS enquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(200) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    age INT,
    meetup_date DATE NOT NULL,
    is_coming_today TINYINT(1) DEFAULT 0,
    car_interest VARCHAR(200),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'Pending',
    called TINYINT(1) DEFAULT 0,
    next_followup_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
"""

try:
    conn = pymysql.connect(host='localhost', user='root', password='jaikeerthi07a', database='m3cars')
    cursor = conn.cursor()
    cursor.execute(DDL)
    conn.commit()
    print("✅ 'enquiries' table created successfully.")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"❌ Error: {e}")
