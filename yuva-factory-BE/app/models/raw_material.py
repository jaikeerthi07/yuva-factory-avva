from app import db
from datetime import datetime

class RawMaterial(db.Model):
    __tablename__ = "raw_materials"

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(100), nullable=False)
    buy_price = db.Column(db.Float, nullable=False, default=0.0)
    sell_price = db.Column(db.Float, nullable=False, default=0.0)
    quantity = db.Column(db.Integer, nullable=False, default=0)

    amount = db.Column(db.Float)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def calculate_values(self):
        # We can calculate inventory amount based on buy_price * quantity
        # or maybe they just track raw value. Let's do buy_price * qty.
        self.amount = round(self.buy_price * self.quantity, 2)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "buyPrice": self.buy_price,
            "sellPrice": self.sell_price,
            "quantity": self.quantity,
            "amount": self.amount,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
