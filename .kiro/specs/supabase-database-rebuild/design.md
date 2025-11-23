# Design Document: TradeLens Supabase Database Rebuild

## Overview

This design document outlines the complete architecture for rebuilding the TradeLens Supabase database from scratch. The design follows industry-standard practices for PostgreSQL database design, including proper normalization, indexing, Row Level Security (RLS), database functions, triggers, and edge functions for serverless operations.

### Goals

1. **Scalability**: Support thousands of concurrent users with millions of trades
2. **Security**: Implement comprehensive RLS policies to protect user data
3. **Performance**: Optimize queries with proper indexing and materialized views
4. **Maintainability**: Use migrations for version control and reproducible deployments
5. **Reliability**: Implement automated backups, audit logging, and error handling
6. **Extensibility**: Design schema to accommodate future features without major refactoring

### Technology Stack

- **Database**: PostgreSQL 15+ (Supabase)
- **Authentication**: Supabase Auth with JWT tokens
- **Storage**: Supabase Storage for images and files
- **Edge Functions**: Deno-based serverless functions
- **Email**: Brevo (formerly Sendinblue) for transactional emails
- **Payment Gateway**: Cashfree for payment processing
- **Migration Tool**: Supabase CLI migration system

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Application                     │
│                  (React + TypeScript + Vite)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS/WebSocket
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Supabase Platform                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Auth API   │  │  Database    │  │   Storage    │     │
│  │   (GoTrue)   │  │ (PostgreSQL) │  │   (S3-like)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Edge Functions│  │  Realtime    │  │   Webhooks   │     │
│  │    (Deno)    │  │  (WebSocket) │  │   Handlers   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ Webhooks/API
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  External Services                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Cashfree   │  │     Brevo    │  │  Analytics   │     │
│  │   Payments   │  │    Emails    │  │   Services   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Database Architecture Layers

1. **Authentication Layer**: Supabase Auth (auth.users) + app_users table
2. **Core Business Layer**: Users, subscriptions, accounts, strategies, trades
3. **Community Layer**: Follows, likes, comments, shared trades
4. **Content Layer**: Journal entries, notes, images
5. **System Layer**: Notifications, settings, audit logs
6. **Analytics Layer**: Aggregated metrics, performance calculations


## Components and Interfaces

### 1. Database Schema Components

#### 1.1 User Management Schema

**Tables:**
- `auth.users` (Supabase managed)
- `app_users` (Application user profiles)
- `trader_profiles` (Extended trader information)
- `user_settings` (User preferences and configuration)

**Relationships:**
- `app_users.id` → `auth.users.id` (1:1, CASCADE DELETE)
- `trader_profiles.user_id` → `app_users.id` (1:1, CASCADE DELETE)
- `user_settings.user_id` → `app_users.id` (1:many, CASCADE DELETE)

#### 1.2 Subscription Management Schema

**Tables:**
- `subscription_plans` (Available subscription tiers)
- `user_subscriptions` (Active user subscriptions)
- `payment_history` (Payment transaction records)
- `coupons` (Discount codes)
- `coupon_usage` (Coupon redemption tracking)

**Relationships:**
- `user_subscriptions.user_id` → `app_users.id` (many:1, CASCADE DELETE)
- `user_subscriptions.plan_id` → `subscription_plans.id` (many:1, RESTRICT)
- `payment_history.user_id` → `app_users.id` (many:1, CASCADE DELETE)
- `coupon_usage.user_id` → `app_users.id` (many:1, CASCADE DELETE)
- `coupon_usage.coupon_id` → `coupons.id` (many:1, RESTRICT)

#### 1.3 Trading Schema

**Tables:**
- `accounts` (Trading accounts)
- `strategies` (Trading strategies)
- `strategy_rules` (Strategy rule definitions)
- `trades` (Individual trade records)
- `trade_metrics` (Calculated trade performance metrics)
- `trade_images` (Trade screenshot/chart images)
- `tags` (User-defined trade tags)
- `trade_tags` (Many-to-many relationship for trade tagging)
- `commissions` (Commission structure per account)

**Relationships:**
- `accounts.user_id` → `app_users.id` (many:1, CASCADE DELETE)
- `strategies.user_id` → `app_users.id` (many:1, CASCADE DELETE)
- `strategy_rules.strategy_id` → `strategies.id` (many:1, CASCADE DELETE)
- `trades.user_id` → `app_users.id` (many:1, CASCADE DELETE)
- `trades.account_id` → `accounts.id` (many:1, SET NULL)
- `trades.strategy_id` → `strategies.id` (many:1, SET NULL)
- `trade_metrics.trade_id` → `trades.id` (1:1, CASCADE DELETE)
- `trade_images.trade_id` → `trades.id` (many:1, CASCADE DELETE)
- `trade_tags.trade_id` → `trades.id` (many:1, CASCADE DELETE)
- `trade_tags.tag_id` → `tags.id` (many:1, CASCADE DELETE)
- `commissions.account_id` → `accounts.id` (many:1, CASCADE DELETE)

#### 1.4 Community Schema

**Tables:**
- `community_follows` (User follow relationships)
- `trade_likes` (Trade like records)
- `trade_comments` (Trade comment records)
- `shared_trades` (Publicly shared trade metadata)

