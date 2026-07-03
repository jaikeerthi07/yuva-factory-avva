from flask import Blueprint, request, jsonify
from app import db
from app.models.customer import Customer
from datetime import datetime

customer_bp = Blueprint("customer", __name__)

@customer_bp.route("/customers", methods=["POST"])
def add_customer():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        name = data.get("name")
        phone = data.get("phone")
        email = data.get("email", "")
        address = data.get("address", "")
        gst = data.get("gst", "")
        customer_type = data.get("type", "regular")

        if not name or not phone:
            return jsonify({"error": "Name and phone number are required"}), 400

        # Check if customer already exists
        existing_customer = Customer.query.filter_by(phone=phone).first()
        if existing_customer:
            return jsonify({"error": "Customer with this phone number already exists"}), 400

        new_customer = Customer(
            name=name,
            phone=phone,
            email=email,
            address=address,
            gst=gst,
            customer_type=customer_type
        )

        db.session.add(new_customer)
        db.session.commit()

        return jsonify({
            "message": "Customer added successfully",
            "customer": new_customer.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@customer_bp.route("/customers", methods=["GET"])
def get_customers():
    try:
        customers = Customer.query.all()
        return jsonify({
            "customers": [c.to_dict() for c in customers]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@customer_bp.route("/customers/<string:phone>", methods=["PUT"])
def update_customer(phone):
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        name = data.get("name")
        new_phone = data.get("phone")
        email = data.get("email", "")
        address = data.get("address", "")
        gst = data.get("gst", "")
        customer_type = data.get("type", "regular")

        if not name or not new_phone:
            return jsonify({"error": "Name and phone number are required"}), 400

        # Find existing customer
        customer = Customer.query.filter_by(phone=phone).first()

        # If phone is being changed, check if new phone already exists
        if phone != new_phone:
            existing_new_phone = Customer.query.filter_by(phone=new_phone).first()
            if existing_new_phone:
                return jsonify({"error": "Customer with the new phone number already exists"}), 400

        if customer:
            customer.name = name
            customer.phone = new_phone
            customer.email = email
            customer.address = address
            customer.gst = gst
            customer.customer_type = customer_type
        else:
            # Create new customer if it didn't exist explicitly
            customer = Customer(
                name=name,
                phone=new_phone,
                email=email,
                address=address,
                gst=gst,
                customer_type=customer_type
            )
            db.session.add(customer)

        db.session.commit()

        return jsonify({
            "message": "Customer updated successfully",
            "customer": customer.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@customer_bp.route("/customers/<string:phone>", methods=["DELETE"])
def delete_customer(phone):
    try:
        from app.models.billing import Bill
        
        customer_deleted = False
        if phone == 'no-phone':
            name = request.args.get('name')
            if not name:
                return jsonify({"error": "Name is required when phone is missing"}), 400
            # Find bills by name where phone is null or empty
            bills = Bill.query.filter((Bill.customer_phone == None) | (Bill.customer_phone == '')).filter(Bill.customer_name == name).all()
        else:
            customer = Customer.query.filter_by(phone=phone).first()
            if customer:
                db.session.delete(customer)
                customer_deleted = True
            # Delete all bills associated with this phone
            bills = Bill.query.filter_by(customer_phone=phone).all()
            
        bills_deleted = len(bills)
        if bills_deleted > 0:
            from app.models.billing import Payment
            for bill in bills:
                # Manually delete payments to avoid IntegrityError (cascade missing)
                Payment.query.filter_by(bill_id=bill.id).delete()
                db.session.delete(bill)

        if not customer_deleted and bills_deleted == 0:
            return jsonify({"error": "Customer not found"}), 404

        db.session.commit()

        return jsonify({"message": f"Customer and {bills_deleted} associated bills deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
