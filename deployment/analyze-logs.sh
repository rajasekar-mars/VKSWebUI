#!/bin/bash
# VKS Web UI - Log Analysis and Error Detection Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

APP_NAME="vks-backend"
APP_DIR="/var/www/vkswebui"
LINES_TO_CHECK=100

echo -e "${BLUE}📊 VKS Web UI Log Analysis - $(date)${NC}"
echo "============================================="

# Function to analyze PM2 logs
analyze_pm2_logs() {
    echo -e "\n${BLUE}🐍 Flask Application Logs${NC}"
    echo "-------------------------"
    
    if pm2 list | grep -q $APP_NAME; then
        echo -e "${YELLOW}Recent application logs:${NC}"
        pm2 logs $APP_NAME --lines $LINES_TO_CHECK --raw | tail -20
        
        echo -e "\n${YELLOW}Error analysis:${NC}"
        local errors=$(pm2 logs $APP_NAME --lines $LINES_TO_CHECK --raw | grep -i "error\|exception\|traceback\|failed" | wc -l)
        
        if [ $errors -gt 0 ]; then
            echo -e "${RED}❌ Found $errors error(s) in application logs${NC}"
            echo -e "${YELLOW}Recent errors:${NC}"
            pm2 logs $APP_NAME --lines $LINES_TO_CHECK --raw | grep -i "error\|exception\|traceback\|failed" | tail -5
        else
            echo -e "${GREEN}✅ No recent errors found in application logs${NC}"
        fi
    else
        echo -e "${RED}❌ PM2 application not found${NC}"
    fi
}

# Function to analyze Nginx logs
analyze_nginx_logs() {
    echo -e "\n${BLUE}🌐 Nginx Logs${NC}"
    echo "-------------"
    
    if [ -f "/var/log/nginx/vkswebui_error.log" ]; then
        echo -e "${YELLOW}Recent Nginx errors:${NC}"
        local errors=$(tail -$LINES_TO_CHECK /var/log/nginx/vkswebui_error.log | wc -l)
        
        if [ $errors -gt 0 ]; then
            tail -10 /var/log/nginx/vkswebui_error.log
        else
            echo -e "${GREEN}✅ No recent errors in Nginx logs${NC}"
        fi
    fi
    
    if [ -f "/var/log/nginx/vkswebui_access.log" ]; then
        echo -e "\n${YELLOW}Recent access patterns:${NC}"
        echo "Status code summary (last 100 requests):"
        tail -$LINES_TO_CHECK /var/log/nginx/vkswebui_access.log | awk '{print $9}' | sort | uniq -c | sort -rn
        
        echo -e "\n${YELLOW}Most accessed endpoints:${NC}"
        tail -$LINES_TO_CHECK /var/log/nginx/vkswebui_access.log | awk '{print $7}' | sort | uniq -c | sort -rn | head -5
    fi
}

# Function to analyze system logs
analyze_system_logs() {
    echo -e "\n${BLUE}🖥️ System Logs${NC}"
    echo "-------------"
    
    echo -e "${YELLOW}Recent system errors:${NC}"
    local system_errors=$(journalctl --since "1 hour ago" --priority=err --no-pager | wc -l)
    
    if [ $system_errors -gt 0 ]; then
        echo -e "${RED}❌ Found $system_errors system error(s)${NC}"
        journalctl --since "1 hour ago" --priority=err --no-pager | tail -5
    else
        echo -e "${GREEN}✅ No recent system errors${NC}"
    fi
}

