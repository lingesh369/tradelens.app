# Design Document: TradeLens Authentication & Trial Flow

## Overview

This design document outlines the complete implementation of the authentication and trial subscription system for TradeLens. The system provides secure user authentication, automated trial management, payment gateway integration, and comprehensive error handling.

## Architecture

### High-Level Flow

```
User Signup → Email Confirmation → Profile Creation → Trial Activation → Dashboard Access
                                                    ↓
                                            Trial Monitoring
                                                    ↓
                                    Trial Expiration / Upgrade
                                                    ↓
                                    Payment Processing → Active Subscription
```

### Components

1. **Frontend Auth Layer** (AuthContext.tsx)
   - User authentication state management
   - Session management and token refresh
   - Error handling with retry logic
   - OAuth integration

2. **Database Layer** (Supabase)
   - User tables (auth.users, app_users, trader_profiles)
   - Subscription tables (subscription_plans, user_subscriptions, payment_history)
   - Database triggers for automation
   - Row Level Security policies

3. **Edge Functions** (Supabase Functions)
   - Webhook handlers (payment, email)
   - Scheduled jobs (trial expiration, reminders)
   - Background processing

4. **External Services**
   - Brevo (Email delivery)
   - Cashfree/Stripe (Payment processing)

## Database Schema

### Core Tables

#### app_users
```sql
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

-- Indexes for performance
CREATE INDEX idx_app_users_email ON app_users(email);
CREATE INDEX idx_app_users_username ON app_users(username);
CREATE INDEX idx_app_users_user_role ON app_users(user_role);
CREATE INDEX idx_app_users_subscription_status ON app_users(subscription_status);
CREATE INDEX idx_app_users_trial_end_date ON app_users(trial_end_date) WHERE subscription_status = 'trialing';
CREATE INDEX idx_app_users_referred_by ON app_users(referred_by) WHERE referred_by IS NOT NULL;

-- Full-text search on username and full_name
CREATE INDEX idx_app_users_search ON app_users USING gin(
    to_tsvector('english', coalesce(username, '') || ' ' || coalesce(full_name, ''))
);
```

**Key Fields:**
- `id` - Links to auth.users (CASCADE DELETE)
- `email` - User's email (unique, required)
- `username` - Unique username (3-20 chars, alphanumeric + underscore)
- `first_name`, `last_name` - User's name components
- `full_name` - Auto-generated from first_name + last_name
- `user_role` - Access level (user, manager, admin)
- `subscription_status` - Current subscription state
- `trial_end_date` - When trial expires (7 days from signup)
- `onboarding_completed` - Has user completed onboarding wizard
- `signup_source` - How user signed up (direct, google, affiliate)
- `affiliate_code` - User's own affiliate code for referrals
- `referred_by` - Affiliate code of referrer (if any)

#### user_subscriptions
```sql
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'expired', 'cancelled', 'past_due')),
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMPTZ,
    payment_gateway TEXT CHECK (payment_gateway IN ('cashfree', 'stripe', 'manual')),
    gateway_subscription_id TEXT,
    gateway_customer_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_period_end ON user_subscriptions(current_period_end) WHERE status IN ('trialing', 'active');
CREATE UNIQUE INDEX idx_user_subscriptions_active ON user_subscriptions(user_id) WHERE status IN ('trialing', 'active');
```

#### subscription_plans
```sql
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    features JSONB NOT NULL DEFAULT '[]',
    limits JSONB NOT NULL DEFAULT '{"accounts": 1, "strategies": 3, "trades_per_month": 100}',
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    cashfree_plan_id_monthly TEXT,
    cashfree_plan_id_yearly TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_plans_is_active ON subscription_plans(is_active) WHERE is_active = true;
CREATE INDEX idx_subscription_plans_sort_order ON subscription_plans(sort_order);
```

#### payment_history
```sql
CREATE TABLE payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
    payment_method TEXT,
    payment_gateway TEXT CHECK (payment_gateway IN ('cashfree', 'stripe', 'manual')),
    gateway_payment_id TEXT,
    gateway_order_id TEXT,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_payment_history_status ON payment_history(status);
CREATE INDEX idx_payment_history_created_at ON payment_history(created_at DESC);
CREATE INDEX idx_payment_history_gateway_order_id ON payment_history(gateway_order_id) WHERE gateway_order_id IS NOT NULL;
```

## Implementation Components

### 1. Database Migrations

