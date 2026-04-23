#!/usr/bin/env python
from app import create_app, db
from sqlalchemy import inspect, text

app = create_app()
with app.app_context():
    inspector = inspect(db.engine)
    columns = [c['name'] for c in inspector.get_columns('bill_items')]
    print('bill_items columns:', columns)
    
    with db.engine.connect() as conn:
        # Add item_source column if it doesn't exist
        if 'item_source' not in columns:
            print('Adding item_source column...')
            try:
                conn.execute(text('ALTER TABLE bill_items ADD COLUMN item_source VARCHAR(20) DEFAULT "product"'))
                conn.commit()
                print('✓ Added item_source column')
            except Exception as e:
                print(f'Note: {e}')
        
        # Make product_id nullable
        if 'product_id' in columns:
            col_info = [c for c in inspector.get_columns('bill_items') if c['name'] == 'product_id'][0]
            if not col_info['nullable']:
                print('Making product_id nullable...')
                try:
                    conn.execute(text('ALTER TABLE bill_items DROP FOREIGN KEY bill_items_ibfk_2'))
                    conn.commit()
                except:
                    pass
                try:
                    conn.execute(text('ALTER TABLE bill_items MODIFY COLUMN product_id INT NULL'))
                    conn.commit()
                    print('✓ product_id is now nullable')
                except Exception as e:
                    print(f'Note: {e}')
    
    print('\n✓ Database schema update attempted')
