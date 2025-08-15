from flask import request, jsonify, session, abort
from flask_login import login_user, logout_user, login_required, current_user
from . import app, db, login_manager
from .models import User, Center, Collection, Sale, Account, CenterAccountDetails
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.exc import IntegrityError
import random
import time
import requests
from flask_cors import CORS

# --- General improvements: docstrings, error handling, validation, status codes, security ---

# Enable CORS
CORS(app, supports_credentials=True)

# Helper: error response
def error_response(message, status=400, fields=None):
    resp = {'success': False, 'message': message}
    if fields:
        resp['fields'] = fields
    return jsonify(resp), status

# Helper: success response
def success_response(message, data=None, status=200):
    resp = {'success': True, 'message': message}
    if data is not None:
        resp['data'] = data
    return jsonify(resp), status

# Helper: get object or 404
def get_or_404(model, *pk):
    obj = model.query.get(pk if len(pk) > 1 else pk[0])
    if not obj:
        abort(404)
    return obj

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/api/login', methods=['POST'])
def login():
    """Authenticate user and start session."""
    data = request.json
    if not data or 'username' not in data or 'password' not in data:
        return error_response('Missing username or password', 400)
    user = User.query.filter_by(username=data['username']).first()
    if user and check_password_hash(user.password, data['password']):
        login_user(user)
        return jsonify({'success': True, 'role': user.role}), 200
    return error_response('Invalid credentials', 401)

@app.route('/api/logout')
@login_required
def logout():
    """Logout current user."""
    logout_user()
    return jsonify({'success': True}), 200

@app.route('/api/user')
@login_required
def get_user():
    """Get current user info."""
    return jsonify({'username': current_user.username, 'role': current_user.role}), 200

# CRUD endpoints for Center, Collection, Sale, Employee(User), Account
# Example for Center
@app.route('/api/centers', methods=['GET', 'POST'])
@login_required
def centers():
    """List or create centers."""
    if request.method == 'GET':
        centers = Center.query.all()
        return jsonify([{'id': c.id, 'name': c.name, 'location': c.location} for c in centers]), 200
    if request.method == 'POST':
        data = request.json
        if not data.get('name') or not data.get('location'):
            return error_response('Name and location are required.', 400)
        center = Center(name=data['name'], location=data['location'])
        db.session.add(center)
        db.session.commit()
        return success_response('Center created successfully.', {'id': center.id, 'name': center.name, 'location': center.location}, 201)

@app.route('/api/centers/<int:center_id>', methods=['PUT', 'DELETE'])
@login_required
def update_center(center_id):
    """Update or delete center."""
    center = Center.query.get(center_id)
    if not center:
        return error_response('Center not found.', 404)
    if request.method == 'PUT':
        data = request.json
        if not data.get('name') or not data.get('location'):
            return error_response('Name and location are required.', 400)
        center.name = data['name']
        center.location = data['location']
        db.session.commit()
        return success_response('Center updated successfully.', {'id': center.id, 'name': center.name, 'location': center.location}, 200)
    if request.method == 'DELETE':
        db.session.delete(center)
        db.session.commit()
        return success_response('Center deleted successfully.', None, 200)

# CRUD for Collections
def collection_to_dict(collection):
    return {
        'id': collection.id,
        'amount': collection.amount,
        'date': collection.date,
        'center_id': collection.center_id
    }

@app.route('/api/collections', methods=['GET', 'POST'])
@login_required
def collections():
    """List or create collections."""
    if request.method == 'GET':
        collections = Collection.query.all()
        return jsonify([collection_to_dict(c) for c in collections]), 200
    if request.method == 'POST':
        data = request.json
        if not data.get('amount') or not data.get('date') or not data.get('center_id'):
            return error_response('Amount, date, and center_id are required.', 400)
        collection = Collection(amount=data['amount'], date=data['date'], center_id=data['center_id'])
        db.session.add(collection)
        db.session.commit()
        return success_response('Collection created successfully.', collection_to_dict(collection), 201)

@app.route('/api/collections/<int:collection_id>', methods=['PUT', 'DELETE'])
@login_required
def update_collection(collection_id):
    """Update or delete collection."""
    collection = Collection.query.get(collection_id)
    if not collection:
        return error_response('Collection not found.', 404)
    if request.method == 'PUT':
        data = request.json
        if not data.get('amount') or not data.get('date') or not data.get('center_id'):
            return error_response('Amount, date, and center_id are required.', 400)
        collection.amount = data['amount']
        collection.date = data['date']
        collection.center_id = data['center_id']
        db.session.commit()
        return success_response('Collection updated successfully.', collection_to_dict(collection), 200)
    if request.method == 'DELETE':
        db.session.delete(collection)
        db.session.commit()
        return success_response('Collection deleted successfully.', None, 200)

