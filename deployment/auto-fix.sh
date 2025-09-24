#!/bin/bash
# VKS Web UI - Automatic Problem Resolution Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

APP_NAME="vks-backend"
APP_DIR="/var/www/vkswebui"
LOG_FILE="/var/log/vks-auto-fix.log"

echo -e "${BLUE}🔧 VKS Web UI Auto-Fix - $(date)${NC}"
echo "=========================================="

# Function to log messages
log_fix() {
    echo "$(date): $1" >> $LOG_FILE
    echo -e "${YELLOW}🔧 $1${NC}"
}

# Function to restart service with error handling
restart_service() {
    local service=$1
    local display_name=$2
    
    log_fix "Restarting $display_name..."
    if sudo systemctl restart $service; then
        echo -e "${GREEN}✅ $display_name restarted successfully${NC}"
        log_fix "$display_name restart: SUCCESS"
        return 0
    else
        echo -e "${RED}❌ Failed to restart $display_name${NC}"
        log_fix "$display_name restart: FAILED"
        return 1
    fi
}

# Fix Flask Application issues
fix_flask_app() {
    echo -e "\n${BLUE}🐍 Fixing Flask Application${NC}"
    echo "----------------------------"
    
    if ! pm2 list | grep -q "$APP_NAME.*online"; then
        log_fix "Flask app is down, attempting restart..."
        cd $APP_DIR
        pm2 restart $APP_NAME || pm2 start ecosystem.config.js
        sleep 5
        
        if pm2 list | grep -q "$APP_NAME.*online"; then
            echo -e "${GREEN}✅ Flask application restarted successfully${NC}"
            return 0
        else
            echo -e "${RED}❌ Flask application failed to restart${NC}"
            log_fix "Flask restart failed, checking logs..."
            pm2 logs $APP_NAME --lines 20
            return 1
        fi
    else
        echo -e "${GREEN}✅ Flask application is already running${NC}"
    fi
}

# Fix Nginx issues
fix_nginx() {
    echo -e "\n${BLUE}🌐 Fixing Nginx${NC}"
    echo "----------------"
    
    if ! systemctl is-active --quiet nginx; then
        # Test configuration first
        if sudo nginx -t; then
            restart_service "nginx" "Nginx"
        else
            log_fix "Nginx configuration error detected, attempting fix..."
            # Backup current config and restore default
            sudo cp /etc/nginx/sites-available/vkswebui /etc/nginx/sites-available/vkswebui.backup
            sudo systemctl restart nginx
        fi
    else
        echo -e "${GREEN}✅ Nginx is already running${NC}"
    fi
}

# Fix PostgreSQL issues
fix_postgresql() {
    echo -e "\n${BLUE}🗄️ Fixing PostgreSQL${NC}"
    echo "-------------------"
    
    if ! systemctl is-active --quiet postgresql; then
        restart_service "postgresql" "PostgreSQL"
    else
        # Check if database is accessible
        if ! sudo -u postgres psql -d vkswebui -c "SELECT 1;" &>/dev/null; then
            log_fix "Database not accessible, checking connection..."
            restart_service "postgresql" "PostgreSQL"
        else
            echo -e "${GREEN}✅ PostgreSQL is running and accessible${NC}"
        fi
    fi
}

# Fix FTP Server issues
fix_ftp() {
    echo -e "\n${BLUE}📁 Fixing FTP Server${NC}"
    echo "-------------------"
    
    if ! systemctl is-active --quiet vsftpd; then
        restart_service "vsftpd" "FTP Server"
    else
        echo -e "${GREEN}✅ FTP Server is already running${NC}"
    fi
}

# Fix disk space issues
fix_disk_space() {
    echo -e "\n${BLUE}💾 Fixing Disk Space${NC}"
    echo "-------------------"
    
    local usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ $usage -gt 85 ]; then
        log_fix "High disk usage detected ($usage%), cleaning up..."
        
        # Clean system logs
        sudo journalctl --vacuum-time=7d
        
        # Clean package cache
        sudo apt-get autoremove -y
        sudo apt-get autoclean
        
        # Clean old log files
        find /var/log -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
        
        # Clean PM2 logs
        pm2 flush
        
        # Clean old backups (keep last 3)
        find /home/backups -name "*.sql" -type f | sort -r | tail -n +4 | xargs rm -f 2>/dev/null || true
        
        local new_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
        log_fix "Disk usage after cleanup: $new_usage%"
        
        if [ $new_usage -lt $usage ]; then
            echo -e "${GREEN}✅ Disk cleanup successful${NC}"
        else
            echo -e "${YELLOW}⚠️  Disk cleanup had minimal effect${NC}"
        fi
    else
        echo -e "${GREEN}✅ Disk usage is acceptable ($usage%)${NC}"
    fi
}

