#!/bin/bash
# FutureMint Frontend Deploy Script
# Usage: bash deploy.sh
# Runs: build → copy static/public → pm2 restart

set -e

echo "🔨 Building frontend..."
NODE_OPTIONS="--max-old-space-size=4096" npm run build

echo "📁 Copying static files..."
cp -r .next/static .next/standalone/.next/static

echo "📁 Copying public folder..."
cp -r public .next/standalone/public

echo "🔄 Restarting PM2..."
pm2 restart nft-frontend || pm2 start node --name "nft-frontend" -- .next/standalone/server.js

echo "✅ Deploy complete!"
pm2 logs nft-frontend --lines 5 --nostream
