from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

# This will be initialized by the app
db = None

def init_db(database):
    global db
    db = database

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
    SUB_CODE = db.Column(db.String, primary_key=True, nullable=True)
    BANK_ACC_NUMBER = db.Column(db.String, primary_key=True, nullable=False)
    NAME = db.Column(db.String, primary_key=True, nullable=False)
    IFSC = db.Column(db.String, primary_key=True, nullable=False)
    BRANCH = db.Column(db.String, primary_key=True, nullable=False)
    AMOUNT = db.Column(db.Float, default=1)

