# Requirements Document: TradeLens Supabase Database Rebuild

## Introduction

This document outlines the requirements for rebuilding the TradeLens Supabase database architecture from scratch. TradeLens is a comprehensive trading journal and performance analytics platform that enables traders to track trades, analyze performance, manage strategies, and engage with a trading community. The rebuild aims to establish an industry-standard, scalable, secure, and maintainable database architecture with proper schema design, Row Level Security (RLS), database functions, triggers, and edge functions.

## Glossary

- **TradeLens System**: The complete trading journal and analytics platform
- **Supabase**: The Backend-as-a-Service platform providing PostgreSQL database, authentication, storage, and edge functions
- **RLS (Row Level Security)**: PostgreSQL security feature that restricts row-level access based on user identity
- **Edge Function**: Serverless functions deployed at the edge for handling webhooks, background jobs, and API endpoints
- **Database Function**: PostgreSQL stored procedure written in PL/pgSQL
- **Database Trigger**: Automated database action that executes in response to specific events
- **Migration**: Version-controlled SQL script that modifies database schema
- **App User**: A registered user of the TradeLens platform
- **Trade**: A single trading transaction with entry and exit points
- **Strategy**: A defined trading approach with rules and parameters
- **Account**: A trading account associated with a broker
- **Journal Entry**: A daily trading journal note with reflections and analysis
- **Subscription Plan**: A pricing tier with specific feature access levels
- **Community Feature**: Social features including follows, likes, and comments
- **Notification**: System-generated or user-triggered alert message
- **Payment Event**: Transaction record from payment gateway (Cashfree)
- **Webhook**: HTTP callback from external service to TradeLens edge functions

## Requirements

### Requirement 1: User Management and Authentication

**User Story:** As a platform user, I want secure authentication and profile management, so that my trading data remains private and accessible only to me.

#### Acceptance Criteria

1. WHEN a new user signs up through Supabase Auth, THEN the TradeLens System SHALL automatically create a corresponding app_users record with user metadata
2. WHEN an app_users record is created, THEN the TradeLens System SHALL initialize default settings and trial subscription status
3. WHEN a user updates their profile, THEN the TradeLens System SHALL validate and persist changes with automatic timestamp updates
4. WHEN a user creates a trader profile, THEN the TradeLens System SHALL store extended trading information including experience, risk tolerance, and social links
5. WHEN a user deletes their account, THEN the TradeLens System SHALL cascade delete all associated data including trades, strategies, and subscriptions

### Requirement 2: Subscription and Payment Management

**User Story:** As a platform administrator, I want robust subscription and payment tracking, so that users receive appropriate access based on their subscription status.

#### Acceptance Criteria

1. WHEN a subscription plan is created, THEN the TradeLens System SHALL store plan details including pricing, features, and access limits
2. WHEN a user subscribes to a plan, THEN the TradeLens System SHALL create a user_subscription record with status, period dates, and payment gateway identifiers
3. WHEN a payment event occurs, THEN the TradeLens System SHALL record payment history with amount, status, currency, and transaction identifiers
4. WHEN a subscription expires, THEN the TradeLens System SHALL update subscription status to expired and restrict feature access accordingly
5. WHEN a payment webhook is received, THEN the TradeLens System SHALL validate, process, and update subscription status atomically

### Requirement 3: Trading Account and Strategy Management

**User Story:** As a trader, I want to manage multiple trading accounts and strategies, so that I can organize my trading activities effectively.

#### Acceptance Criteria

1. WHEN a user creates a trading account, THEN the TradeLens System SHALL store account details including broker, account type, initial balance, and currency
2. WHEN a trade is executed, THEN the TradeLens System SHALL update the associated account balance based on trade profit/loss
3. WHEN a user creates a strategy, THEN the TradeLens System SHALL store strategy name, description, rules, and active status
4. WHEN a user exceeds their plan's account limit, THEN the TradeLens System SHALL prevent creation of additional accounts
5. WHEN a user exceeds their plan's strategy limit, THEN the TradeLens System SHALL prevent creation of additional strategies

### Requirement 4: Trade Recording and Metrics Calculation

**User Story:** As a trader, I want accurate trade recording and automatic metrics calculation, so that I can analyze my trading performance without manual calculations.

#### Acceptance Criteria

