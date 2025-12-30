#!/bin/bash

# TradeLens Edge Functions Deployment Script

echo "🚀 Deploying TradeLens Edge Functions..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it with: npm install -g supabase"
    exit 1
fi

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Run: supabase login"
    exit 1
fi

echo ""
echo "📦 Phase 1: Deploying Payment Functions (Critical)"
echo "=================================================="

supabase functions deploy create-cashfree-order
supabase functions deploy cashfree-webhook
supabase functions deploy process-cashfree-confirmation
supabase functions deploy create-paypal-subscription
supabase functions deploy process-paypal-confirmation
supabase functions deploy create-nowpayments-invoice
supabase functions deploy process-nowpayments-confirmation
supabase functions deploy check-nowpayments-status
supabase functions deploy process-upi-payment
supabase functions deploy process-payment-success

echo ""
echo "🤖 Phase 2: Deploying AI Functions"
echo "==================================="

supabase functions deploy ai-chat
supabase functions deploy ai-intent-classifier
supabase functions deploy ai-context-fetcher
supabase functions deploy analyze-trades-with-gpt

echo ""
echo "👥 Phase 3: Deploying Community Functions"
echo "=========================================="

supabase functions deploy community-actions
supabase functions deploy community-feed
supabase functions deploy community-traders
supabase functions deploy leaderboard-v2

echo ""
echo "🔔 Phase 4: Deploying Notification Functions"
echo "============================================="

supabase functions deploy get-vapid-public-key
supabase functions deploy send-notification
supabase functions deploy send-web-push

echo ""
echo "📸 Phase 5: Deploying Media Functions"
echo "======================================"

supabase functions deploy upload-notes-image

echo ""
echo "⏰ Phase 6: Deploying Cron Jobs"
echo "================================"

supabase functions deploy cron-check-subscriptions
supabase functions deploy cron-trial-expiry-emails

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "Next steps:"
echo "1. Configure webhooks in payment provider dashboards"
echo "2. Test payment flows end-to-end"
echo "3. Monitor function logs: supabase functions logs <function-name>"
echo ""
echo "Function URLs:"
echo "https://tjbrbmywiucblznkjqyi.supabase.co/functions/v1/{function-name}"