# CRUD for Sales
def sale_to_dict(sale):
    return {
        'id': sale.id,
        'item': sale.item,
        'quantity': sale.quantity,
        'price': sale.price,
        'date': sale.date,
        'center_id': sale.center_id
    }

@app.route('/api/sales', methods=['GET', 'POST'])
@login_required
def sales():
    """List or create sales."""
    if request.method == 'GET':
        sales = Sale.query.all()
        return jsonify([sale_to_dict(s) for s in sales]), 200
    if request.method == 'POST':
        data = request.json
        required = ['item', 'quantity', 'price', 'date', 'center_id']
        for field in required:
            if not data.get(field):
                return error_response(f'{field} is required.', 400)
        sale = Sale(item=data['item'], quantity=data['quantity'], price=data['price'], date=data['date'], center_id=data['center_id'])
        db.session.add(sale)
        db.session.commit()
        return success_response('Sale created successfully.', sale_to_dict(sale), 201)

@app.route('/api/sales/<int:sale_id>', methods=['PUT', 'DELETE'])
@login_required
def update_sale(sale_id):
    """Update or delete sale."""
    sale = Sale.query.get(sale_id)
    if not sale:
        return error_response('Sale not found.', 404)
    if request.method == 'PUT':
        data = request.json
        required = ['item', 'quantity', 'price', 'date', 'center_id']
        for field in required:
            if not data.get(field):
                return error_response(f'{field} is required.', 400)
        sale.item = data['item']
        sale.quantity = data['quantity']
        sale.price = data['price']
        sale.date = data['date']
        sale.center_id = data['center_id']
        db.session.commit()
        return success_response('Sale updated successfully.', sale_to_dict(sale), 200)
    if request.method == 'DELETE':
        db.session.delete(sale)
        db.session.commit()
        return success_response('Sale deleted successfully.', None, 200)

# CRUD for Employees (Users)
def user_to_dict(user):
    return {
        'id': user.id,
        'username': user.username,
        'role': user.role,
        'MobileNumber': user.MobileNumber,
        'EmailID': user.EmailID,
        'AccessControl': user.AccessControl
    }

@app.route('/api/employees', methods=['GET', 'POST'])
@login_required
def employees():
    """List or create employees (admin only)."""
    if current_user.role != 'admin':
        return error_response('Unauthorized', 403)
    if request.method == 'GET':
        users = User.query.all()
        result = [user_to_dict(u) for u in users]
        return jsonify(result), 200
    if request.method == 'POST':
        data = request.json
        required = ['username', 'password', 'role', 'MobileNumber', 'EmailID']
        for field in required:
            if not data.get(field):
                return error_response(f'{field} is required.', 400)
        try:
            hashed_pw = generate_password_hash(data['password'])
            user = User(
                username=data['username'],
                password=hashed_pw,
                role=data['role'],
                MobileNumber=data['MobileNumber'],
                EmailID=data['EmailID'],
                AccessControl=data.get('AccessControl', 'NA')
            )
            db.session.add(user)
            db.session.commit()
            users = User.query.all()
            result = [user_to_dict(u) for u in users]
            return success_response('Employee created successfully.', result, 201)
        except IntegrityError:
            db.session.rollback()
            return error_response('Username or email already exists.', 409)

@app.route('/api/employees/<int:user_id>', methods=['PUT', 'DELETE'])
@login_required
def update_employee(user_id):
    """Update or delete employee (admin only)."""
    if current_user.role != 'admin':
        return error_response('Unauthorized', 403)
    user = User.query.get(user_id)
    if not user:
        return error_response('Employee not found.', 404)
    if request.method == 'PUT':
        data = request.json
        required = ['username', 'password', 'role', 'MobileNumber', 'EmailID']
        for field in required:
            if not data.get(field):
                return error_response(f'{field} is required.', 400)
        user.username = data['username']
        user.password = generate_password_hash(data['password'])
        user.role = data['role']
        user.MobileNumber = data['MobileNumber']
        user.EmailID = data['EmailID']
        user.AccessControl = data.get('AccessControl', user.AccessControl)
        db.session.commit()
        return success_response('Employee updated successfully.', user_to_dict(user), 200)
    if request.method == 'DELETE':
        db.session.delete(user)
        db.session.commit()
        return success_response('Employee deleted successfully.', None, 200)

