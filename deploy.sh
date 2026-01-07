#!/bin/bash

# TimeChat Deployment Script
echo "🚀 Deploying TimeChat Application..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Create uploads directory
mkdir -p backend/uploads

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp backend/.env.example backend/.env
    echo "✏️  Please update backend/.env with your production values before running in production."
fi

# Set production environment
export NODE_ENV=production

echo "✅ Deployment preparation complete!"
echo ""
echo "To start the application:"
echo "  npm run prod"
echo ""
echo "Or for development:"
echo "  npm run dev"
echo ""
echo "Application will be available at: http://localhost:5000"