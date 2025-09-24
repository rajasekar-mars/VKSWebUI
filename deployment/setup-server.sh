#!/bin/bash
# VKS Web UI - Complete Server Setup Script
# For Ubuntu 22.04 on $5/month VPS

set -e

echo "🚀 Starting VKS Web UI Server Setup..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
echo "🔧 Installing essential packages..."
sudo apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    nodejs \
    npm \
    nginx \
    postgresql \
    postgresql-contrib \
    vsftpd \
    git \
    ufw \
    certbot \
    python3-certbot-nginx \
    htop \
    curl \
    wget

# Install PM2 for process management
echo "⚙️ Installing PM2..."
sudo npm install -g pm2

# Setup PostgreSQL
echo "🗄️ Setting up PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE vkswebui;
CREATE USER vksuser WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE vkswebui TO vksuser;
ALTER USER vksuser CREATEDB;
\q
EOF

# Setup FTP server
echo "📁 Configuring FTP server..."
sudo systemctl stop vsftpd

# Backup original config
sudo cp /etc/vsftpd.conf /etc/vsftpd.conf.backup

# Create FTP config
sudo tee /etc/vsftpd.conf > /dev/null << EOF
listen=NO
listen_ipv6=YES
anonymous_enable=NO
local_enable=YES
write_enable=YES
local_umask=022
dirmessage_enable=YES
use_localtime=YES
xferlog_enable=YES
connect_from_port_20=YES
chroot_local_user=YES
secure_chroot_dir=/var/run/vsftpd/empty
pam_service_name=vsftpd
rsa_cert_file=/etc/ssl/certs/ssl-cert-snakeoil.pem
rsa_private_key_file=/etc/ssl/private/ssl-cert-snakeoil.key
ssl_enable=NO
pasv_enable=Yes
pasv_min_port=10000
pasv_max_port=10100
allow_writeable_chroot=YES
EOF

# Create FTP user for dairy machines
echo "👤 Creating FTP user for dairy machines..."
sudo adduser --disabled-password --gecos "" dairyftp
echo "dairyftp:dairy_secure_password" | sudo chpasswd
sudo mkdir -p /home/dairyftp/uploads
sudo chown dairyftp:dairyftp /home/dairyftp/uploads
sudo chmod 755 /home/dairyftp/uploads

# Start FTP service
sudo systemctl start vsftpd
sudo systemctl enable vsftpd

# Setup firewall
echo "🔥 Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 21/tcp
sudo ufw allow 10000:10100/tcp
sudo ufw allow 5000/tcp
sudo ufw --force enable

# Create application directory
echo "📂 Setting up application directory..."
sudo mkdir -p /var/www/vkswebui
sudo chown -R $USER:$USER /var/www/vkswebui

# Clone repository (you'll need to run this manually with your repo)
echo "📥 Repository clone (manual step):"
echo "cd /var/www/vkswebui"
echo "git clone https://github.com/rajasekar-mars/VKSWebUI.git ."

# Setup Python virtual environment
echo "🐍 Setting up Python environment..."
cd /var/www/vkswebui
python3 -m venv venv
source venv/bin/activate

echo "✅ Server setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Clone your repository: cd /var/www/vkswebui && git clone https://github.com/rajasekar-mars/VKSWebUI.git ."
echo "2. Install Python packages: source venv/bin/activate && pip install -r requirements.txt"
echo "3. Build React frontend: cd frontend && npm install && npm run build"
echo "4. Configure Nginx with your domain"
echo "5. Setup SSL certificate"
echo ""
echo "🔐 Database connection details:"
echo "Host: localhost"
echo "Database: vkswebui"
echo "Username: vksuser"
echo "Password: your_secure_password_here"
echo ""
echo "📁 FTP access for dairy machines:"
echo "Username: dairyftp"
echo "Password: dairy_secure_password"
echo "Upload directory: /home/dairyftp/uploads"