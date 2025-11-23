# Implementation Tasks: TradeLens Authentication & Trial Flow

## Phase 1: Database Setup

### Task 1.1: Create Core Auth Tables Migration
**Status**: Not Started
**Priority**: High
**Estimated Time**: 2 hours

**Description**: Create migration file for app_users, trader_profiles, and user_settings tables with proper constraints, indexes, and RLS policies.

**Acceptance Criteria**:
- [ ] Migration file created in supabase/migrations/
- [ ] app_users table with all required columns
- [ ] trader_profiles table with foreign key to app_users
- [ ] user_settings table with unique constraint
- [ ] All indexes created
- [ ] RLS policies applied
- [ ] Migration applies successfully locally

**Files to Create/Modify**:
- `supabase/migrations/[timestamp]_create_auth_tables.sql`

---

### Task 1.2: Create Subscription Tables Migration
**Status**: Not Started
**Priority**: High
**Estimated Time**: 2 hours

**Description**: Create migration file for subscription_plans, user_subscriptions, and payment_history tables.

**Acceptance Criteria**:
- [ ] Migration file created
- [ ] subscription_plans table with plan details
- [ ] user_subscriptions table with status tracking
- [ ] payment_history table with gateway details
- [ ] All indexes created
- [ ] RLS policies applied
- [ ] Migration applies successfully locally

**Files to Create/Modify**:
- `supabase/migrations/[timestamp]_create_subscription_tables.sql`

---

### Task 1.3: Create Database Functions and Triggers
**Status**: Not Started
**Priority**: High
**Estimated Time**: 3 hours

**Description**: Create handle_new_signup() trigger function with retry logic and error handling.

**Acceptance Criteria**:
- [ ] handle_new_signup() function created
- [ ] Trigger attached to auth.users INSERT
- [ ] Creates app_users record
- [ ] Creates trader_profiles record
- [ ] Creates user_subscriptions with trial status
- [ ] Sets trial_end_date to NOW() + 7 days
- [ ] Includes retry logic (3 attempts)
- [ ] Logs errors appropriately
- [ ] update_updated_at_column() function created
- [ ] Triggers attached to all relevant tables

**Files to Create/Modify**:
- `supabase/migrations/[timestamp]_create_auth_functions.sql`

---

### Task 1.4: Seed Subscription Plans
**Status**: Not Started
**Priority**: High
**Estimated Time**: 1 hour

**Description**: Create seed data for subscription plans (Free Trial, Basic, Pro, Enterprise).

**Acceptance Criteria**:
- [ ] Seed file created
- [ ] At least 3 subscription plans defined
- [ ] Plans include pricing, features, limits
- [ ] Seed applies successfully locally

**Files to Create/Modify**:
- `supabase/seeds/[timestamp]_seed_subscription_plans.sql`

---

## Phase 2: Frontend Auth Components

### Task 2.1: Fix AuthContext TypeScript Issues
**Status**: Not Started
**Priority**: High
**Estimated Time**: 30 minutes

**Description**: Fix TypeScript errors in AuthContext.tsx (unused imports, type mismatches).

**Acceptance Criteria**:
- [ ] Remove unused imports (ReactNode, Session, SupabaseAuthError)
- [ ] Fix USER_DELETED event type issue
- [ ] No TypeScript errors in AuthContext.tsx
- [ ] All existing functionality still works

**Files to Modify**:
- `src/context/AuthContext.tsx`

---

### Task 2.2: Create SignUp Component
**Status**: Not Started
**Priority**: High
**Estimated Time**: 3 hours

**Description**: Create comprehensive signup component with email/password and OAuth options.

**Acceptance Criteria**:
- [ ] Email/password form with validation
- [ ] Google OAuth button
- [ ] Loading states
- [ ] Error display with retry option
- [ ] Success message for email confirmation
- [ ] Link to sign in page
- [ ] Responsive design
- [ ] Accessibility compliant