**Migration 1: Core Auth Tables**
```sql
-- Create app_users table
-- Create trader_profiles table
-- Create user_settings table
-- Add RLS policies
-- Create indexes
```

**Migration 2: Subscription Tables**
```sql
-- Create subscription_plans table
-- Create user_subscriptions table
-- Create payment_history table
-- Add RLS policies
-- Create indexes
```

**Migration 3: Database Functions & Triggers**
```sql
-- handle_new_signup() trigger function
-- update_updated_at_column() trigger function
-- Attach triggers to tables
```

### 2. Database Functions

#### handle_new_signup()
**Purpose**: Automatically create app_users record when auth.users is created

**Trigger**: AFTER INSERT ON auth.users

**Logic**:
```sql
CREATE OR REPLACE FUNCTION handle_new_signup()
RETURNS TRIGGER AS $$
DECLARE
    v_username TEXT;
    v_first_name TEXT;
    v_last_name TEXT;
    v_signup_source TEXT;
    v_referred_by TEXT;
    v_affiliate_code TEXT;
    v_retry_count INT := 0;
    v_max_retries INT := 3;
    v_delay INTERVAL;
BEGIN
    -- Extract metadata from auth.users
    v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
    v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    v_username := COALESCE(NEW.raw_user_meta_data->>'username', '');
    v_signup_source := COALESCE(NEW.raw_user_meta_data->>'signup_source', 'direct');
    v_referred_by := NEW.raw_user_meta_data->>'referred_by';
    
    -- Generate unique affiliate code for this user
    v_affiliate_code := UPPER(SUBSTRING(MD5(NEW.id::TEXT || NOW()::TEXT) FROM 1 FOR 8));
    
    -- Validate username (should be validated in frontend, but double-check)
    IF v_username = '' OR v_username IS NULL THEN
        -- Generate username from email if not provided
        v_username := SPLIT_PART(NEW.email, '@', 1);
        v_username := REGEXP_REPLACE(v_username, '[^a-zA-Z0-9_]', '', 'g');
        
        -- Ensure uniqueness by appending random suffix if needed
        WHILE EXISTS (SELECT 1 FROM app_users WHERE username = v_username) LOOP
            v_username := v_username || FLOOR(RANDOM() * 1000)::TEXT;
        END LOOP;
    END IF;
    
    -- Retry loop for creating app_users
    WHILE v_retry_count < v_max_retries LOOP
        BEGIN
            -- Create app_users record
            INSERT INTO app_users (
                id,
                email,
                username,
                first_name,
                last_name,
                user_role,
                subscription_status,
                trial_end_date,
                signup_source,
                affiliate_code,
                referred_by,
                is_active,
                onboarding_completed
            ) VALUES (
                NEW.id,
                NEW.email,
                v_username,
                NULLIF(v_first_name, ''),
                NULLIF(v_last_name, ''),
                'user',
                'trialing',
                NOW() + INTERVAL '7 days',
                v_signup_source,
                v_affiliate_code,
                v_referred_by,
                true,
                false
            );
            
            -- Create trader_profiles record
            INSERT INTO trader_profiles (
                user_id,
                bio,
                is_public,
                total_trades,
                win_rate,
                total_pnl
            ) VALUES (
                NEW.id,
                NULL,
                false,
                0,
                0.00,
                0.00
            );
            
            -- Create user_subscriptions record with trial
            INSERT INTO user_subscriptions (
                user_id,
                plan_id,
                status,
                current_period_start,
                current_period_end,
                payment_gateway
            ) VALUES (
                NEW.id,
                NULL, -- No plan during trial
                'trialing',
                NOW(),
                NOW() + INTERVAL '7 days',
                NULL
            );
            
            -- Create default user_settings
            INSERT INTO user_settings (user_id, key, value) VALUES
                (NEW.id, 'theme', '"light"'::jsonb),
                (NEW.id, 'currency', '"USD"'::jsonb),
                (NEW.id, 'timezone', '"UTC"'::jsonb),
                (NEW.id, 'email_notifications', 'true'::jsonb),
                (NEW.id, 'push_notifications', 'false'::jsonb);
            
            -- Success - exit retry loop
            EXIT;
            
        EXCEPTION WHEN OTHERS THEN
            v_retry_count := v_retry_count + 1;
            
            IF v_retry_count >= v_max_retries THEN
                -- Log error and re-raise
                RAISE WARNING 'Failed to create user profile after % attempts for user %: %', 
                    v_max_retries, NEW.id, SQLERRM;
                RAISE;
            END IF;
            
            -- Exponential backoff: 1s, 2s, 4s
            v_delay := (POWER(2, v_retry_count - 1) || ' seconds')::INTERVAL;
            PERFORM pg_sleep(EXTRACT(EPOCH FROM v_delay));
        END;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_signup();
```

