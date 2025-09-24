#!/bin/bash
# VKS Web UI - Application Deployment Script

set -e

echo "🚀 Deploying VKS Web UI Application..."

# Variables (update these)
DOMAIN="littlesonagrofoods.com"
APP_DIR="/var/www/vkswebui"

# Navigate to app directory
cd $APP_DIR

# Pull latest changes
echo "📥 Pulling latest changes from Git..."
git pull origin main

# Activate Python virtual environment
echo "🐍 Activating Python environment..."
source venv/bin/activate

# Install/update Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Update database schema (if needed)
echo "🗄️ Updating database..."
# python backend/recreate_database.py  # Uncomment if needed

# Build React frontend
echo "⚛️ Building React frontend..."
cd frontend
npm install
npm run build
cd ..

# Create PM2 ecosystem file
echo "⚙️ Setting up PM2 process management..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'vks-backend',
    script: 'venv/bin/python',
    args: 'backend/app.py',
    cwd: '/var/www/vkswebui',
    instances: 1,
    exec_mode: 'fork',
    env: {
      FLASK_ENV: 'production',
      DATABASE_URL: 'postgresql://vksuser:your_secure_password_here@localhost/vkswebui'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start/restart application with PM2
echo "🔄 Starting/restarting application..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Setup Nginx configuration
echo "🌐 Configuring Nginx..."
sudo cp deployment/nginx-config /etc/nginx/sites-available/vkswebui
sudo sed -i "s/your-domain.com/$DOMAIN/g" /etc/nginx/sites-available/vkswebui
sudo ln -sf /etc/nginx/sites-available/vkswebui /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Setup SSL certificate with Let's Encrypt
echo "🔐 Setting up SSL certificate..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Final restart
echo "🔄 Final service restart..."
sudo systemctl restart nginx
pm2 restart all

echo "✅ Deployment completed successfully!"
echo ""
echo "🌟 Your application should now be live at:"
echo "https://$DOMAIN"
echo ""
echo "🔧 Useful commands:"
echo "pm2 status          - Check application status"
echo "pm2 logs            - View application logs"
echo "pm2 restart all     - Restart application"
echo "sudo nginx -t       - Test Nginx configuration"
echo "sudo systemctl status nginx - Check Nginx status"