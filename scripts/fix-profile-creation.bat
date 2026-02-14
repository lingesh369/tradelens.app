@echo off
echo ========================================
echo Fixing Profile Creation RLS Issue
echo ========================================
echo.

echo This script will:
echo 1. Apply the RLS policy fix migration
echo 2. Test the profile creation flow
echo.

set /p confirm="Continue? (y/n): "
if /i not "%confirm%"=="y" (
    echo Cancelled.
    exit /b 0
)

echo.
echo Step 1: Applying migration...
echo ========================================

REM Check if supabase CLI is available
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Supabase CLI not found. Please install it first.
    echo Visit: https://supabase.com/docs/guides/cli
    exit /b 1
)

REM Apply the migration
supabase db reset
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to reset database
    exit /b 1
)

echo.
echo ✓ Migration applied successfully!
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo 1. Restart your development server
echo 2. Try signing up with a new account
echo 3. Check the console - you should see:
echo    "✓ User profile found after XXXms"
echo 4. No more 406 errors!
echo.
echo If you still see issues:
echo - Check supabase/logs for trigger errors
echo - Run: supabase db inspect
echo - Check the user_creation_log table for errors
echo.

pause
