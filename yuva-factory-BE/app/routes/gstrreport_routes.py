from flask import Flask, jsonify,Blueprint,request
from flask_cors import CORS
from app.models.billing import Bill,BillItem

from datetime import datetime
from sqlalchemy import func

def get_place_supply(address):

    if not address:
        return ""

    address = address.lower()

    state_map = {

    "jammu and kashmir": "Jammu and Kashmir - 01",
    "himachal pradesh": "Himachal Pradesh - 02",
    "punjab": "Punjab - 03",
    "chandigarh": "Chandigarh - 04",
    "uttarakhand": "Uttarakhand - 05",
    "haryana": "Haryana - 06",
    "delhi": "Delhi - 07",
    "rajasthan": "Rajasthan - 08",
    "uttar pradesh": "Uttar Pradesh - 09",
    "bihar": "Bihar - 10",
    "sikkim": "Sikkim - 11",
    "arunachal pradesh": "Arunachal Pradesh - 12",
    "nagaland": "Nagaland - 13",
    "manipur": "Manipur - 14",
    "mizoram": "Mizoram - 15",
    "tripura": "Tripura - 16",
    "meghalaya": "Meghalaya - 17",
    "assam": "Assam - 18",
    "west bengal": "West Bengal - 19",
    "jharkhand": "Jharkhand - 20",
    "odisha": "Odisha - 21",
    "chhattisgarh": "Chhattisgarh - 22",
    "madhya pradesh": "Madhya Pradesh - 23",
    "gujarat": "Gujarat - 24",
    "dadra and nagar haveli and daman and diu": "Dadra and Nagar Haveli and Daman and Diu - 26",
    "maharashtra": "Maharashtra - 27",
    "karnataka": "Karnataka - 29",
    "goa": "Goa - 30",
    "lakshadweep": "Lakshadweep - 31",
    "kerala": "Kerala - 32",
    "tamil nadu": "Tamil Nadu - 33",
    "puducherry": "Puducherry - 34",
    "andaman and nicobar islands": "Andaman and Nicobar Islands - 35",
    "telangana": "Telangana - 36",
    "andhra pradesh": "Andhra Pradesh - 37",
    "ladakh": "Ladakh - 38",

    # Common Cities

    "chennai": "Tamil Nadu - 33",
    "coimbatore": "Tamil Nadu - 33",
    "madurai": "Tamil Nadu - 33",

    "bangalore": "Karnataka - 29",
    "bengaluru": "Karnataka - 29",
    "mysore": "Karnataka - 29",

    "kochi": "Kerala - 32",
    "thiruvananthapuram": "Kerala - 32",

    "hyderabad": "Telangana - 36",

    "vijayawada": "Andhra Pradesh - 37",
    "visakhapatnam": "Andhra Pradesh - 37",

    "mumbai": "Maharashtra - 27",
    "pune": "Maharashtra - 27",
    "nagpur": "Maharashtra - 27",

    "kolkata": "West Bengal - 19",

    "ahmedabad": "Gujarat - 24",

    "jaipur": "Rajasthan - 08",

    "lucknow": "Uttar Pradesh - 09",

    "patna": "Bihar - 10",

    "bhubaneswar": "Odisha - 21",

    "bhopal": "Madhya Pradesh - 23",

    "delhi": "Delhi - 07"

    }

    for key, value in state_map.items():

        if key in address:
            return value

    return ""
gstrreports_bp = Blueprint('gstrreports_bp', __name__)

#b2b,sez,de
@gstrreports_bp.route('/gstr1/b2b', methods=['GET'])

def get_b2b():
  try:

    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')

    query = Bill.query

    if from_date and to_date:

           query = query.filter(
    func.date(Bill.created_at).between(from_date, to_date)
 )
        # Get all suppliers
    bill = query.order_by(Bill.id).all()

    if not bill:
     return jsonify({
        'success': True,
        'Bill': []
        }), 200
    data=[]
    for bills in bill:

      print(bills.bill_number)  # value example
      # applicaple_tax=bills.subtotal- bills.discount
      taxable=bills.subtotal- bills.discount
      applicaple_tax=taxable * 5/100

      place_supply = get_place_supply(
      bills.customer_address
      )
      data.append({
                "gstin": bills.customer_gst,
                "receiver_name": bills.customer_name,
                "invoice_no": bills.bill_number,
                "invoice_date":  bills.created_at.strftime('%Y-%m-%d'),
                "invoice_value": bills.total,
                "place_supply": place_supply,
                "reverse_charge": "N",
                "applicable_tax": applicaple_tax,
                "invoice_type": "Regular B2B",
                "ecommerce_gstin": "",
                "rate": "5",
                "taxable_value": taxable,
                "cess_amount": ""
            })
    

    return jsonify(data)

  except Exception as e:
        return jsonify({"error": str(e)}), 500


