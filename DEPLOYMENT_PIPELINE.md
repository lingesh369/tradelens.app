# TradeLens Deployment Pipeline Guide

This guide explains the complete CI/CD pipeline for TradeLens that automatically deploys both database changes and frontend updates to production.

## Overview

The deployment pipeline consists of two main jobs:
1. **Database Migration**: Applies schema changes and deploys edge functions to Supabase
2. **Frontend Deployment**: Builds and deploys the React application to Vercel

## Required GitHub Secrets

You need to configure the following secrets in your GitHub repository:

### Supabase Configuration
```
SUPABASE_ACCESS_TOKEN=sbp_your_personal_access_token_here
SUPABASE_DB_PASSWORD=your_database_password
SUPABASE_PROJECT_ID=tzhhxeyisppkzyjacodu
VITE_SUPABASE_URL=https://tzhhxeyisppkzyjacodu.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key_here
```

### Vercel Configuration
```
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

## How to Set Up GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret from the list above

### Getting Supabase Values

**SUPABASE_ACCESS_TOKEN:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click your profile → **Access Tokens**
3. Generate new token → Copy the `sbp_` token

**SUPABASE_PROJECT_ID:**
- Found in your Supabase project URL: `https://supabase.com/dashboard/project/[PROJECT_ID]`

**VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY:**
1. Go to your Supabase project
2. **Settings** → **API**
3. Copy the **Project URL** and **anon public** key

### Getting Vercel Values

**VERCEL_TOKEN:**
1. Go to [Vercel Dashboard](https://vercel.com/account/tokens)
2. Create new token → Copy the token

**VERCEL_ORG_ID & VERCEL_PROJECT_ID:**
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel link` in your project
3. Check `.vercel/project.json` for the IDs

## Deployment Workflow

### On Every Push to Main Branch:

1. **Database Migration Job**:
   - Links to production Supabase project
   - Applies any new migrations from `supabase/migrations/`
   - Deploys all edge functions from `supabase/functions/`

2. **Frontend Build & Deploy Job**:
   - Installs dependencies
   - Builds React app with production environment variables
   - Deploys to Vercel (primary)
   - Falls back to GitHub Pages if Vercel fails

### On Pull Requests:
- Only builds and tests the frontend
- No database changes or deployments

## Local Development Workflow

### Making Changes

1. **Database Changes**:
   ```bash
   # Create new migration
   npx supabase migration new your_migration_name
   
   # Apply locally
   npx supabase db reset
   ```

2. **Edge Function Changes**:
   ```bash
   # Test locally
   npx supabase functions serve
   
   # Test specific function
   curl -X POST 'http://127.0.0.1:54321/functions/v1/your-function'
   ```

3. **Frontend Changes**:
   ```bash
   # Start dev server
   npm run dev
   
   # Test with production Supabase
   # (Already configured in .env)
   ```

### Deployment Process

1. **Commit & Push**:
   ```bash
   git add .
   git commit -m "feat: your changes"
   git push origin main
   ```

2. **Automatic Deployment**:
   - GitHub Actions triggers
   - Database migrations run first
   - Frontend builds and deploys
   - Check Actions tab for status

## Safety Features

### Database Protection
- Migrations only run on `main` branch pushes
- Local environment has `ALLOW_DATABASE_RESET=true`
- Production environment has `ALLOW_DATABASE_RESET=false`
- All changes are version-controlled in migrations

### Deployment Safety
- Frontend deployment depends on successful database migration
- Fallback to GitHub Pages if Vercel fails
- Environment variables properly isolated
- Production builds use production Supabase instance

## Monitoring & Troubleshooting

### Check Deployment Status
1. **GitHub Actions**: Repository → Actions tab
2. **Vercel**: [Vercel Dashboard](https://vercel.com/dashboard)
3. **Supabase**: [Supabase Dashboard](https://supabase.com/dashboard)

### Common Issues

**Migration Fails**:
- Check migration SQL syntax
- Ensure no breaking changes
- Review Supabase logs

**Build Fails**:
- Check environment variables
- Verify TypeScript types
- Review build logs in Actions

**Deployment Fails**:
- Verify Vercel token and project IDs
- Check Vercel dashboard for errors
- GitHub Pages will be used as fallback

## Environment Variables Summary

### Local Development (.env)
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=production_anon_key
NODE_ENV=development
ALLOW_DATABASE_RESET=true
IS_PRODUCTION_ENVIRONMENT=false
```

### Production (GitHub Secrets)
```env
VITE_SUPABASE_URL=https://tzhhxeyisppkzyjacodu.supabase.co
VITE_SUPABASE_ANON_KEY=production_anon_key
NODE_ENV=production
ALLOW_DATABASE_RESET=false
IS_PRODUCTION_ENVIRONMENT=true
```

## Next Steps

1. ✅ Configure all GitHub secrets
2. ✅ Test a small change by pushing to main
3. ✅ Verify deployment in Vercel and Supabase
4. ✅ Set up monitoring and alerts

Your development workflow is now:
**Local Development** → **Commit & Push** → **Automatic Production Deployment** 🚀