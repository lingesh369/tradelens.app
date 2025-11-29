# Requirements Document: TradeLens Authentication & Trial Flow

## Introduction

This document outlines the requirements for implementing a production-ready authentication and trial subscription system for TradeLens. The system follows industry-standard practices for user onboarding, trial management, and payment gateway integration, ensuring a seamless user experience from signup through subscription conversion.

## Glossary

- **Auth User**: A user record in Supabase Auth (auth.users table)
- **App User**: A user profile record in the application database (app_users table)
- **Trial Period**: A 7-day free trial period automatically granted to new users
- **Trial Conversion**: The process of converting a trial user to a paid subscriber
- **Payment Gateway**: External payment processor (Cashfree, Stripe, etc.)
- **Subscription Status**: Current state of user's subscription (trial, active, expired, cancelled)
- **Email Confirmation**: Email verification process required before account activation
- **OAuth Provider**: Third-party authentication provider (Google, GitHub, etc.)
- **Session Management**: Handling user authentication state and token refresh
- **Onboarding Flow**: Guided process for new users to set up their account

## Requirements

### Requirement 1: User Registration and Signup

**User Story:** As a new user, I want to create an account quickly and easily, so that I can start using TradeLens immediately with a free trial.

#### Acceptance Criteria

1. WHEN a user signs up with email and password, THEN the TradeLens System SHALL collect email, password, username, first_name (optional), last_name (optional) and create an auth.users record
2. WHEN a user provides a username, THEN the TradeLens System SHALL validate it is 3-20 characters, alphanumeric with underscores only, and unique
3. WHEN a user signs up via OAuth (Google), THEN the TradeLens System SHALL create an auth.users record without requiring email confirmation and extract name from Google profile
4. WHEN an auth.users record is created, THEN the TradeLens System SHALL automatically trigger creation of app_users (with username, first_name, last_name, user_role='user'), trader_profiles, user_subscriptions, and user_settings records
5. WHEN a new user is created, THEN the TradeLens System SHALL automatically grant a 7-day free trial with trial_end_date set to NOW() + 7 days and subscription_status='trialing'
6. WHEN a new user is created, THEN the TradeLens System SHALL generate a unique affiliate_code for the user to share with others
7. WHEN a user signs up with a referral code, THEN the TradeLens System SHALL store the referred_by field with the referrer's affiliate_code
8. WHEN a user attempts to sign up with an existing email, THEN the TradeLens System SHALL return a clear error message and suggest signing in instead
9. WHEN a user attempts to sign up with an existing username, THEN the TradeLens System SHALL return a clear error message prompting them to choose a different username

### Requirement 2: Email Confirmation Flow (OTP-Based)

**User Story:** As a platform administrator, I want to verify user email addresses using secure 6-digit codes, so that we maintain data quality and prevent spam accounts while providing a better user experience.

#### Acceptance Criteria

1. WHEN a user signs up with email/password, THEN the TradeLens System SHALL send a 6-digit OTP code to their email
2. WHEN a user enters the correct OTP code, THEN the TradeLens System SHALL mark the email as confirmed and redirect to the dashboard
3. WHEN a user attempts to sign in without confirming email, THEN the TradeLens System SHALL display a message prompting email confirmation
4. WHEN a user requests a new OTP code, THEN the TradeLens System SHALL resend a new 6-digit code
5. WHEN an OTP code expires after 1 hour, THEN the TradeLens System SHALL allow the user to request a new code
6. WHEN a user enters an invalid OTP code, THEN the TradeLens System SHALL display an error and allow retry
7. WHEN a user pastes a 6-digit code, THEN the TradeLens System SHALL auto-fill all input fields

### Requirement 3: OAuth Authentication Flow

**User Story:** As a user, I want to sign in with my Google account, so that I can access TradeLens without creating a new password.

#### Acceptance Criteria

1. WHEN a user clicks "Sign in with Google", THEN the TradeLens System SHALL redirect to Google OAuth consent screen
2. WHEN Google OAuth succeeds, THEN the TradeLens System SHALL create or retrieve the user account and redirect to dashboard
3. WHEN OAuth fails, THEN the TradeLens System SHALL display a clear error message and allow retry
4. WHEN a user signs in with OAuth for the first time, THEN the TradeLens System SHALL automatically create app_users and grant a 7-day trial
5. WHEN a user with existing email signs in via OAuth, THEN the TradeLens System SHALL link the OAuth provider to the existing account