1. WHEN a trade is created with entry details, THEN the TradeLens System SHALL store instrument, action, entry price, quantity, entry time, and associated account/strategy
2. WHEN a trade is closed with exit details, THEN the TradeLens System SHALL calculate net profit/loss, percentage gain, R-multiple, and trade duration automatically
3. WHEN a trade supports partial exits, THEN the TradeLens System SHALL track multiple exit transactions and update remaining quantity
4. WHEN trade metrics are calculated, THEN the TradeLens System SHALL store results in a separate trade_metrics table for performance optimization
5. WHEN a trade is updated, THEN the TradeLens System SHALL recalculate dependent metrics and update timestamps

### Requirement 5: Trade Sharing and Community Features

**User Story:** As a trader, I want to share my trades with the community and engage with other traders, so that I can learn from others and showcase my performance.

#### Acceptance Criteria

1. WHEN a user shares a trade, THEN the TradeLens System SHALL mark the trade as shared and make it publicly accessible
2. WHEN a user views shared trades, THEN the TradeLens System SHALL return only trades marked as shared without exposing private data
3. WHEN a user follows another trader, THEN the TradeLens System SHALL create a follow relationship and prevent duplicate follows
4. WHEN a user likes a shared trade, THEN the TradeLens System SHALL record the like and prevent duplicate likes from the same user
5. WHEN a user comments on a shared trade, THEN the TradeLens System SHALL store the comment with user attribution and timestamps

### Requirement 6: Journal and Notes Management

**User Story:** As a trader, I want to maintain a trading journal and notes, so that I can reflect on my trading decisions and track my psychological state.

#### Acceptance Criteria

1. WHEN a user creates a journal entry, THEN the TradeLens System SHALL store title, content, date, mood, tags, and associated images
2. WHEN a user uploads journal images, THEN the TradeLens System SHALL store images in Supabase Storage and reference URLs in the database
3. WHEN a user creates a note, THEN the TradeLens System SHALL store title, content, category, tags, and pinned status
4. WHEN a user searches notes, THEN the TradeLens System SHALL support full-text search across title and content
5. WHEN a user deletes a journal entry, THEN the TradeLens System SHALL cascade delete associated images from storage

### Requirement 7: Notification System

**User Story:** As a user, I want to receive timely notifications about important events, so that I stay informed about my account activity and community interactions.

#### Acceptance Criteria

1. WHEN a notification-worthy event occurs, THEN the TradeLens System SHALL create a notification record with type, title, message, and metadata
2. WHEN a user registers a push notification token, THEN the TradeLens System SHALL store the token with platform information for push delivery
3. WHEN a notification is delivered, THEN the TradeLens System SHALL log delivery status and timestamp
4. WHEN a user marks a notification as read, THEN the TradeLens System SHALL update the is_read flag
5. WHEN a user has unread notifications, THEN the TradeLens System SHALL return unread count efficiently

### Requirement 8: Analytics and Performance Metrics

**User Story:** As a trader, I want comprehensive analytics on my trading performance, so that I can identify strengths, weaknesses, and areas for improvement.

#### Acceptance Criteria

1. WHEN a user requests analytics, THEN the TradeLens System SHALL calculate aggregate metrics including total P&L, win rate, profit factor, and average trade duration
2. WHEN analytics are filtered by date range, THEN the TradeLens System SHALL return metrics for trades within the specified period
3. WHEN analytics are filtered by account, THEN the TradeLens System SHALL return metrics for trades associated with the selected account
4. WHEN analytics are filtered by strategy, THEN the TradeLens System SHALL return metrics for trades associated with the selected strategy
5. WHEN analytics include time-series data, THEN the TradeLens System SHALL aggregate trades by day, week, or month efficiently

### Requirement 9: Data Security and Row Level Security

**User Story:** As a platform administrator, I want comprehensive data security through Row Level Security, so that users can only access their own data and authorized public data.

#### Acceptance Criteria

1. WHEN RLS is enabled on a table, THEN the TradeLens System SHALL enforce policies that restrict access based on user authentication
2. WHEN a user queries their own data, THEN the TradeLens System SHALL allow full CRUD operations on records where user_id matches authenticated user
3. WHEN a user queries shared public data, THEN the TradeLens System SHALL allow read-only access to records marked as public or shared
4. WHEN an unauthenticated user queries data, THEN the TradeLens System SHALL deny access except for explicitly public endpoints
5. WHEN a database function executes with elevated privileges, THEN the TradeLens System SHALL use SECURITY DEFINER with explicit search_path to prevent SQL injection

