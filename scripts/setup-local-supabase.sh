#!/bin/bash
# =====================================================
# TradeLens Local Supabase Setup Script (Unix/Mac)
# =====================================================

set -e

echo ""
echo "========================================"
echo "TradeLens Local Supabase Setup"
echo "========================================"
echo ""

# Check if Docker is running
echo "[1/5] Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running. Please start Docker and try again."
    exit 1
fi
echo "✓ Docker is running"

# Check if Supabase CLI is installed
echo ""
echo "[2/5] Checking Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo "ERROR: Supabase CLI is not installed."
    echo "Please install it with: npm install -g supabase"
    exit 1
fi
echo "✓ Supabase CLI is installed"

# Stop any existing Supabase instance
echo ""
echo "[3/5] Stopping existing Supabase instance..."
supabase stop > /dev/null 2>&1 || true
echo "✓ Stopped existing instance"

# Start Supabase
echo ""
echo "[4/5] Starting Supabase..."
echo "This may take a few minutes on first run..."
if ! supabase start; then
    echo "ERROR: Failed to start Supabase"
    exit 1
fi
echo "✓ Supabase started successfully"

# Apply migrations and seed data
echo ""
echo "[5/5] Applying migrations and seed data..."
if ! supabase db reset --no-confirm; then
    echo "ERROR: Failed to apply migrations"
    exit 1
fi
echo "✓ Database initialized successfully"

# Display access information
echo ""
echo "========================================"
echo "Setup Complete! 🎉"
echo "========================================"
echo ""
echo "Access your local Supabase:"
echo ""
echo "  Studio (Database UI): http://127.0.0.1:54323"
echo "  API URL:              http://127.0.0.1:54321"
echo "  Email Testing:        http://127.0.0.1:54324"
echo ""
echo "Database Connection:"
echo "  postgresql://postgres:postgres@127.0.0.1:54322/postgres"
echo ""
echo "Next steps:"
echo "  1. Run 'npm run dev' to start your application"
echo "  2. Access your app at http://localhost:5173"
echo "  3. Check LOCAL_SUPABASE_SETUP.md for more info"
echo ""
echo "========================================"
echo ""
