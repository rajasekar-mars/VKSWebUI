#!/bin/bash
# VKS Web UI - Monitoring and Alert Setup Script

set -e

echo "🔔 Setting up monitoring and alerts for VKS Web UI..."

# Create monitoring scripts directory
mkdir -p /home/monitoring
chmod 755 /home/monitoring

# Create system monitoring script
cat > /home/monitoring/system-monitor.sh << 'EOF'
#!/bin/bash
# System monitoring script - runs every 5 minutes

APP_NAME="vks-backend"
ALERT_EMAIL="admin@your-domain.com"  # Update this
DOMAIN="your-domain.com"             # Update this

# Check critical services
check_service() {
    local service=$1
    if ! systemctl is-active --quiet $service; then
        echo "ALERT: $service is DOWN at $(date)" >> /var/log/vks-alerts.log
        # Attempt auto-restart
        systemctl restart $service
        sleep 10
        if systemctl is-active --quiet $service; then
            echo "RECOVERY: $service restarted successfully at $(date)" >> /var/log/vks-alerts.log
        fi
    fi
}

# Check PM2 application
if ! pm2 list | grep -q "$APP_NAME.*online"; then
    echo "ALERT: Flask application is DOWN at $(date)" >> /var/log/vks-alerts.log
    pm2 restart $APP_NAME
fi

# Check services
check_service nginx
check_service postgresql
check_service vsftpd

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 90 ]; then
    echo "ALERT: Disk usage is ${DISK_USAGE}% at $(date)" >> /var/log/vks-alerts.log
fi

# Check memory usage
MEM_USAGE=$(free | awk 'FNR==2{printf "%.0f", $3/$2*100}')
if [ $MEM_USAGE -gt 90 ]; then
    echo "ALERT: Memory usage is ${MEM_USAGE}% at $(date)" >> /var/log/vks-alerts.log
fi

# Check website accessibility
if ! curl -s -f "https://$DOMAIN" > /dev/null; then
    echo "ALERT: Website is not accessible at $(date)" >> /var/log/vks-alerts.log
fi
EOF

chmod +x /home/monitoring/system-monitor.sh

# Create log rotation for alerts
cat > /etc/logrotate.d/vks-alerts << 'EOF'
/var/log/vks-alerts.log {
    weekly
    rotate 4
    compress
    missingok
    notifempty
    create 644 root root
}
EOF

# Create daily backup script
cat > /home/monitoring/daily-backup.sh << 'EOF'
#!/bin/bash
# Daily backup script

BACKUP_DIR="/home/backups"
DATE=$(date +%Y%m%d)

mkdir -p $BACKUP_DIR

# Database backup
pg_dump -U vksuser -h localhost vkswebui > "$BACKUP_DIR/vkswebui_${DATE}.sql"

# Compress old backups
find $BACKUP_DIR -name "*.sql" -mtime +1 -exec gzip {} \;

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

# Log backup status
if [ $? -eq 0 ]; then
    echo "SUCCESS: Daily backup completed at $(date)" >> /var/log/vks-backup.log
else
    echo "ERROR: Daily backup failed at $(date)" >> /var/log/vks-backup.log
fi
EOF

chmod +x /home/monitoring/daily-backup.sh

# Setup crontab for monitoring
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/monitoring/system-monitor.sh") | crontab -
(crontab -l 2>/dev/null; echo "0 2 * * * /home/monitoring/daily-backup.sh") | crontab -
(crontab -l 2>/dev/null; echo "0 3 * * 0 /var/www/vkswebui/deployment/health-check.sh >> /var/log/weekly-health.log") | crontab -

# Create performance monitoring script
cat > /home/monitoring/performance-check.sh << 'EOF'
#!/bin/bash
# Performance monitoring - runs every hour

LOG_FILE="/var/log/vks-performance.log"

# Get current metrics
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
MEM_USAGE=$(free | awk 'FNR==2{printf "%.1f", $3/$2*100}')
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}')
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')

# Website response time
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "https://your-domain.com" 2>/dev/null || echo "N/A")

# Log performance data
echo "$(date),${CPU_USAGE},${MEM_USAGE},${DISK_USAGE},${LOAD_AVG},${RESPONSE_TIME}" >> $LOG_FILE

# Alert if performance is poor
if (( $(echo "$LOAD_AVG > 2.0" | bc -l) )); then
    echo "ALERT: High load average $LOAD_AVG at $(date)" >> /var/log/vks-alerts.log
fi

if (( $(echo "$RESPONSE_TIME > 5.0" | bc -l) )); then
    echo "ALERT: Slow response time ${RESPONSE_TIME}s at $(date)" >> /var/log/vks-alerts.log
fi
EOF

