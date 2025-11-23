# 🚀 TradeLens Edge Functions - Deployment Card

## ✅ Pre-Deployment Checklist

### 1. Environment Variables
```bash
supabase secrets set \
  CASHFREE_APP_ID=your_app_id \
  CASHFREE_SECRET_KEY=your_secret_key \
  CASHFREE_ENV=sandbox \
  PAYPAL_CLIENT_ID=your_client_id \
  PAYPAL_CLIENT_SECRET=your_client_secret \
  PAYPAL_ENV=sandbox \
  NOWPAYMENTS_API_KEY=your_api_key \
  OPENAI_API_KEY=your_openai_key \
  VAPID_PUBLIC_KEY=your_vapid_public \
  VAPID_PRIVATE_KEY=your_vapid_private \
  VAPID_SUBJECT=mailto:support@tradelens.app \
  CRON_SECRET=your_secure_random_string \
  FRONTEND_URL=https://your-domain.com
```

### 2. Database Migrations
```bash
supabase db push
```

### 3. Deploy Functions
```bash
# Windows
supabase\deploy-functions.bat

# Linux/Mac
bash supabase/deploy-functions.sh
```

---

## 🔧 Post-Deployment Configuration

### 4. Configure Webhooks

**Cashfree Dashboard:**
- URL: `https://tzhhxeyisppkzyjacodu.supabase.co/functions/v1/cashfree-webhook`
- Events: ORDER_PAID, ORDER_FAILED

**NOWPayments Dashboard:**
- IPN URL: `https://tzhhxeyisppkzyjacodu.supabase.co/functions/v1/nowpayments-webhook`

### 5. Set Up Cron Jobs

**In Supabase Dashboard → Edge Functions → Cron Jobs:**

**Subscription Checks:**
- Function: `cron-check-subscriptions`
- Schedule: `0 */6 * * *` (every 6 hours)
- Authorization: `Bearer YOUR_CRON_SECRET`

**Trial Expiry Emails:**
- Function: `cron-trial-expiry-emails`
- Schedule: `0 9 * * *` (daily at 9 AM)
- Authorization: `Bearer YOUR_CRON_SECRET`

### 6. Create Storage Bucket

**In Supabase Dashboard → Storage:**
- Bucket name: `notes-images`
- Public: Yes
- File size limit: 5MB
- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

---

## 🧪 Testing

### Test Payment Function
```bash
curl -X POST https://tzhhxeyisppkzyjacodu.supabase.co/functions/v1/create-cashfree-order \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planId":"pro","billingCycle":"monthly","amount":999}'
```

### Test AI Function
```bash
curl -X POST https://tzhhxeyisppkzyjacodu.supabase.co/functions/v1/ai-chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Analyze my recent trades"}'
```

### Test Community Function
```bash
curl -X POST https://tzhhxeyisppkzyjacodu.supabase.co/functions/v1/community-feed \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sortBy":"recent","limit":20,"offset":0}'
```

---

## 📊 Monitoring

### View Function Logs
```bash
supabase functions logs <function-name> --follow
```

### Check Performance
```sql
SELECT * FROM function_performance_summary;
```

### Check Errors
```sql
SELECT * FROM error_logs 
ORDER BY occurred_at DESC 
LIMIT 20;
```

### Check Rate Limits
```sql
SELECT * FROM user_rate_limit_violations;
```

---

## ✅ Deployment Verification

- [ ] All 24 functions deployed successfully
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] Webhooks configured
- [ ] Cron jobs scheduled
- [ ] Storage bucket created
- [ ] Payment flow tested
- [ ] AI features tested
- [ ] Community features tested
- [ ] Notifications tested
- [ ] Monitoring working
- [ ] Error logging working

---

## 📋 Function Inventory

### Payment (10)
- [x] create-cashfree-order
- [x] cashfree-webhook
- [x] process-cashfree-confirmation
- [x] create-paypal-subscription
- [x] process-paypal-confirmation
- [x] create-nowpayments-invoice
- [x] process-nowpayments-confirmation
- [x] check-nowpayments-status
- [x] process-upi-payment
- [x] process-payment-success

### AI (4)
- [x] ai-chat
- [x] ai-intent-classifier
- [x] ai-context-fetcher
- [x] analyze-trades-with-gpt

### Community (4)
- [x] community-actions
- [x] community-feed
- [x] community-traders
- [x] leaderboard-v2

### Notifications (3)
- [x] get-vapid-public-key
- [x] send-notification
- [x] send-web-push

### Media (1)
- [x] upload-notes-image

### Cron (2)
- [x] cron-check-subscriptions
- [x] cron-trial-expiry-emails

---

## 🐛 Troubleshooting

### Function Not Working
```bash
# Check logs
supabase functions logs <function-name>

# Redeploy
supabase functions deploy <function-name>

# Verify secrets
supabase secrets list
```

### Webhook Not Receiving
- Verify webhook URL is correct
- Check webhook is enabled in provider dashboard
- Review function logs for errors
- Test webhook manually

### Rate Limit Issues
```sql
-- Check user violations
SELECT * FROM rate_limit_logs 
WHERE user_id = 'USER_ID' 
ORDER BY exceeded_at DESC;
```

---

## 📚 Documentation

- **FINAL_SUMMARY.md** - Complete overview
- **QUICK_REFERENCE.md** - Quick commands
- **EDGE_FUNCTIONS_COMPLETE.md** - Full guide
- **EDGE_FUNCTIONS_DEPLOYMENT.md** - Detailed deployment
- **This file** - Deployment card

---

## 🎯 Success Criteria

✅ All functions deployed
✅ All tests passing
✅ Webhooks receiving events
✅ Cron jobs running
✅ Monitoring active
✅ No errors in logs
✅ Rate limiting working
✅ Performance acceptable

---

## 📞 Support

If you encounter issues:
1. Check function logs
2. Review error logs in database
3. Verify environment variables
4. Test locally first
5. Check documentation

---

**🚀 Ready to deploy! Good luck!**

Estimated deployment time: **10 minutes**
