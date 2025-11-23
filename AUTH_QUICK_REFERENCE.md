# Authentication Flow - Quick Reference

## 🚀 Quick Start

### Add Routes (App.tsx)

```typescript
import EmailConfirmation from "@/pages/EmailConfirmation";
import Onboarding from "@/pages/Onboarding";

// Add these routes:
<Route path="/auth/confirm-email" element={<EmailConfirmation />} />
<Route path="/onboarding" element={<Onboarding />} />
```

### Add Trial Banner (Dashboard Layout)

```typescript
import { TrialBanner } from "@/components/TrialBanner";

// In your layout:
<div className="container">
  <TrialBanner />
  {/* content */}
</div>
```

## 📝 Files Changed

### Updated Files
1. ✅ `src/context/AuthContext.tsx` - Fixed field names, removed manual profile creation
2. ✅ `src/pages/Auth.tsx` - Simplified signup, removed RPC calls
3. ✅ `supabase/migrations/20241123100007_phase8_database_functions.sql` - Updated trigger

### New Files
4. ✅ `src/pages/EmailConfirmation.tsx` - Email confirmation page
5. ✅ `src/pages/Onboarding.tsx` - Onboarding wizard
6. ✅ `src/components/TrialBanner.tsx` - Trial reminder banner

## 🔑 Key Changes

### What Changed
- ❌ **REMOVED**: Manual profile creation via RPC calls
- ❌ **REMOVED**: `auth_id` field references
- ✅ **ADDED**: Automatic profile creation via database trigger
- ✅ **ADDED**: Email confirmation flow
- ✅ **ADDED**: Onboarding wizard
- ✅ **ADDED**: Trial banner component
- ✅ **ADDED**: `signup_source` tracking
- ✅ **ADDED**: `email_verified` status
- ✅ **ADDED**: `profile_completed` flag

### How It Works Now

**Before (Manual):**
```
Signup → Create auth.users → Frontend calls RPC → Create profiles
```

**After (Automatic):**
```
Signup → Create auth.users → Database trigger → Create profiles automatically
```

## 🧪 Test Locally

```bash
# 1. Start Supabase
supabase start

# 2. Apply migrations
supabase db reset

# 3. Start dev server
npm run dev

# 4. Test signup flow
# - Go to /auth/register
# - Fill form and submit
# - Check email for confirmation
# - Click link
# - Complete onboarding
# - Check dashboard
```

## 🔍 Verify Database

```sql
-- Check user was created
SELECT * FROM app_users WHERE email = 'test@example.com';

-- Check profile was created
SELECT * FROM trader_profiles WHERE user_id = 'user-id-here';

-- Check settings were created
SELECT * FROM user_settings WHERE user_id = 'user-id-here';

-- Check subscription was created
SELECT * FROM user_subscriptions WHERE user_id = 'user-id-here';

-- Check creation log
SELECT * FROM user_creation_log WHERE email = 'test@example.com';
```

## 🐛 Common Issues

### Issue: Profile not created

**Solution**: Check `user_creation_log` table for errors
```sql
SELECT * FROM user_creation_log 
WHERE profile_created = false 
ORDER BY created_at DESC;
```

### Issue: Email not confirmed

**Solution**: Check Supabase Auth settings
- Email confirmations enabled?
- SMTP configured?
- Check spam folder

### Issue: Trigger not firing

**Solution**: Check trigger exists
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Issue: Wrong field names

**Solution**: Use `id` not `auth_id`
```typescript
// ❌ Wrong
.eq('auth_id', user.id)

// ✅ Correct
.eq('id', user.id)
```

## 📊 Monitor

### Key Metrics to Track

```sql
-- Signup success rate
SELECT 
  COUNT(*) FILTER (WHERE profile_created = true) * 100.0 / COUNT(*) as success_rate
FROM user_creation_log;

-- Average creation attempts
SELECT AVG(profile_creation_attempts) 
FROM user_creation_log 
WHERE profile_created = true;

-- Failed signups
SELECT * FROM user_creation_log 
WHERE profile_created = false 
ORDER BY created_at DESC;

-- Trial activations
SELECT COUNT(*) FROM user_subscriptions 
WHERE status = 'trialing';

-- Email confirmations
SELECT 
  COUNT(*) FILTER (WHERE email_verified = true) * 100.0 / COUNT(*) as confirmation_rate
FROM app_users;
```

## 🎯 Success Checklist

- [ ] Routes added to App.tsx
- [ ] TrialBanner added to layout
- [ ] Migrations deployed
- [ ] Frontend deployed
- [ ] Supabase Auth configured
- [ ] Email templates configured (optional)
- [ ] Google OAuth enabled (optional)
- [ ] Tested signup flow
- [ ] Tested email confirmation
- [ ] Tested onboarding
- [ ] Tested trial banner
- [ ] Monitoring set up

## 📞 Support

If you encounter issues:

1. Check `user_creation_log` table
2. Check browser console for errors
3. Check Supabase logs
4. Verify trigger exists and is enabled
5. Verify RLS policies allow access

## 🔗 Related Docs

- `AUTH_FLOW_COMPLETE_GUIDE.md` - Complete guide
- `AUTH_IMPLEMENTATION_COMPLETE.md` - Implementation summary
- `.kiro/specs/tradelens-auth-flow/requirements.md` - Requirements
- `DATABASE_REBUILD_SUMMARY.md` - Database schema

---

**Quick Reference v1.0**
**Last Updated**: November 23, 2024
