# TradeLens Authentication Flow - Implementation Plan

## Executive Summary

This document outlines the complete authentication flow implementation for TradeLens, following industry-standard practices and integrating with our new database schema.

## Current State Analysis

### Issues Found in Existing Code

1. **❌ Incorrect Database References**
   - Code references `auth_id` field which doesn't exist
   - Should use `id` field that references `auth.users(id)`

2. **❌ Manual Profile Creation**
   - Frontend tries to manually create profiles via RPC calls
   - Should rely on database trigger `handle_new_signup()`

3. **❌ Missing Fields**
   - Not setting `signup_source`, `email_verified`, `profile_completed`
   - Not handling `display_name` properly

4. **❌ Inconsistent Error Handling**
   - Some errors not properly caught
   - Retry logic not consistent

5. **✅ Good Practices Found**
   - Retry logic with exponential backoff
   - Proper error messages
   - OAuth integration
   - Password reset flow

## Industry-Standard Authentication Flow

### 1. Sign Up Flow

```
User fills form → Validate input → Create auth.users → 
Database trigger creates profiles → Send confirmation email → 
Redirect to email confirmation page
```

**Key Points:**
- Let Supabase handle password hashing (bcrypt with 10+ rounds)
- Let database trigger handle profile creation
- Email confirmation required for security
- Trial starts immediately upon signup

### 2. Sign In Flow

```
User enters credentials → Validate → Check email confirmed → 
Create session → Fetch user profile → Redirect to dashboard
```

**Key Points:**
- Check email confirmation status
- Handle "email not confirmed" gracefully
- Fetch subscription status
- Set up session with proper expiry

### 3. OAuth Flow (Google)

```
User clicks Google → Redirect to Google → User authorizes → 
Google redirects back → Create/link account → Database trigger → 
Redirect to dashboard
```

**Key Points:**
- No email confirmation needed for OAuth
- Extract name from Google profile
- Handle existing email linking
- Same trial logic as email signup

### 4. Password Reset Flow

```
User requests reset → Send email with token → User clicks link → 
Validate token → User sets new password → Redirect to login
```

**Key Points:**
- Token expires after 1 hour
- Secure token generation by Supabase
- Clear success/error messages

### 5. Session Management

```
User signs in → Access token (1h) + Refresh token (30d) → 
Token expires → Auto-refresh → Refresh fails → Sign out
```

**Key Points:**
- Automatic token refresh
- Handle refresh failures gracefully
- Clear session on sign out
- Persist session across page reloads

## Database Integration

### Trigger-Based Profile Creation

Our `handle_new_signup()` trigger automatically creates:
1. `app_users` record with metadata
2. `trader_profiles` record with defaults
3. `user_settings` records (theme, currency, etc.)
4. `user_subscriptions` record with 7-day trial

**Frontend should NOT manually create these!**

### Required Metadata in Signup

```typescript
{
  first_name: string,
  last_name: string,
  username: string,
  signup_source: 'web' | 'mobile' | 'google' | 'referral',
  referred_by?: string // affiliate code
}
```

### Profile Fetching

After authentication, fetch from `app_users` using:
```sql
SELECT * FROM app_users WHERE id = auth.uid()
```

NOT `auth_id` - that field doesn't exist!

## Implementation Tasks

### Phase 1: Fix Database Trigger (CRITICAL)

**File**: `supabase/migrations/20241123100007_phase8_database_functions.sql`

**Updates Needed**:
1. ✅ Trigger already has retry logic
2. ✅ Trigger creates all required records
3. ✅ Trigger handles metadata extraction
4. ⚠️ Need to ensure it sets `signup_source` and `email_verified`

### Phase 2: Update AuthContext

**File**: `src/context/AuthContext.tsx`

**Changes**:
1. Remove `auth_id` references → use `id`
2. Remove manual profile creation logic
3. Simplify to rely on database trigger
4. Add proper `signup_source` tracking
5. Handle `email_verified` status
6. Add `profile_completed` tracking

