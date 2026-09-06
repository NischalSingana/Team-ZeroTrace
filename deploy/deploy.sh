#!/bin/bash
set -e

echo "🚀 Deploying Team-ZeroTrace..."

# Check if .env exists
if [ ! -f ../.env ]; then
    echo "❌ Error: .env file not found in the root directory."
    echo "Please copy .env.example to .env and fill in the values."
    exit 1
fi

cd ..

# Pull latest changes (if in a git repository)
if [ -d .git ]; then
    echo "📥 Pulling latest code..."
    git pull
fi

# Build and start the containers
echo "🏗️ Building and starting containers..."
docker compose up -d --build

echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Deployment complete! Check status with ./deploy/status.sh"
