from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

# Global variables to store models
User = None
Center = None
Customer = None
Collection = None
Sale = None
Account = None
CenterAccountDetails = None

def init_models(db):
    """Initialize models with the database instance"""
    global User, Center, Customer, Collection, Sale, Account, CenterAccountDetails
    
    # Define models here after db is initialized
    class User(UserMixin, db.Model):
        id = db.Column(db.Integer, primary_key=True)
        username = db.Column(db.String(150), unique=True, nullable=False)
        password_hash = db.Column(db.String(150), nullable=False)
        email = db.Column(db.String(150), nullable=False)
        role = db.Column(db.String(50), nullable=False)  # 'admin' or 'employee'
        MobileNumber = db.Column(db.Integer, nullable=True)
        EmailID = db.Column(db.String(150), nullable=True)
        AccessControl = db.Column(db.String(500), nullable=False, default="")  # Comma-separated values
        
        def get_access_list(self):
            """Return list of access permissions"""
            if not self.AccessControl or self.AccessControl == "NA":
                return []
            return [perm.strip() for perm in self.AccessControl.split(',') if perm.strip()]
        
        def set_access_list(self, permissions):
            """Set access permissions from a list"""
            if not permissions:
                self.AccessControl = ""
            else:
                # Remove duplicates and sort for consistency
                unique_perms = sorted(set(perm.strip() for perm in permissions if perm.strip()))
                self.AccessControl = ','.join(unique_perms)
        
        def has_access(self, permission):
            """Check if user has specific access permission"""
            if self.role == 'admin':
                return True
            access_list = self.get_access_list()
            return permission in access_list or 'FULL' in access_list

    class Center(db.Model):
        id = db.Column(db.Integer, primary_key=True)
        name = db.Column(db.String(150), nullable=False)
        location = db.Column(db.String(150), nullable=False)

    class Customer(db.Model):
        id = db.Column(db.Integer, primary_key=True)
        name = db.Column(db.String(150), nullable=False)
        gst_number = db.Column(db.String(50), nullable=True)
        account_number = db.Column(db.String(50), nullable=True)
        ifsc_code = db.Column(db.String(20), nullable=True)
        bank = db.Column(db.String(100), nullable=True)
        address = db.Column(db.Text, nullable=True)
        mobile_number = db.Column(db.String(15), nullable=False)

    class Collection(db.Model):
        id = db.Column(db.Integer, primary_key=True)
        amount = db.Column(db.Float, nullable=False)
        date = db.Column(db.String(50), nullable=False)
        center_id = db.Column(db.Integer, db.ForeignKey('center.id'))

    class Sale(db.Model):
        id = db.Column(db.Integer, primary_key=True)
        item = db.Column(db.String(150), nullable=False)
        quantity = db.Column(db.Integer, nullable=False)
        price = db.Column(db.Float, nullable=False)
        date = db.Column(db.String(50), nullable=False)
        customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'))

    class Account(db.Model):
        id = db.Column(db.Integer, primary_key=True)
        name = db.Column(db.String(150), nullable=False)
        balance = db.Column(db.Float, nullable=False)

    class CenterAccountDetails(db.Model):
        __tablename__ = 'CENTER_ACCOUNT_DETAILS'
        CODE = db.Column(db.Integer, primary_key=True, nullable=False)
        NAME = db.Column(db.String(100), nullable=False)
        ROUTE = db.Column(db.String(100), nullable=True)
        OPENING_BALANCE = db.Column(db.Float, nullable=False, default=0.0)
        AS_ON_DATE = db.Column(db.Date, nullable=True)
    
    # Store globally for import
    globals()['User'] = User
    globals()['Center'] = Center
    globals()['Customer'] = Customer
    globals()['Collection'] = Collection
    globals()['Sale'] = Sale
    globals()['Account'] = Account
    globals()['CenterAccountDetails'] = CenterAccountDetails
    
    # Return the models so they can be imported
    return User, Center, Customer, Collection, Sale, Account, CenterAccountDetails

class Center(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    location = db.Column(db.String(150), nullable=False)

class Customer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    gst_number = db.Column(db.String(50), nullable=True)
    account_number = db.Column(db.String(50), nullable=True)
    ifsc_code = db.Column(db.String(20), nullable=True)
    bank = db.Column(db.String(100), nullable=True)
    address = db.Column(db.Text, nullable=True)
    mobile_number = db.Column(db.String(15), nullable=False)

class Collection(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.String(50), nullable=False)
    center_id = db.Column(db.Integer, db.ForeignKey('center.id'))

class Sale(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item = db.Column(db.String(150), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)
    date = db.Column(db.String(50), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'))

class Account(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    balance = db.Column(db.Float, nullable=False)

class CenterAccountDetails(db.Model):
    __tablename__ = 'CENTER_ACCOUNT_DETAILS'
    CODE = db.Column(db.Integer, primary_key=True, nullable=False)
    SUB_CODE = db.Column(db.String, primary_key=True, nullable=True)
    BANK_ACC_NUMBER = db.Column(db.String, primary_key=True, nullable=False)
    NAME = db.Column(db.String, primary_key=True, nullable=False)
    IFSC = db.Column(db.String, primary_key=True, nullable=False)
    BRANCH = db.Column(db.String, primary_key=True, nullable=False)
    AMOUNT = db.Column(db.Float, default=1)

