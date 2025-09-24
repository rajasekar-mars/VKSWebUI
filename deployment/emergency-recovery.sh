#!/bin/bash
# VKS Web UI - Emergency Recovery Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

APP_NAME="vks-backend"
APP_DIR="/var/www/vkswebui"
BACKUP_DIR="/home/backups"

echo -e "${RED}🚨 VKS Web UI Emergency Recovery - $(date)${NC}"
echo "================================================"
echo -e "${YELLOW}⚠️  This script will attempt to recover a broken system${NC}"
echo -e "${YELLOW}⚠️  All services will be restarted${NC}"
echo ""
read -p "Continue with emergency recovery? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

# Function to log recovery steps
log_recovery() {
    echo "$(date): RECOVERY - $1" >> /var/log/vks-recovery.log
    echo -e "${BLUE}🔧 $1${NC}"
}

# Stop all services
emergency_stop_all() {
    log_recovery "Stopping all services..."
    
    pm2 stop all 2>/dev/null || true
    sudo systemctl stop nginx 2>/dev/null || true
    sudo systemctl stop vsftpd 2>/dev/null || true
    
    sleep 5
    log_recovery "All services stopped"
}

# Backup current state
backup_current_state() {
    log_recovery "Creating emergency backup..."
    
    mkdir -p $BACKUP_DIR/emergency_$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/emergency_$(date +%Y%m%d_%H%M%S)"
    
    # Backup database
    pg_dump -U vksuser -h localhost vkswebui > "$backup_path/database_emergency.sql" 2>/dev/null || true
    
    # Backup application files
    cp -r $APP_DIR "$backup_path/app_files" 2>/dev/null || true
    
    # Backup configurations
    cp -r /etc/nginx/sites-available/vkswebui "$backup_path/nginx_config" 2>/dev/null || true
    
    log_recovery "Emergency backup created at $backup_path"
}

# Reset to known good state
reset_to_good_state() {
    log_recovery "Resetting application to last known good state..."
    
    cd $APP_DIR
    
    # Reset git to last stable commit (you might want to tag releases)
    git fetch origin
    git reset --hard origin/main
    
    # Reinstall Python dependencies
    source venv/bin/activate
    pip install --upgrade -r requirements.txt
    
    # Rebuild frontend
    cd frontend
    npm install --force
    npm run build
    cd ..
    
    log_recovery "Application reset to clean state"
}

# Recreate database if corrupted
emergency_database_reset() {
    log_recovery "Attempting database recovery..."
    
    # Try to connect first
    if sudo -u postgres psql -d vkswebui -c "SELECT 1;" &>/dev/null; then
        log_recovery "Database is accessible, no reset needed"
        return 0
    fi
    
    log_recovery "Database not accessible, attempting recovery..."
    
    # Restart PostgreSQL
    sudo systemctl restart postgresql
    sleep 10
    
    # Try connection again
    if sudo -u postgres psql -d vkswebui -c "SELECT 1;" &>/dev/null; then
        log_recovery "Database recovered after PostgreSQL restart"
        return 0
    fi
    
    # Last resort: recreate database
    log_recovery "Recreating database from scratch..."
    
    sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS vkswebui;
CREATE DATABASE vkswebui;
GRANT ALL PRIVILEGES ON DATABASE vkswebui TO vksuser;
EOF
    
    # Run database creation script
    cd $APP_DIR
    source venv/bin/activate
    python backend/recreate_database.py
    
    log_recovery "Database recreated"
}

# Reset all configurations
reset_configurations() {
    log_recovery "Resetting all configurations..."
    
    # Reset Nginx configuration
    sudo cp $APP_DIR/deployment/nginx-config /etc/nginx/sites-available/vkswebui
    sudo ln -sf /etc/nginx/sites-available/vkswebui /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test Nginx configuration
    if sudo nginx -t; then
        log_recovery "Nginx configuration restored"
    else
        log_recovery "Nginx configuration failed, using minimal config"
        # Create minimal working config
        sudo tee /etc/nginx/sites-available/vkswebui > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        root /var/www/vkswebui/frontend/build;
        try_files $uri /index.html;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
    }
}
EOF
    fi
    
    # Reset FTP configuration
    sudo cp /etc/vsftpd.conf.backup /etc/vsftpd.conf 2>/dev/null || true
    
    log_recovery "Configurations reset"
}

# Start services in order
emergency_start_all() {
    log_recovery "Starting services in recovery mode..."
    
    # Start PostgreSQL first
    sudo systemctl start postgresql
    sleep 5
    
    # Start PM2 application
    cd $APP_DIR
    pm2 start ecosystem.config.js
    sleep 10
    
    # Start Nginx
    sudo systemctl start nginx
    
    # Start FTP
    sudo systemctl start vsftpd
    
    sleep 5
    log_recovery "All services started"
}

# Verify recovery
verify_recovery() {
    log_recovery "Verifying recovery..."
    
    local issues=0
    
    # Check services
    if ! systemctl is-active --quiet nginx; then
        echo -e "${RED}❌ Nginx failed to start${NC}"
        ((issues++))
    fi
    
    if ! systemctl is-active --quiet postgresql; then
        echo -e "${RED}❌ PostgreSQL failed to start${NC}"
        ((issues++))
    fi
    
    if ! pm2 list | grep -q "$APP_NAME.*online"; then
        echo -e "${RED}❌ Flask application failed to start${NC}"
        ((issues++))
    fi
    
    if [ $issues -eq 0 ]; then
        echo -e "${GREEN}✅ Recovery successful! All services are running${NC}"
        log_recovery "Recovery completed successfully"
        return 0
    else
        echo -e "${RED}❌ Recovery partially failed ($issues issues)${NC}"
        log_recovery "Recovery completed with $issues issues"
        return 1
    fi
}

# Main recovery sequence
echo -e "\n${BLUE}🛠️ Starting Emergency Recovery Sequence${NC}"
echo "========================================="

emergency_stop_all
backup_current_state
reset_to_good_state
emergency_database_reset
reset_configurations
emergency_start_all

echo -e "\n${BLUE}🔍 Verifying Recovery${NC}"
echo "====================="
verify_recovery

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}🎉 Emergency Recovery Completed Successfully!${NC}"
    echo "=============================================="
    echo -e "Your application should now be accessible."
    echo -e "Run ${YELLOW}./deployment/health-check.sh${NC} to verify all systems."
else
    echo -e "\n${YELLOW}⚠️  Recovery Completed with Issues${NC}"
    echo "====================================="
    echo -e "Some services may still have problems."
    echo -e "Check logs with: ${YELLOW}./deployment/analyze-logs.sh${NC}"
    echo -e "Or contact support with the recovery log: /var/log/vks-recovery.log"
fi

echo -e "\n${BLUE}📋 Recovery Summary${NC}"
echo "==================="
echo "Recovery log: /var/log/vks-recovery.log"
echo "Emergency backup: $BACKUP_DIR/emergency_*"
echo "Next steps: Run health-check.sh and monitor system"