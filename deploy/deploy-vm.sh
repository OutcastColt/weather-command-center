#!/usr/bin/env bash
# Deploy Weather Command Center to the RGVIG dev VM at 192.168.56.10
# Usage: ./deploy/deploy-vm.sh <ssh-user>
# Example: ./deploy/deploy-vm.sh devuser
set -euo pipefail

VM_IP="192.168.56.10"
VM_USER="${1:?Usage: $0 <ssh-user>}"
DEPLOY_DIR="/var/www/weather-command-center"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> Building backend..."
cd "$REPO_ROOT/backend"
npm ci --omit=dev
npm run build

echo "==> Building frontend for production..."
cd "$REPO_ROOT/frontend"
VITE_API_BASE_URL="http://$VM_IP/api" npm run build

echo "==> Deploying to $VM_USER@$VM_IP..."

# Create directory structure on VM
ssh "$VM_USER@$VM_IP" "sudo mkdir -p $DEPLOY_DIR/backend/dist $DEPLOY_DIR/frontend && sudo chown -R \$USER:\$USER $DEPLOY_DIR"

# Copy backend build + dependencies
scp -r "$REPO_ROOT/backend/dist/"     "$VM_USER@$VM_IP:$DEPLOY_DIR/backend/"
scp -r "$REPO_ROOT/backend/node_modules" "$VM_USER@$VM_IP:$DEPLOY_DIR/backend/"
scp    "$REPO_ROOT/backend/package.json" "$VM_USER@$VM_IP:$DEPLOY_DIR/backend/"

# Copy backend .env if it exists locally
if [ -f "$REPO_ROOT/backend/.env" ]; then
  scp "$REPO_ROOT/backend/.env" "$VM_USER@$VM_IP:$DEPLOY_DIR/backend/.env"
else
  echo "WARNING: No backend/.env found — copy .env.example to backend/.env and fill in values before running."
fi

# Copy frontend build
scp -r "$REPO_ROOT/frontend/dist/." "$VM_USER@$VM_IP:$DEPLOY_DIR/frontend/"

# Copy PM2 ecosystem config
scp "$REPO_ROOT/deploy/ecosystem.config.cjs" "$VM_USER@$VM_IP:$DEPLOY_DIR/"

# Install/configure on VM
ssh "$VM_USER@$VM_IP" <<'REMOTE'
set -e

# Install Node.js 20 + PM2 if not present
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
if ! command -v pm2 &>/dev/null; then
  sudo npm install -g pm2
fi
sudo mkdir -p /var/log/pm2

# Start / reload backend via PM2
cd /var/www/weather-command-center
pm2 delete weather-api 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup | tail -1 | sudo bash || true

echo "Backend running."
REMOTE

# Install Nginx config
scp "$REPO_ROOT/deploy/nginx.conf" "$VM_USER@$VM_IP:/tmp/weather-nginx.conf"
ssh "$VM_USER@$VM_IP" "sudo cp /tmp/weather-nginx.conf /etc/nginx/sites-available/weather-command-center && \
  sudo ln -sf /etc/nginx/sites-available/weather-command-center /etc/nginx/sites-enabled/ && \
  sudo rm -f /etc/nginx/sites-enabled/default && \
  sudo nginx -t && sudo systemctl reload nginx"

echo ""
echo "==> Deploy complete!"
echo "    Frontend: http://$VM_IP"
echo "    API:      http://$VM_IP/api/weather/current?city=corpus-christi"
echo "    Health:   http://$VM_IP/health"
