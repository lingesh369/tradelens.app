# TradeLens Authentication & Trial Flow Specification

## Overview

This specification defines the complete authentication and trial subscription system for TradeLens, a comprehensive trading journal and performance analytics platform.

## Documents

### 📋 [requirements.md](./requirements.md)
Complete requirements document with 20 major requirements covering:
- User registration and signup
- Email confirmation flow
- OAuth authentication (Google)
- Trial subscription management (7-day free trial)
- Trial expiration and access control
- Session management and token refresh
- Password reset flow
- User profile initialization
- Onboarding flow
- Payment gateway integration (Cashfree/Stripe)
- Multi-gateway payment support
- Subscription status synchronization
- Trial to paid conversion tracking
- Error handling and retry logic
- Security and data protection
- Email notifications
- Admin user management
- Coupon and discount support
- Affiliate tracking
- Graceful degradation

### 🏗️ [design.md](./design.md)
Comprehensive design document including:
- System architecture
- Database schema design
- Component specifications
- Edge function implementations
- Email template designs
- Payment gateway integration
- Security measures (RLS policies)
- Error handling strategies
- Testing approach
- Implementation phases
- Success metrics
- Monitoring and alerts

### ✅ [tasks.md](./tasks.md)
Detailed implementation tasks organized by phase:
- **Phase 1**: Database Setup (4 tasks)
- **Phase 2**: Frontend Auth Components (5 tasks)
- **Phase 3**: Trial Management (5 tasks)
- **Phase 4**: Payment Integration (4 tasks)
- **Phase 5**: Onboarding (2 tasks)
- **Phase 6**: Testing & Polish (4 tasks)

Each task includes:
- Status tracking
- Priority level
- Time estimates
- Acceptance criteria
- Files to create/modify

### 🚀 [QUICKSTART.md](./QUICKSTART.md)
Step-by-step implementation guide with:
- Prerequisites checklist
- 8-step implementation process
- Code examples
- Configuration instructions
- Testing procedures
- Deployment checklist
- Common issues and solutions
- Verification checklist

## Key Features

### Authentication
- ✅ Email/password signup and signin
- ✅ Google OAuth integration
- ✅ Email confirmation flow
- ✅ Password reset functionality
- ✅ Session management with automatic token refresh
- ✅ Secure httpOnly cookies
- ✅ Error handling with retry logic

### Trial Management
- ✅ Automatic 7-day free trial on signup
- ✅ Trial status tracking and display
- ✅ Automated trial expiration (daily job)
- ✅ Trial reminder emails (3 days, 1 day before expiration)
- ✅ Trial expiration emails
- ✅ Access control based on subscription status

### Payment Integration
- ✅ Cashfree integration (Indian users)
- ✅ Stripe integration (International users)
- ✅ Webhook handling for payment events
- ✅ Subscription status synchronization
- ✅ Payment history tracking
- ✅ Coupon code support

### User Experience
- ✅ Onboarding wizard for new users
- ✅ Trial banner with days remaining
- ✅ Upgrade modal with plan comparison
- ✅ Email notifications for all key events
- ✅ Clear error messages
- ✅ Loading states and retry options

### Security
- ✅ Row Level Security (RLS) policies
- ✅ Webhook signature validation
- ✅ Password hashing (bcrypt)
- ✅ Secure token storage
- ✅ SQL injection prevention
- ✅ Rate limiting on webhooks

## Database Schema

### Core Tables
- `auth.users` - Supabase Auth managed
- `app_users` - Application user profiles
- `trader_profiles` - Extended trader information
- `user_settings` - User preferences
- `subscription_plans` - Available plans
- `user_subscriptions` - Active subscriptions
- `payment_history` - Payment transactions
- `coupons` - Discount codes
- `coupon_usage` - Coupon redemptions

### Key Relationships
- `app_users.id` → `auth.users.id` (1:1, CASCADE)
- `trader_profiles.user_id` → `app_users.id` (1:1, CASCADE)
- `user_subscriptions.user_id` → `app_users.id` (many:1, CASCADE)
- `payment_history.user_id` → `app_users.id` (many:1, CASCADE)

## Edge Functions

### Webhook Handlers
- `handle-payment-webhook` - Process payment events from Cashfree/Stripe

### Scheduled Jobs
- `check-trial-expiration` - Daily at 00:00 UTC
- `send-trial-reminders` - Daily at 12:00 UTC

## Email Templates (Brevo)

1. Welcome Email
2. Email Confirmation
3. Trial Reminder (3 days)
4. Trial Reminder (1 day)
5. Trial Expired
6. Password Reset
7. Payment Confirmation

## Implementation Status

### ✅ Completed
- Requirements documentation
- Design documentation
- Task breakdown
- Quick start guide

### 🚧 In Progress
- Database migrations
- Frontend components
- Edge functions

### 📋 Planned
- Testing suite
- Performance optimization
- Analytics integration

## Getting Started

1. Read [QUICKSTART.md](./QUICKSTART.md) for step-by-step instructions
2. Review [requirements.md](./requirements.md) to understand what needs to be built
3. Study [design.md](./design.md) to understand how it should be built
4. Follow [tasks.md](./tasks.md) to track implementation progress

## Prerequisites

- Node.js >= 18.0.0
- Docker Desktop (for local Supabase)
- Supabase CLI installed
- Brevo account (for emails)
- Cashfree account (for Indian payments)
- Stripe account (for international payments)

## Quick Start

```bash
# 1. Start local Supabase
supabase start

# 2. Create and apply migrations
supabase migration new create_auth_tables
# ... add schema ...
supabase db reset

# 3. Start development server
npm run dev

# 4. Test auth flow
# - Sign up at http://localhost:5173/signup
# - Check emails at http://127.0.0.1:54324
# - View database at http://127.0.0.1:54323
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   SignUp     │  │   SignIn     │  │ TrialBanner  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ AuthContext  │  │UpgradeModal  │  │  Onboarding  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Supabase Client
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Supabase Platform                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Auth API   │  │  PostgreSQL  │  │   Storage    │     │
│  │   (GoTrue)   │  │   Database   │  │   (Images)   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │Edge Functions│  │   Triggers   │  │     RLS      │     │
│  │  (Webhooks)  │  │  (Auto-ops)  │  │  (Security)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Webhooks / API
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  External Services                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Cashfree   │  │     Brevo    │  │    Stripe    │     │
│  │   Payments   │  │    Emails    │  │   Payments   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Success Metrics

- User signup completion rate > 80%
- Email confirmation rate > 70%
- Trial to paid conversion rate > 10%
- Payment success rate > 95%
- Average time to first trade < 5 minutes
- User satisfaction score > 4.5/5

## Support

For questions or issues:
1. Review the documentation in this spec folder
2. Check [QUICKSTART.md](./QUICKSTART.md) for common issues
3. Review Supabase logs and error messages
4. Test in local environment first

## Contributing

When implementing features:
1. Follow the task order in [tasks.md](./tasks.md)
2. Update task status as you progress
3. Test thoroughly before moving to next task
4. Document any deviations from the design
5. Update this README if architecture changes

## License

Internal project documentation for TradeLens.

---

**Last Updated**: November 23, 2024
**Version**: 1.0.0
**Status**: Ready for Implementation
