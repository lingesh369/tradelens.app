# Quick Start Guide: TradeLens Auth Flow Implementation

## Overview

This guide will help you set up the complete authentication and trial flow for TradeLens. Follow these steps in order for the smoothest implementation.

## Prerequisites

- ✅ Local Supabase running (`supabase start`)
- ✅ Node.js and npm installed
- ✅ Brevo account for emails
- ✅ Cashfree/Stripe accounts (sandbox mode)

## Step-by-Step Implementation

### Step 1: Database Setup (2-3 hours)

#### 1.1 Create Auth Tables Migration

```bash
# Create migration file
supabase migration new create_auth_tables
```

Add this SQL to the migration file:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app_users table
CREATE TABLE app_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
            THEN first_name || ' ' || last_name
            WHEN first_name IS NOT NULL THEN first_name
            WHEN last_name IS NOT NULL THEN last_name
            ELSE NULL
        END
    ) STORED,
    avatar_url TEXT,
    user_role TEXT DEFAULT 'user' CHECK (user_role IN ('user', 'manager', 'admin')),
    subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('trialing', 'active', 'expired', 'cancelled', 'past_due')),
    trial_end_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    onboarding_completed BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    signup_source TEXT DEFAULT 'direct' CHECK (signup_source IN ('direct', 'google', 'affiliate', 'referral')),
    affiliate_code TEXT,
    referred_by TEXT,
    profile_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for app_users
CREATE INDEX idx_app_users_email ON app_users(email);
CREATE INDEX idx_app_users_username ON app_users(username);
CREATE INDEX idx_app_users_user_role ON app_users(user_role);
CREATE INDEX idx_app_users_subscription_status ON app_users(subscription_status);
CREATE INDEX idx_app_users_trial_end_date ON app_users(trial_end_date) WHERE subscription_status = 'trialing';
CREATE INDEX idx_app_users_referred_by ON app_users(referred_by) WHERE referred_by IS NOT NULL;
CREATE INDEX idx_app_users_search ON app_users USING gin(
    to_tsvector('english', coalesce(username, '') || ' ' || coalesce(full_name, ''))
);

-- Create trader_profiles table
CREATE TABLE trader_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    bio TEXT,
    trading_experience TEXT CHECK (trading_experience IN ('beginner', 'intermediate', 'advanced', 'professional')),
    risk_tolerance TEXT CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
    preferred_markets TEXT[],
    location TEXT,
    timezone TEXT,
    website_url TEXT,
    social_links JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    total_trades INT DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0.00,
    total_pnl DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trader_profiles_user_id ON trader_profiles(user_id);
CREATE INDEX idx_trader_profiles_is_public ON trader_profiles(is_public) WHERE is_public = true;

-- Create user_settings table
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_setting UNIQUE(user_id, key)
);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Enable Row Level Security
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trader_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for app_users
CREATE POLICY "Users can view own profile" ON app_users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON app_users
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for trader_profiles
CREATE POLICY "Users can view own trader profile" ON trader_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public trader profiles" ON trader_profiles
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can update own trader profile" ON trader_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_settings
CREATE POLICY "Users can manage own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);
```

#### 1.2 Create Subscription Tables Migration

```bash
# Create migration file
supabase migration new create_subscription_tables
```

Copy the schema from `design.md` for:
- subscription_plans
- user_subscriptions
- payment_history
- coupons
- coupon_usage

#### 1.3 Create Database Functions

```bash
# Create migration file
supabase migration new create_auth_functions
```

Implement:
- `handle_new_signup()` trigger function
- `update_updated_at_column()` trigger function
- Attach triggers to tables

#### 1.4 Apply Migrations

```bash
# Apply all migrations
supabase db reset

