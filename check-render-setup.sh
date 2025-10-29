#!/bin/bash

# Render.com Quick Setup Script
# This script helps verify your setup is ready for Render deployment

echo "🌿 Vilva Greenhouse - Render Deployment Checker"
echo "=============================================="
echo ""

# Check if git is initialized
if [ -d .git ]; then
    echo "✅ Git repository initialized"
else
    echo "❌ Git not initialized. Run: git init"
    exit 1
fi

# Check if package.json exists
if [ -f package.json ]; then
    echo "✅ Root package.json found"
else
    echo "❌ package.json not found"
    exit 1
fi

# Check if client package.json exists
if [ -f client/package.json ]; then
    echo "✅ Client package.json found"
else
    echo "❌ client/package.json not found"
    exit 1
fi

# Check for render.yaml
if [ -f render.yaml ]; then
    echo "✅ render.yaml configuration found"
else
    echo "⚠️  render.yaml not found (optional)"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Commit your changes: git add . && git commit -m 'Prepare for Render'"
echo "2. Push to GitHub: git push origin main"
echo "3. Go to https://render.com and sign up"
echo "4. Follow the RENDER-DEPLOYMENT.md guide"
echo ""
echo "🚀 Ready for deployment!"
