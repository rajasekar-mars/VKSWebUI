from flask import request, jsonify, session
from flask_login import login_user, logout_user, login_required, current_user
from . import app, db, login_manager
from .models import User, Center, Collection, Sale, Account, CenterAccountDetails
from werkzeug.security import generate_password_hash, check_password_hash

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()
    if user and check_password_hash(user.password, data['password']):
        login_user(user)
        return jsonify({'success': True, 'role': user.role})
    return jsonify({'success': False}), 401

@app.route('/api/logout')
@login_required
def logout():
    logout_user()
    return jsonify({'success': True})

@app.route('/api/user')
@login_required
def get_user():
    return jsonify({'username': current_user.username, 'role': current_user.role})

# CRUD endpoints for Center, Collection, Sale, Employee(User), Account
# Example for Center
@app.route('/api/centers', methods=['GET', 'POST'])
@login_required
def centers():
    if request.method == 'GET':
        centers = Center.query.all()
        return jsonify([{'id': c.id, 'name': c.name, 'location': c.location} for c in centers])
    if request.method == 'POST':
        data = request.json
        center = Center(name=data['name'], location=data['location'])
        db.session.add(center)
        db.session.commit()
        return jsonify({'id': center.id, 'name': center.name, 'location': center.location})

@app.route('/api/centers/<int:center_id>', methods=['PUT', 'DELETE'])
@login_required
def update_center(center_id):
    center = Center.query.get_or_404(center_id)
    if request.method == 'PUT':
        data = request.json
        center.name = data['name']
        center.location = data['location']
        db.session.commit()
        return jsonify({'id': center.id, 'name': center.name, 'location': center.location})
    if request.method == 'DELETE':
        db.session.delete(center)
        db.session.commit()
        return jsonify({'success': True})

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
    if request.method == 'GET':
        collections = Collection.query.all()
        return jsonify([collection_to_dict(c) for c in collections])
    if request.method == 'POST':
        data = request.json
        collection = Collection(amount=data['amount'], date=data['date'], center_id=data['center_id'])
        db.session.add(collection)
        db.session.commit()
        return jsonify(collection_to_dict(collection))

@app.route('/api/collections/<int:collection_id>', methods=['PUT', 'DELETE'])
@login_required
def update_collection(collection_id):
    collection = Collection.query.get_or_404(collection_id)
    if request.method == 'PUT':
        data = request.json
        collection.amount = data['amount']
        collection.date = data['date']
        collection.center_id = data['center_id']
        db.session.commit()
        return jsonify(collection_to_dict(collection))
    if request.method == 'DELETE':
        db.session.delete(collection)
        db.session.commit()
        return jsonify({'success': True})

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
    if request.method == 'GET':
        sales = Sale.query.all()
        return jsonify([sale_to_dict(s) for s in sales])
    if request.method == 'POST':
        data = request.json
        sale = Sale(item=data['item'], quantity=data['quantity'], price=data['price'], date=data['date'], center_id=data['center_id'])
        db.session.add(sale)
        db.session.commit()
        return jsonify(sale_to_dict(sale))

@app.route('/api/sales/<int:sale_id>', methods=['PUT', 'DELETE'])
@login_required
def update_sale(sale_id):
    sale = Sale.query.get_or_404(sale_id)
    if request.method == 'PUT':
        data = request.json
        sale.item = data['item']
        sale.quantity = data['quantity']
        sale.price = data['price']
        sale.date = data['date']
        sale.center_id = data['center_id']
        db.session.commit()
        return jsonify(sale_to_dict(sale))
    if request.method == 'DELETE':
        db.session.delete(sale)
        db.session.commit()
        return jsonify({'success': True})

# CRUD for Employees (Users)
def user_to_dict(user):
    return {
        'id': user.id,
        'username': user.username,
        'role': user.role
    }

@app.route('/api/employees', methods=['GET', 'POST'])
@login_required
def employees():
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    if request.method == 'GET':
        users = User.query.all()
        # Show decrypted password for employees (not secure, for demo only)
        from werkzeug.security import check_password_hash
        result = []
        for u in users:
            # Try to guess the password (not possible to decrypt hash, so show placeholder)
            result.append({
                'id': u.id,
                'username': u.username,
                'role': u.role,
                'password': '(cannot decrypt hash)'
            })
        return jsonify(result)
    if request.method == 'POST':
        data = request.json
        hashed_pw = generate_password_hash(data['password'])
        user = User(username=data['username'], password=hashed_pw, role=data['role'])
        db.session.add(user)
        db.session.commit()
        return jsonify({'id': user.id, 'username': user.username, 'role': user.role, 'password': '(cannot decrypt hash)'})

@app.route('/api/employees/<int:user_id>', methods=['PUT', 'DELETE'])
@login_required
def update_employee(user_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    user = User.query.get_or_404(user_id)
    if request.method == 'PUT':
        data = request.json
        user.username = data['username']
        if data.get('password'):
            user.password = generate_password_hash(data['password'])
        user.role = data['role']
        db.session.commit()
        return jsonify(user_to_dict(user))
    if request.method == 'DELETE':
        db.session.delete(user)
        db.session.commit()
        return jsonify({'success': True})

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
    if request.method == 'GET':
        accounts = Account.query.all()
        return jsonify([account_to_dict(a) for a in accounts])
    if request.method == 'POST':
        data = request.json
        account = Account(name=data['name'], balance=data['balance'])
        db.session.add(account)
        db.session.commit()
        return jsonify(account_to_dict(account))

@app.route('/api/accounts/<int:account_id>', methods=['PUT', 'DELETE'])
@login_required
def update_account(account_id):
    account = Account.query.get_or_404(account_id)
    if request.method == 'PUT':
        data = request.json
        account.name = data['name']
        account.balance = data['balance']
        db.session.commit()
        return jsonify(account_to_dict(account))
    if request.method == 'DELETE':
        db.session.delete(account)
        db.session.commit()
        return jsonify({'success': True})

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
    if request.method == 'GET':
        accs = CenterAccountDetails.query.all()
        return jsonify([center_account_to_dict(a) for a in accs])
    if request.method == 'POST':
        data = request.json
        acc = CenterAccountDetails(
            CODE=data['CODE'],
            SUB_CODE=data.get('SUB_CODE'),
            BANK_ACC_NUMBER=data['BANK_ACC_NUMBER'],
            NAME=data['NAME'],
            IFSC=data['IFSC'],
            BRANCH=data.get('BRANCH'),
            AMOUNT=data.get('AMOUNT', 1)
        )
        db.session.add(acc)
        db.session.commit()
        return jsonify(center_account_to_dict(acc))

@app.route('/api/center_account_details/<int:code>', methods=['PUT', 'DELETE'])
@login_required
def update_center_account_details(code):
    acc = CenterAccountDetails.query.get_or_404(code)
    if request.method == 'PUT':
        data = request.json
        acc.SUB_CODE = data.get('SUB_CODE')
        acc.BANK_ACC_NUMBER = data['BANK_ACC_NUMBER']
        acc.NAME = data['NAME']
        acc.IFSC = data['IFSC']
        acc.BRANCH = data.get('BRANCH')
        acc.AMOUNT = data.get('AMOUNT', 1)
        db.session.commit()
        return jsonify(center_account_to_dict(acc))
    if request.method == 'DELETE':
        db.session.delete(acc)
        db.session.commit()
        return jsonify({'success': True})