**Relationships:**
- `community_follows.follower_id` → `app_users.id` (many:1, CASCADE DELETE)
- `community_follows.following_id` → `app_users.id` (many:1, CASCADE DELETE)
- `trade_likes.user_id` → `app_users.id` (many:1, CASCADE DELETE)
- `trade_likes.trade_id` → `trades.id` (many:1, CASCADE DELETE)
- `trade_comments.user_id` → `app_users.id` (many:1, CASCADE DELETE)
- `trade_comments.trade_id` → `trades.id` (many:1, CASCADE DELETE)

#### 1.5 Content Schema

**Tables:**
- `journal` (Daily trading journal entries)
- `journal_images` (Journal entry images)
- `notes` (User notes and documentation)

**Relationships:**
- `journal.user_id` → `app_users.id` (many:1, CASCADE DELETE)
- `journal_images.journal_id` → `journal.id` (many:1, CASCADE DELETE)
- `notes.user_id` → `app_users.id` (many:1, CASCADE DELETE)

#### 1.6 Notification Schema

**Tables:**
- `notifications` (User notification records)
- `user_push_tokens` (Push notification device tokens)
- `notification_logs` (Notification delivery logs)

**Relationships:**
- `notifications.user_id` → `app_users.id` (many:1, CASCADE DELETE)
- `user_push_tokens.user_id` → `app_users.id` (many:1, CASCADE DELETE)

#### 1.7 System Schema

**Tables:**
- `email_logs` (Email delivery tracking)
- `subscription_event_logs` (Subscription lifecycle events)
- `user_creation_log` (User signup tracking)
- `affiliate_tracking` (Affiliate referral tracking)
- `affiliate_commissions` (Affiliate commission records)

**Relationships:**
- `email_logs.user_id` → `app_users.id` (many:1, SET NULL)
- `subscription_event_logs.user_id` → `app_users.id` (many:1, CASCADE DELETE)
- `affiliate_tracking.user_id` → `app_users.id` (1:1, CASCADE DELETE)
- `affiliate_commissions.affiliate_id` → `app_users.id` (many:1, CASCADE DELETE)

### 2. Database Function Components

#### 2.1 Trigger Functions

**handle_new_signup()**
- Automatically creates app_users record when auth.users record is created
- Initializes default settings and trial subscription
- Returns NEW record for trigger chain

**update_updated_at_column()**
- Automatically updates updated_at timestamp on record modification
- Applied to all tables with updated_at column
- Returns NEW record with updated timestamp

**calculate_trade_metrics()**
- Calculates P&L, percentage gain, R-multiple, trade duration
- Inserts or updates trade_metrics table
- Triggered on trade INSERT or UPDATE when exit_price is set

**update_account_balance()**
- Updates account current_balance based on trade P&L
- Triggered on trade INSERT or UPDATE when status changes to 'closed'
- Handles partial exits by calculating incremental P&L

**create_notification_on_subscription_change()**
- Creates notification when subscription status changes
- Triggered on user_subscriptions UPDATE
- Includes subscription details in notification metadata

#### 2.2 Utility Functions

**get_user_subscription_status(user_id UUID)**
- Returns current subscription status for a user
- Checks expiration dates and returns 'active', 'expired', or 'trialing'
- Used in RLS policies and application logic

**check_plan_limits(user_id UUID, limit_type TEXT)**
- Checks if user has reached plan limits (accounts, strategies)
- Returns boolean indicating if limit is reached
- Used in RLS policies to prevent exceeding limits

**calculate_aggregate_metrics(user_id UUID, date_from DATE, date_to DATE)**
- Calculates aggregate trading metrics for a user and date range
- Returns JSONB with total P&L, win rate, profit factor, etc.
- Used in analytics queries

**get_shared_trades(limit INT, offset INT)**
- Returns paginated list of publicly shared trades
- Includes trader profile information
- Used in community feed


### 3. Edge Function Components

#### 3.1 Webhook Handlers

**handle-payment-webhook**
- Receives webhooks from Cashfree payment gateway
- Validates webhook signature using HMAC
- Processes payment events (success, failure, refund)
- Updates user_subscriptions and payment_history atomically
- Sends confirmation emails via Brevo
- Returns 200 OK to acknowledge webhook

**handle-email-webhook**
- Receives delivery status webhooks from Brevo
- Updates email_logs with delivery, open, click events
- Used for email analytics and debugging
- Returns 200 OK to acknowledge webhook

#### 3.2 Scheduled Jobs

**check-trial-expiration**
- Runs daily at 00:00 UTC
- Queries users with trial_end_date < NOW()
- Updates subscription_status to 'expired'
- Sends trial expiration emails
- Logs execution results

**check-inactivity**
- Runs daily at 12:00 UTC
- Queries users with no trades in last 7 days
- Sends re-engagement emails with tips
- Logs execution results

**send-journey-emails**
- Runs every 6 hours
- Checks email journey state for each user
- Sends appropriate journey emails (welcome, first trade milestone, etc.)
- Updates journey state in user_settings
- Logs execution results

**cleanup-old-logs**
- Runs weekly on Sunday at 02:00 UTC
- Archives or deletes logs older than 90 days
- Maintains database size and performance
- Logs execution results

#### 3.3 API Endpoints

