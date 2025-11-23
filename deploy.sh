#!/bin/bash

# Deployment script for Tradelens Journal
# This script builds the project and pushes to GitHub repository

set -e

echo "🚀 Starting deployment process..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not a git repository. Initializing..."
    git init
    git remote add origin https://github.com/Lee5595/tradelens-journal.git
fi

# Check if origin remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "📡 Adding GitHub remote..."
    git remote add origin https://github.com/Lee5595/tradelens-journal.git
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the project
echo "🔨 Building project..."
npm run build

# Add all changes
echo "📝 Adding changes to git..."
git add .

# Commit changes with timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
git commit -m "Deploy: $TIMESTAMP" || echo "No changes to commit"

# Push to GitHub
echo "⬆️ Pushing to GitHub..."
git push origin main

echo "✅ Deployment completed successfully!"
echo "🌐 Your site will be available at: https://lee5595.github.io/tradelens-journal/"