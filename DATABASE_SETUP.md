# TradeLens Database Schema Documentation

## Table of Contents
1. [Overview](#overview)
2. [Core Database Schema](#core-database-schema)
3. [User Management Tables](#user-management-tables)
4. [Subscription Management](#subscription-management)
5. [Trading Tables](#trading-tables)
6. [Community Features](#community-features)
7. [Notification System](#notification-system)
8. [Support Tables](#support-tables)
9. [Debug/Log Tables](#debuglog-tables)
10. [Database Cleanup Recommendations](#database-cleanup-recommendations)
11. [RLS Policies](#rls-policies)
12. [Database Functions & Triggers](#database-functions--triggers)
13. [Setup Instructions](#setup-instructions)
14. [Migration Management](#migration-management)
15. [Best Practices](#best-practices)

## Overview

TradeLens is a comprehensive trading platform with a well-structured PostgreSQL database hosted on Supabase. The database contains 25 core business tables with proper relationships, foreign keys, and Row Level Security (RLS) implementation.

**Database Statistics:**
- Total Tables: 25+ (including debug/log tables)
- Core Business Tables: 25
- RLS Enabled: All core tables
- Primary Authentication: Supabase Auth + Custom app_users table

## Core Database Schema

### User Management Tables

#### app_users
```sql
CREATE TABLE app_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    subscription_status TEXT DEFAULT 'trial',
    trial_end_date TIMESTAMPTZ,
    onboarding_completed BOOLEAN DEFAULT false
);
```

#### trader_profiles
```sql
CREATE TABLE trader_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    trading_experience TEXT,
    risk_tolerance TEXT,
    preferred_markets TEXT[],
    bio TEXT,
    location TEXT,
    website_url TEXT,
    social_links JSONB,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Subscription Management

#### subscription_plans
```sql
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### user_subscriptions_new
```sql
CREATE TABLE user_subscriptions_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    status TEXT NOT NULL,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Trading Tables

#### accounts
```sql
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    broker TEXT,
    account_type TEXT,
    initial_balance DECIMAL(15,2),
    current_balance DECIMAL(15,2),
    currency TEXT DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### strategies
```sql
CREATE TABLE strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    rules JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### trades
```sql
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id),
    strategy_id UUID REFERENCES strategies(id),
    symbol TEXT NOT NULL,
    side TEXT NOT NULL, -- 'long' or 'short'
    entry_price DECIMAL(15,4),
    exit_price DECIMAL(15,4),
    quantity DECIMAL(15,4),
    entry_date TIMESTAMPTZ,
    exit_date TIMESTAMPTZ,
    status TEXT DEFAULT 'open',
    pnl DECIMAL(15,2),
    commission DECIMAL(15,2),
    notes TEXT,
    tags TEXT[],
    is_shared BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### trade_metrics
```sql
CREATE TABLE trade_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    max_drawdown DECIMAL(10,4),
    max_profit DECIMAL(15,2),
    hold_time INTERVAL,
    risk_reward_ratio DECIMAL(10,2),
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Community Features

#### community_follows
```sql
CREATE TABLE community_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);
```

#### trade_likes
```sql
CREATE TABLE trade_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, trade_id)
);
```

#### trade_comments
```sql
CREATE TABLE trade_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Notification System

#### notifications
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### user_push_tokens
```sql
CREATE TABLE user_push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Support Tables

#### journal
```sql
CREATE TABLE journal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    date DATE,
    mood TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### notes
```sql
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    category TEXT,
    tags TEXT[],
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### settings
```sql
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, key)
);
```

## Debug/Log Tables

The following tables are used for debugging, logging, and analysis purposes:

- `email_logs` - Email delivery tracking
- `trial_email_logs` - Trial email specific logs
- `subscription_event_logs` - Subscription event tracking
- `notification_logs` - Notification delivery logs
- `rls_analysis_summary` - RLS policy analysis results
- `rls_verification_results` - RLS verification test results
- `migration_backup_foreign_keys` - Migration backup data
- `user_creation_log` - User creation tracking
- `migration_log` - Database migration history

## Database Cleanup Recommendations

### Safe to Remove/Archive
1. **Debug Tables** (can be archived):
   - `rls_analysis_summary`
   - `rls_verification_results`
   - `migration_backup_foreign_keys`

2. **Old Log Tables** (can be truncated/archived):
   - `email_logs` (keep recent 30 days)
   - `trial_email_logs` (keep recent 30 days)
   - `notification_logs` (keep recent 30 days)

### Keep for Operations
- `subscription_event_logs` - Important for billing
- `user_creation_log` - Important for analytics
- `migration_log` - Important for deployment tracking

## RLS Policies

All core business tables have Row Level Security (RLS) enabled with the following pattern:

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- User can only access their own data
CREATE POLICY "Users can only access their own data" ON table_name
    FOR ALL USING (user_id = auth.uid());

-- Public read access for shared content (where applicable)
CREATE POLICY "Public read access for shared content" ON trades
    FOR SELECT USING (is_shared = true);
```

## Database Functions & Triggers

### Core Functions

#### handle_new_signup()
```sql
CREATE OR REPLACE FUNCTION handle_new_signup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO app_users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

#### update_updated_at_column()
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
```

### Triggers

```sql
-- Auto-create app_users record on auth.users insert
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_signup();

-- Auto-update updated_at columns
CREATE TRIGGER update_app_users_updated_at
    BEFORE UPDATE ON app_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Setup Instructions

### 1. Environment Setup
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Configure Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Database Migration
```bash
# Run migrations
npx supabase db push

# Seed initial data (if needed)
npx supabase db seed
```

### 3. Verify Setup
```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';

-- Verify triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

## Migration Management

### Best Practices
1. **Always backup before migrations**
2. **Test migrations on staging first**
3. **Use descriptive migration names**
4. **Include rollback procedures**

### Migration Naming Convention
```
YYYYMMDDHHMMSS_descriptive_name.sql
```

### Example Migration Template
```sql
-- Migration: Add new feature
-- Date: 2024-01-01
-- Description: Brief description of changes

BEGIN;

-- Your migration code here

-- Verify the changes
-- Add verification queries

COMMIT;
```

## Best Practices

### Security
1. **RLS Enabled**: All tables have RLS enabled
2. **Function Security**: All functions use `SECURITY DEFINER` with `SET search_path = public`
3. **Input Validation**: Validate all user inputs
4. **Audit Logging**: Track important changes

### Performance
1. **Indexes**: Proper indexes on foreign keys and query columns
2. **Query Optimization**: Use EXPLAIN ANALYZE for slow queries
3. **Connection Pooling**: Use Supabase connection pooling
4. **Batch Operations**: Use batch inserts/updates where possible

### Monitoring
1. **Log Analysis**: Regular review of error logs
2. **Performance Metrics**: Monitor query performance
3. **RLS Verification**: Regular RLS policy testing
4. **Backup Verification**: Test backup/restore procedures

---

**Last Updated**: January 2025
**Database Version**: PostgreSQL 15 (Supabase)
**Total Tables**: 25+ core business tables
**RLS Status**: Enabled on all core tables