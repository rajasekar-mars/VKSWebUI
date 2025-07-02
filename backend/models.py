from . import db
from flask_login import UserMixin

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)
    role = db.Column(db.String(50), nullable=False)  # 'admin' or 'employee'

class Center(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    location = db.Column(db.String(150), nullable=False)

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
    center_id = db.Column(db.Integer, db.ForeignKey('center.id'))

class Account(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    balance = db.Column(db.Float, nullable=False)

class CenterAccountDetails(db.Model):
    __tablename__ = 'CENTER_ACCOUNT_DETAILS'
    CODE = db.Column(db.Integer, primary_key=True, nullable=False)
    SUB_CODE = db.Column(db.String, nullable=True)
    BANK_ACC_NUMBER = db.Column(db.String, primary_key=True, nullable=False)
    NAME = db.Column(db.String, primary_key=True, nullable=False)
    IFSC = db.Column(db.String, primary_key=True, nullable=False)
    BRANCH = db.Column(db.String, primary_key=True, nullable=False)
    AMOUNT = db.Column(db.Float, default=1)