### Requirement 4: Trial Subscription Management

**User Story:** As a new user, I want to receive a 7-day free trial automatically, so that I can evaluate TradeLens before committing to a paid plan.

#### Acceptance Criteria

1. WHEN a new user account is created, THEN the TradeLens System SHALL create a user_subscriptions record with status='trialing' and trial_end_date = NOW() + 7 days
2. WHEN a trial user accesses the platform, THEN the TradeLens System SHALL display days remaining in trial prominently
3. WHEN a trial has 3 days remaining, THEN the TradeLens System SHALL send a reminder email with upgrade options
4. WHEN a trial has 1 day remaining, THEN the TradeLens System SHALL send a final reminder email with upgrade options
5. WHEN a trial expires (trial_end_date < NOW()), THEN the TradeLens System SHALL update subscription_status to 'expired' and restrict access to paid features

### Requirement 5: Trial Expiration and Access Control

**User Story:** As a platform administrator, I want to automatically restrict access when trials expire, so that users are encouraged to upgrade to paid plans.

#### Acceptance Criteria

1. WHEN a trial expires, THEN the TradeLens System SHALL update subscription_status to 'expired' via scheduled edge function
2. WHEN an expired trial user signs in, THEN the TradeLens System SHALL redirect to the upgrade page with a clear message
3. WHEN an expired trial user attempts to access paid features, THEN the TradeLens System SHALL display an upgrade prompt modal
4. WHEN a trial expires, THEN the TradeLens System SHALL send a trial expiration email with upgrade options and benefits
5. WHEN an expired user upgrades, THEN the TradeLens System SHALL immediately restore full access to all features

### Requirement 6: Session Management and Token Refresh

**User Story:** As a user, I want to remain signed in across browser sessions, so that I don't have to re-authenticate frequently.

#### Acceptance Criteria

1. WHEN a user signs in, THEN the TradeLens System SHALL create a session with access token (1 hour expiry) and refresh token (30 days expiry)
2. WHEN an access token expires, THEN the TradeLens System SHALL automatically refresh the token using the refresh token
3. WHEN a refresh token expires or is invalid, THEN the TradeLens System SHALL sign out the user and redirect to login
4. WHEN a user signs out, THEN the TradeLens System SHALL invalidate all tokens and clear local storage
5. WHEN a user is inactive for 30 days, THEN the TradeLens System SHALL expire the session and require re-authentication

### Requirement 7: Password Reset Flow (OTP-Based)

**User Story:** As a user, I want to reset my password using a secure code if I forget it, so that I can regain access to my account.

#### Acceptance Criteria

1. WHEN a user clicks "Forgot Password", THEN the TradeLens System SHALL display a form to enter email address
2. WHEN a user submits the forgot password form, THEN the TradeLens System SHALL send a 6-digit OTP code to their email
3. WHEN a user enters the correct OTP code, THEN the TradeLens System SHALL redirect to a password reset form
4. WHEN a user submits a new password, THEN the TradeLens System SHALL update the password and redirect to login with success message
5. WHEN an OTP code expires after 1 hour, THEN the TradeLens System SHALL allow the user to request a new code
6. WHEN a user enters an invalid OTP code, THEN the TradeLens System SHALL display an error and allow retry

### Requirement 8: User Profile Initialization

**User Story:** As a new user, I want my profile to be automatically set up, so that I can start using the platform immediately.

#### Acceptance Criteria

1. WHEN a new auth.users record is created, THEN the TradeLens System SHALL trigger handle_new_signup() to create app_users record
2. WHEN app_users is created, THEN the TradeLens System SHALL populate email, username, first_name, last_name from auth metadata
3. WHEN app_users is created, THEN the TradeLens System SHALL set user_role to 'user' by default
4. WHEN app_users is created, THEN the TradeLens System SHALL generate full_name automatically from first_name and last_name
5. WHEN app_users is created, THEN the TradeLens System SHALL generate a unique affiliate_code for the user
6. WHEN app_users is created, THEN the TradeLens System SHALL create a trader_profiles record with default values (total_trades=0, win_rate=0, is_public=false)
7. WHEN app_users is created, THEN the TradeLens System SHALL create default user_settings records (theme, currency, timezone, notifications)
8. WHEN username is not provided in signup, THEN the TradeLens System SHALL generate one from email prefix and ensure uniqueness
9. WHEN profile creation fails, THEN the TradeLens System SHALL retry up to 3 times with exponential backoff (1s, 2s, 4s) before alerting the user