### Requirement 10: Database Functions and Triggers

**User Story:** As a platform administrator, I want automated database functions and triggers, so that data consistency and business logic are enforced at the database level.

#### Acceptance Criteria

1. WHEN a new user signs up, THEN the TradeLens System SHALL trigger automatic creation of app_users record from auth.users data
2. WHEN a record is updated, THEN the TradeLens System SHALL automatically update the updated_at timestamp
3. WHEN a trade is closed, THEN the TradeLens System SHALL trigger automatic calculation of trade metrics
4. WHEN a trade profit/loss changes, THEN the TradeLens System SHALL trigger automatic update of associated account balance
5. WHEN a subscription status changes, THEN the TradeLens System SHALL trigger notification creation for the user

### Requirement 11: Edge Functions for Webhooks and Background Jobs

**User Story:** As a platform administrator, I want serverless edge functions to handle webhooks and background jobs, so that external integrations and asynchronous tasks are processed reliably.

#### Acceptance Criteria

1. WHEN a payment webhook is received from Cashfree, THEN the TradeLens System SHALL validate the webhook signature and process the payment event
2. WHEN a payment is successful, THEN the TradeLens System SHALL update user subscription status and send confirmation notification
3. WHEN a trial period expires, THEN the TradeLens System SHALL execute a scheduled edge function to update subscription status and send expiration email
4. WHEN a user is inactive for a defined period, THEN the TradeLens System SHALL execute a scheduled edge function to send re-engagement email
5. WHEN an edge function fails, THEN the TradeLens System SHALL log the error with context for debugging and retry if appropriate

### Requirement 12: Migration Management and Version Control

**User Story:** As a database administrator, I want version-controlled migrations, so that schema changes are tracked, reproducible, and safely deployable.

#### Acceptance Criteria

1. WHEN a schema change is required, THEN the TradeLens System SHALL create a timestamped migration file with descriptive name
2. WHEN migrations are applied, THEN the TradeLens System SHALL execute them in chronological order and record execution status
3. WHEN a migration fails, THEN the TradeLens System SHALL rollback the transaction and report the error
4. WHEN migrations are deployed to production, THEN the TradeLens System SHALL apply only new migrations not yet executed
5. WHEN a migration includes data transformation, THEN the TradeLens System SHALL include rollback procedures for safe reversal

### Requirement 13: Data Integrity and Constraints

**User Story:** As a platform administrator, I want comprehensive data integrity constraints, so that invalid data cannot be inserted and relationships are maintained.

#### Acceptance Criteria

1. WHEN a foreign key relationship exists, THEN the TradeLens System SHALL enforce referential integrity with appropriate CASCADE or RESTRICT actions
2. WHEN a unique constraint is defined, THEN the TradeLens System SHALL prevent duplicate values in the constrained columns
3. WHEN a NOT NULL constraint is defined, THEN the TradeLens System SHALL prevent insertion of null values
4. WHEN a CHECK constraint is defined, THEN the TradeLens System SHALL validate data against the constraint before insertion or update
5. WHEN a constraint violation occurs, THEN the TradeLens System SHALL return a descriptive error message to the application

### Requirement 14: Performance Optimization

**User Story:** As a platform user, I want fast query performance, so that the application responds quickly even with large datasets.

#### Acceptance Criteria

1. WHEN a table has frequently queried columns, THEN the TradeLens System SHALL create indexes on those columns
2. WHEN a foreign key relationship exists, THEN the TradeLens System SHALL create indexes on foreign key columns
3. WHEN a query involves date range filtering, THEN the TradeLens System SHALL use indexes on date columns for efficient filtering
4. WHEN aggregate queries are executed, THEN the TradeLens System SHALL use materialized views or optimized queries to reduce computation time
5. WHEN connection pooling is configured, THEN the TradeLens System SHALL reuse database connections to reduce connection overhead

### Requirement 15: Backup and Disaster Recovery

**User Story:** As a platform administrator, I want automated backups and disaster recovery procedures, so that data can be restored in case of failure.

#### Acceptance Criteria