**Error Handling**:
- Retry up to 3 times with exponential backoff (1s, 2s, 4s)
- Log errors with RAISE WARNING
- Generate username from email if not provided
- Ensure username uniqueness with random suffix if needed
- Continue even if optional steps fail

#### update_updated_at_column()
**Purpose**: Auto-update timestamps on record changes

**Logic**:
1. Set NEW.updated_at = NOW()
2. Return NEW record

### 3. Frontend Auth Implementation

#### AuthContext Enhancements

**Current State**: Already implements most requirements
- ✅ Sign in with email/password
- ✅ Sign up with email/password
- ✅ OAuth (Google)
- ✅ Password reset
- ✅ Session management with token refresh
- ✅ Error handling with retry logic
- ✅ Trial status tracking

**Needed Additions**:
1. Email confirmation flow UI
2. Onboarding wizard component
3. Trial expiration warnings
4. Upgrade prompts
5. Payment integration

### 4. UI Components

#### SignUp Component
- Email/password form
- Google OAuth button
- Email confirmation message
- Error display with retry option

#### SignIn Component
- Email/password form
- Google OAuth button
- Forgot password link
- Email confirmation reminder

#### OnboardingWizard Component
- Multi-step wizard
- Profile setup
- Trading preferences
- Account creation
- Strategy setup
- Skip option

#### TrialBanner Component
- Days remaining display
- Upgrade CTA
- Dismissible
- Prominent placement

#### UpgradeModal Component
- Plan comparison
- Pricing display
- Payment gateway integration
- Coupon code input

### 5. Edge Functions

#### handle-payment-webhook
**Endpoint**: POST /functions/v1/handle-payment-webhook

**Request**:
```json
{
  "event": "payment.success",
  "order_id": "order_123",
  "payment_id": "pay_123",
  "amount": 999,
  "currency": "INR",
  "signature": "hmac_signature"
}
```

**Logic**:
1. Validate webhook signature
2. Extract payment details
3. Find user by gateway_order_id
4. Update user_subscriptions status to 'active'
5. Create payment_history record
6. Send confirmation email via Brevo
7. Return 200 OK

**Error Handling**:
- Invalid signature → 401 Unauthorized
- User not found → Log error, return 200
- Database error → Retry with exponential backoff
- Email error → Log but don't fail

#### check-trial-expiration
**Schedule**: Daily at 00:00 UTC

**Logic**:
1. Query users with trial_end_date < NOW() AND status='trialing'
2. For each user:
   - Update subscription_status to 'expired'
   - Create notification
   - Send trial expiration email
3. Log execution results

#### send-trial-reminders
**Schedule**: Daily at 12:00 UTC

**Logic**:
1. Query users with trial_end_date in (NOW() + 3 days, NOW() + 1 day)
2. For each user:
   - Check if reminder already sent
   - Send reminder email with days remaining
   - Log email delivery
3. Log execution results

### 6. Email Templates (Brevo)

#### Welcome Email
**Trigger**: User signup
**Content**:
- Welcome message
- Trial information (7 days)
- Getting started guide
- Support links

#### Email Confirmation
**Trigger**: Email/password signup
**Content**:
- Confirmation link
- Link expiration (24 hours)
- Resend option

#### Trial Reminder (3 days)
**Trigger**: 3 days before expiration
**Content**:
- Days remaining
- Plan comparison
- Upgrade CTA
- Feature highlights

#### Trial Reminder (1 day)
**Trigger**: 1 day before expiration
**Content**:
- Final reminder
- Urgent CTA
- Limited time offer (optional)

#### Trial Expired
**Trigger**: Trial expiration
**Content**:
- Expiration notice
- Feature restrictions
- Upgrade options
- Special offer (optional)

#### Payment Confirmation
**Trigger**: Successful payment
**Content**:
- Thank you message
- Receipt details
- Next billing date
- Invoice attachment

### 7. Payment Gateway Integration

#### Cashfree Integration
**Use Case**: Indian users

**Flow**:
1. User clicks "Upgrade"
2. Frontend creates order via Cashfree API
3. Redirect to Cashfree checkout
4. User completes payment
5. Cashfree sends webhook to edge function
6. Edge function updates subscription
7. User redirected to success page

