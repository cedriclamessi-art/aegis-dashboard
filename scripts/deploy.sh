#!/bin/bash
set -e

echo "🚀 AEGIS v5.0 Deployment Script"
echo "================================"

# Build
echo "📦 Building application..."
npm run build

# Check database
echo "🗄️  Initializing database..."
npm run db:init

# Seed agents
echo "🤖 Seeding agents..."
npm run db:seed

# Validate agents
echo "✅ Validating agents..."
npm run agents:validate

# Test connectors
echo "🔌 Testing connectors..."
npm run connectors:test

# Health check
echo "❤️  Health check..."
npm run health-check

echo "✨ Deployment completed successfully!"
echo "🎉 AEGIS v5.0 is ready to deploy"