### Requirement 9: Onboarding Flow

**User Story:** As a new user, I want a guided onboarding experience, so that I understand how to use TradeLens effectively.

#### Acceptance Criteria

1. WHEN a new user first signs in, THEN the TradeLens System SHALL redirect to an onboarding wizard
2. WHEN a user completes onboarding steps, THEN the TradeLens System SHALL update onboarding_completed flag to true
3. WHEN a user skips onboarding, THEN the TradeLens System SHALL allow access to dashboard but show onboarding prompts
4. WHEN a user completes onboarding, THEN the TradeLens System SHALL send a welcome email with getting started tips
5. WHEN a user returns before completing onboarding, THEN the TradeLens System SHALL resume from the last incomplete step

### Requirement 10: Payment Gateway Integration

**User Story:** As a user, I want to upgrade from trial to a paid plan, so that I can continue using TradeLens after my trial expires.

#### Acceptance Criteria

1. WHEN a user clicks "Upgrade", THEN the TradeLens System SHALL display available subscription plans with pricing
2. WHEN a user selects a plan, THEN the TradeLens System SHALL redirect to the payment gateway (Cashfree/Stripe) checkout
3. WHEN payment succeeds, THEN the TradeLens System SHALL receive a webhook, update subscription status to 'active', and send confirmation email
4. WHEN payment fails, THEN the TradeLens System SHALL display an error message and allow retry
5. WHEN a subscription is created, THEN the TradeLens System SHALL record payment_history with gateway details

### Requirement 11: Multi-Gateway Payment Support

**User Story:** As a platform administrator, I want to support multiple payment gateways, so that users can pay using their preferred method.

#### Acceptance Criteria

1. WHEN a user is in India, THEN the TradeLens System SHALL default to Cashfree payment gateway
2. WHEN a user is outside India, THEN the TradeLens System SHALL default to Stripe payment gateway
3. WHEN a payment gateway is unavailable, THEN the TradeLens System SHALL fallback to the alternate gateway
4. WHEN a webhook is received, THEN the TradeLens System SHALL validate the signature based on the gateway (Cashfree HMAC or Stripe signature)
5. WHEN a subscription is created, THEN the TradeLens System SHALL store gateway_subscription_id and payment_gateway for future reference

### Requirement 12: Subscription Status Synchronization

**User Story:** As a platform administrator, I want subscription status to be synchronized with payment gateways, so that access control is accurate.

#### Acceptance Criteria

1. WHEN a payment webhook is received, THEN the TradeLens System SHALL update user_subscriptions status atomically
2. WHEN a subscription is cancelled in the gateway, THEN the TradeLens System SHALL update status to 'cancelled' and set cancel_at_period_end
3. WHEN a subscription renewal fails, THEN the TradeLens System SHALL update status to 'past_due' and send payment failure email
4. WHEN a subscription is refunded, THEN the TradeLens System SHALL update status to 'cancelled' and record refund in payment_history
5. WHEN subscription status changes, THEN the TradeLens System SHALL trigger a notification to the user

### Requirement 13: Trial to Paid Conversion Tracking

**User Story:** As a platform administrator, I want to track trial conversion rates, so that I can optimize the onboarding experience.

#### Acceptance Criteria

1. WHEN a trial user upgrades to paid, THEN the TradeLens System SHALL record the conversion event with timestamp
2. WHEN a trial expires without conversion, THEN the TradeLens System SHALL record the expiration event
3. WHEN conversion events are recorded, THEN the TradeLens System SHALL include trial_start_date, trial_end_date, and days_to_conversion
4. WHEN an admin views conversion metrics, THEN the TradeLens System SHALL display conversion rate, average days to conversion, and revenue
5. WHEN a user converts, THEN the TradeLens System SHALL update subscription_status from 'trialing' to 'active'

### Requirement 14: Error Handling and Retry Logic

**User Story:** As a user, I want the system to handle errors gracefully, so that temporary issues don't prevent me from accessing my account.

#### Acceptance Criteria

1. WHEN a database trigger fails, THEN the TradeLens System SHALL retry up to 3 times with exponential backoff (1s, 2s, 4s)
2. WHEN a network error occurs during authentication, THEN the TradeLens System SHALL display a user-friendly error and allow retry
3. WHEN a webhook delivery fails, THEN the TradeLens System SHALL retry with exponential backoff up to 5 times
4. WHEN profile creation fails after retries, THEN the TradeLens System SHALL log the error and alert administrators
5. WHEN an error occurs, THEN the TradeLens System SHALL display context-specific error messages (not generic "something went wrong")