**Files to Create**:
- `src/components/auth/SignUp.tsx`
- `src/pages/SignUpPage.tsx` (if needed)

---

### Task 2.3: Create SignIn Component
**Status**: Not Started
**Priority**: High
**Estimated Time**: 2 hours

**Description**: Create sign in component with email/password and OAuth options.

**Acceptance Criteria**:
- [ ] Email/password form with validation
- [ ] Google OAuth button
- [ ] Forgot password link
- [ ] Loading states
- [ ] Error display
- [ ] Email confirmation reminder
- [ ] Link to sign up page
- [ ] Responsive design

**Files to Create**:
- `src/components/auth/SignIn.tsx`
- `src/pages/SignInPage.tsx` (if needed)

---

### Task 2.4: Create Password Reset Flow
**Status**: Not Started
**Priority**: Medium
**Estimated Time**: 2 hours

**Description**: Create forgot password and reset password components.

**Acceptance Criteria**:
- [ ] ForgotPassword component with email input
- [ ] ResetPassword component with new password input
- [ ] Email sent confirmation message
- [ ] Password updated confirmation
- [ ] Error handling
- [ ] Link expiration handling

**Files to Create**:
- `src/components/auth/ForgotPassword.tsx`
- `src/components/auth/ResetPassword.tsx`

---

### Task 2.5: Create Email Confirmation Flow
**Status**: Not Started
**Priority**: High
**Estimated Time**: 2 hours

**Description**: Handle email confirmation redirects and display appropriate messages.

**Acceptance Criteria**:
- [ ] Confirmation success page
- [ ] Confirmation error page
- [ ] Resend confirmation email option
- [ ] Redirect to dashboard after confirmation
- [ ] Handle expired links

**Files to Create**:
- `src/components/auth/EmailConfirmation.tsx`
- `src/pages/ConfirmEmailPage.tsx`

---

## Phase 3: Trial Management

### Task 3.1: Create TrialBanner Component
**Status**: Not Started
**Priority**: High
**Estimated Time**: 2 hours

**Description**: Create banner component to display trial status and days remaining.

**Acceptance Criteria**:
- [ ] Shows days remaining in trial
- [ ] Upgrade CTA button
- [ ] Dismissible (stores preference)
- [ ] Different styles for 7, 3, 1 days remaining
- [ ] Only shows for trial users
- [ ] Responsive design

**Files to Create**:
- `src/components/subscription/TrialBanner.tsx`

---

### Task 3.2: Add Trial Status to Dashboard
**Status**: Not Started
**Priority**: Medium
**Estimated Time**: 1 hour

**Description**: Display trial information prominently on dashboard.

**Acceptance Criteria**:
- [ ] Trial status card on dashboard
- [ ] Days remaining display
- [ ] Progress bar
- [ ] Upgrade button
- [ ] Feature comparison link

**Files to Modify**:
- `src/pages/Dashboard.tsx` (or equivalent)

---

### Task 3.3: Create Trial Expiration Edge Function
**Status**: Not Started
**Priority**: High
**Estimated Time**: 3 hours

**Description**: Create scheduled edge function to check and expire trials daily.

**Acceptance Criteria**:
- [ ] Edge function created
- [ ] Queries users with expired trials
- [ ] Updates subscription_status to 'expired'
- [ ] Creates notifications
- [ ] Sends expiration emails via Brevo
- [ ] Logs execution results
- [ ] Scheduled to run daily at 00:00 UTC
- [ ] Error handling and retries

**Files to Create**:
- `supabase/functions/check-trial-expiration/index.ts`
- `supabase/functions/check-trial-expiration/deno.json`

---

### Task 3.4: Create Trial Reminder Edge Function
**Status**: Not Started
**Priority**: High
**Estimated Time**: 2 hours

**Description**: Create scheduled edge function to send trial reminder emails.