**generate-export**
- Accepts user_id and export_type (CSV, PDF)
- Queries user's trades with RLS enforcement
- Generates export file asynchronously
- Uploads to Supabase Storage
- Sends notification with download link
- Returns job_id for status tracking

**calculate-analytics**
- Accepts user_id, date_range, filters
- Calculates comprehensive analytics metrics
- Caches results for performance
- Returns JSONB with metrics and charts data
- Used by analytics dashboard

### 4. Storage Components

#### 4.1 Storage Buckets

**trade-images**
- Stores trade screenshots and charts
- Public read access for shared trades
- Private read access for user's own trades
- Max file size: 10MB
- Allowed formats: JPG, PNG, WebP

**journal-images**
- Stores journal entry images
- Private read access only
- Max file size: 10MB
- Allowed formats: JPG, PNG, WebP

**profile-avatars**
- Stores user profile pictures
- Public read access
- Max file size: 2MB
- Allowed formats: JPG, PNG, WebP

**exports**
- Stores generated CSV and PDF exports
- Private read access with expiring signed URLs
- Auto-delete after 7 days
- Max file size: 50MB

#### 4.2 Storage Policies

All storage buckets implement RLS-style policies:
- Users can upload to their own user_id folder
- Users can read from their own user_id folder
- Public buckets allow read access to all authenticated users
- Shared trade images are readable by anyone with the URL


## Data Models

### Core Tables

#### app_users

```sql
CREATE TABLE app_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    username TEXT UNIQUE,
    avatar_url TEXT,
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
    trial_end_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    onboarding_completed BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    affiliate_code TEXT,
    referred_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_app_users_email ON app_users(email);
CREATE INDEX idx_app_users_username ON app_users(username);
CREATE INDEX idx_app_users_subscription_status ON app_users(subscription_status);
CREATE INDEX idx_app_users_trial_end_date ON app_users(trial_end_date) WHERE subscription_status = 'trial';
```

#### trader_profiles

```sql
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
    win_rate DECIMAL(5,2),
    total_pnl DECIMAL(15,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trader_profiles_user_id ON trader_profiles(user_id);
CREATE INDEX idx_trader_profiles_is_public ON trader_profiles(is_public) WHERE is_public = true;
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
    features JSONB NOT NULL DEFAULT '{}',
    limits JSONB NOT NULL DEFAULT '{"accounts": 1, "strategies": 3}',
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
```

#### user_subscriptions

```sql
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled', 'trialing', 'past_due')),
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMPTZ,
    payment_gateway TEXT CHECK (payment_gateway IN ('cashfree', 'stripe', 'manual')),
    gateway_subscription_id TEXT,
    gateway_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_period_end ON user_subscriptions(current_period_end) WHERE status = 'active';
CREATE UNIQUE INDEX idx_user_subscriptions_active ON user_subscriptions(user_id) WHERE status = 'active';
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
```

#### accounts

```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    broker TEXT,
    account_type TEXT CHECK (account_type IN ('live', 'demo', 'paper')),
    initial_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_account_name UNIQUE(user_id, name)
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_is_active ON accounts(is_active) WHERE is_active = true;
```

#### strategies

```sql
CREATE TABLE strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    rules JSONB DEFAULT '[]',
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    total_trades INT DEFAULT 0,
    win_rate DECIMAL(5,2),
    total_pnl DECIMAL(15,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_strategy_name UNIQUE(user_id, name)
);

CREATE INDEX idx_strategies_user_id ON strategies(user_id);
CREATE INDEX idx_strategies_is_active ON strategies(is_active) WHERE is_active = true;
```

#### trades

```sql
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
    instrument TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('long', 'short', 'buy', 'sell')),
    entry_price DECIMAL(15,4) NOT NULL,
    exit_price DECIMAL(15,4),
    quantity DECIMAL(15,4) NOT NULL,
    entry_time TIMESTAMPTZ NOT NULL,
    exit_time TIMESTAMPTZ,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'partially_closed', 'closed')),
    market_type TEXT CHECK (market_type IN ('stocks', 'forex', 'crypto', 'futures', 'options', 'commodities')),
    sl DECIMAL(15,4),
    target DECIMAL(15,4),
    commission DECIMAL(15,2) DEFAULT 0,
    fees DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    is_shared BOOLEAN DEFAULT false,
    shared_at TIMESTAMPTZ,
    main_image TEXT,
    additional_images TEXT[],
    tags TEXT[],
    partial_exits JSONB DEFAULT '[]',
    remaining_quantity DECIMAL(15,4),
    parent_trade_id UUID REFERENCES trades(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_account_id ON trades(account_id);
CREATE INDEX idx_trades_strategy_id ON trades(strategy_id);
CREATE INDEX idx_trades_entry_time ON trades(entry_time DESC);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_trades_is_shared ON trades(is_shared) WHERE is_shared = true;
CREATE INDEX idx_trades_instrument ON trades(instrument);
```

#### trade_metrics

```sql
CREATE TABLE trade_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID UNIQUE NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    net_pnl DECIMAL(15,2),
    percent_gain DECIMAL(10,4),
    r_multiple DECIMAL(10,2),
    trade_duration INTERVAL,
    trade_result TEXT CHECK (trade_result IN ('win', 'loss', 'breakeven')),
    max_drawdown DECIMAL(15,2),
    max_profit DECIMAL(15,2),
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trade_metrics_trade_id ON trade_metrics(trade_id);
CREATE INDEX idx_trade_metrics_user_id ON trade_metrics(user_id);
CREATE INDEX idx_trade_metrics_trade_result ON trade_metrics(trade_result);
```


