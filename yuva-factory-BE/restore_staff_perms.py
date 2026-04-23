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
    
    # Predefined modules from permissions_routes.py
    modules = [
        "dashboard", "products", "category", "stock_in", "stock_out", "low_stock",
        "create_bill", "bill_reports", "service_bill", "service_bills", "quotations", "invoices", "discount",
        "add_supplier", "supplier_list", "payment_tracking", "employee", "user_type", "attendance", "company",
        "enquiries", "customer_details", "usersettings"
    ]
    
    permissions = [{"submodule_id": mid, "view": True, "add": True, "edit": True, "delete": True} for mid in modules]
    perms_json = json.dumps(permissions)
    
    # Check if staff user type exists
    cursor.execute("SELECT * FROM user_types WHERE name='staff'")
    if cursor.fetchone():
        cursor.execute("UPDATE user_types SET permissions=%s WHERE name='staff'", (perms_json,))
        print("Updated existing 'staff' user type permissions.")
    else:
        cursor.execute("INSERT INTO user_types (name, permissions) VALUES ('staff', %s)", (perms_json,))
        print("Created 'staff' user type and set permissions.")
    
    # Also ensure Admin has full permissions in case it's missing there too
    cursor.execute("SELECT * FROM user_types WHERE name='Admin'")
    if cursor.fetchone():
        cursor.execute("UPDATE user_types SET permissions=%s WHERE name='Admin'", (perms_json,))
        print("Updated existing 'Admin' user type permissions.")
    else:
        cursor.execute("INSERT INTO user_types (name, permissions) VALUES ('Admin', %s)", (perms_json,))
        print("Created 'Admin' user type and set permissions.")
        
    connection.commit()
    cursor.close()
    connection.close()
    print("Permissions restored successfully.")
except Exception as e:
    print(f"Error: {e}")
