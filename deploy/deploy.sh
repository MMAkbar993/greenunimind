#!/usr/bin/env bash
# GreenUniMind deploy script — safe to run; only touches this app
set -euo pipefail

APP_DIR="/var/www/greenunimind"
PM2_NAME="greenunimind-api"

echo "==> Pulling latest code..."
cd "$APP_DIR"
git pull origin main

echo "==> Installing & building frontend..."
cd "$APP_DIR/frontend"
npm ci
npm run build

echo "==> Installing backend dependencies..."
cd "$APP_DIR/backend"
npm ci --omit=dev

echo "==> Restarting backend (PM2: $PM2_NAME)..."
pm2 restart "$PM2_NAME" || pm2 start "$APP_DIR/deploy/ecosystem.config.cjs"
pm2 save

echo "==> Testing nginx config..."
nginx -t

echo "==> Reloading nginx..."
systemctl reload nginx

echo "==> Deploy complete."
curl -sf http://127.0.0.1:5001/api/health && echo "" || echo "Warning: health check failed"
