#!/bin/bash
set -e

echo "📦 Preparing deployment package..."

# Create deployment directory
rm -rf .azure-deploy
mkdir -p .azure-deploy

# Copy standalone build output
echo "Copying Next.js standalone build..."
cp -r apps/web/.next/standalone/* .azure-deploy/

# Copy static files
echo "Copying static assets..."
mkdir -p .azure-deploy/apps/web/.next
cp -r apps/web/.next/static .azure-deploy/apps/web/.next/static

# Copy public folder
echo "Copying public files..."
cp -r apps/web/public .azure-deploy/apps/web/public

# Copy node_modules (already in standalone)
# Copy package.json for Azure to detect Node.js
cp apps/web/package.json .azure-deploy/package.json

# Create startup script
cat > .azure-deploy/server.js << 'EOF'
process.chdir(__dirname);
require('./apps/web/server.js');
EOF

echo "✅ Deployment package ready in .azure-deploy/"