# Function to analyze PostgreSQL logs
analyze_postgres_logs() {
    echo -e "\n${BLUE}🗄️ PostgreSQL Logs${NC}"
    echo "------------------"
    
    local pg_log_dir="/var/log/postgresql"
    if [ -d "$pg_log_dir" ]; then
        local latest_log=$(find $pg_log_dir -name "*.log" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
        
        if [ -n "$latest_log" ]; then
            echo -e "${YELLOW}Recent PostgreSQL activity:${NC}"
            local errors=$(tail -$LINES_TO_CHECK "$latest_log" | grep -i "error\|fatal\|panic" | wc -l)
            
            if [ $errors -gt 0 ]; then
                echo -e "${RED}❌ Found $errors database error(s)${NC}"
                tail -$LINES_TO_CHECK "$latest_log" | grep -i "error\|fatal\|panic" | tail -3
            else
                echo -e "${GREEN}✅ No recent database errors${NC}"
            fi
        fi
    else
        echo -e "${YELLOW}ℹ️  PostgreSQL logs not accessible${NC}"
    fi
}

# Function to check for common issues
check_common_issues() {
    echo -e "\n${BLUE}🔍 Common Issue Detection${NC}"
    echo "-------------------------"
    
    # Check for database connection issues
    if pm2 logs $APP_NAME --lines $LINES_TO_CHECK --raw | grep -q "database\|connection\|psycopg2"; then
        echo -e "${YELLOW}⚠️  Potential database connection issues detected${NC}"
    fi
    
    # Check for memory issues
    if pm2 logs $APP_NAME --lines $LINES_TO_CHECK --raw | grep -q "memory\|MemoryError\|out of memory"; then
        echo -e "${YELLOW}⚠️  Potential memory issues detected${NC}"
    fi
    
    # Check for permission issues
    if pm2 logs $APP_NAME --lines $LINES_TO_CHECK --raw | grep -q "permission\|access denied\|forbidden"; then
        echo -e "${YELLOW}⚠️  Potential permission issues detected${NC}"
    fi
    
    # Check for FTP issues
    if journalctl -u vsftpd --since "1 hour ago" | grep -q "error\|failed"; then
        echo -e "${YELLOW}⚠️  Potential FTP server issues detected${NC}"
    fi
    
    echo -e "${GREEN}✅ Common issue detection completed${NC}"
}

# Function to show performance metrics
show_performance_metrics() {
    echo -e "\n${BLUE}📈 Performance Metrics${NC}"
    echo "---------------------"
    
    # CPU usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    echo "CPU Usage: ${cpu_usage}%"
    
    # Memory usage
    local mem_usage=$(free | awk 'FNR==2{printf "%.1f", $3/$2*100}')
    echo "Memory Usage: ${mem_usage}%"
    
    # Disk usage
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}')
    echo "Disk Usage: ${disk_usage}"
    
    # Load average
    local load_avg=$(uptime | awk -F'load average:' '{print $2}')
    echo "Load Average:${load_avg}"
    
    # Application response time (if accessible)
    local domain="your-domain.com"  # Update with your actual domain
    if curl -s -o /dev/null -w "%{time_total}" "https://$domain" > /tmp/response_time 2>/dev/null; then
        local response_time=$(cat /tmp/response_time)
        echo "Website Response Time: ${response_time}s"
        rm -f /tmp/response_time
    fi
}

# Function to provide troubleshooting suggestions
provide_suggestions() {
    echo -e "\n${BLUE}💡 Troubleshooting Suggestions${NC}"
    echo "------------------------------"
    
    echo "If you're experiencing issues, try these commands:"
    echo ""
    echo "🔧 Quick Fixes:"
    echo "  ./deployment/auto-fix.sh           - Run automatic problem resolution"
    echo "  pm2 restart all                   - Restart Flask application"
    echo "  sudo systemctl restart nginx      - Restart web server"
    echo "  sudo systemctl restart postgresql - Restart database"
    echo ""
    echo "📊 Monitoring:"
    echo "  pm2 monit                         - Real-time monitoring"
    echo "  htop                              - System resource monitor"
    echo "  tail -f /var/log/nginx/error.log  - Watch Nginx errors"
    echo ""
    echo "🗄️ Database:"
    echo "  sudo -u postgres psql -d vkswebui - Access database"
    echo "  pg_dump -U vksuser vkswebui > backup.sql - Create backup"
    echo ""
    echo "📁 FTP Server:"
    echo "  sudo systemctl status vsftpd      - Check FTP status"
    echo "  sudo tail -f /var/log/vsftpd.log  - Monitor FTP connections"
}

# Main analysis routine
analyze_pm2_logs
analyze_nginx_logs
analyze_system_logs
analyze_postgres_logs
check_common_issues
show_performance_metrics
provide_suggestions

echo -e "\n${BLUE}📋 Analysis Complete${NC}"
echo "===================="
echo -e "${GREEN}Log analysis finished. Review the output above for any issues.${NC}"
echo -e "For automatic fixes, run: ${YELLOW}./deployment/auto-fix.sh${NC}"