#### journal

```sql
CREATE TABLE journal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    date DATE NOT NULL,
    mood TEXT CHECK (mood IN ('excellent', 'good', 'neutral', 'bad', 'terrible')),
    tags TEXT[],
    images TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_journal_date UNIQUE(user_id, date)
);

CREATE INDEX idx_journal_user_id ON journal(user_id);
CREATE INDEX idx_journal_date ON journal(date DESC);
```

#### notes

```sql
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT,
    tags TEXT[],
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_is_pinned ON notes(is_pinned) WHERE is_pinned = true;
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
-- Full-text search index
CREATE INDEX idx_notes_search ON notes USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));
```

#### notifications

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

#### community_follows

```sql
CREATE TABLE community_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_follow UNIQUE(follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

CREATE INDEX idx_community_follows_follower ON community_follows(follower_id);
CREATE INDEX idx_community_follows_following ON community_follows(following_id);
```

#### trade_likes

```sql
CREATE TABLE trade_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_trade_like UNIQUE(user_id, trade_id)
);

CREATE INDEX idx_trade_likes_user_id ON trade_likes(user_id);
CREATE INDEX idx_trade_likes_trade_id ON trade_likes(trade_id);
```

#### trade_comments

```sql
CREATE TABLE trade_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trade_comments_trade_id ON trade_comments(trade_id);
CREATE INDEX idx_trade_comments_user_id ON trade_comments(user_id);
CREATE INDEX idx_trade_comments_created_at ON trade_comments(created_at DESC);
```

#### coupons

```sql
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    usage_limit INT,
    usage_count INT DEFAULT 0,
    applicable_plans UUID[],
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_is_active ON coupons(is_active) WHERE is_active = true;
CREATE INDEX idx_coupons_valid_until ON coupons(valid_until);
```

#### coupon_usage

```sql
CREATE TABLE coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_coupon_user UNIQUE(coupon_id, user_id)
);

CREATE INDEX idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_user_id ON coupon_usage(user_id);
```

#### email_logs

```sql
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    email_type TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    subject TEXT,
    status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
    provider TEXT DEFAULT 'brevo',
    provider_message_id TEXT,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ
);

CREATE INDEX idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at DESC);
```

#### user_settings