**Acceptance Criteria**:
- [ ] Edge function created
- [ ] Queries users with trials ending in 3 days
- [ ] Queries users with trials ending in 1 day
- [ ] Sends reminder emails via Brevo
- [ ] Prevents duplicate reminders
- [ ] Logs execution results
- [ ] Scheduled to run daily at 12:00 UTC

**Files to Create**:
- `supabase/functions/send-trial-reminders/index.ts`

---

### Task 3.5: Set Up Brevo Email Templates
**Status**: Not Started
**Priority**: High
**Estimated Time**: 3 hours

**Description**: Create email templates in Brevo for all auth and trial emails.

**Acceptance Criteria**:
- [ ] Welcome email template
- [ ] Email confirmation template
- [ ] Trial reminder (3 days) template
- [ ] Trial reminder (1 day) template
- [ ] Trial expired template
- [ ] Password reset template
- [ ] Payment confirmation template
- [ ] All templates tested

**External Work**: Brevo dashboard

---

## Phase 4: Payment Integration

### Task 4.1: Create UpgradeModal Component
**Status**: Not Started
**Priority**: Medium
**Estimated Time**: 4 hours

**Description**: Create modal for plan selection and upgrade flow.

**Acceptance Criteria**:
- [ ] Plan comparison display
- [ ] Monthly/yearly toggle
- [ ] Pricing display
- [ ] Feature list per plan
- [ ] Coupon code input
- [ ] Payment gateway selection (auto-detect location)
- [ ] Loading states
- [ ] Error handling

**Files to Create**:
- `src/components/subscription/UpgradeModal.tsx`
- `src/components/subscription/PlanCard.tsx`

---

### Task 4.2: Integrate Cashfree SDK
**Status**: Not Started
**Priority**: Medium
**Estimated Time**: 4 hours

**Description**: Integrate Cashfree payment gateway for Indian users.

**Acceptance Criteria**:
- [ ] Cashfree SDK installed
- [ ] Create order API endpoint
- [ ] Redirect to Cashfree checkout
- [ ] Handle success/failure redirects
- [ ] Store order details in database
- [ ] Test with Cashfree sandbox

**Files to Create/Modify**:
- `src/services/cashfree.ts`
- `src/hooks/useCashfree.ts`

---

### Task 4.3: Integrate Stripe SDK
**Status**: Not Started
**Priority**: Medium
**Estimated Time**: 4 hours

**Description**: Integrate Stripe payment gateway for international users.

**Acceptance Criteria**:
- [ ] Stripe SDK installed
- [ ] Create checkout session API endpoint
- [ ] Redirect to Stripe checkout
- [ ] Handle success/failure redirects
- [ ] Store session details in database
- [ ] Test with Stripe test mode

**Files to Create/Modify**:
- `src/services/stripe.ts`
- `src/hooks/useStripe.ts`

---

### Task 4.4: Create Payment Webhook Edge Function
**Status**: Not Started
**Priority**: High
**Estimated Time**: 4 hours

**Description**: Create edge function to handle payment webhooks from Cashfree and Stripe.

**Acceptance Criteria**:
- [ ] Edge function created
- [ ] Validates Cashfree HMAC signature
- [ ] Validates Stripe signature
- [ ] Extracts payment details
- [ ] Updates user_subscriptions atomically
- [ ] Creates payment_history record
- [ ] Sends confirmation email
- [ ] Returns 200 OK
- [ ] Error handling and logging
- [ ] Idempotency handling

**Files to Create**:
- `supabase/functions/handle-payment-webhook/index.ts`

---

## Phase 5: Onboarding

### Task 5.1: Create OnboardingWizard Component
**Status**: Not Started
**Priority**: Medium
**Estimated Time**: 6 hours

**Description**: Create multi-step onboarding wizard for new users.

**Acceptance Criteria**:
- [ ] Step 1: Welcome and profile setup
- [ ] Step 2: Trading preferences
- [ ] Step 3: Create first account
- [ ] Step 4: Create first strategy (optional)
- [ ] Step 5: Tour of features
- [ ] Progress indicator
- [ ] Skip option
- [ ] Save progress
- [ ] Completion tracking

