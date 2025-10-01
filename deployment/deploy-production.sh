#!/bin/bash

# Production Deployment Script for VKS Web UI (feature/WorkingWithoutOTP)
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
PM2_BACKEND_NAME="vks-backend"

echo "📁 Setting up directory structure..."
cd $APP_DIR

sudo mkdir -p /var/log/vkswebui
sudo mkdir -p /var/www/html
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

echo "🔄 Pulling latest code from feature/WorkingWithoutOTP..."
git fetch origin
git checkout feature/WorkingWithoutOTP
git pull origin feature/WorkingWithoutOTP

echo "🔧 Configuring Flask Backend..."
cd $APP_DIR/backend

# (Re)create production config.py if needed (see your template above)

echo "📦 Installing Python dependencies..."
source ../venv/bin/activate
pip install --upgrade pip
pip install -r ../requirements.txt
pip install psycopg2-binary gunicorn

echo "🗄️ Setting up PostgreSQL database..."
sudo -u postgres psql << EOF
SELECT 'CREATE DATABASE $DB_NAME' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '$DB_USER') THEN
      CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
   END IF;
END
\$\$;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\q
EOF

echo "🌐 Deploying Frontend..."
cd $APP_DIR/frontend
if [ -f "package.json" ]; then
  npm install
  npm run build
  sudo cp -r build/* /var/www/html/
else
  # If using HTML/JS fallback, copy your index.html
  sudo cp $APP_DIR/frontend/build/index.html /var/www/html/index.html
fi
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html

echo "⚙️ Configuring Nginx..."
sudo tee $NGINX_SITES/$DOMAIN > /dev/null << 'EOF'
# ... (Paste your Nginx config from above here) ...
EOF

sudo ln -sf $NGINX_SITES/$DOMAIN $NGINX_ENABLED/
sudo rm -f $NGINX_ENABLED/default

echo "📋 Creating PM2 configuration..."
cd $APP_DIR
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$PM2_BACKEND_NAME',
    script: './backend/app.py',
    interpreter: './backend/venv/bin/python',
    cwd: '$APP_DIR',
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
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

pm2 delete $PM2_BACKEND_NAME 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "🔒 Setting up SSL Certificate..."
if ! command -v certbot &> /dev/null; then
    sudo snap install --classic certbot
    sudo ln -sf /snap/bin/certbot /usr/bin/certbot
fi
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect

echo "🔍 Final system check..."
sudo systemctl status nginx --no-pager -l
pm2 status

echo "Checking database connection..."
cd $APP_DIR/backend
source ../venv/bin/activate
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
echo "🌐 Your website is now available at:"
echo "   https://$DOMAIN"
echo "   https://www.$DOMAIN"
echo ""
echo "🔐 Admin login:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "📊 Monitor your application:"
echo "   pm2 status"
echo "   pm2 logs $PM2_BACKEND_NAME"
echo "   sudo tail -f /var/log/nginx/access.log"
echo ""
echo "🔧 Useful commands:"
echo "   pm2 restart $PM2_BACKEND_NAME  # Restart Flask app"
echo "   sudo systemctl restart nginx  # Restart web server"
echo "   sudo certbot renew  # Renew SSL certificate"
echo ""