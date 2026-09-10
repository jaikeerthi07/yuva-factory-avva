from flask import Flask, jsonify,Blueprint,request
from flask_cors import CORS
from app.models.billing import Bill,BillItem

from datetime import datetime
from sqlalchemy import func

import re
import requests
pincode_cache = {}

def get_place_supply(address):

    if not address:
        return ""

    state_code_map = {
        "Jammu and Kashmir": "Jammu and Kashmir - 01",
    "Himachal Pradesh": "Himachal Pradesh - 02",
    "Punjab": "Punjab - 03",
    "Chandigarh": "Chandigarh - 04",
    "Uttarakhand": "Uttarakhand - 05",
    "Haryana": "Haryana - 06",
    "Delhi": "Delhi - 07",
    "Rajasthan": "Rajasthan - 08",
    "Uttar Pradesh": "Uttar Pradesh - 09",
    "Bihar": "Bihar - 10",
    "Sikkim": "Sikkim - 11",
    "Arunachal Pradesh": "Arunachal Pradesh - 12",
    "Nagaland": "Nagaland - 13",
    "Manipur": "Manipur - 14",
    "Mizoram": "Mizoram - 15",
    "Tripura": "Tripura - 16",
    "Meghalaya": "Meghalaya - 17",
    "Assam": "Assam - 18",
    "West Bengal": "West Bengal - 19",
    "Jharkhand": "Jharkhand - 20",
    "Odisha": "Odisha - 21",
    "Chhattisgarh": "Chhattisgarh - 22",
    "Madhya Pradesh": "Madhya Pradesh - 23",
    "Gujarat": "Gujarat - 24",

    "Dadra and Nagar Haveli and Daman and Diu":
    "Dadra and Nagar Haveli and Daman and Diu - 26",

    "Maharashtra": "Maharashtra - 27",
    "Karnataka": "Karnataka - 29",
    "Goa": "Goa - 30",
    "Lakshadweep": "Lakshadweep - 31",
    "Kerala": "Kerala - 32",
    "Tamil Nadu": "Tamil Nadu - 33",
    "Puducherry": "Puducherry - 34",

    "Andaman and Nicobar Islands":
    "Andaman and Nicobar Islands - 35",

    "Telangana": "Telangana - 36",
    "Andhra Pradesh": "Andhra Pradesh - 37",
    "Ladakh": "Ladakh - 38"
    }

    pincode_match = re.search(r'\b\d{6}\b', address)

    if not pincode_match:
        return ""

    pincode = pincode_match.group()

    if pincode in pincode_cache:
        return pincode_cache[pincode]

    url = f"https://api.postalpincode.in/pincode/{pincode}"

    headers = {
      "User-Agent": "Mozilla/5.0"
    }

    try:
        response = requests.get(
        url,
        headers=headers,
        timeout=5
        )
        data = response.json()

        if data and data[0]["Status"] == "Success":
            state = data[0]["PostOffice"][0]["State"]
            result = state_code_map.get(state, "")
            pincode_cache[pincode] = result
            return result
    except Exception:
        pass
    
    pincode_cache[pincode] = ""
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
    # bill = query.order_by(Bill.id).all()
    bill = query.order_by(Bill.id).yield_per(1000)
    if not bill:
     return jsonify({
        'success': True,
        'Bill': []
        }), 200
    data=[]
    for bills in bill:

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
    # bill = query.order_by(Bill.id).all()
    bill = query.order_by(Bill.id).yield_per(1000)

    if not bill:
     return jsonify({
        'success': True,
        'Bill': []
        }), 200
    data=[]
    for bills in bill:
      place_supply = get_place_supply(
      bills.customer_address
      )
      # applicaple_tax=bills.subtotal- bills.discount
      taxable=bills.subtotal- bills.discount
      applicaple_tax=taxable * 5/100
      data.append({
                "invoice_no": bills.bill_number,
                "invoice_date":  bills.created_at,
                "invoice_value": bills.total,
                "place_supply": place_supply,
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
    # bill = query.order_by(Bill.id).all()
    bill = query.order_by(Bill.id).yield_per(1000)

    if not bill:
     return jsonify({
        'success': True,
        'Bill': []
        }), 200
    data=[]
    for bills in bill:
      place_supply = get_place_supply(
      bills.customer_address
      )
      # applicaple_tax=bills.subtotal- bills.discount
      taxable=bills.subtotal- bills.discount
      applicaple_tax=taxable * 5/100
      data.append({
                "type": bills.customer_type,
                "place_supply": place_supply,
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
    # bill = query.order_by(Bill.id).all()
    bill = query.order_by(Bill.id).yield_per(1000)

    if not bill:
     return jsonify({
        'success': True,
        'Bill': []
        }), 200
    data=[]
    for bills in bill:
      place_supply = get_place_supply(
        bills.customer_address
        )
      # applicaple_tax=bills.subtotal- bills.discount
      taxable=bills.subtotal- bills.discount
      applicaple_tax=taxable * 5/100
      data.append({
                "gstin": bills.customer_gst,
                "receiver_name":  bills.customer_name,
                "note_no": bills.bill_number,
                "note_date": bills.created_at ,
                "note_type": 'Regular B2B',
                "place_supply": place_supply,
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
    # bill = query.order_by(Bill.id).all()
    bill = query.order_by(Bill.id).yield_per(1000)

    if not bill:
     return jsonify({
        'success': True,
        'Bill': []
        }), 200
    data=[]
    for bills in bill:
      place_supply = get_place_supply(
        bills.customer_address
        )
      # applicaple_tax=bills.subtotal- bills.discount
      taxable=bills.subtotal- bills.discount
      applicaple_tax=taxable * 5/100 
      data.append({
                "ur_type":"",
                "note_no":  bills.bill_number,
                "note_date": bills.created_at ,
                "note_type": 'Regular B2B',
                "place_supply": place_supply,
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
    # bill = query.order_by(Bill.id).all()
    bill = query.order_by(Bill.id).yield_per(1000)

    if not bill:
     return jsonify({
        'success': True,
        'Bill': []
        }), 200
    data=[]
    for bills in bill:

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
    # bill = query.order_by(Bill.id).all()
    bill = query.order_by(Bill.id).yield_per(1000)

    if not bill:
     return jsonify({
        'success': True,
        'Bill': []
        }), 200
    data=[]
    for bills in bill:
      place_supply = get_place_supply(
        bills.customer_address
        )
      # applicaple_tax=bills.subtotal- bills.discount
      taxable=bills.subtotal- bills.discount
      applicaple_tax=taxable * 5/100 
      data.append({
                "place_supply": place_supply,
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
    # bill = query.order_by(Bill.id).all()
    bill = query.order_by(Bill.id).yield_per(1000)

    if not bill:
     return jsonify({
        'success': True,
        'Bill': []
        }), 200
    data=[]
    for bills in bill:

    
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
    # bill = query.order_by(Bill.id).all()
    bill = query.order_by(Bill.id).yield_per(1000)

    if not bill:
     return jsonify({
        'success': True,
        'Bill': []
        }), 200
    data=[]
    for bills in bill:

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
    # bill = query.order_by(Bill.id).all()
    bill = query.order_by(Bill.id).yield_per(1000)

    if not bill:
     return jsonify({
        'success': True,
        'Bill': []
        }), 200
    data=[]
    for bills in bill:

    
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