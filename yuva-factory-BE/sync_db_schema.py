import pymysql

def sync_db():
    try:
        connection = pymysql.connect(
            host='localhost',
            user='root',
            password='jaikeerthi07a',
            database='m3cars'
        )
        cursor = connection.cursor()

        # Define columns to add to 'bills' table
        bills_columns = [
            ('company_id', 'INT NULL'),
            ('company_name', 'VARCHAR(200) NULL'),
            ('company_logo', 'VARCHAR(500) NULL'),
            ('company_address', 'VARCHAR(500) NULL'),
            ('company_city', 'VARCHAR(100) NULL'),
            ('company_phone', 'VARCHAR(50) NULL'),
            ('company_email', 'VARCHAR(100) NULL'),
            ('company_gst', 'VARCHAR(50) NULL'),
            ('company_alternate_phone', 'VARCHAR(50) NULL'),
            ('company_bank_name', 'VARCHAR(100) NULL'),
            ('company_bank_account', 'VARCHAR(50) NULL'),
            ('company_bank_ifsc', 'VARCHAR(50) NULL'),
            ('company_bank_branch', 'VARCHAR(100) NULL'),
            ('company_upi_id', 'VARCHAR(100) NULL'),
            ('payment_card_number', 'VARCHAR(20) NULL'),
            ('payment_card_holder', 'VARCHAR(100) NULL'),
            ('payment_upi_id', 'VARCHAR(100) NULL'),
            ('payment_transaction_id', 'VARCHAR(100) NULL'),
            ('payment_bank_name', 'VARCHAR(100) NULL'),
            ('payment_cheque_number', 'VARCHAR(50) NULL'),
            ('cash_received', 'FLOAT DEFAULT 0'),
            ('created_by_name', 'VARCHAR(100) NULL')
        ]

        # Add missing columns to 'bills'
        print("Checking 'bills' table for missing columns...")
        for col_name, col_type in bills_columns:
            cursor.execute(f"SHOW COLUMNS FROM bills LIKE '{col_name}'")
            if not cursor.fetchone():
                print(f"Adding column '{col_name}' to 'bills' table...")
                cursor.execute(f"ALTER TABLE bills ADD COLUMN {col_name} {col_type}")
            else:
                print(f"Column '{col_name}' already exists in 'bills'.")

        connection.commit()
        print("Database sync completed successfully.")
        
        cursor.close()
        connection.close()
    except Exception as e:
        print(f"Error syncing database: {e}")

if __name__ == "__main__":
    sync_db()