1. WHEN daily backups are scheduled, THEN the TradeLens System SHALL create point-in-time backups of the entire database
2. WHEN a backup is created, THEN the TradeLens System SHALL verify backup integrity and store it in secure off-site storage
3. WHEN a restore is required, THEN the TradeLens System SHALL support point-in-time recovery to any backup timestamp
4. WHEN critical data is modified, THEN the TradeLens System SHALL maintain audit logs for compliance and recovery
5. WHEN a disaster recovery test is performed, THEN the TradeLens System SHALL successfully restore data to a test environment

### Requirement 16: Email Journey and User Onboarding

**User Story:** As a platform administrator, I want automated email journeys for user onboarding and engagement, so that users receive timely guidance and remain active.

#### Acceptance Criteria

1. WHEN a new user signs up, THEN the TradeLens System SHALL initiate a welcome email journey with onboarding steps
2. WHEN a user completes their first trade, THEN the TradeLens System SHALL send a milestone congratulations email
3. WHEN a user is inactive for 7 days, THEN the TradeLens System SHALL send a re-engagement email with tips
4. WHEN a trial period is ending, THEN the TradeLens System SHALL send reminder emails at 3 days and 1 day before expiration
5. WHEN an email is sent, THEN the TradeLens System SHALL log email delivery status and track open/click events

### Requirement 17: Admin and Moderation Tools

**User Story:** As a platform administrator, I want admin tools for user management and content moderation, so that I can maintain platform quality and handle support requests.

#### Acceptance Criteria

1. WHEN an admin views user details, THEN the TradeLens System SHALL provide comprehensive user information including subscription, trades, and activity
2. WHEN an admin updates a user's subscription, THEN the TradeLens System SHALL apply changes immediately and log the admin action
3. WHEN an admin creates a coupon code, THEN the TradeLens System SHALL store coupon details including discount, validity, and usage limits
4. WHEN a user applies a coupon, THEN the TradeLens System SHALL validate the coupon and apply the discount to the subscription price
5. WHEN an admin views platform metrics, THEN the TradeLens System SHALL provide aggregate statistics on users, trades, and revenue

### Requirement 18: Coupon and Discount Management

**User Story:** As a marketing manager, I want to create and manage coupon codes, so that I can run promotional campaigns and offer discounts to users.

#### Acceptance Criteria

1. WHEN a coupon is created, THEN the TradeLens System SHALL store coupon code, discount type (percentage or fixed), discount value, and validity dates
2. WHEN a coupon has usage limits, THEN the TradeLens System SHALL track usage count and prevent exceeding the limit
3. WHEN a user applies a coupon at checkout, THEN the TradeLens System SHALL validate the coupon and calculate the discounted price
4. WHEN a coupon is applied to a subscription, THEN the TradeLens System SHALL record the coupon usage with user and timestamp
5. WHEN a coupon expires, THEN the TradeLens System SHALL prevent further usage and return an appropriate error message

### Requirement 19: Affiliate Tracking

**User Story:** As a platform administrator, I want to track affiliate referrals, so that I can attribute signups to marketing partners and calculate commissions.

#### Acceptance Criteria

1. WHEN a user signs up with an affiliate code, THEN the TradeLens System SHALL record the affiliate attribution in the user record
2. WHEN an affiliate referral converts to a paid subscription, THEN the TradeLens System SHALL calculate and record the affiliate commission
3. WHEN an admin views affiliate reports, THEN the TradeLens System SHALL provide metrics on referrals, conversions, and commissions per affiliate
4. WHEN an affiliate commission is paid, THEN the TradeLens System SHALL update the payment status and record the transaction
5. WHEN an affiliate link is clicked, THEN the TradeLens System SHALL track the click and store it for attribution

### Requirement 20: Data Export and Reporting

**User Story:** As a trader, I want to export my trading data, so that I can perform custom analysis or migrate to another platform.

#### Acceptance Criteria

1. WHEN a user requests a CSV export of trades, THEN the TradeLens System SHALL generate a CSV file with all trade data including metrics
2. WHEN a user requests a PDF report, THEN the TradeLens System SHALL generate a formatted report with charts and statistics
3. WHEN an export is generated, THEN the TradeLens System SHALL include only data accessible to the requesting user based on RLS policies
4. WHEN an export is large, THEN the TradeLens System SHALL process it asynchronously and notify the user when ready
5. WHEN a user requests account deletion, THEN the TradeLens System SHALL provide a complete data export before deletion
