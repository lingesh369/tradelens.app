# Edge Functions Comparison: Old DB vs New DB

## Summary
Comparing edge functions from old database with current implementation.

## ✅ Functions Present in Both (Core Functions)

### Payment Processing
- ✅ `create-paypal-subscription` 
- ✅ `verify-paypal-payment`
- ✅ `create-nowpayments-invoice`
- ✅ `nowpayments-webhook` (was: nowpayments-webhook)
- ✅ `paypal-webhook`
- ✅ `process-payment-success`
- ✅ `check-nowpayments-status`
- ✅ `capture-paypal-order`
- ✅ `create-paypal-order`
- ✅ `process-upi-payment`
- ✅ `process-nowpayments-confirmation`
- ✅ `process-paypal-confirmation`
- ✅ `cashfree-webhook`
- ✅ `create-cashfree-order`
- ✅ `process-cashfree-confirmation`
- ✅ `handle-payment-webhook`

### Subscription Management
- ✅ `cron-check-subscriptions`
- ✅ `cron-trial-expiry-emails`
- ✅ `check-trial-expiration`

### AI Features
- ✅ `ai-chat`
- ✅ `analyze-trades-with-gpt`
- ✅ `ai-context-fetcher`
- ✅ `ai-intent-classifier`

### Notifications
- ✅ `send-notification`
- ✅ `send-web-push`
- ✅ `get-vapid-public-key`

### Community Features
- ✅ `community-actions`
- ✅ `community-feed`
- ✅ `community-traders`
- ✅ `leaderboard-v2`

### File Upload
- ✅ `upload-notes-image`

## ❌ Functions Missing from New DB (Need to Add/Check)

### User Role Management
- ❌ `assign-user-role` - Admin function to assign roles
- ❌ `get-user-roles` - Get user roles
- ❌ `remove-user-role` - Remove user roles

### AI Features (Extended)
- ❌ `gennie-chat` - Gennie AI chat (might be replaced by ai-chat)
- ❌ `ai-smart-context` - Smart context for AI
- ❌ `ai-strategy-review` - AI strategy review
- ❌ `ai-trade-review` - AI trade review

### Video/Communication
- ❌ `create-daily-room` - Daily.co video room creation
- ❌ `text-to-speech` - TTS functionality
- ❌ `voice-to-text` - STT functionality

### Settings Management
- ❌ `set-secret` - Set secrets
- ❌ `update-gennie-api-key` - Update Gennie API key
- ❌ `get-user-settings` - Get user settings
- ❌ `save-user-settings` - Save user settings

### Subscription Checks (Duplicates?)
- ❌ `check_expired_subscriptions` - Might be duplicate of cron-check-subscriptions
- ❌ `check-expired-subscriptions` - Might be duplicate

### Payment (Extended)
- ❌ `validate-coupon` - Coupon validation
- ❌ `phonepe-auth` - PhonePe authentication
- ❌ `phonepe-payment` - PhonePe payment
- ❌ `phonepe-status` - PhonePe status check
- ❌ `phonepe-webhook` - PhonePe webhook

### Email Management
- ❌ `send-trial-expiry-email` - Send trial expiry email
- ❌ `send-welcome-email` - Send welcome email
- ❌ `send-enhanced-notification` - Enhanced notifications
- ❌ `send-journey-email` - Journey email
- ❌ `cron-process-email-queue` - Process email queue (we have process-email-queue)

### Brevo/Email Marketing
- ❌ `create-brevo-campaign` - Create Brevo campaign
- ❌ `manage-brevo-campaigns` - Manage Brevo campaigns
- ❌ `brevo-campaign-webhook` - Brevo webhook
- ❌ `sync-users-to-brevo-list` - Sync users to Brevo
- ❌ `test-brevo-templates` - Test Brevo templates

### Community (Extended)
- ❌ `trader-shared-trades` - Get trader shared trades
- ❌ `public-profile-analytics` - Public profile analytics
- ❌ `profile-analytics-v2` - Profile analytics v2
- ❌ `profile-about` - Profile about
- ❌ `community-leaderboard` - Community leaderboard
- ❌ `trader-profile` - Trader profile

### Cron Jobs (Extended)
- ❌ `cron-check-inactivity` - Check user inactivity
- ❌ `cron-first-trade-milestone` - First trade milestone

### Payment Events
- ❌ `handle-payment-events` - Handle payment events

### Debug/Test Functions
- ❌ `fix-journal-trades-notes` - Fix journal trades notes
- ❌ `debug-trade-notes` - Debug trade notes
- ❌ `test-function` - Test function
- ❌ `debug-user-subscription` - Debug user subscription

### User Journey
- ❌ `update-journey-state` - Update user journey state

### Auth
- ❌ `auth-webhook` - Auth webhook
- ❌ `create-user-profile` - Create user profile

### Misc
- ❌ `hello-world` - Hello world test function

## 🔍 Analysis

### Critical Missing Functions (Need to Add)
1. **validate-coupon** - Used for coupon validation in payments
2. **send-welcome-email** - Important for onboarding
3. **auth-webhook** - Might be needed for auth events
4. **create-user-profile** - Might be needed for user creation

### Functions Likely Replaced/Integrated
1. `gennie-chat` → `ai-chat` (consolidated)
2. `check_expired_subscriptions` / `check-expired-subscriptions` → `cron-check-subscriptions`
3. `cron-process-email-queue` → `process-email-queue`

### Functions to Consider Adding
1. **PhonePe Integration** - If targeting Indian market
2. **Brevo Email Marketing** - If using Brevo for campaigns
3. **User Role Management** - For admin panel
4. **Video Rooms** - If video features needed
5. **Voice/TTS** - If voice features needed

### Functions Not Needed (Debug/Test)
- `fix-journal-trades-notes`
- `debug-trade-notes`
- `test-function`
- `debug-user-subscription`
- `hello-world`

## 📝 Recommendations

### High Priority (Add Now)
1. ✅ Create `validate-coupon` function
2. ✅ Create `send-welcome-email` function  
3. ✅ Create `auth-webhook` function
4. ✅ Check if user profile creation is handled in triggers

### Medium Priority (Add if Needed)
1. User role management functions (for admin panel)
2. PhonePe integration (if targeting India)
3. Enhanced email functions

### Low Priority (Optional)
1. Brevo integration
2. Video room creation
3. Voice/TTS features
4. Journey state management

## ✅ Current Status

### Working Functions
All core payment, subscription, AI, and community functions are present and working.

### Next Steps
1. Add critical missing functions (validate-coupon, send-welcome-email, auth-webhook)
2. Test all existing functions
3. Verify frontend integration
4. Add admin functions if needed
