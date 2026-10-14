#!/usr/bin/env bash
# ==============================================================================
# KODESHARE Master Deployment Script (Deploys BOTH UI & Server)
#
# Server Layout:
#   - UI:     /var/www/kodeshare/ui/dist  (https://kodeshare.in)
#   - Server: /var/www/kodeshare/server   (https://api.kodeshare.in -> localhost:3000)
#
# Usage:
#   ./deploy.sh          # Automatically deploys BOTH UI and Server
#   ./deploy.sh --pull   # Pulls latest Git changes first, then deploys both
# ==============================================================================

set -e

# Color styling
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PULL_FLAG=false

# Check if --pull is passed anywhere in arguments
for arg in "$@"; do
    if [ "$arg" == "--pull" ]; then
        PULL_FLAG=true
    fi
done

echo -e "${BLUE}====================================================================${NC}"
echo -e "${BOLD}${BLUE}       🚀 KODESHARE MASTER DEPLOYMENT (UI + SERVER)                ${NC}"
echo -e "${BLUE}====================================================================${NC}"
echo -e "${GREEN}Root directory:${NC} $ROOT_DIR"

# 1. Pull Git repository updates if requested
if [ "$PULL_FLAG" = true ]; then
    if [ -d "$ROOT_DIR/.git" ]; then
        echo -e "\n${YELLOW}→ [Git] Pulling latest updates from repository...${NC}"
        git -C "$ROOT_DIR" pull origin main || git -C "$ROOT_DIR" pull
        echo -e "${GREEN}✓ [Git] Repository up to date.${NC}"
    else
        echo -e "${YELLOW}! [Git] Not a git root directory, skipping git pull.${NC}"
    fi
fi

# 2. Locate UI Directory (/var/www/kodeshare/ui or ./client)
if [ -d "/var/www/kodeshare/ui" ]; then
    UI_DIR="/var/www/kodeshare/ui"
elif [ -d "$ROOT_DIR/ui" ]; then
    UI_DIR="$ROOT_DIR/ui"
elif [ -d "$ROOT_DIR/client" ]; then
    UI_DIR="$ROOT_DIR/client"
else
    UI_DIR="$ROOT_DIR/client"
fi

# 3. Locate Server Directory (/var/www/kodeshare/server or ./server)
if [ -d "/var/www/kodeshare/server" ]; then
    SERVER_DIR="/var/www/kodeshare/server"
elif [ -d "$ROOT_DIR/server" ]; then
    SERVER_DIR="$ROOT_DIR/server"
else
    SERVER_DIR="$ROOT_DIR/server"
fi

echo -e "${BLUE}Target UI Path:${NC}     $UI_DIR"
echo -e "${BLUE}Target Server Path:${NC} $SERVER_DIR"

# Ensure child deploy scripts are executable
[ -f "$UI_DIR/deploy.sh" ] && chmod +x "$UI_DIR/deploy.sh" || true
[ -f "$SERVER_DIR/deploy.sh" ] && chmod +x "$SERVER_DIR/deploy.sh" || true

# 4. Deploy UI (Frontend)
echo -e "\n${BLUE}====================================================================${NC}"
echo -e "${BOLD}${BLUE} [1/2] DEPLOYING UI (Vite Build -> dist/)${NC}"
echo -e "${BLUE}====================================================================${NC}"

if [ -f "$UI_DIR/deploy.sh" ]; then
    bash "$UI_DIR/deploy.sh"
else
    echo -e "${RED}✗ Error: $UI_DIR/deploy.sh not found!${NC}"
    exit 1
fi

# 5. Deploy Server (Backend & PM2)
echo -e "\n${BLUE}====================================================================${NC}"
echo -e "${BOLD}${BLUE} [2/2] DEPLOYING SERVER (Node/PM2 -> Port 3000)${NC}"
echo -e "${BLUE}====================================================================${NC}"

if [ -f "$SERVER_DIR/deploy.sh" ]; then
    bash "$SERVER_DIR/deploy.sh"
else
    echo -e "${RED}✗ Error: $SERVER_DIR/deploy.sh not found!${NC}"
    exit 1
fi

# 6. Test and Reload Nginx
echo -e "\n${BLUE}====================================================================${NC}"
echo -e "${BOLD}${BLUE} [Nginx] Testing and Reloading Configuration${NC}"
echo -e "${BLUE}====================================================================${NC}"

if command -v nginx &> /dev/null; then
    if [ "$EUID" -eq 0 ]; then
        nginx -t && systemctl reload nginx
        echo -e "${GREEN}✓ Nginx reloaded successfully.${NC}"
    elif sudo -n true 2>/dev/null; then
        sudo nginx -t && sudo systemctl reload nginx
        echo -e "${GREEN}✓ Nginx reloaded successfully via sudo.${NC}"
    else
        echo -e "${YELLOW}! To reload Nginx manually, run: sudo nginx -t && sudo systemctl reload nginx${NC}"
    fi
else
    echo -e "${YELLOW}! Nginx command not found in PATH, skipping reload.${NC}"
fi

# 7. Final Completion Summary
echo -e "\n${GREEN}====================================================================${NC}"
echo -e "${BOLD}${GREEN}  🎉 FULL DEPLOYMENT COMPLETED SUCCESSFULLY!                       ${NC}"
echo -e "${GREEN}====================================================================${NC}"
echo -e "  ${BOLD}Frontend:${NC} https://kodeshare.in      (Root: /var/www/kodeshare/ui/dist)"
echo -e "  ${BOLD}Backend:${NC}  https://api.kodeshare.in  (Port: 3000 via PM2)"
echo -e "${GREEN}====================================================================${NC}\n"