#b2c1
@gstrreports_bp.route('/gstr1/b2c1', methods=['GET'])

def get_b2c1():
  try:
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')

    query = Bill.query

    if from_date and to_date:

                 query = query.filter(
    func.date(Bill.created_at).between(from_date, to_date)
 )
        # Get all suppliers
    bill = query.order_by(Bill.id).all()

    if not bill:
     return jsonify({
        'success': True,
        'Bill': []
        }), 200
    data=[]
    for bills in bill:

      print(bills.bill_number)  # value example
      # applicaple_tax=bills.subtotal- bills.discount
      taxable=bills.subtotal- bills.discount
      applicaple_tax=taxable * 5/100
      data.append({
                "invoice_no": bills.bill_number,
                "invoice_date":  bills.created_at,
                "invoice_value": bills.total,
                "place_supply": "",
                "rate":"5",
                "applicable_tax":applicaple_tax,
                "taxable_value": taxable,
                "cess_amount": "",
                "ecommerce_gstin": "",
                "sale_from_bonded_wh": ""
                })
    

    return jsonify(data)

  except Exception as e:
        return jsonify({"error": str(e)}), 500


#b2cs
@gstrreports_bp.route('/gstr1/b2cs', methods=['GET'])

def get_b2cs():
  try:
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')

    query = Bill.query

    if from_date and to_date:

                 query = query.filter(
    func.date(Bill.created_at).between(from_date, to_date)
 )
        # Get all suppliers
    bill = query.order_by(Bill.id).all()

    if not bill:
     return jsonify({
        'success': True,
        'Bill': []
        }), 200
    data=[]
    for bills in bill:

      print(bills.bill_number)  # value example
      # applicaple_tax=bills.subtotal- bills.discount
      taxable=bills.subtotal- bills.discount
      applicaple_tax=taxable * 5/100
      data.append({
                "type": bills.customer_type,
                "place_supply": "",
                "rate":"5",
                "applicable_tax": applicaple_tax,
                "taxable_value": taxable,
                "cess_amount": "",
                "ecommerce_gstin": "",
            })
    

    return jsonify(data)

  except Exception as e:
        return jsonify({"error": str(e)}), 500  


#cdnr
@gstrreports_bp.route('/gstr1/cdnr', methods=['GET'])

def get_cdnr():
  try:
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')

    query = Bill.query

    if from_date and to_date:

                query = query.filter(
    func.date(Bill.created_at).between(from_date, to_date)
 )
        # Get all suppliers
    bill = query.order_by(Bill.id).all()

    if not bill:
     return jsonify({
        'success': True,
        'Bill': []
        }), 200
    data=[]
    for bills in bill:

      print(bills.bill_number)  # value example
      # applicaple_tax=bills.subtotal- bills.discount
      taxable=bills.subtotal- bills.discount
      applicaple_tax=taxable * 5/100
      data.append({
                "gstin": bills.customer_gst,
                "receiver_name":  bills.customer_name,
                "note_no": bills.bill_number,
                "note_date": bills.created_at ,
                "note_type": 'Regular B2B',
                "place_supply": "",
                "reverse_charge": "N",
                "note_supply_type":"",
                "note_value":bills.total,
                "applicable_tax": applicaple_tax,
                "rate": "5",
                "taxable_value": taxable,
                "cess_amount": ""
            })
    

    return jsonify(data)

  except Exception as e:
        return jsonify({"error": str(e)}), 500   



#cdnur
@gstrreports_bp.route('/gstr1/cdnur', methods=['GET'])

def get_cdnur():
  try:
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')

    query = Bill.query

    if from_date and to_date:

                query = query.filter(
    func.date(Bill.created_at).between(from_date, to_date)
 )
        # Get all suppliers
    bill = query.order_by(Bill.id).all()

    if not bill:
     return jsonify({
        'success': True,
        'Bill': []
        }), 200
    data=[]
    for bills in bill:

      print(bills.bill_number)  # value example
      # applicaple_tax=bills.subtotal- bills.discount
      taxable=bills.subtotal- bills.discount
      applicaple_tax=taxable * 5/100 
      data.append({
                "ur_type":"",
                "note_no":  bills.bill_number,
                "note_date": bills.created_at ,
                "note_type": 'Regular B2B',
                "place_supply": "",
                "note_value":bills.total,
                "applicable_tax": applicaple_tax,
                "rate": "5",
                "taxable_value": taxable,
                "cess_amount": ""
            })
    

    return jsonify(data)

  except Exception as e:
        return jsonify({"error": str(e)}), 500       


#exp
@gstrreports_bp.route('/gstr1/exp', methods=['GET'])

