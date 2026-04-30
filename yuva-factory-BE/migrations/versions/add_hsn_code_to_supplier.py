"""
Revision ID: add_hsn_code_to_supplier
Revises: 
Create Date: 2026-04-30

"""
from alembic import op
import sqlalchemy as sa

def upgrade():
    op.add_column('suppliers', sa.Column('hsn_code', sa.String(length=20), nullable=True))

def downgrade():
    op.drop_column('suppliers', 'hsn_code')
