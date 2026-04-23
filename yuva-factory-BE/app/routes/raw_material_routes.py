from flask import Blueprint, request, jsonify
from app.models.raw_material import RawMaterial
from app import db
from flask_cors import CORS

raw_material_bp = Blueprint("raw_material_bp", __name__)
CORS(raw_material_bp)

def validate_raw_material_data(data):
    errors = []
    
    if not data.get('name'):
        errors.append('Raw Material name is required')
    
    try:
        buy_price = float(data.get('buyPrice', 0))
        if buy_price < 0:
            errors.append('Buy price cannot be negative')
    except (TypeError, ValueError):
        errors.append('Invalid buy price')
    
    try:
        sell_price = float(data.get('sellPrice', 0))
        if sell_price < 0:
            errors.append('Sell price cannot be negative')
    except (TypeError, ValueError):
        errors.append('Invalid sell price')
    
    try:
        quantity = int(data.get('quantity', 0))
        if quantity < 0:
            errors.append('Quantity cannot be negative')
    except (TypeError, ValueError):
        errors.append('Invalid quantity')
    
    return errors

@raw_material_bp.route("/raw-materials", methods=["POST"])
def create_raw_material():
    try:
        data = request.get_json()
        
        errors = validate_raw_material_data(data)
        if errors:
            return jsonify({"errors": errors}), 400

        item = RawMaterial(
            name=data.get("name", "").strip(),
            buy_price=float(data.get("buyPrice", 0)),
            sell_price=float(data.get("sellPrice", 0)),
            quantity=int(data.get("quantity", 0)),
        )

        item.calculate_values()

        db.session.add(item)
        db.session.commit()

        return jsonify(item.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


@raw_material_bp.route("/raw-materials", methods=["GET"])
def get_raw_materials():
    try:
        # Simplistic approach without pagination for raw materials unless asked
        query = RawMaterial.query.order_by(RawMaterial.id.desc()).all()
        return jsonify({
            'items': [p.to_dict() for p in query]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@raw_material_bp.route("/raw-materials/<int:id>", methods=["PUT"])
def update_raw_material(id):
    try:
        item = RawMaterial.query.get_or_404(id)
        data = request.get_json()
        
        errors = validate_raw_material_data(data)
        if errors:
            return jsonify({"errors": errors}), 400

        if data.get('name') is not None:
            item.name = data['name'].strip()
        if data.get('buyPrice') is not None:
            item.buy_price = float(data['buyPrice'])
        if data.get('sellPrice') is not None:
            item.sell_price = float(data['sellPrice'])
        if data.get('quantity') is not None:
            item.quantity = int(data['quantity'])

        item.calculate_values()

        db.session.commit()

        return jsonify(item.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


@raw_material_bp.route("/raw-materials/<int:id>", methods=["DELETE"])
def delete_raw_material(id):
    try:
        item = RawMaterial.query.get_or_404(id)
        db.session.delete(item)
        db.session.commit()
        return jsonify({"message": "Deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400