**Files to Create**:
- `src/components/onboarding/OnboardingWizard.tsx`
- `src/components/onboarding/steps/WelcomeStep.tsx`
- `src/components/onboarding/steps/ProfileStep.tsx`
- `src/components/onboarding/steps/PreferencesStep.tsx`
- `src/components/onboarding/steps/AccountStep.tsx`
- `src/components/onboarding/steps/TourStep.tsx`

---

### Task 5.2: Add Onboarding Redirect Logic
**Status**: Not Started
**Priority**: Medium
**Estimated Time**: 1 hour

**Description**: Redirect new users to onboarding wizard on first login.

**Acceptance Criteria**:
- [ ] Check onboarding_completed flag
- [ ] Redirect to onboarding if not completed
- [ ] Allow skip and resume later
- [ ] Update flag on completion

**Files to Modify**:
- `src/App.tsx` or routing logic

---

## Phase 6: Testing & Polish

### Task 6.1: Write Unit Tests for Auth Functions
**Status**: Not Started
**Priority**: Low
**Estimated Time**: 4 hours

**Description**: Write unit tests for AuthContext and auth utilities.

**Acceptance Criteria**:
- [ ] Test signIn function
- [ ] Test signUp function
- [ ] Test signOut function
- [ ] Test password reset
- [ ] Test error handling
- [ ] Test retry logic
- [ ] 80%+ code coverage

**Files to Create**:
- `src/context/__tests__/AuthContext.test.tsx`

---

### Task 6.2: Integration Testing
**Status**: Not Started
**Priority**: Medium
**Estimated Time**: 4 hours

**Description**: Test complete auth flows end-to-end.

**Acceptance Criteria**:
- [ ] Test signup → confirmation → login flow
- [ ] Test OAuth flow
- [ ] Test password reset flow
- [ ] Test trial expiration
- [ ] Test payment webhook
- [ ] Document test results

**Files to Create**:
- `tests/integration/auth.test.ts`

---

### Task 6.3: Accessibility Audit
**Status**: Not Started
**Priority**: Low
**Estimated Time**: 2 hours

**Description**: Ensure all auth components are accessible.

**Acceptance Criteria**:
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] ARIA labels present
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] Error messages announced

---

### Task 6.4: Performance Optimization
**Status**: Not Started
**Priority**: Low
**Estimated Time**: 2 hours

**Description**: Optimize auth flow performance.

**Acceptance Criteria**:
- [ ] Lazy load auth components
- [ ] Optimize database queries
- [ ] Add loading skeletons
- [ ] Reduce bundle size
- [ ] Measure and document improvements

---

## Deployment Checklist

### Pre-Deployment
- [ ] All migrations tested locally
- [ ] All edge functions tested locally
- [ ] Environment variables configured
- [ ] Brevo templates created
- [ ] Payment gateways configured (sandbox)
- [ ] RLS policies verified
- [ ] Database backups enabled

### Deployment Steps
1. [ ] Apply migrations to production database
2. [ ] Deploy edge functions
3. [ ] Configure webhook URLs in payment gateways
4. [ ] Configure scheduled functions (cron)
5. [ ] Update frontend environment variables
6. [ ] Deploy frontend to production
7. [ ] Test signup flow in production
8. [ ] Test payment flow with test cards
9. [ ] Monitor logs for errors

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check email delivery rates
- [ ] Verify trial expiration job runs
- [ ] Test payment webhooks
- [ ] Gather user feedback
- [ ] Document any issues

## Notes

- All tasks should be completed in order within each phase
- High priority tasks must be completed before moving to next phase
- Medium and Low priority tasks can be deferred if needed
- Each task should include proper error handling and logging
- All user-facing text should be clear and helpful
- Security should be considered in every task