# Fix memory issues
fix_memory() {
    echo -e "\n${BLUE}🧠 Fixing Memory Issues${NC}"
    echo "----------------------"
    
    local usage=$(free | awk 'FNR==2{printf "%.0f", $3/$2*100}')
    
    if [ $usage -gt 85 ]; then
        log_fix "High memory usage detected ($usage%), attempting fixes..."
        
        # Restart PM2 processes to free memory
        pm2 restart all
        
        # Clear system cache
        sudo sync
        echo 1 | sudo tee /proc/sys/vm/drop_caches > /dev/null
        
        sleep 5
        local new_usage=$(free | awk 'FNR==2{printf "%.0f", $3/$2*100}')
        log_fix "Memory usage after cleanup: $new_usage%"
        
        if [ $new_usage -lt $usage ]; then
            echo -e "${GREEN}✅ Memory cleanup successful${NC}"
        else
            echo -e "${YELLOW}⚠️  Memory usage still high, consider upgrading VPS${NC}"
        fi
    else
        echo -e "${GREEN}✅ Memory usage is acceptable ($usage%)${NC}"
    fi
}

# Fix SSL certificate issues
fix_ssl() {
    echo -e "\n${BLUE}🔒 Checking SSL Certificate${NC}"
    echo "----------------------------"
    
    local domain="littlesonagrofoods.com"  # Updated with actual domain
    
    # Check if certificate exists and is valid
    if ! openssl s_client -servername $domain -connect $domain:443 </dev/null 2>/dev/null | openssl x509 -noout -dates &>/dev/null; then
        log_fix "SSL certificate issue detected, attempting renewal..."
        sudo certbot renew --nginx --non-interactive
        sudo systemctl reload nginx
        echo -e "${GREEN}✅ SSL certificate renewal attempted${NC}"
    else
        # Check expiry
        local expiry_date=$(openssl s_client -servername $domain -connect $domain:443 </dev/null 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
        local expiry_timestamp=$(date -d "$expiry_date" +%s)
        local current_timestamp=$(date +%s)
        local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [ $days_until_expiry -lt 30 ]; then
            log_fix "SSL certificate expires soon ($days_until_expiry days), renewing..."
            sudo certbot renew --nginx --non-interactive
            sudo systemctl reload nginx
        fi
        
        echo -e "${GREEN}✅ SSL certificate is valid${NC}"
    fi
}

# Update application if needed
update_application() {
    echo -e "\n${BLUE}🔄 Checking for Application Updates${NC}"
    echo "-----------------------------------"
    
    cd $APP_DIR
    
    # Check if there are updates available
    git fetch origin
    local local_commit=$(git rev-parse HEAD)
    local remote_commit=$(git rev-parse origin/main)
    
    if [ "$local_commit" != "$remote_commit" ]; then
        log_fix "Updates available, pulling latest changes..."
        git pull origin main
        
        # Reinstall dependencies if requirements.txt changed
        if git diff HEAD~1 HEAD --name-only | grep -q "requirements.txt"; then
            log_fix "Requirements updated, reinstalling dependencies..."
            source venv/bin/activate
            pip install -r requirements.txt
        fi
        
        # Rebuild frontend if package.json changed
        if git diff HEAD~1 HEAD --name-only | grep -q "frontend/package.json"; then
            log_fix "Frontend dependencies updated, rebuilding..."
            cd frontend
            npm install
            npm run build
            cd ..
        fi
        
        # Restart application
        pm2 restart all
        echo -e "${GREEN}✅ Application updated successfully${NC}"
    else
        echo -e "${GREEN}✅ Application is up to date${NC}"
    fi
}

# Main auto-fix routine
echo -e "\n${BLUE}🔧 Running Auto-Fix Procedures${NC}"
echo "==============================="

fix_flask_app
fix_nginx
fix_postgresql
fix_ftp
fix_disk_space
fix_memory
fix_ssl
# update_application  # Uncomment if you want automatic updates

echo -e "\n${BLUE}📊 Auto-Fix Summary${NC}"
echo "===================="
echo -e "${GREEN}🎉 Auto-fix procedures completed!${NC}"
echo -e "Check the log file for details: $LOG_FILE"

echo -e "\n${BLUE}🔍 Running Health Check${NC}"
echo "======================="
./deployment/health-check.sh