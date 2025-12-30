@echo off
REM TradeLens Edge Functions Deployment Script for Windows

echo 🚀 Deploying TradeLens Edge Functions...

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Supabase CLI not found. Install it with: npm install -g supabase
    exit /b 1
)

echo.
echo 📦 Phase 1: Deploying Payment Functions (Critical)
echo ==================================================

call supabase functions deploy create-cashfree-order
call supabase functions deploy cashfree-webhook
call supabase functions deploy process-cashfree-confirmation
call supabase functions deploy create-paypal-subscription
call supabase functions deploy process-paypal-confirmation
call supabase functions deploy create-nowpayments-invoice
call supabase functions deploy process-nowpayments-confirmation
call supabase functions deploy check-nowpayments-status
call supabase functions deploy process-upi-payment
call supabase functions deploy process-payment-success

echo.
echo 🤖 Phase 2: Deploying AI Functions
echo ===================================

call supabase functions deploy ai-chat
call supabase functions deploy ai-intent-classifier
call supabase functions deploy ai-context-fetcher
call supabase functions deploy analyze-trades-with-gpt

echo.
echo 👥 Phase 3: Deploying Community Functions
echo ==========================================

call supabase functions deploy community-actions
call supabase functions deploy community-feed
call supabase functions deploy community-traders
call supabase functions deploy leaderboard-v2

echo.
echo 🔔 Phase 4: Deploying Notification Functions
echo =============================================

call supabase functions deploy get-vapid-public-key
call supabase functions deploy send-notification
call supabase functions deploy send-web-push

echo.
echo 📸 Phase 5: Deploying Media Functions
echo ======================================

call supabase functions deploy upload-notes-image

echo.
echo ⏰ Phase 6: Deploying Cron Jobs
echo ================================

call supabase functions deploy cron-check-subscriptions
call supabase functions deploy cron-trial-expiry-emails

echo.
echo ✅ Deployment Complete!
echo.
echo Next steps:
echo 1. Configure webhooks in payment provider dashboards
echo 2. Test payment flows end-to-end
echo 3. Monitor function logs: supabase functions logs ^<function-name^>
echo.
echo Function URLs:
echo https://tjbrbmywiucblznkjqyi.supabase.co/functions/v1/{function-name}

pause
