#!/usr/bin/env python3
"""
Script to test the new Customer and Sales API endpoints.
"""

import requests
import json

BASE_URL = "http://127.0.0.1:5000"

def test_login():
    """Test admin login."""
    login_data = {
        "username": "admin",
        "password": "admin"
    }
    response = requests.post(f"{BASE_URL}/api/login", json=login_data)
    print(f"Login test: {response.status_code} - {response.json()}")
    return response.cookies

def test_customers_api(cookies):
    """Test Customer CRUD operations."""
    print("\n" + "="*50)
    print("TESTING CUSTOMER API ENDPOINTS")
    print("="*50)
    
    # Test GET (empty list)
    response = requests.get(f"{BASE_URL}/api/customers", cookies=cookies)
    print(f"GET /api/customers: {response.status_code} - {response.json()}")
    
    # Test POST (create customer)
    customer_data = {
        "name": "John Doe",
        "gst_number": "22AAAAA0000A1Z5",
        "account_number": "123456789",
        "ifsc_code": "SBIN0001234",
        "bank": "State Bank of India",
        "address": "123 Main Street, Mumbai, 400001",
        "mobile_number": "9876543210"
    }
    response = requests.post(f"{BASE_URL}/api/customers", json=customer_data, cookies=cookies)
    print(f"POST /api/customers: {response.status_code} - {response.json()}")
    
    if response.status_code == 201:
        customer_id = response.json()['data']['id']
        return customer_id
    return None

def test_sales_api(cookies, customer_id):
    """Test Sales CRUD operations with customer_id."""
    print("\n" + "="*50)
    print("TESTING SALES API ENDPOINTS (with customer_id)")
    print("="*50)
    
    if not customer_id:
        print("❌ Cannot test sales - no customer created")
        return
    
    # Test GET (empty list)
    response = requests.get(f"{BASE_URL}/api/sales", cookies=cookies)
    print(f"GET /api/sales: {response.status_code} - {response.json()}")
    
    # Test POST (create sale with customer_id)
    sale_data = {
        "item": "Milk",
        "quantity": 10,
        "price": 50.0,
        "date": "2025-08-30",
        "customer_id": customer_id
    }
    response = requests.post(f"{BASE_URL}/api/sales", json=sale_data, cookies=cookies)
    print(f"POST /api/sales: {response.status_code} - {response.json()}")

def main():
    """Run all tests."""
    print("🧪 Testing New Customer and Sales API")
    print("=" * 60)
    
    try:
        # Login
        cookies = test_login()
        
        # Test customers
        customer_id = test_customers_api(cookies)
        
        # Test sales
        test_sales_api(cookies, customer_id)
        
        print("\n✅ All tests completed!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to Flask server. Make sure it's running on http://127.0.0.1:5000")
    except Exception as e:
        print(f"❌ Error during testing: {e}")

if __name__ == "__main__":
    main()
