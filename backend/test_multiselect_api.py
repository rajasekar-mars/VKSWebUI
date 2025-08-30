#!/usr/bin/env python3
"""
Test script for the new multi-select access control and customer API endpoints.
"""

import sys
import os
import requests
import json

# Test the new endpoints
API_BASE = 'http://localhost:5000/api'

def test_access_control_options():
    """Test the access control options endpoint"""
    print("🔧 Testing Access Control Options...")
    
    # First login as admin
    login_data = {'username': 'admin', 'password': 'admin'}
    session = requests.Session()
    
    response = session.post(f'{API_BASE}/login', json=login_data)
    if response.status_code != 200:
        print("❌ Login failed")
        return
    
    # Test access control options
    response = session.get(f'{API_BASE}/access_control_options')
    if response.status_code == 200:
        options = response.json()
        print(f"✅ Access Control Options: {options}")
    else:
        print(f"❌ Failed to get access control options: {response.status_code}")

def test_customer_api():
    """Test the customer API endpoints"""
    print("\n👥 Testing Customer API...")
    
    session = requests.Session()
    login_data = {'username': 'admin', 'password': 'admin'}
    session.post(f'{API_BASE}/login', json=login_data)
    
    # Create a test customer
    customer_data = {
        'name': 'Test Customer',
        'gst_number': '22AAAAA0000A1Z5',
        'account_number': '123456789',
        'ifsc_code': 'SBIN0001234',
        'bank': 'State Bank of India',
        'address': '123 Test Street, Mumbai',
        'mobile_number': '9876543210'
    }
    
    response = session.post(f'{API_BASE}/customers', json=customer_data)
    if response.status_code == 201:
        customer = response.json()
        print(f"✅ Customer created: {customer}")
        return customer.get('data', {}).get('id')
    else:
        print(f"❌ Failed to create customer: {response.status_code} - {response.text}")
        return None

def test_sales_with_customer():
    """Test sales API with customer_id"""
    print("\n💰 Testing Sales with Customer ID...")
    
    session = requests.Session()
    login_data = {'username': 'admin', 'password': 'admin'}
    session.post(f'{API_BASE}/login', json=login_data)
    
    # First create a customer
    customer_id = test_customer_api()
    if not customer_id:
        print("❌ Cannot test sales without customer")
        return
    
    # Create a test sale
    sale_data = {
        'item': 'Test Product',
        'quantity': 5,
        'price': 100.0,
        'date': '2025-08-30',
        'customer_id': customer_id
    }
    
    response = session.post(f'{API_BASE}/sales', json=sale_data)
    if response.status_code == 201:
        sale = response.json()
        print(f"✅ Sale created: {sale}")
    else:
        print(f"❌ Failed to create sale: {response.status_code} - {response.text}")

def test_employee_access_control():
    """Test employee creation with multi-select access control"""
    print("\n👨‍💼 Testing Employee with Multi-Select Access Control...")
    
    session = requests.Session()
    login_data = {'username': 'admin', 'password': 'admin'}
    session.post(f'{API_BASE}/login', json=login_data)
    
    # Create a test employee with multiple access permissions
    employee_data = {
        'username': 'test_employee',
        'password': 'password123',
        'role': 'employee',
        'MobileNumber': 9876543210,
        'EmailID': 'test@company.com',
        'AccessControl': ['SALES', 'CUSTOMERS', 'COLLECTIONS']  # Array of permissions
    }
    
    response = session.post(f'{API_BASE}/employees', json=employee_data)
    if response.status_code == 201:
        result = response.json()
        print(f"✅ Employee created with access control: {result}")
    else:
        print(f"❌ Failed to create employee: {response.status_code} - {response.text}")

if __name__ == "__main__":
    print("🧪 Testing New Multi-Select Access Control & Customer API")
    print("=" * 60)
    
    test_access_control_options()
    customer_id = test_customer_api()
    test_sales_with_customer()
    test_employee_access_control()
    
    print("\n✨ Testing completed!")
