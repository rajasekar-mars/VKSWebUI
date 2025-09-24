#!/bin/bash
# Database Migration Script - SQLite to PostgreSQL

set -e

echo "🔄 Migrating from SQLite to PostgreSQL..."

# Backup SQLite database first
echo "💾 Creating backup of SQLite database..."
cp instance/app.db instance/app.db.backup.$(date +%Y%m%d_%H%M%S)

# Install required Python packages for migration
pip install psycopg2-binary python-dotenv

# Create migration script
cat > migrate_db.py << 'EOF'
import sqlite3
import psycopg2
import os
from datetime import datetime

# Database connections
sqlite_conn = sqlite3.connect('instance/app.db')
sqlite_conn.row_factory = sqlite3.Row

# PostgreSQL connection
pg_conn = psycopg2.connect(
    host='localhost',
    database='vkswebui',
    user='vksuser',
    password='your_secure_password_here'
)

def migrate_table(table_name, columns):
    print(f"Migrating table: {table_name}")
    
    # Get data from SQLite
    sqlite_cursor = sqlite_conn.cursor()
    sqlite_cursor.execute(f"SELECT * FROM {table_name}")
    rows = sqlite_cursor.fetchall()
    
    if not rows:
        print(f"No data found in {table_name}")
        return
    
    # Insert into PostgreSQL
    pg_cursor = pg_conn.cursor()
    
    # Create placeholders for INSERT
    placeholders = ', '.join(['%s'] * len(columns))
    column_names = ', '.join(columns)
    
    insert_query = f"INSERT INTO {table_name} ({column_names}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"
    
    for row in rows:
        try:
            values = [row[col] for col in columns]
            pg_cursor.execute(insert_query, values)
        except Exception as e:
            print(f"Error inserting row in {table_name}: {e}")
            continue
    
    pg_conn.commit()
    print(f"Migrated {len(rows)} rows to {table_name}")

# Define your table structures (update based on your actual tables)
tables_to_migrate = {
    'user': ['id', 'username', 'email', 'password_hash', 'role', 'created_at', 'is_active'],
    'center': ['id', 'name', 'location', 'created_at'],
    'collection': ['id', 'center_id', 'date', 'amount', 'created_at'],
    'sales': ['id', 'product', 'quantity', 'price', 'date', 'created_at'],
    'employee': ['id', 'name', 'position', 'salary', 'hire_date', 'created_at'],
    'account': ['id', 'account_type', 'balance', 'description', 'created_at']
}

# Migrate each table
for table_name, columns in tables_to_migrate.items():
    try:
        migrate_table(table_name, columns)
    except Exception as e:
        print(f"Error migrating {table_name}: {e}")

# Close connections
sqlite_conn.close()
pg_conn.close()

print("✅ Migration completed!")
EOF

# Run migration
echo "🚀 Running database migration..."
python migrate_db.py

# Clean up
rm migrate_db.py

echo "✅ Database migration completed successfully!"