### Requirement 15: Security and Data Protection

**User Story:** As a user, I want my account and payment information to be secure, so that my data is protected from unauthorized access.

#### Acceptance Criteria

1. WHEN a user signs up, THEN the TradeLens System SHALL hash passwords using bcrypt with minimum 10 rounds
2. WHEN a session is created, THEN the TradeLens System SHALL use secure, httpOnly cookies for token storage
3. WHEN a webhook is received, THEN the TradeLens System SHALL validate the signature before processing
4. WHEN sensitive data is logged, THEN the TradeLens System SHALL redact passwords, tokens, and payment details
5. WHEN a user account is accessed, THEN the TradeLens System SHALL enforce Row Level Security policies

### Requirement 16: Email Notifications

**User Story:** As a user, I want to receive email notifications about my account and subscription, so that I stay informed.

#### Acceptance Criteria

1. WHEN a user signs up, THEN the TradeLens System SHALL send a welcome email with onboarding tips
2. WHEN a trial has 3 days remaining, THEN the TradeLens System SHALL send a reminder email with upgrade CTA
3. WHEN a trial expires, THEN the TradeLens System SHALL send an expiration email with upgrade options
4. WHEN a payment succeeds, THEN the TradeLens System SHALL send a confirmation email with receipt
5. WHEN a subscription is cancelled, THEN the TradeLens System SHALL send a cancellation confirmation email

### Requirement 17: Admin User Management

**User Story:** As an administrator, I want to manage user accounts and subscriptions, so that I can provide support and handle edge cases.

#### Acceptance Criteria

1. WHEN an admin views a user profile, THEN the TradeLens System SHALL display subscription status, trial dates, and payment history
2. WHEN an admin manually grants a subscription, THEN the TradeLens System SHALL update user_subscriptions with payment_gateway='manual'
3. WHEN an admin extends a trial, THEN the TradeLens System SHALL update trial_end_date and send notification to user
4. WHEN an admin cancels a subscription, THEN the TradeLens System SHALL update status and log the admin action
5. WHEN an admin views conversion metrics, THEN the TradeLens System SHALL display trial conversion rates and revenue analytics

### Requirement 18: Coupon and Discount Support

**User Story:** As a user, I want to apply coupon codes during checkout, so that I can receive promotional discounts.

#### Acceptance Criteria

1. WHEN a user enters a coupon code at checkout, THEN the TradeLens System SHALL validate the coupon and apply the discount
2. WHEN a coupon is invalid or expired, THEN the TradeLens System SHALL display a clear error message
3. WHEN a coupon is applied, THEN the TradeLens System SHALL record coupon_usage with user_id and discount_amount
4. WHEN a coupon has usage limits, THEN the TradeLens System SHALL prevent usage beyond the limit
5. WHEN a coupon is applied to a trial conversion, THEN the TradeLens System SHALL apply the discount to the first payment

### Requirement 19: Affiliate Tracking

**User Story:** As a platform administrator, I want to track affiliate referrals, so that I can attribute signups and calculate commissions.

#### Acceptance Criteria

1. WHEN a user signs up with an affiliate code in the URL, THEN the TradeLens System SHALL record the affiliate_code in app_users
2. WHEN an affiliate referral converts to paid, THEN the TradeLens System SHALL calculate and record affiliate commission
3. WHEN an affiliate views their dashboard, THEN the TradeLens System SHALL display referral count, conversion rate, and earnings
4. WHEN a commission is earned, THEN the TradeLens System SHALL create an affiliate_commissions record
5. WHEN an affiliate is paid, THEN the TradeLens System SHALL update commission payment_status to 'paid'

### Requirement 20: Graceful Degradation

**User Story:** As a user, I want the system to work even when some services are unavailable, so that I can still access core features.

#### Acceptance Criteria

1. WHEN email service is unavailable, THEN the TradeLens System SHALL queue emails for later delivery and allow signup to proceed
2. WHEN payment gateway is unavailable, THEN the TradeLens System SHALL display a maintenance message and allow retry
3. WHEN database is under heavy load, THEN the TradeLens System SHALL implement connection pooling and query timeouts
4. WHEN external services fail, THEN the TradeLens System SHALL log errors and alert administrators
5. WHEN a non-critical service fails, THEN the TradeLens System SHALL continue core authentication flow without blocking users
