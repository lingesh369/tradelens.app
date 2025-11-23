# TradeLens Production Development Rules

## Overview
This document outlines the rules and guidelines for development of the TradeLens application using production Supabase environment.

## Production Supabase Setup

### Prerequisites
- Supabase CLI installed (`npm install -g supabase`)
- Node.js and npm installed
- Access to production Supabase project

### Initial Setup
1. **Configure Production Supabase Connection**
   ```bash
   # Ensure .env file has production credentials
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
   This connects to production Supabase services including:
   - PostgreSQL database
   - Auth server
   - Edge Functions runtime
   - Storage server
   - Realtime server

2. **Database Schema**
   - All migrations are applied to production from `supabase/migrations/`
   - RLS policies are applied from `supabase/sql/rls_policies.sql`
   - Production data is live and must be handled carefully

3. **Environment Configuration**
   - Production Supabase URL: `https://your-project.supabase.co`
   - Production Supabase Anon Key: From Supabase dashboard
   - Frontend connects to production instance

### Current Database State
The local database comes pre-populated with:
- **12 app users** (including sample test users)
- **3 subscription plans** (Free Trial, Starter, Pro)
- **11 trading accounts** across different brokers
- **16 sample trades** with various instruments
- **3 trading strategies**
- **2 journal entries**

## Development Workflow

### 1. Starting Development
```bash
# Terminal 1: Start frontend development server
npm run dev

# Terminal 2: Deploy Edge Functions (if needed)
npx supabase functions deploy
```

### 2. Database Development
- **Schema Changes**: Create new migrations using `npx supabase migration new <name>`
- **Data Seeding**: Use the existing `supabase/seed.sql` for additional test data
- **Testing**: All changes are isolated to your local environment

### 3. Edge Functions Development
- Functions are located in `supabase/functions/`
- Test in production environment
- Deploy using `npx supabase functions deploy`

## Production Development Rules

### Database Rules
1. **Be extremely careful with production data** - Always backup before making changes
2. **Use migrations for schema changes** - Never alter tables directly in production
3. **Test thoroughly** - Ensure all changes work correctly before applying
4. **Backup before major changes** - Always backup production data before changes

### Code Development Rules
1. **Environment Variables**
   - Use `.env.local` for local development settings
   - Never commit sensitive keys to version control
   - Local Supabase credentials are safe to use in development

2. **API Development**
   - Test all API endpoints against production Supabase instance
   - Verify RLS policies work correctly with production users
   - Be careful when testing with production user accounts

3. **Frontend Development**
   - Application connects to production environment
   - Be careful when testing with production data
   - Test all user roles and subscription levels

### Testing Rules
1. **User Authentication**
   - Test with sample users: john.doe@example.com, jane.smith@example.com, mike.wilson@example.com
   - Verify different subscription plan behaviors
   - Test user role permissions (user, admin, manager)

2. **Trading Features**
   - Use existing sample accounts for testing
   - Test with various trade types and statuses
   - Verify strategy assignment and journal integration

3. **Data Integrity**
   - Ensure all foreign key relationships work correctly
   - Test cascade deletes and updates
   - Verify RLS policies prevent unauthorized access

## Deployment Rules

### Before Deployment
1. **Test Locally**: Ensure all features work in local environment
2. **Run Migrations**: Apply any new migrations to production
3. **Backup Production**: Always backup before major deployments
4. **Edge Functions**: Deploy and test functions in staging first

### Production Deployment
1. **Database Changes**
   ```bash
   # Apply migrations to production
   npx supabase db push
   ```

2. **Edge Functions**
   ```bash
   # Deploy specific function
   npx supabase functions deploy <function-name>
   
   # Deploy all functions
   npx supabase functions deploy
   ```

3. **Frontend Deployment**
   - Ensure environment variables point to production Supabase
   - Test authentication and data access post-deployment

## Troubleshooting

### Common Issues
1. **Empty Tables**: If tables appear empty, check if you're connected to the correct Supabase instance
2. **Permission Errors**: Verify RLS policies and user authentication
3. **Migration Failures**: Check migration syntax and dependencies
4. **Function Errors**: Check function logs using `npx supabase functions logs`

### Reset Local Environment
```bash
# Stop all services
npx supabase stop

# Reset and restart (this will clear all local data)
npx supabase stop --no-backup
npx supabase start
```

### Data Recovery
```bash
# Restore from backup
# Use Supabase dashboard or backup tools

# Connect to production database
npx supabase db shell
```

## Security Guidelines

### Production Development
- Production Supabase credentials must be kept secure
- Never commit production credentials to version control
- Test RLS policies thoroughly in production environment

### Production
- Use environment variables for all sensitive configuration
- Regularly rotate API keys and database passwords
- Monitor access logs and audit trails
- Keep Supabase CLI and dependencies updated

## Best Practices

1. **Version Control**
   - Commit all migration files
   - Include RLS policies in version control
   - Document significant schema changes

2. **Documentation**
   - Update this document when adding new features
   - Document any custom Edge Functions
   - Maintain API documentation for frontend integration

3. **Performance**
   - Use database indexes appropriately
   - Optimize queries for large datasets
   - Monitor function execution times

4. **Monitoring**
   - Use Supabase dashboard for monitoring
   - Set up alerts for critical errors
   - Regular backup schedules

---

**Last Updated**: January 2025
**Maintainer**: Development Team
**Version**: 1.0