### Phase 3: Update Auth Page

**File**: `src/pages/Auth.tsx`

**Changes**:
1. Remove manual RPC calls for profile creation
2. Simplify signup to just call `supabase.auth.signUp()`
3. Add `signup_source` to metadata
4. Handle email confirmation flow better
5. Add loading states for trigger completion
6. Improve error messages

### Phase 4: Add Email Confirmation Page

**New File**: `src/pages/EmailConfirmation.tsx`

**Features**:
- Show "Check your email" message
- Resend confirmation link
- Handle confirmation callback
- Redirect to dashboard after confirmation

### Phase 5: Add Onboarding Flow

**New File**: `src/pages/Onboarding.tsx`

**Steps**:
1. Welcome screen
2. Profile setup (optional fields)
3. First account creation
4. Quick tutorial
5. Mark `onboarding_completed = true`

### Phase 6: Add Trial Banner

**New Component**: `src/components/TrialBanner.tsx`

**Features**:
- Show days remaining
- Upgrade CTA
- Dismissible
- Show on all pages during trial

### Phase 7: Edge Functions

**Files to Create**:
1. `supabase/functions/check-trial-expiration/index.ts`
2. `supabase/functions/send-trial-reminders/index.ts`
3. `supabase/functions/handle-payment-webhook/index.ts`

## Detailed Implementation

### 1. Updated handle_new_signup() Trigger

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
    v_default_plan_id UUID;
    v_retry_count INT := 0;
    v_max_retries INT := 3;
    v_error_message TEXT;
BEGIN
    -- Extract metadata
    v_first_name := NEW.raw_user_meta_data->>'first_name';
    v_last_name := NEW.raw_user_meta_data->>'last_name';
    v_username := NEW.raw_user_meta_data->>'username';
    v_signup_source := COALESCE(NEW.raw_user_meta_data->>'signup_source', 'web');
    v_referred_by := NEW.raw_user_meta_data->>'referred_by';
    
    -- Generate username if not provided
    IF v_username IS NULL OR v_username = '' THEN
        v_username := generate_username_from_email(NEW.email);
    END IF;
    
    -- Generate affiliate code
    v_affiliate_code := generate_affiliate_code();
    
    -- Retry loop
    WHILE v_retry_count < v_max_retries LOOP
        BEGIN
            -- Create app_users
            INSERT INTO app_users (
                id, email, username, first_name, last_name,
                affiliate_code, referred_by, subscription_status,
                trial_end_date, signup_source, email_verified,
                profile_completed
            ) VALUES (
                NEW.id, NEW.email, v_username, v_first_name, v_last_name,
                v_affiliate_code, v_referred_by, 'trialing',
                NOW() + INTERVAL '7 days', v_signup_source,
                NEW.email_confirmed_at IS NOT NULL, false
            );
            
            -- Create trader_profiles
            INSERT INTO trader_profiles (user_id)
            VALUES (NEW.id);
            
            -- Create default settings
            INSERT INTO user_settings (user_id, key, value) VALUES
                (NEW.id, 'theme', '"light"'),
                (NEW.id, 'currency', '"USD"'),
                (NEW.id, 'timezone', '"UTC"'),
                (NEW.id, 'notifications', '{"email": true, "push": true}');
            
            -- Get default plan
            SELECT id INTO v_default_plan_id
            FROM subscription_plans
            WHERE is_default = true AND plan_type = 'trial'
            LIMIT 1;
            
            -- Create trial subscription
            IF v_default_plan_id IS NOT NULL THEN
                INSERT INTO user_subscriptions (
                    user_id, plan_id, status, billing_cycle,
                    current_period_start, current_period_end,
                    next_billing_date, payment_gateway
                ) VALUES (
                    NEW.id, v_default_plan_id, 'trialing', 'monthly',
                    NOW(), NOW() + INTERVAL '7 days',
                    NOW() + INTERVAL '7 days', 'trial'
                );
            END IF;
            
            -- Log successful creation
            INSERT INTO user_creation_log (
                user_id, auth_user_id, email, signup_method,
                signup_source, profile_created, profile_creation_attempts
            ) VALUES (
                NEW.id, NEW.id, NEW.email,
                COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
                v_signup_source, true, v_retry_count + 1
            );
            
            EXIT; -- Success
            
        EXCEPTION WHEN OTHERS THEN
            v_retry_count := v_retry_count + 1;
            v_error_message := SQLERRM;
            
            IF v_retry_count >= v_max_retries THEN
                -- Log failure
                INSERT INTO user_creation_log (
                    auth_user_id, email, signup_method, signup_source,
                    profile_created, profile_creation_attempts,
                    profile_creation_error
                ) VALUES (
                    NEW.id, NEW.email,
                    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
                    v_signup_source, false, v_retry_count, v_error_message
                );
                
                RAISE EXCEPTION 'Failed to create user profile: %', v_error_message;
            END IF;
            
            -- Wait before retry
            PERFORM pg_sleep(POWER(2, v_retry_count - 1));
        END;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Simplified AuthContext

