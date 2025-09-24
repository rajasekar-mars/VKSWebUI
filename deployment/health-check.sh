#!/bin/bash
# VKS Web UI - System Health Check and Monitoring Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="vks-backend"
APP_DIR="/var/www/vkswebui"
LOG_FILE="/var/log/vks-health-check.log"

echo -e "${BLUE}🔍 VKS Web UI Health Check - $(date)${NC}"
echo "================================================="

# Function to log messages
log_message() {
    echo "$(date): $1" >> $LOG_FILE
}

# Function to check service status
check_service() {
    local service=$1
    local display_name=$2
    
    if systemctl is-active --quiet $service; then
        echo -e "${GREEN}✅ $display_name is running${NC}"
        log_message "$display_name: OK"
        return 0
    else
        echo -e "${RED}❌ $display_name is NOT running${NC}"
        log_message "$display_name: FAILED"
        return 1
    fi
}

# Function to check PM2 application
check_pm2_app() {
    if pm2 list | grep -q "$APP_NAME.*online"; then
        echo -e "${GREEN}✅ Flask Application is running${NC}"
        log_message "Flask Application: OK"
        return 0
    else
        echo -e "${RED}❌ Flask Application is NOT running${NC}"
        log_message "Flask Application: FAILED"
        return 1
    fi
}

# Function to check database connectivity
check_database() {
    if sudo -u postgres psql -d vkswebui -c "SELECT 1;" &>/dev/null; then
        echo -e "${GREEN}✅ Database is accessible${NC}"
        log_message "Database: OK"
        return 0
    else
        echo -e "${RED}❌ Database connection failed${NC}"
        log_message "Database: FAILED"
        return 1
    fi
}

# Function to check disk space
check_disk_space() {
    local usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ $usage -lt 80 ]; then
        echo -e "${GREEN}✅ Disk usage: ${usage}% (Good)${NC}"
        log_message "Disk usage: ${usage}% - OK"
    elif [ $usage -lt 90 ]; then
        echo -e "${YELLOW}⚠️  Disk usage: ${usage}% (Warning)${NC}"
        log_message "Disk usage: ${usage}% - WARNING"
    else
        echo -e "${RED}❌ Disk usage: ${usage}% (Critical)${NC}"
        log_message "Disk usage: ${usage}% - CRITICAL"
    fi
}

# Function to check memory usage
check_memory() {
    local usage=$(free | awk 'FNR==2{printf "%.0f", $3/$2*100}')
    
    if [ $usage -lt 80 ]; then
        echo -e "${GREEN}✅ Memory usage: ${usage}% (Good)${NC}"
        log_message "Memory usage: ${usage}% - OK"
    elif [ $usage -lt 90 ]; then
        echo -e "${YELLOW}⚠️  Memory usage: ${usage}% (Warning)${NC}"
        log_message "Memory usage: ${usage}% - WARNING"
    else
        echo -e "${RED}❌ Memory usage: ${usage}% (Critical)${NC}"
        log_message "Memory usage: ${usage}% - CRITICAL"
    fi
}

# Function to check website accessibility
check_website() {
    local domain="littlesonagrofoods.com"  # Updated with actual domain
    
    if curl -s -o /dev/null -w "%{http_code}" "https://$domain" | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✅ Website is accessible${NC}"
        log_message "Website accessibility: OK"
        return 0
    else
        echo -e "${RED}❌ Website is NOT accessible${NC}"
        log_message "Website accessibility: FAILED"
        return 1
    fi
}

# Function to check FTP server
check_ftp() {
    if nc -z localhost 21; then
        echo -e "${GREEN}✅ FTP Server is running${NC}"
        log_message "FTP Server: OK"
        return 0
    else
        echo -e "${RED}❌ FTP Server is NOT running${NC}"
        log_message "FTP Server: FAILED"
        return 1
    fi
}

# Function to check SSL certificate expiry
check_ssl() {
    local domain="littlesonagrofoods.com"  # Updated with actual domain
    local expiry_date=$(openssl s_client -servername $domain -connect $domain:443 </dev/null 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
    local expiry_timestamp=$(date -d "$expiry_date" +%s)
    local current_timestamp=$(date +%s)
    local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
    
    if [ $days_until_expiry -gt 30 ]; then
        echo -e "${GREEN}✅ SSL Certificate expires in $days_until_expiry days${NC}"
        log_message "SSL Certificate: OK ($days_until_expiry days remaining)"
    elif [ $days_until_expiry -gt 7 ]; then
        echo -e "${YELLOW}⚠️  SSL Certificate expires in $days_until_expiry days${NC}"
        log_message "SSL Certificate: WARNING ($days_until_expiry days remaining)"
    else
        echo -e "${RED}❌ SSL Certificate expires in $days_until_expiry days${NC}"
        log_message "SSL Certificate: CRITICAL ($days_until_expiry days remaining)"
    fi
}

# Main health checks
echo -e "\n${BLUE}🔧 System Services${NC}"
echo "-------------------"
services_failed=0

check_service "nginx" "Nginx Web Server" || ((services_failed++))
check_service "postgresql" "PostgreSQL Database" || ((services_failed++))
check_service "vsftpd" "FTP Server" || ((services_failed++))
check_pm2_app || ((services_failed++))

echo -e "\n${BLUE}🗄️ Database Connectivity${NC}"
echo "-------------------------"
check_database || ((services_failed++))

echo -e "\n${BLUE}💾 System Resources${NC}"
echo "-------------------"
check_disk_space
check_memory

echo -e "\n${BLUE}🌐 Network Connectivity${NC}"
echo "-----------------------"
check_website || ((services_failed++))
check_ftp || ((services_failed++))

echo -e "\n${BLUE}🔒 SSL Certificate${NC}"
echo "------------------"
check_ssl

# Summary
echo -e "\n${BLUE}📊 Health Check Summary${NC}"
echo "========================"
if [ $services_failed -eq 0 ]; then
    echo -e "${GREEN}🎉 All critical services are running properly!${NC}"
    log_message "Health Check: ALL SYSTEMS OK"
else
    echo -e "${RED}⚠️  $services_failed critical service(s) have issues!${NC}"
    log_message "Health Check: $services_failed SERVICES FAILED"
fi

echo -e "\n${BLUE}📋 Quick Commands${NC}"
echo "------------------"
echo "pm2 status        - Check application status"
echo "pm2 logs          - View application logs"
echo "pm2 restart all   - Restart application"
echo "sudo systemctl status nginx - Check Nginx status"
echo "tail -f $LOG_FILE - View health check history"

exit $services_failed