```sql
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
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties were identified as redundant or could be combined:

**Redundancies Identified:**
1. Properties 1.1 and 10.1 both test the same trigger behavior (user signup → app_users creation)
2. Properties 17.3, 17.4, 18.1, and 18.3 overlap in coupon creation and validation
3. Multiple properties test similar constraint enforcement patterns (unique, foreign key, etc.)

**Consolidation Strategy:**
- Combine duplicate trigger tests into single comprehensive properties
- Merge coupon-related properties into unified validation properties
- Group constraint enforcement tests by constraint type rather than table

### User Management Properties

**Property 1: User signup triggers app_users creation**
*For any* new user signup in auth.users, the system should automatically create a corresponding app_users record with correct metadata, default settings, and trial subscription status.
**Validates: Requirements 1.1, 1.2, 10.1**

**Property 2: Profile updates maintain timestamp consistency**
*For any* user profile update, the updated_at timestamp should be automatically updated to the current time.
**Validates: Requirements 1.3, 10.2**

**Property 3: Trader profile data persistence**
*For any* trader profile creation with valid data, all fields including experience, risk tolerance, and social links should be stored correctly and retrievable.
**Validates: Requirements 1.4**

**Property 4: User deletion cascades to all related data**
*For any* user account deletion, all associated data (trades, strategies, subscriptions, journal entries, notes) should be automatically deleted.
**Validates: Requirements 1.5**

### Subscription Management Properties

**Property 5: Subscription plan data completeness**
*For any* subscription plan creation, all required fields (pricing, features, limits) should be stored and retrievable.
**Validates: Requirements 2.1**

**Property 6: User subscription creation completeness**
*For any* user subscription creation, all required fields (status, period dates, gateway identifiers) should be stored correctly.
**Validates: Requirements 2.2**

**Property 7: Payment event recording**
*For any* payment event, the system should record complete payment history including amount, status, currency, and transaction identifiers.
**Validates: Requirements 2.3**

**Property 8: Subscription expiration updates status**
*For any* subscription with current_period_end in the past, the status should be updated to 'expired'.
**Validates: Requirements 2.4**

**Property 9: Webhook processing atomicity**
*For any* valid payment webhook, the system should atomically update subscription status and payment history or rollback both on failure.
**Validates: Requirements 2.5**

### Trading Account and Strategy Properties

**Property 10: Account creation data persistence**
*For any* trading account creation, all fields (broker, account type, initial balance, currency) should be stored correctly.
**Validates: Requirements 3.1**

**Property 11: Trade execution updates account balance**
*For any* closed trade with calculated P&L, the associated account's current_balance should be updated by the trade's net P&L amount.
**Validates: Requirements 3.2, 10.4**

**Property 12: Strategy creation data persistence**
*For any* strategy creation, all fields (name, description, rules, active status) should be stored correctly.
**Validates: Requirements 3.3**

**Property 13: Account limit enforcement**
*For any* user at their plan's account limit, attempting to create an additional account should fail with an appropriate error.
**Validates: Requirements 3.4**

**Property 14: Strategy limit enforcement**
*For any* user at their plan's strategy limit, attempting to create an additional strategy should fail with an appropriate error.
**Validates: Requirements 3.5**

### Trade Recording and Metrics Properties

**Property 15: Trade creation data completeness**
*For any* trade creation, all required entry fields (instrument, action, entry price, quantity, entry time, account/strategy references) should be stored correctly.
**Validates: Requirements 4.1**

**Property 16: Trade closure triggers metric calculation**
*For any* trade closure with exit details, the system should automatically calculate and store net P&L, percentage gain, R-multiple, and trade duration in trade_metrics.
**Validates: Requirements 4.2, 10.3**

**Property 17: Partial exit quantity tracking**
*For any* trade with partial exits, the remaining_quantity should equal the original quantity minus the sum of all partial exit quantities.
**Validates: Requirements 4.3**

**Property 18: Trade metrics table separation**
*For any* trade with calculated metrics, the metrics should be stored in the trade_metrics table, not in the trades table.
**Validates: Requirements 4.4**

**Property 19: Trade update triggers metric recalculation**
*For any* trade update that changes entry_price, exit_price, or quantity, the trade_metrics should be recalculated and updated_at should be updated.
**Validates: Requirements 4.5**

### Community Features Properties

**Property 20: Trade sharing marks as public**
*For any* trade marked as shared, the is_shared flag should be true, shared_at should be set, and the trade should be accessible via public queries.
**Validates: Requirements 5.1**

**Property 21: Shared trade queries filter correctly**
*For any* query for shared trades, only trades with is_shared = true should be returned, and private fields should not be exposed.
**Validates: Requirements 5.2**

**Property 22: Follow relationship uniqueness**
*For any* user attempting to follow another user, if a follow relationship already exists, the system should prevent duplicate creation.
**Validates: Requirements 5.3**

**Property 23: Trade like uniqueness**
*For any* user attempting to like a trade, if a like already exists from that user for that trade, the system should prevent duplicate creation.
**Validates: Requirements 5.4**

**Property 24: Comment creation with attribution**
*For any* comment on a shared trade, the system should store the comment content, user attribution, and timestamps correctly.
**Validates: Requirements 5.5**

### Journal and Notes Properties

**Property 25: Journal entry data completeness**
*For any* journal entry creation, all fields (title, content, date, mood, tags, images) should be stored correctly.
**Validates: Requirements 6.1**

**Property 26: Journal image storage and referencing**
*For any* journal image upload, the image should be stored in Supabase Storage and the URL should be correctly referenced in the journal entry.
**Validates: Requirements 6.2**

**Property 27: Note creation data completeness**
*For any* note creation, all fields (title, content, category, tags, pinned status) should be stored correctly.
**Validates: Requirements 6.3**

**Property 28: Note full-text search functionality**
*For any* note search query, the system should return notes where the search term appears in either title or content.
**Validates: Requirements 6.4**

**Property 29: Journal deletion cascades to images**
*For any* journal entry deletion, all associated images should be deleted from Supabase Storage.
**Validates: Requirements 6.5**

### Notification System Properties

**Property 30: Notification creation completeness**
*For any* notification-worthy event, a notification record should be created with type, title, message, and metadata.
**Validates: Requirements 7.1**

**Property 31: Push token registration**
*For any* push notification token registration, the token and platform information should be stored correctly.
**Validates: Requirements 7.2**

**Property 32: Notification delivery logging**
*For any* notification delivery attempt, the delivery status and timestamp should be logged.
**Validates: Requirements 7.3**

**Property 33: Notification read status update**
*For any* notification marked as read, the is_read flag should be set to true and read_at should be set to the current timestamp.
**Validates: Requirements 7.4**

**Property 34: Unread notification count accuracy**
*For any* user, the unread notification count should equal the number of notifications where is_read = false.
**Validates: Requirements 7.5**

### Analytics Properties

**Property 35: Analytics metric calculation accuracy**
*For any* user's trades within a date range, the calculated aggregate metrics (total P&L, win rate, profit factor, average trade duration) should match manual calculations.
**Validates: Requirements 8.1**

**Property 36: Date range filtering correctness**
*For any* analytics query with a date range, only trades with entry_time within the specified range should be included in calculations.
**Validates: Requirements 8.2**

**Property 37: Account filtering correctness**
*For any* analytics query filtered by account, only trades associated with the selected account should be included in calculations.
**Validates: Requirements 8.3**

**Property 38: Strategy filtering correctness**
*For any* analytics query filtered by strategy, only trades associated with the selected strategy should be included in calculations.
**Validates: Requirements 8.4**

**Property 39: Time-series aggregation correctness**
*For any* time-series analytics query, trades should be correctly grouped by the specified period (day, week, month) based on entry_time.
**Validates: Requirements 8.5**


### Row Level Security Properties

**Property 40: RLS enforces user data isolation**
*For any* authenticated user querying a table with RLS enabled, only records where user_id matches the authenticated user's ID should be accessible.
**Validates: Requirements 9.1, 9.2**

**Property 41: Public data read-only access**
*For any* authenticated user querying shared/public data, read access should be granted but write/update/delete operations should be denied unless the user owns the data.
**Validates: Requirements 9.3**

**Property 42: Unauthenticated access denial**
*For any* unauthenticated query to a protected table, access should be denied with an appropriate error.
**Validates: Requirements 9.4**

### Database Trigger Properties

**Property 43: Subscription change triggers notification**
*For any* subscription status change, a notification should be automatically created for the user with subscription details in metadata.
**Validates: Requirements 10.5**

### Edge Function Properties

**Property 44: Webhook signature validation**
*For any* payment webhook received, if the signature is invalid, the webhook should be rejected without processing.
**Validates: Requirements 11.1**

**Property 45: Successful payment updates subscription**
*For any* successful payment webhook, the user's subscription status should be updated to 'active' and a confirmation notification should be created.
**Validates: Requirements 11.2**

**Property 46: Trial expiration scheduled job**
*For any* user with trial_end_date in the past, the scheduled job should update subscription_status to 'expired' and send an expiration email.
**Validates: Requirements 11.3**

**Property 47: Inactivity scheduled job**
*For any* user with no trades in the last 7 days, the scheduled job should send a re-engagement email.
**Validates: Requirements 11.4**

**Property 48: Edge function error logging**
*For any* edge function execution failure, an error log should be created with context information for debugging.
**Validates: Requirements 11.5**

### Migration Properties

**Property 49: Migration execution order**
*For any* set of migrations, they should be executed in chronological order based on timestamp in filename.
**Validates: Requirements 12.2**

**Property 50: Migration failure rollback**
*For any* migration that fails during execution, all changes should be rolled back and the database should remain in the pre-migration state.
**Validates: Requirements 12.3**

**Property 51: Migration idempotency**
*For any* migration that has already been executed, attempting to execute it again should be skipped without error.
**Validates: Requirements 12.4**

### Data Integrity Properties

**Property 52: Foreign key referential integrity**
*For any* foreign key relationship, attempting to insert a record with a non-existent foreign key value should fail with a referential integrity error.
**Validates: Requirements 13.1**

**Property 53: Unique constraint enforcement**
*For any* unique constraint, attempting to insert a duplicate value should fail with a unique violation error.
**Validates: Requirements 13.2**

**Property 54: NOT NULL constraint enforcement**
*For any* NOT NULL constraint, attempting to insert a null value should fail with a not-null violation error.
**Validates: Requirements 13.3**

**Property 55: CHECK constraint enforcement**
*For any* CHECK constraint, attempting to insert a value that violates the constraint should fail with a check violation error.
**Validates: Requirements 13.4**

**Property 56: Constraint violation error messages**
*For any* constraint violation, the error message should clearly indicate which constraint was violated and on which table/column.
**Validates: Requirements 13.5**

### Performance Properties

**Property 57: Date range query uses index**
*For any* query filtering by date range on indexed date columns, the query execution plan should show index usage.
**Validates: Requirements 14.3**

**Property 58: Aggregate query performance**
*For any* aggregate analytics query, the execution time should be under 2 seconds for datasets up to 10,000 trades.
**Validates: Requirements 14.4**

**Property 59: Connection pooling reuse**
*For any* sequence of database queries, connections should be reused from the pool rather than creating new connections.
**Validates: Requirements 14.5**

### Backup and Recovery Properties

**Property 60: Backup integrity verification**
*For any* backup created, the integrity check should pass, confirming the backup is valid and restorable.
**Validates: Requirements 15.2**

**Property 61: Point-in-time recovery**
*For any* restore operation to a specific timestamp, the restored database should contain all data as it existed at that timestamp.
**Validates: Requirements 15.3**

**Property 62: Audit log creation**
*For any* critical data modification (subscription changes, payment events), an audit log entry should be created with user, timestamp, and change details.
**Validates: Requirements 15.4**

### Email Journey Properties

**Property 63: Welcome email on signup**
*For any* new user signup, a welcome email should be sent within 5 minutes of account creation.
**Validates: Requirements 16.1**

**Property 64: First trade milestone email**
*For any* user completing their first trade, a congratulations email should be sent within 1 hour.
**Validates: Requirements 16.2**

**Property 65: Inactivity re-engagement email**
*For any* user inactive for 7 days, a re-engagement email should be sent.
**Validates: Requirements 16.3**

**Property 66: Trial expiration reminder emails**
*For any* user with trial ending in 3 days or 1 day, a reminder email should be sent at the appropriate time.
**Validates: Requirements 16.4**

**Property 67: Email delivery logging**
*For any* email sent, a log entry should be created with delivery status, and the log should be updated when delivery events (open, click) occur.
**Validates: Requirements 16.5**

### Admin and Coupon Properties

**Property 68: Admin user detail query completeness**
*For any* admin query for user details, the response should include subscription, trade count, and recent activity information.
**Validates: Requirements 17.1**

**Property 69: Admin subscription update with logging**
*For any* admin update to a user's subscription, the change should be applied immediately and an audit log entry should be created.
**Validates: Requirements 17.2**

**Property 70: Coupon validation and discount application**
*For any* valid coupon applied at checkout, the discount should be correctly calculated and applied to the subscription price.
**Validates: Requirements 17.4, 18.3**

**Property 71: Admin platform metrics accuracy**
*For any* admin query for platform metrics, the aggregate statistics should match manual calculations of user count, trade count, and revenue.
**Validates: Requirements 17.5**

**Property 72: Coupon usage limit enforcement**
*For any* coupon with a usage limit, once the limit is reached, further attempts to use the coupon should fail with an appropriate error.
**Validates: Requirements 18.2**

**Property 73: Coupon usage recording**
*For any* successful coupon application, a coupon_usage record should be created with user, subscription, discount amount, and timestamp.
**Validates: Requirements 18.4**

**Property 74: Expired coupon rejection**
*For any* coupon with valid_until in the past, attempting to use the coupon should fail with an expiration error message.
**Validates: Requirements 18.5**

### Affiliate Tracking Properties

**Property 75: Affiliate attribution recording**
*For any* user signup with an affiliate code, the referred_by field should be set to the affiliate code.
**Validates: Requirements 19.1**

**Property 76: Affiliate commission calculation**
*For any* affiliate referral that converts to a paid subscription, the commission should be calculated based on the subscription amount and recorded.
**Validates: Requirements 19.2**

**Property 77: Affiliate report accuracy**
*For any* affiliate, the report metrics (referrals, conversions, commissions) should match manual calculations from the database.
**Validates: Requirements 19.3**

**Property 78: Affiliate commission payment tracking**
*For any* affiliate commission payment, the payment status should be updated and a transaction record should be created.
**Validates: Requirements 19.4**

**Property 79: Affiliate link click tracking**
*For any* affiliate link click, a click record should be created with timestamp and attribution information.
**Validates: Requirements 19.5**

### Data Export Properties

**Property 80: CSV export completeness**
*For any* user's CSV export request, the generated file should contain all trade data and metrics accessible to that user.
**Validates: Requirements 20.1**

**Property 81: PDF report generation**
*For any* user's PDF report request, the generated file should contain formatted trade data, charts, and statistics.
**Validates: Requirements 20.2**

**Property 82: Export RLS enforcement**
*For any* export request, only data accessible to the requesting user based on RLS policies should be included in the export.
**Validates: Requirements 20.3**

**Property 83: Large export async processing**
*For any* export request exceeding 1000 trades, the export should be processed asynchronously and the user should receive a notification when complete.
**Validates: Requirements 20.4**

**Property 84: Account deletion export provision**
*For any* account deletion request, a complete data export should be generated and provided to the user before deletion proceeds.
**Validates: Requirements 20.5**


## Error Handling

### Database-Level Error Handling

#### Constraint Violations
- **Foreign Key Violations**: Return descriptive error indicating which foreign key constraint failed
- **Unique Violations**: Return error specifying which unique constraint was violated
- **Check Violations**: Return error describing which check constraint failed
- **Not Null Violations**: Return error indicating which column cannot be null

#### Transaction Management
- All multi-step operations wrapped in transactions
- Automatic rollback on any error within transaction
- Explicit SAVEPOINT usage for nested transactions
- Connection timeout handling with retry logic

#### Function Error Handling
```sql
CREATE OR REPLACE FUNCTION safe_function_example()
RETURNS void AS $$
BEGIN
    -- Function logic
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'Referenced record does not exist';
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Duplicate record already exists';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Unexpected error: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
```

### Edge Function Error Handling

#### Webhook Error Handling
```typescript
try {
    // Validate webhook signature
    if (!validateSignature(request)) {
        return new Response('Invalid signature', { status: 401 });
    }
    
    // Process webhook
    await processPaymentWebhook(payload);
    
    return new Response('OK', { status: 200 });
} catch (error) {
    // Log error with context
    await logError({
        function: 'handle-payment-webhook',
        error: error.message,
        payload: payload,
        timestamp: new Date()
    });
    
    // Return 500 to trigger retry
    return new Response('Internal Server Error', { status: 500 });
}
```

#### Scheduled Job Error Handling
```typescript
try {
    const expiredTrials = await getExpiredTrials();
    
    for (const user of expiredTrials) {
        try {
            await updateSubscriptionStatus(user.id, 'expired');
            await sendExpirationEmail(user.email);
        } catch (userError) {
            // Log individual user error but continue processing others
            await logError({
                function: 'check-trial-expiration',
                userId: user.id,
                error: userError.message
            });
        }
    }
} catch (error) {
    // Log critical error
    await logError({
        function: 'check-trial-expiration',
        error: error.message,
        critical: true
    });
}
```

### Application-Level Error Handling

#### RLS Policy Errors
- Return 403 Forbidden when RLS policy denies access
- Include helpful error message indicating permission issue
- Log unauthorized access attempts for security monitoring

#### Rate Limiting
- Implement rate limiting on expensive operations (exports, analytics)
- Return 429 Too Many Requests when limit exceeded
- Include Retry-After header with cooldown period

#### Validation Errors
- Validate input data before database operations
- Return 400 Bad Request with detailed validation errors
- Use Zod or similar library for type-safe validation

## Testing Strategy

### Unit Testing

**Database Functions:**
- Test each database function with valid inputs
- Test edge cases (null values, boundary conditions)
- Test error conditions (constraint violations, invalid data)
- Verify return values and side effects

**RLS Policies:**
- Test each policy with different user contexts
- Verify users can only access their own data
- Verify public data is accessible to all authenticated users
- Verify unauthenticated users are denied access

**Triggers:**
- Test trigger execution on INSERT, UPDATE, DELETE
- Verify trigger side effects (updated_at, cascades)
- Test trigger error handling

### Property-Based Testing

**Testing Framework:** We will use **pgTAP** for PostgreSQL property-based testing, which provides a TAP-compliant testing framework for database testing.

**Configuration:** Each property-based test will run a minimum of 100 iterations to ensure comprehensive coverage across random inputs.

**Test Tagging:** Each property-based test will be tagged with a comment explicitly referencing the correctness property from this design document using the format: `-- Feature: supabase-database-rebuild, Property {number}: {property_text}`

**Property Test Examples:**

```sql
-- Feature: supabase-database-rebuild, Property 1: User signup triggers app_users creation
-- Test that for any new auth.users record, app_users is created
BEGIN;
SELECT plan(100);

