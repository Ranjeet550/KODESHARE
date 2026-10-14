#!/usr/bin/env bash
# ==============================================================================
# KODESHARE UI Deployment Script
# Target Server Path: /var/www/kodeshare/ui
# Output: /var/www/kodeshare/ui/dist
# ==============================================================================

set -e

# Color definitions
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}  Starting KODESHARE UI Deployment                  ${NC}"
echo -e "${BLUE}====================================================${NC}"

# Navigate to script directory (where client/ui code lives)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
echo -e "${GREEN}✓ Working directory:${NC} $SCRIPT_DIR"

# 1. Pull latest code if git repository and --pull flag is passed
if [[ "$*" == *"--pull"* ]] && [ -d ".git" ]; then
    echo -e "${YELLOW}→ Pulling latest changes from git...${NC}"
    git pull origin main || git pull
    echo -e "${GREEN}✓ Git pull completed.${NC}"
fi

# 2. Verify environment configuration
if [ -f ".env.production" ]; then
    echo -e "${GREEN}✓ Found .env.production file.${NC}"
    # Ensure .env matches .env.production if .env doesn't exist
    if [ ! -f ".env" ]; then
        cp .env.production .env
        echo -e "${GREEN}✓ Copied .env.production to .env${NC}"
    fi
elif [ -f ".env" ]; then
    echo -e "${YELLOW}! Using existing .env file.${NC}"
else
    echo -e "${RED}✗ Error: Neither .env.production nor .env found in $SCRIPT_DIR${NC}"
    echo -e "${YELLOW}Please create .env.production before deploying.${NC}"
    exit 1
fi

# 3. Check for Node & npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ Error: npm is not installed. Please install Node.js (v18+ recommended).${NC}"
    exit 1
fi

echo -e "${BLUE}Node version:${NC} $(node -v)"
echo -e "${BLUE}npm version:${NC}  $(npm -v)"

# 4. Install dependencies
echo -e "${YELLOW}→ Installing UI dependencies...${NC}"
if [ -f "package-lock.json" ]; then
    npm ci --prefer-offline --no-audit || npm install
else
    npm install
fi
echo -e "${GREEN}✓ Dependencies installed.${NC}"

# 5. Build production bundle
echo -e "${YELLOW}→ Building Vite production bundle...${NC}"
npm run build

# 6. Verify build output
if [ -f "dist/index.html" ]; then
    echo -e "${GREEN}✓ Build succeeded! 'dist/index.html' is present.${NC}"
else
    echo -e "${RED}✗ Error: dist/index.html was not found after build.${NC}"
    exit 1
fi

# 7. Set file permissions for Nginx (www-data)
echo -e "${YELLOW}→ Setting directory permissions...${NC}"
chmod -R 755 dist/
if id -u www-data &>/dev/null; then
    # Try setting ownership if root/sudo
    if [ "$EUID" -eq 0 ]; then
        chown -R www-data:www-data dist/
        echo -e "${GREEN}✓ Owned by www-data:www-data${NC}"
    fi
fi

# 8. Reload Nginx if requested or accessible
if [[ "$*" == *"--reload-nginx"* ]]; then
    echo -e "${YELLOW}→ Reloading Nginx...${NC}"
    if command -v nginx &> /dev/null; then
        sudo nginx -t && sudo systemctl reload nginx
        echo -e "${GREEN}✓ Nginx reloaded successfully.${NC}"
    fi
fi

echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}  KODESHARE UI Deployment Finished Successfully!   ${NC}"
echo -e "${GREEN}  Static files ready at: $SCRIPT_DIR/dist           ${NC}"
echo -e "${GREEN}====================================================${NC}"