Key changes:
- Remove `auth_id` → use `id`
- Remove manual profile creation
- Wait for trigger with polling
- Better error handling

### 3. Simplified Auth.tsx

Key changes:
- Remove RPC calls
- Just call `supabase.auth.signUp()` with metadata
- Let trigger handle everything
- Poll for profile creation
- Better loading states

## Security Considerations

### 1. Password Security
- ✅ Supabase uses bcrypt with 10+ rounds
- ✅ Passwords never stored in plain text
- ✅ Password reset uses secure tokens

### 2. Session Security
- ✅ HTTP-only cookies for tokens
- ✅ Secure flag in production
- ✅ SameSite=Lax for CSRF protection
- ✅ Automatic token refresh

### 3. Email Verification
- ✅ Required for email/password signups
- ✅ Not required for OAuth (Google verifies)
- ✅ Tokens expire after 24 hours
- ✅ Can resend confirmation

### 4. RLS Policies
- ✅ Users can only access their own data
- ✅ Public data accessible to authenticated users
- ✅ Admin role with elevated permissions

## Testing Plan

### Unit Tests
- [ ] Test username generation
- [ ] Test affiliate code generation
- [ ] Test password validation
- [ ] Test email validation

### Integration Tests
- [ ] Test complete signup flow
- [ ] Test email confirmation
- [ ] Test OAuth flow
- [ ] Test password reset
- [ ] Test session management
- [ ] Test trial creation
- [ ] Test profile creation via trigger

### E2E Tests
- [ ] User can sign up with email
- [ ] User receives confirmation email
- [ ] User can confirm email
- [ ] User can sign in
- [ ] User can reset password
- [ ] User can sign in with Google
- [ ] Trial is created automatically
- [ ] Profile is created automatically

## Success Criteria

- ✅ User can sign up in < 3 seconds
- ✅ Profile created automatically via trigger
- ✅ Trial starts immediately
- ✅ Email confirmation works
- ✅ OAuth works seamlessly
- ✅ Password reset works
- ✅ Sessions persist across reloads
- ✅ Errors are user-friendly
- ✅ Retry logic handles failures
- ✅ No manual profile creation needed

## Next Steps

1. ✅ Update database trigger (add signup_source, email_verified)
2. ⏳ Update AuthContext.tsx
3. ⏳ Update Auth.tsx
4. ⏳ Create EmailConfirmation.tsx
5. ⏳ Create Onboarding.tsx
6. ⏳ Create TrialBanner.tsx
7. ⏳ Create edge functions
8. ⏳ Test complete flow
9. ⏳ Deploy to production

---

**Status**: Ready for Implementation
**Last Updated**: November 23, 2024
**Estimated Time**: 4-6 hours