-- Run 100 iterations with random user data
DO $$
DECLARE
    i INT;
    test_user_id UUID;
    test_email TEXT;
BEGIN
    FOR i IN 1..100 LOOP
        test_user_id := gen_random_uuid();
        test_email := 'test' || i || '@example.com';
        
        -- Insert into auth.users (simulated)
        INSERT INTO auth.users (id, email) VALUES (test_user_id, test_email);
        
        -- Verify app_users was created
        SELECT ok(
            EXISTS(SELECT 1 FROM app_users WHERE id = test_user_id),
            'app_users record created for user ' || test_email
        );
        
        -- Verify default values
        SELECT is(
            (SELECT subscription_status FROM app_users WHERE id = test_user_id),
            'trial',
            'Default subscription status is trial'
        );
    END LOOP;
END $$;

SELECT * FROM finish();
ROLLBACK;
```

```sql
-- Feature: supabase-database-rebuild, Property 16: Trade closure triggers metric calculation
-- Test that for any closed trade, metrics are calculated correctly
BEGIN;
SELECT plan(100);

DO $$
DECLARE
    i INT;
    test_trade_id UUID;
    test_user_id UUID;
    entry_price DECIMAL;
    exit_price DECIMAL;
    quantity DECIMAL;
    expected_pnl DECIMAL;
    actual_pnl DECIMAL;