# Verify in Supabase Studio
# Open http://127.0.0.1:54323
```

#### 1.5 Seed Subscription Plans

```bash
# Create seed file
supabase migration new seed_subscription_plans
```

Add at least 3 plans:
- Free Trial (7 days)
- Basic ($9.99/month)
- Pro ($29.99/month)

### Step 2: Fix Existing Auth Issues (30 minutes)

#### 2.1 Fix AuthContext TypeScript Errors

Open `src/context/AuthContext.tsx` and:

1. Remove unused imports:
```typescript
// Remove these lines
import { ReactNode, Session, SupabaseAuthError } from '@supabase/supabase-js';
```

2. Fix USER_DELETED event check:
```typescript
// Change this:
if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {

// To this:
if (event === 'SIGNED_OUT') {
```

3. Run diagnostics:
```bash
npm run type-check
```

### Step 3: Create Core Auth Components (4-6 hours)

#### 3.1 Create SignUp Component

```bash
# Create component file
mkdir -p src/components/auth
touch src/components/auth/SignUp.tsx
```

Features needed:
- Email/password form with validation
- Google OAuth button
- Error display
- Loading states
- Link to sign in

#### 3.2 Create SignIn Component

```bash
touch src/components/auth/SignIn.tsx
```

Features needed:
- Email/password form
- Google OAuth button
- Forgot password link
- Email confirmation reminder

#### 3.3 Create Password Reset Components

```bash
touch src/components/auth/ForgotPassword.tsx
touch src/components/auth/ResetPassword.tsx
```

#### 3.4 Test Auth Flow

1. Start your dev server: `npm run dev`
2. Test signup with email/password
3. Check Mailpit for confirmation email: http://127.0.0.1:54324
4. Test Google OAuth
5. Test password reset

### Step 4: Implement Trial Management (4-5 hours)

#### 4.1 Create TrialBanner Component

```bash
mkdir -p src/components/subscription
touch src/components/subscription/TrialBanner.tsx
```

Display:
- Days remaining
- Upgrade CTA
- Dismissible option

#### 4.2 Create Trial Expiration Edge Function

```bash
# Create edge function
supabase functions new check-trial-expiration
```

Implement logic to:
- Query expired trials
- Update subscription status
- Send expiration emails
- Create notifications

#### 4.3 Create Trial Reminder Edge Function

```bash
supabase functions new send-trial-reminders
```

Send reminders at:
- 3 days before expiration
- 1 day before expiration

#### 4.4 Test Edge Functions Locally

```bash
# Serve functions locally
supabase functions serve

# Test with curl
curl -X POST http://localhost:54321/functions/v1/check-trial-expiration \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Step 5: Set Up Email Templates (2-3 hours)

#### 5.1 Create Brevo Templates

Log in to Brevo and create templates for:

1. **Welcome Email** (Template ID: 1)
   - Subject: "Welcome to TradeLens! 🎉"
   - Variables: {{name}}, {{trial_days}}

2. **Email Confirmation** (Template ID: 2)
   - Subject: "Confirm your TradeLens account"
   - Variables: {{confirmation_link}}

3. **Trial Reminder - 3 Days** (Template ID: 3)
   - Subject: "3 days left in your TradeLens trial"
   - Variables: {{name}}, {{days_left}}, {{upgrade_link}}

4. **Trial Reminder - 1 Day** (Template ID: 4)
   - Subject: "Last day of your TradeLens trial!"
   - Variables: {{name}}, {{upgrade_link}}

5. **Trial Expired** (Template ID: 5)
   - Subject: "Your TradeLens trial has ended"
   - Variables: {{name}}, {{upgrade_link}}

6. **Payment Confirmation** (Template ID: 6)
   - Subject: "Payment received - Welcome to TradeLens Pro!"
   - Variables: {{name}}, {{plan}}, {{amount}}, {{next_billing_date}}

#### 5.2 Configure Brevo in Edge Functions

Add to your edge function:

```typescript
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

async function sendEmail(templateId: number, to: string, params: any) {
  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      templateId,
      to: [{ email: to }],
      params,
    }),
  });
  return response.json();
}
```

### Step 6: Payment Integration (Optional - Can be done later)

#### 6.1 Create UpgradeModal Component

```bash
touch src/components/subscription/UpgradeModal.tsx
touch src/components/subscription/PlanCard.tsx
```

#### 6.2 Set Up Cashfree (for Indian users)

1. Sign up at https://www.cashfree.com/
2. Get sandbox credentials
3. Add to `.env.local`:
```env
VITE_CASHFREE_APP_ID=your_app_id
VITE_CASHFREE_SECRET_KEY=your_secret_key
VITE_CASHFREE_MODE=sandbox
```

#### 6.3 Set Up Stripe (for international users)

1. Sign up at https://stripe.com/
2. Get test API keys
3. Add to `.env.local`:
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_SECRET_KEY=sk_test_...
```

#### 6.4 Create Payment Webhook Handler

```bash
supabase functions new handle-payment-webhook
```

Implement:
- Signature validation
- Payment processing
- Subscription updates
- Email notifications

### Step 7: Testing (2-3 hours)

#### 7.1 Test Complete Signup Flow

1. Sign up with email/password
2. Check email confirmation in Mailpit
3. Confirm email
4. Verify app_users record created
5. Verify trader_profiles created
6. Verify user_subscriptions created with trial status
7. Verify trial_end_date is 7 days from now

#### 7.2 Test Trial Expiration

1. Manually set trial_end_date to yesterday in database
2. Run trial expiration function
3. Verify subscription status updated to 'expired'
4. Verify expiration email sent
5. Verify user sees upgrade prompt

#### 7.3 Test Payment Flow (if implemented)

1. Click upgrade button
2. Select a plan
3. Complete payment with test card
4. Verify webhook received
5. Verify subscription updated
6. Verify confirmation email sent

### Step 8: Deploy to Production

#### 8.1 Apply Migrations to Production

```bash
# Link to production project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

#### 8.2 Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy check-trial-expiration
supabase functions deploy send-trial-reminders
supabase functions deploy handle-payment-webhook
```

#### 8.3 Set Up Scheduled Functions

In Supabase Dashboard → Edge Functions → Cron:

1. `check-trial-expiration`: `0 0 * * *` (daily at midnight)
2. `send-trial-reminders`: `0 12 * * *` (daily at noon)

#### 8.4 Configure Production Environment Variables

In Supabase Dashboard → Settings → Edge Functions:

```
BREVO_API_KEY=your_production_key
CASHFREE_APP_ID=your_production_id
CASHFREE_SECRET_KEY=your_production_key
STRIPE_SECRET_KEY=your_production_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

#### 8.5 Update Frontend Environment Variables

In Vercel/Netlify dashboard:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_CASHFREE_APP_ID=your_production_id
VITE_STRIPE_PUBLISHABLE_KEY=your_production_key
```

## Verification Checklist

After completing all steps, verify:

- [ ] Users can sign up with email/password
- [ ] Users receive confirmation email
- [ ] Users can sign in with Google OAuth
- [ ] app_users record is created automatically
- [ ] trader_profiles record is created automatically
- [ ] user_subscriptions record is created with trial status
- [ ] Trial end date is set to 7 days from signup
- [ ] Trial banner shows days remaining
- [ ] Trial expiration function runs daily
- [ ] Trial reminder emails are sent
- [ ] Expired trials show upgrade prompt
- [ ] Payment flow works (if implemented)
- [ ] Webhooks update subscription status
- [ ] Confirmation emails are sent

## Common Issues & Solutions

### Issue: Database trigger not creating user records

**Solution**: Check trigger is attached and function has proper permissions:
```sql
-- Verify trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check function permissions
GRANT EXECUTE ON FUNCTION handle_new_signup() TO postgres;
```

### Issue: Email confirmation not working

**Solution**: Check Supabase Auth settings:
1. Go to Authentication → Settings
2. Enable "Confirm email"
3. Set redirect URL to your app URL

### Issue: Trial expiration function not running

**Solution**: Check cron schedule and function logs:
1. Verify cron expression is correct
2. Check function logs in Supabase Dashboard
3. Test function manually first

### Issue: Payment webhook not receiving events

**Solution**: 
1. Verify webhook URL is correct in payment gateway
2. Check webhook signature validation
3. Test with webhook testing tools
4. Check edge function logs

## Next Steps

After completing the auth flow:

1. Implement onboarding wizard
2. Add analytics tracking
3. Create admin dashboard for user management
4. Implement coupon system
5. Add affiliate tracking
6. Optimize performance
7. Add comprehensive error logging

## Support

If you encounter issues:
1. Check Supabase Studio logs
2. Check browser console for errors
3. Review edge function logs
4. Test with Mailpit for email issues
5. Use payment gateway test mode

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Brevo API Documentation](https://developers.brevo.com/)
- [Cashfree Documentation](https://docs.cashfree.com/)
- [Stripe Documentation](https://stripe.com/docs)
