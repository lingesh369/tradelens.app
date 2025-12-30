# TradeLens Production Development Setup

This guide will help you set up the TradeLens application for development with production Supabase environment.

## Prerequisites

- Node.js 18+ installed
- npm package manager
- Git
- Supabase CLI installed globally: `npm install -g supabase`
- Access to production Supabase project

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/lingesh369/tradelens.git
cd tradelens
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

The `.env` file has been configured for production development:

```env
# Supabase Configuration for Production Development
VITE_SUPABASE_URL=https://tjbrbmywiucblznkjqyi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

### 4. Configure Production Supabase Connection

Ensure your `.env` file contains the production Supabase credentials:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The application will connect directly to production Supabase services:
- API Gateway
- Database (PostgreSQL)
- Auth
- Storage
- Edge Functions
- Realtime

### 5. Database Setup

The production database has been configured with:
- ✅ Production schema active
- ✅ Live data available
- ✅ All tables and relationships configured
- ✅ Row Level Security (RLS) policies applied

### 6. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Database Management

### Viewing Production Database

- **Supabase Studio**: `https://supabase.com/dashboard/project/your-project-id`
- **Database URL**: Available in Supabase dashboard settings

### Production Data Available

The production database includes:
- Live subscription plans and user data
- Real user accounts and subscription statuses
- Active trading accounts across different brokers
- Live trading data and analytics
- User-generated notes and content
- Complete production relationships

### Making Database Changes

1. **Create a new migration**:
   ```bash
   supabase migration new your_migration_name
   ```

2. **Apply migrations**:
   ```bash
   supabase db push  # Push migrations to production
   # OR
   supabase migration up  # Apply pending migrations
   ```

3. **Generate TypeScript types**:
   ```bash
   supabase gen types typescript --project-id your-project-id > src/types/database.types.ts
   ```

## Edge Functions Development

### Available Functions

The project includes numerous Edge Functions for:
- AI chat and analysis
- Payment processing (PayPal, Cashfree, NowPayments)
- Email automation
- Subscription management
- Community features

### Testing Functions Locally

```bash
# Serve a specific function
supabase functions serve function-name

# Serve all functions
supabase functions serve
```

### Function Environment Variables

For local testing, you may need to set additional environment variables:

```bash
# Example for AI functions
export OPENAI_API_KEY=your_openai_key

# Example for payment functions
export PAYPAL_CLIENT_ID=your_paypal_client_id
export PAYPAL_CLIENT_SECRET=your_paypal_secret
```

## Testing

### Database Testing

```bash
# Test cascading deletes
supabase db test

# Verify RLS policies
supabase db lint
```

### Frontend Testing

```bash
# Run unit tests
npm test

# Run e2e tests
npm run test:e2e
```

## Deployment

### CI/CD Pipeline

The project uses GitHub Actions for automated deployment:

- **Staging**: Deploys on push to `develop` branch
- **Production**: Deploys on push to `main` branch
- **Testing**: Runs on all pull requests

### Manual Deployment

```bash
# Deploy to production
supabase link --project-ref your-production-project-id
supabase db push
supabase functions deploy

# Deploy frontend
npm run build
# Deploy dist/ folder to your hosting platform
```

## Troubleshooting

### Common Issues

1. **Supabase won't start**:
   ```bash
   supabase stop
   docker system prune -f
   supabase start
   ```

2. **Database connection issues**:
   - Check if Docker is running
   - Verify ports 54321-54326 are available
   - Check `supabase status` for service health

3. **Migration errors**:
   ```bash
   supabase db reset  # Reset to clean state
   supabase migration repair  # Fix migration issues
   ```

4. **Environment variable issues**:
   - Ensure `.env` file exists and has correct values
   - Restart development server after changes
   - Check browser console for connection errors

### Getting Help

- Check the [Supabase Documentation](https://supabase.com/docs)
- Review existing GitHub issues
- Check the project's README.md for additional information

## Development Workflow

### Feature Development

1. Create a feature branch from `develop`
2. Make your changes (frontend, backend, database)
3. Test with production Supabase using `npm run dev`
4. Create a pull request to `develop`
5. After review, merge to `develop` for staging deployment
6. When ready, merge `develop` to `main` for production

### Database Schema Changes

1. Create migration: `supabase migration new feature_name`
2. Write SQL in the generated migration file
3. Test with production: Verify changes work correctly
4. Update TypeScript types: `supabase gen types typescript --project-id your-project-id`
5. Commit migration file and types

### Best Practices

- Always test database changes locally before pushing
- Use meaningful migration names
- Keep migrations small and focused
- Test Edge Functions locally before deployment
- Follow the existing code style and patterns
- Write tests for new features
- Update documentation when adding new features

## Project Structure

```
tradelens/
├── src/                    # Frontend React application
├── supabase/
│   ├── config.toml        # Supabase configuration
│   ├── migrations/        # Database migrations
│   ├── functions/         # Edge Functions
│   └── sql/              # Additional SQL files
├── .github/workflows/     # CI/CD pipelines
├── .env                   # Environment variables (local)
└── LOCAL_DEVELOPMENT.md   # This file
```

This setup provides a complete local development environment that mirrors production, allowing you to develop and test features with confidence.
