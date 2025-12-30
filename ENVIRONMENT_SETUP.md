# Environment Configuration Setup Guide

## Overview

This project uses a dual-environment setup for Supabase:
- **Local Development**: Uses Supabase CLI with Docker
- **Remote/Production**: Uses your Supabase cloud project

## Files Structure

### `.env.local` (Local Development)
- Contains local Supabase configuration
- Automatically loaded by Vite in development mode
- **NEVER commit this file to version control**

### `.env` (Remote/Production)  
- Contains production Supabase configuration
- Should be committed with placeholder values
- Actual values should be set in deployment environment variables

### `.env.example` (Template)
- Comprehensive template with documentation
- Copy to `.env` or `.env.local` as needed

## Setup Instructions

### Local Development Setup

1. **Start Local Supabase:**
   ```bash
   npm run supabase:start
   ```

2. **Copy environment template:**
   ```bash
   cp .env.example .env.local
   ```

3. **Update local values:** (automatically done in current setup)
   - `VITE_SUPABASE_URL=http://127.0.0.1:54321`
   - `VITE_SUPABASE_ANON_KEY=sb_publishable_...` (from `supabase status`)
   - `SUPABASE_SERVICE_ROLE_KEY=sb_secret_...` (from `supabase status`)

4. **Start development server:**
   ```bash
   npm run dev
   ```

### Production Setup

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Update with production values:**
   - `VITE_SUPABASE_URL=https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=your-publishable-key`
   - `SUPABASE_SERVICE_ROLE_KEY=your-service-role-key`

3. **Set deployment environment variables:**
   - Set the same variables in your hosting platform (Vercel, Netlify, etc.)

## Environment Variables

### Required Variables
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous/publishable key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (server-side only)

### Protection Variables
- `NODE_ENV`: `development` or `production`
- `ALLOW_DATABASE_RESET`: `true` (local) or `false` (production)
- `IS_PRODUCTION_ENVIRONMENT`: `false` (local) or `true` (production)

### Feature Flags
- `NEXT_PUBLIC_ENABLE_ANALYTICS`: Enable analytics features
- `NEXT_PUBLIC_ENABLE_REAL_TIME`: Enable real-time features

## Security Notes

1. **Never commit actual API keys** to version control
2. **Service role key should NEVER be used** in client-side code
3. Use environment variables for all sensitive information
4. `.env.local` is automatically excluded by `.gitignore`

## Troubleshooting

### Environment Variables Not Loading
- Ensure you're using `import.meta.env.VITE_*` in Vite projects
- Restart development server after changing environment files

### Local Supabase Connection Issues
- Verify Supabase CLI is running: `supabase status`
- Check Docker is running
- Restart Supabase: `supabase stop && supabase start`

### Production Deployment
- Set environment variables in your hosting platform
- Ensure `NODE_ENV=production` and `ALLOW_DATABASE_RESET=false`