#!/usr/bin/env python3
"""
Script to update admin mobile number for WhatsApp OTP functionality.
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + '/..'))
from backend import create_app, db
from backend.models import User

def update_admin_mobile():
    """Update admin mobile number."""
    app = create_app()
    with app.app_context():
        try:
            admin = User.query.filter_by(username='admin').first()
            if not admin:
                print("❌ Admin user not found!")
                return
            
            print(f"Current admin mobile number: {admin.MobileNumber}")
            
            # Ask for new mobile number
            new_mobile = input("Enter new WhatsApp mobile number for admin (with country code, e.g., 919876543210): ")
            
            if not new_mobile.isdigit():
                print("❌ Invalid mobile number! Please enter only digits.")
                return
            
            if len(new_mobile) < 10:
                print("❌ Mobile number too short! Please include country code.")
                return
            
            # Update mobile number
            admin.MobileNumber = int(new_mobile)
            db.session.commit()
            
            print(f"✅ Admin mobile number updated successfully!")
            print(f"New mobile number: {admin.MobileNumber}")
            print(f"📱 Now employees will receive OTP notifications on WhatsApp: +{new_mobile}")
            
        except Exception as e:
            print(f"❌ Error updating admin mobile number: {e}")
            db.session.rollback()

if __name__ == "__main__":
    print("📱 Admin Mobile Number Update Tool")
    print("=" * 40)
    update_admin_mobile()