def get_exp():
  try:
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')

    query = Bill.query

    if from_date and to_date:

                 query = query.filter(
    func.date(Bill.created_at).between(from_date, to_date)
 )
        # Get all suppliers
    bill = query.order_by(Bill.id).all()

    if not bill:
     return jsonify({
        'success': True,
        'Bill': []
        }), 200
    data=[]
    for bills in bill:

      print(bills.bill_number)  # value example
      # applicaple_tax=bills.subtotal- bills.discount
      taxable=bills.subtotal- bills.discount
      applicaple_tax=taxable * 5/100 
      data.append({
                "exp_type": "",
                "invoice_no": bills.bill_number,
                "invoice_date":  bills.created_at,
                "invoice_value": bills.total,
                "po_code":"",
                "shipping_bill_no":"",
                "shipping_bill_date":"",
                "rate": "5",
                "applicable_tax": applicaple_tax,
                "taxable_value": taxable,
                "cess_amount": ""
            })
    

    return jsonify(data)

  except Exception as e:
        return jsonify({"error": str(e)}), 500  


#at/atadj
@gstrreports_bp.route('/gstr1/at', methods=['GET'])

def get_at():
  try:
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')

    query = Bill.query

    if from_date and to_date:

                query = query.filter(
    func.date(Bill.created_at).between(from_date, to_date)
 )
        # Get all suppliers
    bill = query.order_by(Bill.id).all()

    if not bill:
     return jsonify({
        'success': True,
        'Bill': []
        }), 200
    data=[]
    for bills in bill:

      print(bills.bill_number)  # value example
      # applicaple_tax=bills.subtotal- bills.discount
      taxable=bills.subtotal- bills.discount
      applicaple_tax=taxable * 5/100 
      data.append({
                "place_supply": "",
                "rate": "5",
                "applicable_tax": applicaple_tax,
                "gross_adv_recive": "",
                "cess_amount": ""
            })
    

    return jsonify(data)

  except Exception as e:
        return jsonify({"error": str(e)}), 500   


#exemp
@gstrreports_bp.route('/gstr1/exemp', methods=['GET'])

def get_exemp():
  try:
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')

    query = Bill.query

    if from_date and to_date:

                 query = query.filter(
    func.date(Bill.created_at).between(from_date, to_date)
 )
        # Get all suppliers
    bill = query.order_by(Bill.id).all()
    if not bill:
     return jsonify({
        'success': True,
        'Bill': []
        }), 200
    data=[]
    for bills in bill:

      print(bills.bill_number)  # value example
    
      data.append({
                "description": "",
                "nill_rate_supplies": "",
                "excempted": "",
                "non_gst_supplies": "",
            })
    

    return jsonify(data)

  except Exception as e:
        return jsonify({"error": str(e)}), 500   


#hsn/hsn(b2b)/hsn(b2c)
@gstrreports_bp.route('/gstr1/hsn', methods=['GET'])

def get_hsn():
  try:
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')

    query = Bill.query

    if from_date and to_date:

                query = query.filter(
    func.date(Bill.created_at).between(from_date, to_date)
 )
        # Get all suppliers
    bill = query.order_by(Bill.id).all()

    if not bill:
     return jsonify({
        'success': True,
        'Bill': []
        }), 200
    data=[]
    for bills in bill:

      print(bills.bill_number)  # value example
      items = BillItem.query.filter_by(bill_id=bills.id).all()
      taxable=bills.subtotal- bills.discount
      for item in items: 
        data.append({
                "hsn": bills.hsn,
                "description": "",
                "uqc": "",
                "total_quantity":item.quantity,
                "total_value":item.total,
                "taxable_value": taxable,
                "integ_tax_amount": "",
                "central_tax_amount": "",
                "state_tax_amount": "",
                "cess_amount": "",
                "rate": "5",
               
            })
    

    return jsonify(data)

  except Exception as e:
        return jsonify({"error": str(e)}), 500 



#docs
@gstrreports_bp.route('/gstr1/docs', methods=['GET'])

def get_docs():
  try:
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')

    query = Bill.query

    if from_date and to_date:

                query = query.filter(
    func.date(Bill.created_at).between(from_date, to_date)
 )
        # Get all suppliers
    bill = query.order_by(Bill.id).all()
    if not bill:
     return jsonify({
        'success': True,
        'Bill': []
        }), 200
    data=[]
    for bills in bill:

      print(bills.bill_number)  # value example
    
      data.append({
                "nature_of_doc": "",
                "sr_no_from": "",
                "sr_no_to": "",
                "total_number": "",
                "cancelled": "",
                })
    

    return jsonify(data)

  except Exception as e:
        return jsonify({"error": str(e)}), 500