# CRUD for Accounts
def account_to_dict(account):
    return {
        'id': account.id,
        'name': account.name,
        'balance': account.balance
    }

@app.route('/api/accounts', methods=['GET', 'POST'])
@login_required
def accounts():
    """List or create accounts."""
    if request.method == 'GET':
        accounts = Account.query.all()
        return jsonify([account_to_dict(a) for a in accounts]), 200
    if request.method == 'POST':
        data = request.json
        if not data.get('name') or not data.get('balance'):
            return error_response('Name and balance are required.', 400)
        account = Account(name=data['name'], balance=data['balance'])
        db.session.add(account)
        db.session.commit()
        return success_response('Account created successfully.', account_to_dict(account), 201)

@app.route('/api/accounts/<int:account_id>', methods=['PUT', 'DELETE'])
@login_required
def update_account(account_id):
    """Update or delete account."""
    account = Account.query.get(account_id)
    if not account:
        return error_response('Account not found.', 404)
    if request.method == 'PUT':
        data = request.json
        if not data.get('name') or not data.get('balance'):
            return error_response('Name and balance are required.', 400)
        account.name = data['name']
        account.balance = data['balance']
        db.session.commit()
        return success_response('Account updated successfully.', account_to_dict(account), 200)
    if request.method == 'DELETE':
        db.session.delete(account)
        db.session.commit()
        return success_response('Account deleted successfully.', None, 200)

def center_account_to_dict(acc):
    return {
        'CODE': acc.CODE,
        'SUB_CODE': acc.SUB_CODE,
        'BANK_ACC_NUMBER': acc.BANK_ACC_NUMBER,
        'NAME': acc.NAME,
        'IFSC': acc.IFSC,
        'BRANCH': acc.BRANCH,
        'AMOUNT': acc.AMOUNT
    }

@app.route('/api/center_account_details', methods=['GET', 'POST'])
@login_required
def center_account_details():
    """List or create center account details."""
    if request.method == 'GET':
        accs = CenterAccountDetails.query.all()
        return jsonify([center_account_to_dict(a) for a in accs]), 200
    if request.method == 'POST':
        data = request.json
        required = ['CODE', 'BANK_ACC_NUMBER', 'NAME', 'IFSC', 'BRANCH', 'AMOUNT']
        for field in required:
            if not data.get(field):
                return error_response(f'{field} is required.', 400)
        acc = CenterAccountDetails(
            CODE=data['CODE'],
            SUB_CODE=data.get('SUB_CODE'),
            BANK_ACC_NUMBER=data['BANK_ACC_NUMBER'],
            NAME=data['NAME'],
            IFSC=data['IFSC'],
            BRANCH=data['BRANCH'],
            AMOUNT=data['AMOUNT']
        )
        db.session.add(acc)
        try:
            db.session.commit()
        except IntegrityError as e:
            db.session.rollback()
            # More explicit error message for duplicate
            if 'UNIQUE constraint failed' in str(e):
                return error_response('Duplicate record: Center Account Details with this key already exists.', 409)
            return error_response('Database error: Unable to add record.', 409)
        return success_response('Center account details created successfully.', center_account_to_dict(acc), 201)

@app.route('/api/center_account_details/<int:code>/<bank_acc_number>/<name>/<ifsc>/<branch>', methods=['PUT', 'DELETE'])
@login_required
def update_center_account_details(code, bank_acc_number, name, ifsc, branch):
    """Update or delete center account details by composite PK."""
    acc = CenterAccountDetails.query.get((code, bank_acc_number, name, ifsc, branch))
    if not acc:
        return error_response('Center account details not found.', 404)
    if request.method == 'PUT':
        data = request.json
        required = ['SUB_CODE', 'BANK_ACC_NUMBER', 'NAME', 'IFSC', 'BRANCH', 'AMOUNT']
        for field in required:
            if not data.get(field):
                return error_response(f'{field} is required.', 400)
        acc.SUB_CODE = data['SUB_CODE']
        acc.BANK_ACC_NUMBER = data['BANK_ACC_NUMBER']
        acc.NAME = data['NAME']
        acc.IFSC = data['IFSC']
        acc.BRANCH = data['BRANCH']
        acc.AMOUNT = data['AMOUNT']
        db.session.commit()
        return success_response('Center account details updated successfully.', center_account_to_dict(acc), 200)
    if request.method == 'DELETE':
        db.session.delete(acc)
        db.session.commit()
        return success_response('Center account details deleted successfully.', None, 200)

