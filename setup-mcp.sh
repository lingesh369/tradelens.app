#!/bin/bash

# MCP Setup Script for Supabase Integration
# This script helps automate the MCP setup process

echo "🚀 Setting up MCP for Supabase integration..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are available"

# Install Supabase MCP Server globally
echo "📦 Installing Supabase MCP Server..."
npm install -g @supabase/mcp-server

if [ $? -eq 0 ]; then
    echo "✅ Supabase MCP Server installed successfully"
else
    echo "❌ Failed to install Supabase MCP Server"
    exit 1
fi

# Check if the MCP config file exists
if [ -f ".mcp-config.json" ]; then
    echo "✅ MCP configuration file found"
    echo "📝 Please update the SUPABASE_SERVICE_ROLE_KEY in .mcp-config.json"
    echo "🔑 Get your service role key from: https://supabase.com/dashboard/project/tzhhxeyisppkzyjacodu/settings/api"
else
    echo "❌ MCP configuration file not found"
    exit 1
fi

# Detect OS and provide Claude Desktop config path
echo ""
echo "📁 Claude Desktop configuration paths:"
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "Windows: %APPDATA%\\Claude\\claude_desktop_config.json"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    echo "macOS: ~/Library/Application Support/Claude/claude_desktop_config.json"
else
    echo "Linux: ~/.config/claude/claude_desktop_config.json"
fi

echo ""
echo "📋 Next steps:"
echo "1. Get your Supabase service role key"
echo "2. Update .mcp-config.json with your service role key"
echo "3. Copy the configuration to Claude Desktop config file"
echo "4. Restart Claude Desktop"
echo "5. Test the connection by asking Claude about your database"

echo ""
echo "🎉 MCP setup preparation complete!"
echo "📖 See MCP_SETUP_GUIDE.md for detailed instructions"