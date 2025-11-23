# Local Supabase Setup Guide

Complete guide for setting up and managing local Supabase development environment for TradeLens.

## Prerequisites

- Node.js >= 18.0.0
- Docker Desktop (running)
- Supabase CLI installed (`npm install -g supabase`)

## Quick Start

### 1. Initial Setup

```bash
# Start Supabase local development
supabase start

# Apply migrations
supabase db reset

# Verify setup
supabase status
```

### 2. Access Points

After starting Supabase, you'll have access to:

- **API URL**: http://127.0.0.1:54321
- **Studio (Database UI)**: http://127.0.0.1:54323
- **Mailpit (Email Testing)**: http://127.0.0.1:54324
- **Database**: postgresql://postgres:postgres@127.0.0.1:54322/postgres

### 3. Start Development

```bash
# Start your frontend
npm run dev

# Access your app at http://localhost:5173
```

## Project Structure

```
supabase/
├── config.toml                          # Supabase configuration
├── migrations/                          # Database migrations
│   └── 20241123000001_initial_schema.sql
├── seeds/                               # Seed data
│   └── 20241123000001_seed_data.sql
└── seed.sql                             # Main seed file
```

## Database Schema

### Core Tables

1. **User Management**
   - `app_users` - Main user profiles
   - `trader_profiles` - Extended trader information

2. **Subscriptions**
   - `subscription_plans` - Available plans
   - `user_subscriptions` - User subscription records

3. **Trading**
   - `accounts` - Trading accounts
   - `strategies` - Trading strategies
   - `trades` - Individual trades
   - `trade_metrics` - Trade performance metrics

4. **Community**
   - `community_follows` - User follows
   - `trade_likes` - Trade likes
   - `trade_comments` - Trade comments

5. **Notifications**
   - `notifications` - User notifications
   - `user_push_tokens` - Push notification tokens

6. **Personal**
   - `journal` - Trading journal entries
   - `notes` - User notes
   - `settings` - User settings

## Common Tasks

### Creating a New Migration

```bash
# Create a new migration file
supabase migration new add_feature_name

# Edit the generated file in supabase/migrations/
# Then apply it
supabase db reset
```

### Viewing Database

```bash
# Open Supabase Studio
# Navigate to http://127.0.0.1:54323

# Or use psql
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Resetting Database

```bash
# Reset database (applies all migrations and seeds)
supabase db reset

# Reset without seed data
supabase db reset --no-seed
```

### Backing Up Local Data

```bash
# Backup schema
supabase db dump --local --schema public -f backup_schema.sql

# Backup data
supabase db dump --local --schema public --data-only -f backup_data.sql

# Restore from backup
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < backup_data.sql
```

### Testing Email Flows

1. Navigate to http://127.0.0.1:54324 (Mailpit)
2. All emails sent by your app will appear here
3. No actual emails are sent in local development

## Environment Variables

### Local Development (.env.local)

```env
NODE_ENV=development
ALLOW_DATABASE_RESET=true
IS_PRODUCTION_ENVIRONMENT=false

VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

VITE_SITE_URL=http://localhost:5173
```

## Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies that:
- Users can only access their own data
- Public data (shared trades, profiles) is accessible to all
- Proper authentication checks on all operations

### Database Functions

- `handle_new_signup()` - Auto-creates app_users record
- `update_updated_at_column()` - Auto-updates timestamps
- `calculate_trade_pnl()` - Auto-calculates trade profit/loss
- `update_account_balance()` - Updates account balance on trade close

### Triggers

- Auto-create user profiles on signup
- Auto-update timestamps on record changes
- Auto-calculate trade metrics
- Auto-update account balances

## Best Practices

### 1. Migration Management

- Always create migrations for schema changes
- Never edit existing migrations
- Test migrations locally before deploying
- Use descriptive migration names

### 2. Data Safety

- Never run `db reset` on production
- Always backup before major changes
- Use transactions for complex operations
- Test RLS policies thoroughly

### 3. Performance

- Use indexes on frequently queried columns
- Avoid N+1 queries
- Use connection pooling
- Monitor slow queries in Studio

### 4. Development Workflow

```bash
# 1. Start Supabase
supabase start

# 2. Make schema changes via migrations
supabase migration new my_feature

# 3. Apply changes
supabase db reset

# 4. Test in your app
npm run dev

# 5. Commit migrations
git add supabase/migrations/
git commit -m "Add my_feature migration"
```

## Troubleshooting

### Supabase won't start

```bash
# Stop all containers
supabase stop

# Remove volumes
docker volume prune

# Start fresh
supabase start
```

### Database connection issues

```bash
# Check status
supabase status

# Restart services
supabase stop
supabase start
```

### Migration errors

```bash
# Check migration status
supabase migration list

# Reset to specific version
supabase db reset --version 20241123000001
```

### Port conflicts

Edit `supabase/config.toml` to change ports:
```toml
[api]
port = 54321  # Change if needed

[db]
port = 54322  # Change if needed

[studio]
port = 54323  # Change if needed
```

## Production Deployment

### Preparing for Production

1. **Test all migrations locally**
   ```bash
   supabase db reset
   ```

2. **Link to production project**
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. **Push migrations**
   ```bash
   supabase db push
   ```

4. **Verify in production**
   - Check Supabase Dashboard
   - Test critical flows
   - Monitor logs

### Environment Variables for Production

Set these in your hosting platform (Vercel, Netlify, etc.):

```env
NODE_ENV=production
ALLOW_DATABASE_RESET=false
IS_PRODUCTION_ENVIRONMENT=true

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

VITE_SITE_URL=https://your-domain.com
```

## Monitoring & Maintenance

### Regular Tasks

1. **Monitor database size**
   ```sql
   SELECT pg_size_pretty(pg_database_size('postgres'));
   ```

2. **Check slow queries**
   - Use Supabase Studio > SQL Editor
   - Enable query logging in config.toml

3. **Review RLS policies**
   ```sql
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```

4. **Backup production data**
   ```bash
   supabase db dump --project-ref your-project-ref
   ```

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## Support

For issues or questions:
1. Check Supabase Studio logs
2. Review migration files
3. Check Docker container logs: `docker logs supabase_db_tradelens`
4. Consult Supabase Discord community

---

**Last Updated**: November 23, 2024
**Supabase CLI Version**: 2.58.5
**PostgreSQL Version**: 17
