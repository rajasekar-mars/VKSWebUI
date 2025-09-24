# 🚨 VKS Web UI - Error Management & Monitoring Guide

## 🛠️ Complete Error Management Toolkit

I've created a comprehensive error management system for your $5/month setup. Here's what you now have:

### 📋 **Available Scripts**

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `health-check.sh` | Complete system health check | Daily monitoring, troubleshooting |
| `auto-fix.sh` | Automatic problem resolution | When issues detected |
| `analyze-logs.sh` | Detailed log analysis | Understanding what went wrong |
| `emergency-recovery.sh` | Nuclear option recovery | When system is completely broken |
| `setup-monitoring.sh` | Install automated monitoring | One-time setup |

---

## 🔍 **Daily Error Management Workflow**

### **1. Quick Health Check (2 minutes)**
```bash
# Run this daily or when you suspect issues
./deployment/health-check.sh
```

**What it checks:**
- ✅ All services running (Nginx, PostgreSQL, Flask, FTP)
- 💾 Disk space and memory usage
- 🌐 Website accessibility
- 🔒 SSL certificate status
- 🗄️ Database connectivity

### **2. Automatic Problem Fixing (5 minutes)**
```bash
# If health check shows issues, run auto-fix
./deployment/auto-fix.sh
```

**What it fixes:**
- 🔄 Restarts crashed services
- 🧹 Cleans up disk space
- 🧠 Frees memory
- 🔒 Renews SSL certificates
- 🗄️ Fixes database connections

### **3. Detailed Log Analysis (when needed)**
```bash
# For deeper investigation
./deployment/analyze-logs.sh
```

**What it shows:**
- 📊 Application error patterns
- 🌐 Web server access/error logs
- 🖥️ System-level issues
- 🗄️ Database problems
- 📈 Performance metrics

---

## 🚨 **Emergency Scenarios & Solutions**

### **Scenario 1: Website is Down**
```bash
# Step 1: Quick diagnosis
./deployment/health-check.sh

# Step 2: Auto-fix attempt
./deployment/auto-fix.sh

# Step 3: If still down, check logs
./deployment/analyze-logs.sh
```

### **Scenario 2: Database Issues**
```bash
# Check database status
sudo systemctl status postgresql

# Restart database
sudo systemctl restart postgresql

# Test connection
sudo -u postgres psql -d vkswebui -c "SELECT 1;"

# If corrupted, run emergency recovery
./deployment/emergency-recovery.sh
```

### **Scenario 3: Application Errors**
```bash
# Check application logs
pm2 logs vks-backend

# Restart application
pm2 restart all

# If persistent, check for code issues
cd /var/www/vkswebui
git pull origin main
pm2 restart all
```

### **Scenario 4: FTP Server Problems**
```bash
# Check FTP status
sudo systemctl status vsftpd

# Test FTP connection
ftp YOUR_SERVER_IP
# Username: dairyftp
# Password: dairy_secure_password

# Restart FTP service
sudo systemctl restart vsftpd
```

### **Scenario 5: Server Completely Broken**
```bash
# Nuclear option - complete recovery
./deployment/emergency-recovery.sh
```
**Warning:** This will restart everything and reset to clean state!

---

## 📊 **Automated Monitoring Setup**

### **One-time Setup:**
```bash
# Install automated monitoring (run once)
./deployment/setup-monitoring.sh
```

**What it sets up:**
- 🔔 **Every 5 minutes**: Automatic service monitoring
- 💾 **Daily 2 AM**: Database backups
- 📈 **Hourly**: Performance monitoring
- 📧 **Daily**: Alert summaries
- 🔍 **Weekly**: Complete health checks

### **Real-time Dashboard:**
```bash
# View system status anytime
/home/monitoring/dashboard.sh
```

---

## 📱 **Common Error Messages & Solutions**

### **"Flask Application Not Running"**
```bash
pm2 status                    # Check status
pm2 logs vks-backend         # Check errors
pm2 restart vks-backend      # Restart app
```

### **"Database Connection Failed"**
```bash
sudo systemctl restart postgresql
# Wait 10 seconds
sudo -u postgres psql -d vkswebui -c "SELECT 1;"
```

### **"Nginx 502 Bad Gateway"**
```bash
pm2 restart all              # Restart backend
sudo systemctl reload nginx  # Reload nginx
```

### **"Disk Usage Critical"**
```bash
# Automatic cleanup
./deployment/auto-fix.sh

# Manual cleanup
sudo journalctl --vacuum-time=3d
sudo apt autoremove -y
pm2 flush
```

### **"SSL Certificate Expired"**
```bash
sudo certbot renew --nginx
sudo systemctl reload nginx
```

---

## 🔧 **Manual Troubleshooting Commands**

### **Service Management:**
```bash
# Check all services
systemctl status nginx postgresql vsftpd
pm2 status

# Restart services
sudo systemctl restart nginx
sudo systemctl restart postgresql
sudo systemctl restart vsftpd
pm2 restart all
```

### **Log Files:**
```bash
# Application logs
pm2 logs vks-backend

# Web server logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# System logs
journalctl -f

# Database logs (if accessible)
sudo tail -f /var/log/postgresql/*.log
```

### **System Resources:**
```bash
# Check resources
htop                    # Interactive process monitor
df -h                   # Disk usage
free -h                 # Memory usage
netstat -tlnp          # Network connections
```

---

## 📞 **When to Contact Support**

Contact your hosting provider if:
- 🔥 Hardware failure suspected
- 🌐 Network connectivity issues
- 💾 Disk corruption
- 🔒 Security breaches
- Emergency recovery script fails

---

## 💡 **Pro Tips for Error Prevention**

### **Daily Habits:**
1. Run `./deployment/health-check.sh` once daily
2. Monitor `/var/log/vks-alerts.log` for issues
3. Check `/home/monitoring/dashboard.sh` weekly

### **Weekly Maintenance:**
1. Review alert summaries
2. Check backup integrity
3. Update system packages: `sudo apt update && sudo apt upgrade`
4. Review performance logs

### **Monthly Tasks:**
1. Review and rotate log files
2. Test emergency recovery procedure
3. Update application dependencies
4. Review security settings

---

## 🎯 **Quick Reference Card**

### **Emergency Commands (memorize these):**
```bash
# System broken? Start here:
./deployment/emergency-recovery.sh

# Website down? Try this:
./deployment/auto-fix.sh

# Need details? Check this:
./deployment/analyze-logs.sh

# Daily health check:
./deployment/health-check.sh

# Real-time status:
/home/monitoring/dashboard.sh
```

### **Service Restart Commands:**
```bash
pm2 restart all                      # Restart Flask app
sudo systemctl restart nginx         # Restart web server  
sudo systemctl restart postgresql    # Restart database
sudo systemctl restart vsftpd        # Restart FTP server
```

---

## 🚀 **Your $5/Month System is Now Bulletproof!**

With this error management system, you can:
- ✅ **Detect** problems automatically
- 🔧 **Fix** most issues automatically  
- 🔍 **Diagnose** complex problems easily
- 🚨 **Recover** from complete failures
- 📊 **Monitor** system health 24/7

**Total time for error resolution: Usually under 5 minutes!**