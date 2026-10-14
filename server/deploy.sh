#!/usr/bin/env bash
# ==============================================================================
# KODESHARE Server Deployment Script
# Target Server Path: /var/www/kodeshare/server
# Listening Port: 3000 (proxied by Nginx)
# ==============================================================================

set -e

# Color definitions
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}  Starting KODESHARE Server Deployment              ${NC}"
echo -e "${BLUE}====================================================${NC}"

# Navigate to script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
echo -e "${GREEN}✓ Working directory:${NC} $SCRIPT_DIR"

# 1. Pull latest code if git repo and --pull flag is passed
if [[ "$*" == *"--pull"* ]] && [ -d ".git" ]; then
    echo -e "${YELLOW}→ Pulling latest changes from git...${NC}"
    git pull origin main || git pull
    echo -e "${GREEN}✓ Git pull completed.${NC}"
fi

# 2. Check production environment file
if [ -f ".env.production" ]; then
    echo -e "${GREEN}✓ Found .env.production file.${NC}"
    if [ ! -f ".env" ]; then
        cp .env.production .env
        echo -e "${GREEN}✓ Synced .env.production to .env${NC}"
    fi
elif [ -f ".env" ]; then
    echo -e "${YELLOW}! Using existing .env file.${NC}"
else
    echo -e "${RED}✗ Error: .env.production or .env not found in $SCRIPT_DIR${NC}"
    exit 1
fi

# 3. Check Node.js and npm
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Error: Node.js is not installed.${NC}"
    exit 1
fi

echo -e "${BLUE}Node version:${NC} $(node -v)"
echo -e "${BLUE}npm version:${NC}  $(npm -v)"

# 4. Install production dependencies
echo -e "${YELLOW}→ Installing production dependencies...${NC}"
if [ -f "package-lock.json" ]; then
    npm ci --omit=dev --no-audit || npm install --omit=dev
else
    npm install --omit=dev
fi
echo -e "${GREEN}✓ Dependencies installed.${NC}"

# 5. Ensure logs directory exists
mkdir -p logs

# 6. PM2 Process Management
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}→ Managing process with PM2...${NC}"
    
    if pm2 describe kodeshare-server > /dev/null 2>&1; then
        echo -e "${YELLOW}→ Reloading existing kodeshare-server process...${NC}"
        pm2 reload ecosystem.config.js --env production --update-env
    else
        echo -e "${YELLOW}→ Starting new kodeshare-server process...${NC}"
        pm2 start ecosystem.config.js --env production
    fi
    
    pm2 save
    echo -e "${GREEN}✓ PM2 process active and saved.${NC}"
    pm2 status kodeshare-server
else
    echo -e "${RED}! PM2 is not installed globally.${NC}"
    echo -e "${YELLOW}To install PM2: sudo npm install -g pm2${NC}"
    echo -e "${YELLOW}Starting with standard node in background...${NC}"
    pkill -f "node.*index.js" || true
    NODE_ENV=production PORT=3000 nohup node index.js > ./logs/out.log 2> ./logs/err.log &
    echo -e "${GREEN}✓ Started node process with PID $!${NC}"
fi

# 7. Health check on port 3000
echo -e "${YELLOW}→ Waiting for server to initialize...${NC}"
sleep 2

if command -v curl &> /dev/null; then
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ || true)
    echo -e "${GREEN}✓ Server responded with HTTP status: ${STATUS}${NC}"
fi

echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}  KODESHARE Server Deployment Finished!             ${NC}"
echo -e "${GREEN}  Listening on: http://localhost:3000               ${NC}"
echo -e "${GREEN}====================================================${NC}"
