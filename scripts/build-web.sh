#!/bin/bash
set -e

echo "🚀 Building SafetyQuest monorepo for Azure..."

# 1. Generate Prisma Client
echo "📦 Generating Prisma Client..."
pnpm --filter @safetyquest/database db:generate

# 2. Build the web app (standalone mode)
echo "🔨 Building Next.js app..."
pnpm --filter @safetyquest/web build

echo "✅ Build complete!"