**Configuration**:
- App ID: From environment
- Secret Key: From environment
- Webhook URL: https://[project].supabase.co/functions/v1/handle-payment-webhook
- Signature validation: HMAC SHA256

#### Stripe Integration
**Use Case**: International users

**Flow**:
1. User clicks "Upgrade"
2. Frontend creates checkout session via Stripe API
3. Redirect to Stripe checkout
4. User completes payment
5. Stripe sends webhook to edge function
6. Edge function updates subscription
7. User redirected to success page

**Configuration**:
- Publishable Key: From environment
- Secret Key: From environment
- Webhook Secret: From environment
- Signature validation: Stripe signature

### 8. Security Measures

#### Row Level Security Policies

**app_users**:
```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON app_users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON app_users
  FOR UPDATE USING (auth.uid() = id);
```

**user_subscriptions**:
```sql
-- Users can read their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
```

**payment_history**:
```sql
-- Users can read their own payment history
CREATE POLICY "Users can view own payments" ON payment_history
  FOR SELECT USING (auth.uid() = user_id);
```

#### Webhook Security
- Validate signatures for all webhooks
- Use HTTPS only
- Rate limiting on webhook endpoints
- Log all webhook attempts

#### Session Security
- Access tokens expire after 1 hour
- Refresh tokens expire after 30 days
- Automatic token refresh
- Secure httpOnly cookies

### 9. Error Handling Strategy

#### Frontend Errors
- Network errors → Retry with exponential backoff
- Auth errors → Clear error messages
- Validation errors → Inline field errors
- Server errors → Generic message + retry option

#### Backend Errors
- Database errors → Retry up to 3 times
- External service errors → Fallback or queue
- Webhook errors → Return 200 but log error
- Critical errors → Alert administrators

#### User-Facing Messages
- "Invalid email or password" (not "User not found")
- "Please check your email to confirm your account"
- "We're experiencing technical difficulties. Please try again."
- "Your trial has expired. Upgrade to continue using TradeLens."

### 10. Testing Strategy

#### Unit Tests
- Database functions
- Trigger logic
- Utility functions

#### Integration Tests
- Signup flow end-to-end
- OAuth flow
- Password reset flow
- Trial expiration
- Payment webhook processing

#### Manual Testing Checklist
- [ ] Sign up with email/password
- [ ] Confirm email
- [ ] Sign in with confirmed account
- [ ] Sign up with Google OAuth
- [ ] Reset password
- [ ] Update password
- [ ] View trial status
- [ ] Receive trial reminders
- [ ] Trial expires correctly
- [ ] Upgrade to paid plan
- [ ] Payment webhook updates subscription
- [ ] Access control enforced

## Implementation Plan

### Phase 1: Database Setup (Priority: High)
1. Create migration for app_users, trader_profiles, user_settings
2. Create migration for subscription tables
3. Create migration for database functions and triggers
4. Apply migrations to local Supabase
5. Test trigger functionality
6. Apply migrations to production

### Phase 2: Frontend Auth (Priority: High)
1. Review and fix AuthContext issues
2. Create SignUp component
3. Create SignIn component
4. Create PasswordReset component
5. Add email confirmation flow
6. Test all auth flows locally

### Phase 3: Trial Management (Priority: High)
1. Create TrialBanner component
2. Add trial status to dashboard
3. Create edge function for trial expiration
4. Create edge function for trial reminders
5. Set up Brevo email templates
6. Test trial flow end-to-end

### Phase 4: Payment Integration (Priority: Medium)
1. Create UpgradeModal component
2. Integrate Cashfree SDK
3. Integrate Stripe SDK
4. Create payment webhook edge function
5. Test payment flow with test credentials
6. Deploy to production

### Phase 5: Onboarding (Priority: Medium)
1. Create OnboardingWizard component
2. Add onboarding steps
3. Track onboarding completion
4. Send welcome email
5. Test onboarding flow

### Phase 6: Polish & Optimization (Priority: Low)
1. Add loading states
2. Improve error messages
3. Add analytics tracking
4. Performance optimization
5. Accessibility improvements

## Success Metrics

- User signup completion rate > 80%
- Email confirmation rate > 70%
- Trial to paid conversion rate > 10%
- Payment success rate > 95%
- Average time to first trade < 5 minutes
- User satisfaction score > 4.5/5

## Monitoring & Alerts

- Monitor trial expiration job execution
- Alert on payment webhook failures
- Track email delivery rates
- Monitor authentication errors
- Alert on database trigger failures