chmod +x /home/monitoring/performance-check.sh

# Add hourly performance monitoring
(crontab -l 2>/dev/null; echo "0 * * * * /home/monitoring/performance-check.sh") | crontab -

# Create alert summary script
cat > /home/monitoring/alert-summary.sh << 'EOF'
#!/bin/bash
# Generate daily alert summary

ALERT_FILE="/var/log/vks-alerts.log"
SUMMARY_FILE="/var/log/daily-alert-summary.log"

if [ -f "$ALERT_FILE" ]; then
    TODAY=$(date +%Y-%m-%d)
    ALERTS_TODAY=$(grep "$TODAY" "$ALERT_FILE" | wc -l)
    
    echo "=== Daily Alert Summary for $TODAY ===" >> $SUMMARY_FILE
    echo "Total alerts: $ALERTS_TODAY" >> $SUMMARY_FILE
    
    if [ $ALERTS_TODAY -gt 0 ]; then
        echo "Alert details:" >> $SUMMARY_FILE
        grep "$TODAY" "$ALERT_FILE" >> $SUMMARY_FILE
    else
        echo "No alerts today - system running smoothly!" >> $SUMMARY_FILE
    fi
    
    echo "" >> $SUMMARY_FILE
fi
EOF

chmod +x /home/monitoring/alert-summary.sh

# Add daily alert summary
(crontab -l 2>/dev/null; echo "59 23 * * * /home/monitoring/alert-summary.sh") | crontab -

# Create monitoring dashboard script
cat > /home/monitoring/dashboard.sh << 'EOF'
#!/bin/bash
# Simple monitoring dashboard

clear
echo "========================================"
echo "    VKS Web UI Monitoring Dashboard"
echo "========================================"
echo "Last updated: $(date)"
echo ""

# Service status
echo "🔧 Service Status:"
echo "----------------"
systemctl is-active nginx && echo "✅ Nginx: Running" || echo "❌ Nginx: Stopped"
systemctl is-active postgresql && echo "✅ PostgreSQL: Running" || echo "❌ PostgreSQL: Stopped"
systemctl is-active vsftpd && echo "✅ FTP Server: Running" || echo "❌ FTP Server: Stopped"
pm2 list | grep -q "vks-backend.*online" && echo "✅ Flask App: Running" || echo "❌ Flask App: Stopped"

echo ""

# System resources
echo "💻 System Resources:"
echo "------------------"
echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')"
echo "Memory Usage: $(free | awk 'FNR==2{printf "%.1f%%", $3/$2*100}')"
echo "Disk Usage: $(df -h / | awk 'NR==2 {print $5}')"
echo "Load Average: $(uptime | awk -F'load average:' '{print $2}')"

echo ""

# Recent alerts
echo "🚨 Recent Alerts (last 24 hours):"
echo "--------------------------------"
if [ -f "/var/log/vks-alerts.log" ]; then
    RECENT_ALERTS=$(find /var/log/vks-alerts.log -mtime -1 -exec wc -l {} \; 2>/dev/null | awk '{print $1}')
    if [ "$RECENT_ALERTS" -gt 0 ]; then
        tail -5 /var/log/vks-alerts.log
    else
        echo "✅ No recent alerts"
    fi
else
    echo "✅ No alerts file found"
fi

echo ""

# Website status
echo "🌐 Website Status:"
echo "----------------"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://your-domain.com" 2>/dev/null || echo "000")
if [ "$RESPONSE" = "200" ]; then
    echo "✅ Website is accessible (HTTP $RESPONSE)"
else
    echo "❌ Website issue (HTTP $RESPONSE)"
fi

echo ""
echo "========================================"
echo "Commands: health-check.sh | auto-fix.sh | analyze-logs.sh"
echo "========================================"
EOF

chmod +x /home/monitoring/dashboard.sh

echo "✅ Monitoring setup completed!"
echo ""
echo "📊 Available monitoring tools:"
echo "  /home/monitoring/dashboard.sh     - Real-time dashboard"
echo "  /home/monitoring/system-monitor.sh - Manual system check"
echo "  /home/monitoring/daily-backup.sh   - Manual backup"
echo ""
echo "📝 Log files:"
echo "  /var/log/vks-alerts.log          - System alerts"
echo "  /var/log/vks-performance.log     - Performance metrics"
echo "  /var/log/daily-alert-summary.log - Daily summaries"
echo ""
echo "⏰ Automated schedules:"
echo "  Every 5 minutes: System monitoring"
echo "  Every hour: Performance check"
echo "  Daily 2 AM: Database backup"
echo "  Daily 11:59 PM: Alert summary"
echo "  Weekly Sunday 3 AM: Health check"