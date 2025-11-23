# Production Supabase Development Workflow Guide

## 🚨 IMPORTANT: Understanding Your Current Setup

### Current Configuration Status
- ✅ **Frontend (Vite)**: Running on `http://localhost:8080` (connected to PRODUCTION Supabase)
- ✅ **Production Supabase**: Running on `https://your-project.supabase.co` (live production environment)
- ✅ **Supabase Studio**: Available at `http://127.0.0.1:54323`
- ❓ **Port 8080**: Something else is running here (not your TradeLens app)

### What You Should Access
- **Your TradeLens App**: `http://localhost:8080` ← This shows PRODUCTION data
- **Database Admin**: `https://supabase.com/dashboard/project/your-project-id` ← Supabase Studio for production DB

## 🔄 Proper Local Development Workflow (WITHOUT Data Loss)

### ❌ AVOID: `npx supabase db reset`
You're absolutely right! This command:
- Completely wipes your local database
- Reloads only from migration files
- **DESTROYS all your loaded production data**
- Should only be used when you want a fresh start

### ✅ RECOMMENDED: Safe Development Practices

#### 1. **Making Schema Changes**
```bash
# Create a new migration for schema changes
npx supabase migration new add_new_feature

# Edit the generated migration file in supabase/migrations/
# Then apply it without losing data:
npx supabase migration up
```

#### 2. **Testing Changes**
```bash
# Your changes are immediately available in:
# - Frontend: http://localhost:5173
# - Studio: http://127.0.0.1:54323
```

#### 3. **Reverting Changes (Safe)**
```bash
# If you need to undo a migration:
npx supabase migration down

# Or rollback to a specific version:
npx supabase db reset --version 20241005112233
```

#### 4. **Updating Functions**
```bash
# Deploy updated Edge Functions:
npx supabase functions deploy function_name

# Or serve them locally (already running):
npx supabase functions serve
```

## 📊 Data Persistence in Local Development

### Your Current Data State
- ✅ **Production data is live** in your production Supabase
- ✅ **Data persists** between restarts (unless you run `db reset`)
- ✅ **Schema changes preserve data** when using migrations

### Data Locations
```
Production Supabase Database
├── Live production schema ✅
├── Live production data ✅
├── Real-time changes ✅
└── Always available ✅
```

## 🔧 Common Development Tasks

### Adding New Tables
```bash
# 1. Create migration
npx supabase migration new add_user_preferences

# 2. Edit the migration file
# supabase/migrations/[timestamp]_add_user_preferences.sql
CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  theme VARCHAR(20) DEFAULT 'light',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

# 3. Apply migration (keeps existing data)
npx supabase migration up
```

### Modifying Existing Tables
```bash
# 1. Create migration
npx supabase migration new modify_trades_table

# 2. Add your changes
ALTER TABLE trades ADD COLUMN new_field TEXT;

# 3. Apply safely
npx supabase migration up
```

### Testing with Real Data
```bash
# Your local environment now has:
# - Real production data for testing
# - Same schema as production
# - Safe environment for experiments
```

## 🚀 Deployment Workflow

### From Local to Production
```bash
# 1. Test locally with real data ✅
# 2. Commit your migration files
git add supabase/migrations/
git commit -m "Add new feature"

# 3. Push to GitHub
git push origin main

# 4. GitHub Actions automatically:
#    - Applies migrations to production
#    - Deploys frontend to Vercel
```

## 🛡️ Safety Guidelines

### When to Use `db reset` (Rarely)
- ✅ When you want to start completely fresh
- ✅ When your local DB is corrupted
- ✅ When you want to test the full migration process
- ❌ **NOT for regular development**

### Backup Your Local Data
```bash
# Create a backup before major changes
pg_dump "postgresql://postgres:postgres@127.0.0.1:54322/postgres" > local_backup.sql

# Restore if needed
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" < local_backup.sql
```

## 🔍 Troubleshooting

### If Your Frontend Shows No Data
1. Check `.env` file points to production Supabase ✅
2. Verify production Supabase connection ✅
3. Check Studio at production dashboard for data ✅

### If You Accidentally Reset
```bash
# Reload production data (we have the dump files)
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" < production_full_dump.sql
```

## 📝 Summary

**Your Current Setup is PERFECT:**
- ✅ Frontend connects to production Supabase
- ✅ Production Supabase has live data
- ✅ Changes are live and persistent
- ✅ Direct production environment access

**Development Flow:**
1. Make changes using migrations
2. Test on `http://localhost:5173`
3. Commit and push
4. Auto-deploy to production

**Remember:** `http://localhost:8080` is NOT your TradeLens app. Use `http://localhost:5173` for your application!