BEGIN
    FOR i IN 1..100 LOOP
        test_user_id := gen_random_uuid();
        test_trade_id := gen_random_uuid();
        
        -- Generate random trade data
        entry_price := (random() * 1000)::DECIMAL(15,4);
        exit_price := (random() * 1000)::DECIMAL(15,4);
        quantity := (random() * 100)::DECIMAL(15,4);
        expected_pnl := (exit_price - entry_price) * quantity;
        
        -- Create user and trade
        INSERT INTO app_users (id, email) VALUES (test_user_id, 'test' || i || '@example.com');
        INSERT INTO trades (id, user_id, instrument, action, entry_price, exit_price, quantity, entry_time, exit_time, status)
        VALUES (test_trade_id, test_user_id, 'TEST', 'long', entry_price, exit_price, quantity, NOW(), NOW(), 'closed');
        
        -- Verify metrics were calculated
        SELECT ok(
            EXISTS(SELECT 1 FROM trade_metrics WHERE trade_id = test_trade_id),
            'Trade metrics created for trade ' || test_trade_id
        );
        
        -- Verify P&L calculation
        SELECT net_pnl INTO actual_pnl FROM trade_metrics WHERE trade_id = test_trade_id;
        SELECT ok(
            ABS(actual_pnl - expected_pnl) < 0.01,
            'P&L calculated correctly: expected ' || expected_pnl || ', got ' || actual_pnl
        );
    END LOOP;
