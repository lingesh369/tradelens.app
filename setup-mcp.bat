@echo off
REM MCP Setup Script for Windows - Supabase Integration
REM This script helps automate the MCP setup process on Windows

echo 🚀 Setting up MCP for Supabase integration...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are available

REM Install Supabase MCP Server globally
echo 📦 Installing Supabase MCP Server...
npm install -g @supabase/mcp-server

if %errorlevel% equ 0 (
    echo ✅ Supabase MCP Server installed successfully
) else (
    echo ❌ Failed to install Supabase MCP Server
    pause
    exit /b 1
)

REM Check if the MCP config file exists
if exist ".mcp-config.json" (
    echo ✅ MCP configuration file found
    echo 📝 Please update the SUPABASE_SERVICE_ROLE_KEY in .mcp-config.json
    echo 🔑 Get your service role key from: https://supabase.com/dashboard/project/tzhhxeyisppkzyjacodu/settings/api
) else (
    echo ❌ MCP configuration file not found
    pause
    exit /b 1
)

echo.
echo 📁 Claude Desktop configuration path:
echo Windows: %%APPDATA%%\Claude\claude_desktop_config.json

echo.
echo 📋 Next steps:
echo 1. Get your Supabase service role key
echo 2. Update .mcp-config.json with your service role key
echo 3. Copy the configuration to Claude Desktop config file
echo 4. Restart Claude Desktop
echo 5. Test the connection by asking Claude about your database

echo.
echo 🎉 MCP setup preparation complete!
echo 📖 See MCP_SETUP_GUIDE.md for detailed instructions

pause