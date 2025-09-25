#!/bin/bash

echo "🏗️  Testing static build for GitHub Pages..."

# Navigate to frontend directory
cd frontend

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next out

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build static site
echo "🔨 Building static site..."
NODE_ENV=production npm run build:static

# Check if build was successful
if [ -d "out" ]; then
    echo "✅ Static build successful!"
    echo "📁 Output directory: frontend/out"
    echo "📊 Build size:"
    du -sh out
    echo ""
    echo "🌐 You can test locally by running:"
    echo "   cd frontend/out && python -m http.server 8000"
    echo "   Then visit: http://localhost:8000"
else
    echo "❌ Static build failed!"
    exit 1
fi