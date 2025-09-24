#!/bin/bash

# Production Deployment Script for VKS Web UI
# Run this on your server: ./deploy-production.sh

set -e

echo "🚀 Starting VKS Web UI Production Deployment..."

# Configuration
DOMAIN="littlesonagrofoods.com"
APP_DIR="/var/www/vkswebui"
NGINX_SITES="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
DB_NAME="vkswebui_db"
DB_USER="vksuser"
DB_PASS="vks_secure_password_2025"

echo "📁 Setting up directory structure..."
cd $APP_DIR

# Create necessary directories
sudo mkdir -p /var/log/vkswebui
sudo mkdir -p /var/www/html
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

echo "🔧 Configuring Flask Backend..."
cd $APP_DIR/backend

# Create production configuration
cat > config.py << EOF
import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'vks-production-secret-key-2025'
    SQLALCHEMY_DATABASE_URI = 'postgresql://$DB_USER:$DB_PASS@localhost/$DB_NAME'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PERMANENT_SESSION_LIFETIME = timedelta(hours=24)
    WTF_CSRF_ENABLED = True
    
class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    
class DevelopmentConfig(Config):
    DEBUG = True
    
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': ProductionConfig
}
EOF

# Update app.py for production
cat > app.py << 'EOF'
from flask import Flask, request, jsonify, session, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
import os
from datetime import datetime, timedelta
from config import config

def create_app(config_name=None):
    app = Flask(__name__)
    
    # Load configuration
    config_name = config_name or os.environ.get('FLASK_ENV', 'production')
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db = SQLAlchemy(app)
    login_manager = LoginManager(app)
    login_manager.login_view = 'login'
    
    # Enable CORS for API endpoints
    CORS(app, origins=['https://littlesonagrofoods.com', 'https://www.littlesonagrofoods.com'])
    
    # Import models and routes
    from models import User, Center, Collection, Sale, Employee, Account
    from routes import *
    
    # Create tables
    with app.app_context():
        db.create_all()
        
        # Create admin user if doesn't exist
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin_user = User(
                username='admin',
                email='admin@littlesonagrofoods.com',
                password_hash=generate_password_hash('admin123'),
                role='admin'
            )
            db.session.add(admin_user)
            db.session.commit()
            print("Admin user created: admin/admin123")
    
    return app, db

app, db = create_app()

@app.route('/')
def index():
    return send_from_directory('/var/www/html', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('/var/www/html', path)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
EOF

echo "📦 Installing Python dependencies..."
source venv/bin/activate
pip install --upgrade pip
pip install -r ../requirements.txt
pip install psycopg2-binary gunicorn

echo "🗄️ Setting up PostgreSQL database..."
sudo -u postgres psql << EOF
-- Create database if it doesn't exist
SELECT 'CREATE DATABASE $DB_NAME' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Create user if it doesn't exist
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '$DB_USER') THEN
      CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
   END IF;
END
\$\$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\q
EOF

echo "🌐 Deploying Frontend..."
cd $APP_DIR/frontend

# Copy built files to web root
sudo cp -r build/* /var/www/html/
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

echo "⚙️ Configuring Nginx..."
# First create HTTP-only configuration
sudo tee $NGINX_SITES/$DOMAIN << 'EOF'
server {
    listen 80;
    server_name littlesonagrofoods.com www.littlesonagrofoods.com;
    
    # Static files (React frontend)
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, no-transform";
        }
    }
    
    # API routes (Flask backend)
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        
        # Increase timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Flask login routes
    location ~ ^/(login|logout|dashboard|centers|collections|sales|employees|accounts) {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
    
    # FTP upload directory
    location /uploads/ {
        alias /home/dairyftp/uploads/;
        autoindex on;
        auth_basic "Restricted Access";
        auth_basic_user_file /etc/nginx/.htpasswd;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/json
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
EOF

# Enable the site
sudo ln -sf $NGINX_SITES/$DOMAIN $NGINX_ENABLED/
sudo rm -f $NGINX_ENABLED/default

echo "📋 Creating PM2 configuration..."
cd $APP_DIR

cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'vks-backend',
    script: './backend/app.py',
    interpreter: './backend/venv/bin/python',
    cwd: '/var/www/vkswebui',
    instances: 1,
    exec_mode: 'fork',
    env: {
      FLASK_ENV: 'production',
      PORT: '5000'
    },
    error_file: '/var/log/vkswebui/backend-error.log',
    out_file: '/var/log/vkswebui/backend-out.log',
    log_file: '/var/log/vkswebui/backend.log',
    time: true,
    watch: false,
    max_memory_restart: '500M',
    restart_delay: 5000
  }]
};
EOF

echo "🚦 Starting services..."

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Start Flask app with PM2
pm2 delete vks-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "🔒 Setting up SSL Certificate..."
# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    sudo snap install --classic certbot
    sudo ln -sf /snap/bin/certbot /usr/bin/certbot
fi

# Get SSL certificate and automatically configure Nginx
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect

echo "🔍 Final system check..."
echo "Checking services..."
sudo systemctl status nginx --no-pager -l
pm2 status

echo "Checking database connection..."
cd $APP_DIR/backend
source venv/bin/activate
python -c "
from config import config
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
app = Flask(__name__)
app.config.from_object(config['production'])
db = SQLAlchemy(app)
with app.app_context():
    db.engine.execute('SELECT 1')
    print('✅ Database connection successful')
"

echo "Testing website accessibility..."
curl -I http://localhost/ || echo "⚠️ Local HTTP test failed"
curl -I https://$DOMAIN/ || echo "⚠️ HTTPS test failed"

echo ""
echo "🎉 Deployment Complete!"
echo ""
echo "🌐 Your website is now available at:"
echo "   https://$DOMAIN"
echo "   https://www.$DOMAIN"
echo ""
echo "🔐 Admin login:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "📁 FTP Server:"
echo "   Host: $DOMAIN"
echo "   User: dairyftp"
echo "   Password: dairy123"
echo "   Directory: /uploads/"
echo ""
echo "📊 Monitor your application:"
echo "   pm2 status"
echo "   pm2 logs vks-backend"
echo "   sudo tail -f /var/log/nginx/access.log"
echo ""
echo "🔧 Useful commands:"
echo "   pm2 restart vks-backend  # Restart Flask app"
echo "   sudo systemctl restart nginx  # Restart web server"
echo "   sudo certbot renew  # Renew SSL certificate"
echo ""