# In-memory OTP store: {username: {otp, expires_at}}
otp_store = {}

# WhatsApp API config (for local WhatsApp Web bot)
WHATSAPP_BOT_API_URL = 'http://localhost:3001/send-message'  # Change to your bot's endpoint

# Helper: get admin's WhatsApp number from DB
def get_admin_whatsapp_number():
    admin = User.query.filter_by(username='admin').first()
    print(f"Debug: admin found: {admin}")
    if admin:
        print(f"Debug: admin mobile number: {admin.MobileNumber}")
        if admin.MobileNumber:
            # Remove any + or spaces, just digits
            mobile = ''.join(filter(str.isdigit, str(admin.MobileNumber)))
            print(f"Debug: formatted mobile: {mobile}")
            return mobile
        else:
            print("Debug: admin mobile number is None or empty")
    else:
        print("Debug: admin user not found")
    return None

# Helper: send WhatsApp message via local WhatsApp Web bot
# Assumes your bot exposes POST /send-message with JSON: {"phone": "<number>", "message": "..."}
def send_whatsapp_otp(admin_number, otp, employee_username):
    print(f"Debug: Sending OTP to {admin_number} for employee {employee_username}")
    message = f'OTP for {employee_username} login: {otp} (valid 60s)'
    payload = {
        'phone': admin_number,
        'message': message
    }
    try:
        print(f"Debug: Making request to {WHATSAPP_BOT_API_URL} with payload: {payload}")
        resp = requests.post(WHATSAPP_BOT_API_URL, json=payload, timeout=10)
        print(f"Debug: WhatsApp API response status: {resp.status_code}")
        print(f"Debug: WhatsApp API response body: {resp.text}")
        return resp.status_code == 200
    except Exception as e:
        print('WhatsApp bot send error:', e)
        return False

# Patch: always use admin's number from DB
import functools

def send_whatsapp_otp_to_admin(otp, employee_username):
    print(f"Debug: send_whatsapp_otp_to_admin called for employee: {employee_username}")
    admin_number = get_admin_whatsapp_number()
    print(f"Debug: got admin number: {admin_number}")
    if not admin_number:
        print('Admin WhatsApp number not found!')
        return False
    return send_whatsapp_otp(admin_number, otp, employee_username)

@app.route('/api/login/request_otp', methods=['POST'])
def request_otp():
    """Step 1: Employee submits username/password, triggers OTP to admin's WhatsApp."""
    data = request.json
    if not data or 'username' not in data or 'password' not in data:
        return error_response('Missing username or password', 400)
    user = User.query.filter_by(username=data['username']).first()
    if not user or not check_password_hash(user.password, data['password']):
        return error_response('Invalid credentials', 401)
    if user.role == 'admin':
        # Admin can login directly
        login_user(user)
        return jsonify({'success': True, 'role': user.role, 'otp_required': False}), 200
    # Employee: generate OTP, send to admin
    otp = str(random.randint(100000, 999999))
    expires_at = time.time() + 60
    otp_store[user.username] = {'otp': otp, 'expires_at': expires_at}
    sent = send_whatsapp_otp_to_admin(otp, user.username)
    if not sent:
        return error_response('Failed to send OTP to admin', 500)
    return jsonify({'success': True, 'otp_required': True, 'message': 'OTP sent to admin. Ask admin for OTP.'}), 200

@app.route('/api/login/verify_otp', methods=['POST'])
def verify_otp():
    """Step 2: Employee submits username + OTP. If valid, login."""
    data = request.json
    if not data or 'username' not in data or 'otp' not in data:
        return error_response('Missing username or otp', 400)
    user = User.query.filter_by(username=data['username']).first()
    if not user or user.role == 'admin':
        return error_response('Invalid user', 401)
    otp_entry = otp_store.get(user.username)
    if not otp_entry:
        return error_response('No OTP requested or expired', 400)
    if time.time() > otp_entry['expires_at']:
        otp_store.pop(user.username, None)
        return error_response('OTP expired', 400)
    if data['otp'] != otp_entry['otp']:
        return error_response('Invalid OTP', 401)
    # OTP valid
    otp_store.pop(user.username, None)
    login_user(user)
    return jsonify({'success': True, 'role': user.role}), 200
