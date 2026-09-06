#!/bin/bash

# Ensure we are in the project root
cd "$(dirname "$0")/.."

echo "📊 Team-ZeroTrace Status"

echo "🐳 Docker Containers:"
docker compose ps
echo ""

echo "📝 Recent Backend Logs (last 10 lines):"
docker compose logs --tail=10 backend
echo ""

echo "📝 Recent Frontend Logs (last 10 lines):"
docker compose logs --tail=10 frontend
echo ""

echo "✅ Health Check (Backend):"
curl -s -f http://localhost:8000/api/health || echo "❌ Backend health check failed"
echo ""

echo "Status check complete."
