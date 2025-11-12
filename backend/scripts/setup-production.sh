#!/bin/bash

# Production setup script for Rideshare Village Backend
# Run this script on your VPS to set up the production environment

set -e

echo "🚀 Setting up Rideshare Village Backend for production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Update system
echo -e "${YELLOW}Updating system packages...${NC}"
apt update && apt upgrade -y

# Install Node.js 20.x
echo -e "${YELLOW}Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
echo -e "${GREEN}Node.js version: $(node -v)${NC}"

# Install PostgreSQL with PostGIS
echo -e "${YELLOW}Installing PostgreSQL with PostGIS...${NC}"
if ! command -v psql &> /dev/null; then
    apt install -y postgresql postgresql-contrib postgis
    systemctl enable postgresql
    systemctl start postgresql
fi
echo -e "${GREEN}PostgreSQL installed${NC}"

# Install Nginx
echo -e "${YELLOW}Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
fi
echo -e "${GREEN}Nginx installed${NC}"

# Install PM2
echo -e "${YELLOW}Installing PM2...${NC}"
npm install -g pm2
echo -e "${GREEN}PM2 installed${NC}"

# Install Certbot for SSL
echo -e "${YELLOW}Installing Certbot...${NC}"
apt install -y certbot python3-certbot-nginx
echo -e "${GREEN}Certbot installed${NC}"

# Configure firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5432/tcp
echo -e "${GREEN}Firewall configured${NC}"

# Create application user
echo -e "${YELLOW}Creating application user...${NC}"
if ! id -u rideshare &> /dev/null; then
    adduser --disabled-password --gecos "" rideshare
    usermod -aG sudo rideshare
fi
echo -e "${GREEN}User 'rideshare' created${NC}"

# Create application directory
echo -e "${YELLOW}Creating application directory...${NC}"
mkdir -p /var/www/rideshare-backend
chown -R rideshare:rideshare /var/www/rideshare-backend
echo -e "${GREEN}Application directory created${NC}"

# Setup PostgreSQL database
echo -e "${YELLOW}Setting up PostgreSQL database...${NC}"
sudo -u postgres psql << EOF
-- Create database and user if they don't exist
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'rideshare') THEN
        CREATE DATABASE rideshare;
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'rideshare') THEN
        CREATE USER rideshare WITH ENCRYPTED PASSWORD 'changeme';
    END IF;
END
\$\$;

GRANT ALL PRIVILEGES ON DATABASE rideshare TO rideshare;
\c rideshare
CREATE EXTENSION IF NOT EXISTS postgis;
EOF
echo -e "${GREEN}Database setup complete${NC}"

# Create logs directory
mkdir -p /var/www/rideshare-backend/logs
chown -R rideshare:rideshare /var/www/rideshare-backend/logs

# Install PM2 logrotate
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

echo -e "${GREEN}✅ Production environment setup complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update database password in PostgreSQL"
echo "2. Clone your repository to /var/www/rideshare-backend"
echo "3. Create .env file with production settings"
echo "4. Run 'npm ci --production' to install dependencies"
echo "5. Run 'npm run build' to build the application"
echo "6. Run 'npm run migrate' to run database migrations"
echo "7. Copy nginx.conf to /etc/nginx/sites-available/rideshare"
echo "8. Create symlink: ln -s /etc/nginx/sites-available/rideshare /etc/nginx/sites-enabled/"
echo "9. Test nginx config: nginx -t"
echo "10. Restart nginx: systemctl restart nginx"
echo "11. Start application with PM2: pm2 start ecosystem.config.js"
echo "12. Save PM2 config: pm2 save"
echo "13. Setup PM2 startup: pm2 startup"
echo "14. Get SSL certificate: certbot --nginx -d api.rideshare.example.com"
echo ""
echo -e "${YELLOW}Don't forget to:${NC}"
echo "- Update database password"
echo "- Configure DNS records"
echo "- Set up monitoring"
echo "- Configure backups"
