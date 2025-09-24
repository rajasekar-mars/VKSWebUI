# 🚀 Little Son Agro Foods - Deployment Guide
**Domain: littlesonagrofoods.com**
**Total Cost: $5.70/month**

## ✅ Completed Steps
- [x] Domain registered at Cloudflare: **littlesonagrofoods.com**
- [ ] VPS server deployment
- [ ] DNS configuration
- [ ] Server setup
- [ ] Application deployment

---

## 🎯 **Next Steps to Complete**

### **Step 1: Deploy VPS Server (5 minutes)**

1. **Go to Vultr.com**
   - Sign up if you haven't already
   - Login to your dashboard

2. **Deploy New Server**:
   - **Product**: Regular Performance
   - **Location**: Choose closest to your users
   - **OS**: Ubuntu 22.04 x64  
   - **Plan**: $5/month (1GB RAM, 25GB SSD)
   - **Hostname**: `littlesonagrofoods-server`
   - **Deploy**

3. **Note Your Server IP**: `_____._____._____._____ ` ← Write it here!

### **Step 2: Configure Cloudflare DNS (2 minutes)**

1. **Login to Cloudflare Dashboard**
2. **Select**: littlesonagrofoods.com
3. **Go to**: DNS > Records
4. **Add A Record**:
   - Name: `@`
   - IPv4 address: `YOUR_VULTR_SERVER_IP`
   - Proxy status: ✅ Proxied (orange cloud)
5. **Add CNAME Record**:
   - Name: `www`  
   - Target: `littlesonagrofoods.com`
   - Proxy status: ✅ Proxied

### **Step 3: Initial Server Connection (2 minutes)**

```bash
# Connect to your server (replace with your actual IP)
ssh root@YOUR_SERVER_IP

# When prompted, type 'yes' to continue
# Set a strong root password when asked
```

### **Step 4: Run Complete Setup (30 minutes)**

Once connected to your server, run these commands:

```bash
# 1. Update system
apt update && apt upgrade -y

# 2. Download setup script
wget https://raw.githubusercontent.com/rajasekar-mars/VKSWebUI/main/deployment/setup-server.sh

# 3. Make it executable
chmod +x setup-server.sh

# 4. Run setup (will take 10-15 minutes)
./setup-server.sh

# 5. Clone your application
cd /var/www/vkswebui
git clone https://github.com/rajasekar-mars/VKSWebUI.git .

# 6. Setup Python environment
source venv/bin/activate
pip install -r requirements.txt

# 7. Build React frontend
cd frontend
npm install
npm run build
cd ..

# 8. Run database migration
chmod +x deployment/migrate-database.sh
./deployment/migrate-database.sh

# 9. Deploy application
chmod +x deployment/deploy.sh
./deployment/deploy.sh

# 10. Setup monitoring
chmod +x deployment/setup-monitoring.sh
./deployment/setup-monitoring.sh
```

### **Step 5: Test Your Application (10 minutes)**

1. **Test Website Access**:
   - Visit: `https://littlesonagrofoods.com`
   - Should show your React application

2. **Test FTP Server**:
   ```bash
   # From your local machine or another computer
   ftp YOUR_SERVER_IP
   # Username: dairyftp
   # Password: dairy_secure_password
   ```

3. **Test System Health**:
   ```bash
   # On your server
   ./deployment/health-check.sh
   ```

---

## 📋 **Your System Configuration**

### **Website URLs:**
- **Main Site**: https://littlesonagrofoods.com
- **WWW**: https://www.littlesonagrofoods.com

### **FTP Access for Dairy Machines:**
- **Server**: YOUR_SERVER_IP
- **Username**: dairyftp
- **Password**: dairy_secure_password
- **Upload Directory**: /uploads

### **Database Connection:**
- **Type**: PostgreSQL
- **Host**: localhost
- **Database**: vkswebui
- **Username**: vksuser
- **Password**: your_secure_password_here

### **Admin Access:**
- **SSH**: `ssh root@YOUR_SERVER_IP`
- **Application Logs**: `pm2 logs vks-backend`
- **System Status**: `./deployment/health-check.sh`

---

## 🔧 **Important Security Updates**

After deployment, update these default passwords:

### **1. Database Password**
```bash
sudo -u postgres psql
ALTER USER vksuser PASSWORD 'YOUR_NEW_SECURE_DATABASE_PASSWORD';
\q
```

### **2. FTP Password**  
```bash
sudo passwd dairyftp
# Enter new secure password for dairy machines
```

### **3. Update Environment File**
```bash
nano deployment/.env.production
# Update database password and other secrets
```

---

## 🚨 **Emergency Commands**

Keep these handy for troubleshooting:

```bash
# Check system health
./deployment/health-check.sh

# Fix common problems automatically  
./deployment/auto-fix.sh

# View detailed logs and analysis
./deployment/analyze-logs.sh

# Nuclear option - complete recovery
./deployment/emergency-recovery.sh

# Real-time monitoring dashboard
/home/monitoring/dashboard.sh
```

---

## 📞 **Support Information**

### **If Something Goes Wrong:**
1. **Run health check**: `./deployment/health-check.sh`
2. **Try auto-fix**: `./deployment/auto-fix.sh` 
3. **Check logs**: `./deployment/analyze-logs.sh`
4. **Emergency recovery**: `./deployment/emergency-recovery.sh`

### **Log Files:**
- Application: `pm2 logs vks-backend`
- System: `/var/log/vks-alerts.log`
- Web Server: `/var/log/nginx/error.log`

---

## 🎉 **Once Deployed Successfully**

Your **Little Son Agro Foods** system will have:

✅ **Professional website** at littlesonagrofoods.com  
✅ **Secure FTP server** for dairy machine uploads  
✅ **PostgreSQL database** for data storage  
✅ **SSL certificate** for secure connections  
✅ **24/7 monitoring** with auto-restart  
✅ **Daily backups** of your data  
✅ **Enterprise-level error management**  

**Total Monthly Cost: $5.70** 🎯

---

## 📱 **Next Steps After Deployment**

1. **Configure your dairy machines** with FTP settings
2. **Test file uploads** from dairy machines
3. **Set up user accounts** in your application
4. **Configure business-specific settings**
5. **Train your team** on using the system

**Your professional dairy management system will be live and ready for business!** 🥛🚀