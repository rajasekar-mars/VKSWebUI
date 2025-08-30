#!/usr/bin/env python3
"""
Script to delete all sales data from the database.
This is useful when changing the sales table structure from center_id to customer_id.
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + '/..'))
from backend import create_app, db
from backend.models import Sale

def delete_all_sales():
    """Delete all sales records from the database."""
    app = create_app()
    with app.app_context():
        try:
            # Get count of sales before deletion
            sales_count = Sale.query.count()
            print(f"Found {sales_count} sales records in the database.")
            
            if sales_count == 0:
                print("No sales data found. Nothing to delete.")
                return
            
            # Ask for confirmation
            confirm = input(f"Are you sure you want to delete all {sales_count} sales records? (yes/no): ")
            
            if confirm.lower() in ['yes', 'y']:
                # Delete all sales
                Sale.query.delete()
                db.session.commit()
                
                # Verify deletion
                remaining_count = Sale.query.count()
                print(f"✅ Successfully deleted all sales data!")
                print(f"Remaining sales records: {remaining_count}")
                
            else:
                print("❌ Operation cancelled. No data was deleted.")
                
        except Exception as e:
            print(f"❌ Error occurred while deleting sales data: {e}")
            db.session.rollback()

if __name__ == "__main__":
    print("🗑️  Sales Data Deletion Script")
    print("=" * 40)
    delete_all_sales()
