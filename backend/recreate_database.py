#!/usr/bin/env python3
"""
Script to recreate the database with the new Customer model and updated Sales table.
This will delete all existing data and create fresh tables.
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + '/..'))
from backend import create_app, db
from backend.models import User, Center, Collection, Sale, Account, CenterAccountDetails, Customer

def recreate_database():
    """Recreate the database with new schema."""
    app = create_app()
    with app.app_context():
        try:
            print("🗑️  Database Recreation Script")
            print("=" * 40)
            
            # Ask for confirmation
            confirm = input("⚠️  This will DELETE ALL DATA and recreate the database. Continue? (yes/no): ")
            
            if confirm.lower() not in ['yes', 'y']:
                print("❌ Operation cancelled. No changes made.")
                return
            
            print("\n🔄 Dropping all existing tables...")
            db.drop_all()
            
            print("🔧 Creating new tables with updated schema...")
            db.create_all()
            
            print("✅ Database successfully recreated!")
            print("\nNew tables created:")
            print("- User (employees)")
            print("- Center")
            print("- Customer (NEW - with GST, bank details, etc.)")
            print("- Collection (linked to centers)")
            print("- Sale (now linked to customers instead of centers)")
            print("- Account")
            print("- CenterAccountDetails")
            
            print("\n📝 Next steps:")
            print("1. Create an admin user using create_admin.py")
            print("2. Add customers using the new /api/customers endpoint")
            print("3. Create sales linked to customers using /api/sales")
                
        except Exception as e:
            print(f"❌ Error occurred while recreating database: {e}")

if __name__ == "__main__":
    recreate_database()
