from app import db
from datetime import datetime

class Customer(db.Model):
    __tablename__ = "customers"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), unique=True, nullable=True)
    email = db.Column(db.String(100))
    address = db.Column(db.String(200))
    gst = db.Column(db.String(50))
    customer_type = db.Column(db.String(50), default='regular')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __init__(self, **kwargs):
        super(Customer, self).__init__(**kwargs)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'phone': self.phone,
            'email': self.email,
            'address': self.address,
            'gst': self.gst,
            'type': self.customer_type,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