END $$;

SELECT * FROM finish();
ROLLBACK;
```

### Integration Testing

**Edge Functions:**
- Test webhook handlers with sample payloads
- Test scheduled jobs with test data
- Verify database updates after edge function execution
- Test error handling and retry logic

**End-to-End Flows:**
- Test complete user signup flow (auth → app_users → trial subscription)
- Test complete payment flow (webhook → subscription update → notification)
- Test complete trade flow (create → update → close → metrics calculation)
- Test complete export flow (request → generation → storage → notification)

### Performance Testing

**Query Performance:**
- Benchmark common queries (trade list, analytics, dashboard)
- Verify query execution time under load
- Test with datasets of varying sizes (100, 1K, 10K, 100K trades)
- Verify index usage with EXPLAIN ANALYZE

**Concurrent Access:**
- Test multiple users accessing data simultaneously
- Verify RLS performance under load
- Test connection pool behavior under high concurrency

**Scalability:**
- Test database performance with increasing data volume
- Verify backup and restore times
- Test migration execution time

### Security Testing

**RLS Policy Testing:**
- Attempt to access other users' data
- Verify policy enforcement across all tables
- Test with different authentication states
- Verify admin access patterns

**SQL Injection Testing:**
- Test all database functions with malicious inputs
- Verify parameterized queries in edge functions
- Test SECURITY DEFINER functions with search_path

**Authentication Testing:**
- Test with expired tokens
- Test with invalid tokens
- Test with missing authentication
- Verify token refresh behavior

---

**Last Updated**: November 23, 2024
**Version**: 1.0
**Status**: Design Complete - Ready for Implementation
