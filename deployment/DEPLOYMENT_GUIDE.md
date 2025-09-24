# VKS Web UI - Ultra-Budget Deployment Guide
**Total Cost: $5.70/month ($68.40/year)**

## Prerequisites
- Vultr account (or Linode)
- Cloudflare account
- Domain name registered with Cloudflare

## Step 1: VPS Setup (5 minutes)

### 1.1 Create VPS
1. Sign up at [Vultr.com](https://vultr.com)
2. Deploy new server:
   - **Choose Instance**: Regular Performance
   - **Server Location**: Choose closest to your users
   - **Server Type**: Ubuntu 22.04 x64
   - **Server Size**: $5/month (1GB RAM, 1 vCPU, 25GB SSD)
   - **Additional Features**: None needed
3. Wait for deployment (2-3 minutes)
4. Note down server IP address

### 1.2 Initial Connection
```bash
# Connect to your server
ssh root@YOUR_SERVER_IP

# Update root password when prompted
```

## Step 2: Domain Setup (10 minutes)

### 2.1 Register Domain with Cloudflare
1. Go to [Cloudflare.com](https://cloudflare.com)
2. Register domain ($8.57/year)
3. Domain will automatically use Cloudflare DNS

### 2.2 Configure DNS
1. In Cloudflare dashboard, go to DNS settings
2. Add A record:
   - **Name**: `@` (root domain)
   - **IPv4 address**: YOUR_SERVER_IP
   - **Proxy status**: Proxied (orange cloud)
3. Add CNAME record:
   - **Name**: `www`
   - **Target**: `your-domain.com`
   - **Proxy status**: Proxied

## Step 3: Server Setup (15 minutes)

### 3.1 Run Setup Script
```bash
# Download and run setup script
wget https://raw.githubusercontent.com/YOUR_USERNAME/VKSWebUI/main/deployment/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh
```

### 3.2 Clone Your Repository
```bash
cd /var/www/vkswebui
git clone https://github.com/rajasekar-mars/VKSWebUI.git .
```

### 3.3 Install Application Dependencies
```bash
# Python dependencies
source venv/bin/activate
pip install -r requirements.txt

# Frontend dependencies
cd frontend
npm install
npm run build
cd ..
```

## Step 4: Database Migration (10 minutes)

### 4.1 Migrate from SQLite to PostgreSQL
```bash
# Update migration script with your table structure
nano deployment/migrate-database.sh

# Run migration
chmod +x deployment/migrate-database.sh
./deployment/migrate-database.sh
```

### 4.2 Update Flask Configuration
Update your Flask app to use PostgreSQL:
```python
# In your app.py or config
DATABASE_URL = 'postgresql://vksuser:your_secure_password_here@localhost/vkswebui'
```

## Step 5: Deploy Application (10 minutes)

### 5.1 Update Deployment Script
```bash
# Edit domain name in deployment script
nano deployment/deploy.sh
# Change 'your-domain.com' to your actual domain

# Make executable and run
chmod +x deployment/deploy.sh
./deployment/deploy.sh
```

## Step 6: FTP Setup for Dairy Machines (5 minutes)

### 6.1 Configure FTP Access
The setup script already configured FTP. Test it:
```bash
# Test FTP connection
ftp YOUR_SERVER_IP
# Username: dairyftp
# Password: dairy_secure_password
```

### 6.2 Update Dairy Machine Settings
Configure your dairy machines to upload to:
- **FTP Server**: YOUR_SERVER_IP
- **Username**: dairyftp
- **Password**: dairy_secure_password
- **Directory**: /uploads

## Step 7: SSL Certificate (5 minutes)

SSL is automatically configured in the deployment script via Let's Encrypt.

## Step 8: Testing (10 minutes)

### 8.1 Test Website
- Visit `https://your-domain.com`
- Test login functionality
- Check all menu sections

### 8.2 Test FTP Upload
```bash
# Upload test file via FTP
echo "test" > test.txt
ftp YOUR_SERVER_IP
# Upload test.txt to /uploads directory
```

### 8.3 Monitor Services
```bash
# Check application status
pm2 status

# Check logs
pm2 logs

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check PostgreSQL
sudo systemctl status postgresql
```

## Maintenance Commands

### Daily Operations
```bash
# Check application status
pm2 status

# View logs
pm2 logs vks-backend

# Restart application
pm2 restart vks-backend

# Update application
cd /var/www/vkswebui
git pull
./deployment/deploy.sh
```

### Weekly Maintenance
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Backup database
pg_dump -U vksuser -h localhost vkswebui > backup_$(date +%Y%m%d).sql

# Check disk usage
df -h

# Check memory usage
free -h
```

## Security Considerations

### 5.1 Change Default Passwords
```bash
# Change database password
sudo -u postgres psql
ALTER USER vksuser PASSWORD 'new_secure_password';

# Change FTP password
sudo passwd dairyftp

# Update environment files with new passwords
```

### 5.2 Regular Updates
```bash
# Set up automatic security updates
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Backup Strategy

### 5.1 Database Backups
```bash
# Create backup script
cat > /home/backup.sh << 'EOF'
#!/bin/bash
pg_dump -U vksuser -h localhost vkswebui > /home/backups/vkswebui_$(date +%Y%m%d_%H%M%S).sql
# Keep only last 7 days
find /home/backups -name "*.sql" -mtime +7 -delete
EOF

chmod +x /home/backup.sh

# Add to crontab for daily backups
echo "0 2 * * * /home/backup.sh" | crontab -
```

## Troubleshooting

### Common Issues
1. **Application not starting**: Check `pm2 logs`
2. **Database connection error**: Verify PostgreSQL service is running
3. **FTP not working**: Check firewall settings and vsftpd status
4. **SSL certificate issues**: Run `sudo certbot renew`

### Support Commands
```bash
# Check all services
systemctl status nginx postgresql vsftpd

# Check ports
netstat -tlnp | grep -E '(80|443|21|5000|5432)'

# Check logs
tail -f /var/log/nginx/error.log
pm2 logs
```

## Cost Breakdown
- **VPS**: $5/month
- **Domain**: $8.57/year ($0.71/month)
- **Total**: $5.71/month or $68.52/year

## Scaling Options
When you outgrow this setup:
1. Upgrade VPS to $10/month (2GB RAM)
2. Add separate database server
3. Migrate to AWS/Google Cloud
4. Add load balancer for multiple servers

---

**🎉 Congratulations! Your VKS Web UI is now live for under $6/month!**