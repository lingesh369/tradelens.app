# Edge Functions Analysis & Implementation Plan

## Frontend Usage Analysis

### Active Functions (Found in Frontend Code)

#### Payment Processing (High Priority)
1. **process-nowpayments-confirmation** - Crypto payment confirmation
2. **process-paypal-confirmation** - PayPal payment confirmation  
3. **process-cashfree-confirmation** - Cashfree payment confirmation
4. **create-paypal-subscription** - Create PayPal orders
5. **create-nowpayments-invoice** - Create crypto invoices
6. **create-cashfree-order** - Create Cashfree orders
7. **process-upi-payment** - UPI payment processing
8. **process-payment-success** - Generic payment success handler
9. **check-nowpayments-status** - Check crypto payment status

#### AI Features (High Priority)
10. **ai-chat** - Main AI chat interface
11. **ai-intent-classifier** - Classify user intent
12. **ai-context-fetcher** - Fetch context for AI
13. **analyze-trades-with-gpt** - Trade analysis

#### Community Features (Medium Priority)
14. **community-actions** - Community interactions (like, comment, share)
15. **community-feed** - Get community feed
16. **community-traders** - Get traders list
17. **leaderboard-v2** - Leaderboard data

#### Notifications (Medium Priority)
18. **send-notification** - Send notifications
19. **send-web-push** - Web push notifications
20. **get-vapid-public-key** - Get VAPID key for push

#### Image Upload (Medium Priority)
21. **upload-notes-image** - Upload images for notes

### Existing Functions (In Current Project)
- check-trial-expiration
- create-payment
- handle-payment-webhook
- process-email-queue
- send-trial-reminders

### Old DB Functions (Not Found in Frontend - Low Priority)
- Role management (assign-user-role, get-user-roles, remove-user-role)
- Daily video rooms (create-daily-room)
- User settings (get-user-settings, save-user-settings)
- Voice features (text-to-speech, voice-to-text)
- PhonePe payment (phonepe-*)
- Brevo campaigns (create-brevo-campaign, manage-brevo-campaigns, etc.)
- Debug functions (debug-*, test-*)
- Profile functions (trader-profile, profile-analytics-v2, etc.)
- Journey emails (send-journey-email, update-journey-state)
- Auth webhook (auth-webhook)
- Gennie chat (gennie-chat, update-gennie-api-key)

## Implementation Priority

### Phase 1: Critical Payment Functions (Immediate)
These are essential for revenue:
1. create-cashfree-order
2. cashfree-webhook
3. process-cashfree-confirmation
4. create-paypal-subscription
5. process-paypal-confirmation
6. create-nowpayments-invoice
7. process-nowpayments-confirmation
8. check-nowpayments-status
9. process-upi-payment
10. process-payment-success

### Phase 2: AI Features (High Value)
Core product differentiator:
1. ai-chat
2. ai-intent-classifier
3. ai-context-fetcher
4. analyze-trades-with-gpt

### Phase 3: Community & Engagement (User Retention)
1. community-actions
2. community-feed
3. community-traders
4. leaderboard-v2

### Phase 4: Notifications & Media (Enhancement)
1. send-notification
2. send-web-push
3. get-vapid-public-key
4. upload-notes-image

### Phase 5: Webhooks & Cron Jobs (Background)
1. cashfree-webhook
2. paypal-webhook (if needed)
3. nowpayments-webhook (if needed)
4. cron-check-subscriptions
5. cron-trial-expiry-emails

## Industry Standard Structure

```
supabase/functions/
├── _shared/           # Shared utilities
│   ├── cors.ts
│   ├── auth.ts
│   ├── database.ts
│   ├── payment-providers/
│   │   ├── cashfree.ts
│   │   ├── paypal.ts
│   │   └── nowpayments.ts
│   ├── ai/
│   │   ├── openai.ts
│   │   └── context.ts
│   └── notifications/
│       └── push.ts
├── payments/
│   ├── create-cashfree-order/
│   ├── cashfree-webhook/
│   ├── process-cashfree-confirmation/
│   ├── create-paypal-subscription/
│   ├── process-paypal-confirmation/
│   ├── create-nowpayments-invoice/
│   ├── process-nowpayments-confirmation/
│   ├── check-nowpayments-status/
│   ├── process-upi-payment/
│   └── process-payment-success/
├── ai/
│   ├── ai-chat/
│   ├── ai-intent-classifier/
│   ├── ai-context-fetcher/
│   └── analyze-trades-with-gpt/
├── community/
│   ├── community-actions/
│   ├── community-feed/
│   ├── community-traders/
│   └── leaderboard-v2/
├── notifications/
│   ├── send-notification/
│   ├── send-web-push/
│   └── get-vapid-public-key/
├── media/
│   └── upload-notes-image/
└── cron/
    ├── check-trial-expiration/
    ├── cron-check-subscriptions/
    └── cron-trial-expiry-emails/
```

## Next Steps

1. Create shared utilities in `_shared/` folder
2. Implement Phase 1 payment functions
3. Set up webhook handlers with proper security
4. Implement AI functions with rate limiting
5. Add community features
6. Set up notification system
7. Configure cron jobs in Supabase dashboard
