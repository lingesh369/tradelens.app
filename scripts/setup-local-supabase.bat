@echo off
REM =====================================================
REM TradeLens Local Supabase Setup Script (Windows)
REM =====================================================

echo.
echo ========================================
echo TradeLens Local Supabase Setup
echo ========================================
echo.

REM Check if Docker is running
echo [1/5] Checking Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)
echo ✓ Docker is running

REM Check if Supabase CLI is installed
echo.
echo [2/5] Checking Supabase CLI...
supabase --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Supabase CLI is not installed.
    echo Please install it with: npm install -g supabase
    pause
    exit /b 1
)
echo ✓ Supabase CLI is installed

REM Stop any existing Supabase instance
echo.
echo [3/5] Stopping existing Supabase instance...
supabase stop >nul 2>&1
echo ✓ Stopped existing instance

REM Start Supabase
echo.
echo [4/5] Starting Supabase...
echo This may take a few minutes on first run...
supabase start
if errorlevel 1 (
    echo ERROR: Failed to start Supabase
    pause
    exit /b 1
)
echo ✓ Supabase started successfully

REM Apply migrations and seed data
echo.
echo [5/5] Applying migrations and seed data...
supabase db reset --no-confirm
if errorlevel 1 (
    echo ERROR: Failed to apply migrations
    pause
    exit /b 1
)
echo ✓ Database initialized successfully

REM Display access information
echo.
echo ========================================
echo Setup Complete! 🎉
echo ========================================
echo.
echo Access your local Supabase:
echo.
echo   Studio (Database UI): http://127.0.0.1:54323
echo   API URL:              http://127.0.0.1:54321
echo   Email Testing:        http://127.0.0.1:54324
echo.
echo Database Connection:
echo   postgresql://postgres:postgres@127.0.0.1:54322/postgres
echo.
echo Next steps:
echo   1. Run 'npm run dev' to start your application
echo   2. Access your app at http://localhost:5173
echo   3. Check LOCAL_SUPABASE_SETUP.md for more info
echo.
echo ========================================
echo.

pause
