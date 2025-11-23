# 🚀 TradeLens Edge Functions - Quick Reference

## 📦 What You Have

**24 Production-Ready Edge Functions** with rate limiting, monitoring, and security.

## ⚡ Quick Deploy (3 Steps)

### 1. Set Secrets (2 min)
```bash
supabase secrets set \
  CASHFREE_APP_ID=xxx \
  CASHFREE_SECRET_KEY=xxx \
  PAYPAL_CLIENT_ID=xxx \
  PAYPAL_CLIENT_SECRET=xxx \
  NOWPAYMENTS_API_KEY=xxx \
  OPENAI_API_KEY=xxx \
  VAPID_PUBLIC_KEY=xxx \
  VAPID_PRIVATE_KEY=xxx \
  CRON_SECRET=xxx \
  FRONTEND_URL=https://your-domain.com
```

### 2. Deploy (5 min)
```bash
supabase db push
supabase\deploy-functions.bat  # Windows
```

### 3. Configure (3 min)
- Cashfree webhook: `/functions/v1/cashfree-webhook`
- NOWPayments IPN: `/functions/v1/nowpayments-webhook`
- Cron jobs in Supabase dashboard
- Create `notes-images` storage bucket

## 📋 Function List

### 💳 Payment (10)
- create-cashfree-order
- cashfree-webhook
- process-cashfree-confirmation
- create-paypal-subscription
- process-paypal-confirmation
- create-nowpayments-invoice
- process-nowpayments-confirmation
- check-nowpayments-status
- process-upi-payment
- process-payment-success

### 🤖 AI (4) - Rate Limited
- ai-chat (50/hour)
- ai-intent-classifier (100/hour)
- ai-context-fetcher
- analyze-trades-with-gpt (20/hour)

### 👥 Community (4)
- community-actions
- community-feed
- community-traders
- leaderboard-v2

### 🔔 Notifications (3)
- get-vapid-public-key
- send-notification
- send-web-push

### 📸 Media (1)
- upload-notes-image

### ⏰ Cron (2)
- cron-check-subscriptions
- cron-trial-expiry-emails

## 🔍 Monitoring

### View Logs
```bash
supabase functions logs <function-name> --follow
```

### Check Performance
```sql
SELECT * FROM function_performance_summary;
```

### Check Errors
```sql
SELECT * FROM error_logs ORDER BY occurred_at DESC LIMIT 20;
```

### Check Rate Limits
```sql
SELECT * FROM user_rate_limit_violations;
```

## 🧪 Test Functions

### Test Payment
```bash
curl -X POST https://tzhhxeyisppkzyjacodu.supabase.co/functions/v1/create-cashfree-order \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planId":"pro","billingCycle":"monthly","amount":999}'
```

### Test AI
```bash
curl -X POST https://tzhhxeyisppkzyjacodu.supabase.co/functions/v1/ai-chat \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Analyze my trades"}'
```

### Test Community
```bash
curl -X POST https://tzhhxeyisppkzyjacodu.supabase.co/functions/v1/community-feed \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sortBy":"recent","limit":20}'
```

## 🔐 Security Features

- ✅ JWT authentication
- ✅ Rate limiting (per user)
- ✅ Webhook signature verification
- ✅ Input validation
- ✅ Cron secret authentication
- ✅ Error logging
- ✅ Abuse prevention

## 📊 Rate Limits

| Function | Limit |
|----------|-------|
| ai-chat | 50/hour |
| ai-analysis | 20/hour |
| ai-intent | 100/hour |
| payment-create | 10/hour |
| community-like | 100/hour |
| community-comment | 50/hour |

## 🐛 Troubleshooting

### Function Not Working
```bash
# Check logs
supabase functions logs <name>

# Redeploy
supabase functions deploy <name>

# Check secrets
supabase secrets list
```

### Rate Limit Hit
```sql
-- Check violations
SELECT * FROM rate_limit_logs 
WHERE user_id = 'USER_ID' 
ORDER BY exceeded_at DESC;
```

### Performance Issues
```sql
-- Find slow functions
SELECT function_name, avg_duration_ms 
FROM function_performance_summary 
WHERE avg_duration_ms > 1000;
```

## 📚 Documentation

- **EDGE_FUNCTIONS_COMPLETE.md** - Full guide
- **EDGE_FUNCTIONS_QUICK_START.md** - Quick start
- **EDGE_FUNCTIONS_DEPLOYMENT.md** - Deployment details
- **IMPLEMENTATION_SUMMARY.md** - What was built
- **This file** - Quick reference

## ✅ Checklist

- [ ] Set all environment variables
- [ ] Run database migrations
- [ ] Deploy all functions
- [ ] Configure webhooks
- [ ] Set up cron jobs
- [ ] Create storage bucket
- [ ] Test payment flow
- [ ] Test AI features
- [ ] Test community features
- [ ] Monitor logs

## 🎯 URLs

Base URL: `https://tzhhxeyisppkzyjacodu.supabase.co/functions/v1/`

All functions: `{base_url}/{function-name}`

## 📞 Need Help?

1. Check function logs
2. Review error logs in database
3. Verify environment variables
4. Test locally: `supabase functions serve`
5. Check documentation files

---

**Everything is ready for production! 🚀**
