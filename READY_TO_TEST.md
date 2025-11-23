# ✅ Ready to Test - Quick Checklist

## 🎉 Implementation Complete!

All code is written and integrated. Here's what to do next:

## 1. Test Locally (5 minutes)

```bash
# Start Supabase
supabase start

# Apply all migrations
supabase db reset

# Start dev server
npm run dev
```

## 2. Test Signup Flow (2 minutes)

1. Go to `http://localhost:5173/auth/register`
2. Fill in the form:
   - Email: `test@example.com`
   - Password: `password123`
   - Username: `testuser`
   - First Name: `Test`
   - Last Name: `User`
3. Click "Sign up"
4. Should redirect to `/auth/confirm-email`

## 3. Check Database (1 minute)

Open Supabase Studio: `http://localhost:54323`

```sql
-- Check user created
SELECT * FROM app_users WHERE email = 'test@example.com';

-- Should see:
-- - email, username, first_name, last_name
-- - signup_source = 'web'
-- - email_verified = false (until confirmed)
-- - profile_completed = false
-- - trial_end_date = NOW() + 7 days
-- - affiliate_code (8 chars)

-- Check profiles created
SELECT * FROM trader_profiles WHERE user_id IN (
  SELECT id FROM app_users WHERE email = 'test@example.com'
);

-- Check settings created (should be 4 rows)
SELECT * FROM user_settings WHERE user_id IN (
  SELECT id FROM app_users WHERE email = 'test@example.com'
);

-- Check subscription created
SELECT * FROM user_subscriptions WHERE user_id IN (
  SELECT id FROM app_users WHERE email = 'test@example.com'
);
-- Should see status = 'trialing'

-- Check creation log
SELECT * FROM user_creation_log WHERE email = 'test@example.com';
-- Should see profile_created = true
```

## 4. Test Email Confirmation (if enabled)

If email confirmations are enabled in Supabase:

1. Check Supabase logs for confirmation email
2. Copy confirmation link
3. Open in browser
4. Should redirect to `/dashboard` or `/onboarding`

If email confirmations are disabled:
- User is auto-confirmed
- Redirects immediately to dashboard

## 5. Test Onboarding (1 minute)

1. Should see onboarding wizard
2. Click through 4 steps
3. Click "Go to Dashboard"
4. Should redirect to `/dashboard`

## 6. Check Trial Banner (30 seconds)

1. On dashboard, should see trial banner at top
2. Should show "7 days left in your free trial"
3. Click X to dismiss
4. Refresh page - should stay dismissed (session)

## 7. Test Sign Out & Sign In (1 minute)

1. Sign out
2. Go to `/auth/sign-in`
3. Enter credentials
4. Should sign in and redirect to dashboard

## 8. Test Password Reset (2 minutes)

1. Sign out
2. Click "Forgot password"
3. Enter email
4. Check for reset email
5. Click link
6. Enter new password
7. Should redirect to sign in

## 9. Test Google OAuth (if configured)

1. Click "Sign in with Google"
2. Authorize
3. Should create profile automatically
4. Redirect to onboarding
5. Complete onboarding
6. Check database - profile should exist

## ✅ Success Criteria

All of these should work:

- [ ] Signup creates user in auth.users
- [ ] Database trigger creates app_users
- [ ] Database trigger creates trader_profiles
- [ ] Database trigger creates user_settings (4 records)
- [ ] Database trigger creates user_subscriptions
- [ ] Trial subscription has 7-day period
- [ ] Email confirmation page shows
- [ ] Onboarding wizard shows
- [ ] Onboarding marks completion flags
- [ ] Trial banner shows on dashboard
- [ ] Trial banner shows correct days
- [ ] Trial banner dismisses
- [ ] Sign in works
- [ ] Password reset works
- [ ] Google OAuth works (if configured)

## 🐛 If Something Fails

### Profile not created?

Check `user_creation_log`:
```sql
SELECT * FROM user_creation_log 
WHERE profile_created = false 
ORDER BY created_at DESC;
```

Look at `profile_creation_error` column for details.

### Trigger not firing?

Check trigger exists:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Wrong field names?

Make sure you're using `id` not `auth_id`:
```typescript
// ❌ Wrong
.eq('auth_id', user.id)

// ✅ Correct
.eq('id', user.id)
```

### Email not sending?

Check Supabase Auth settings:
- Email confirmations enabled?
- SMTP configured?
- Check spam folder

## 📊 Monitor These

```sql
-- Signup success rate
SELECT 
  COUNT(*) FILTER (WHERE profile_created = true) * 100.0 / COUNT(*) as success_rate
FROM user_creation_log;

-- Should be > 99%

-- Failed signups
SELECT * FROM user_creation_log 
WHERE profile_created = false 
ORDER BY created_at DESC;

-- Should be empty or very few

-- Trial activations
SELECT COUNT(*) FROM user_subscriptions 
WHERE status = 'trialing';

-- Should equal number of new signups
```

## 🚀 Deploy When Ready

```bash
# 1. Deploy migrations
supabase db push

# 2. Deploy frontend
npm run build
vercel deploy --prod

# 3. Configure Supabase Auth
# - Add redirect URLs
# - Enable email confirmations
# - Configure SMTP
# - Enable Google OAuth

# 4. Test in production
# - Sign up
# - Confirm email
# - Complete onboarding
# - Check trial banner
```

## 📞 Need Help?

Check these docs:
- `AUTH_QUICK_REFERENCE.md` - Quick troubleshooting
- `AUTH_FLOW_COMPLETE_GUIDE.md` - Complete guide
- `IMPLEMENTATION_COMPLETE_SUMMARY.md` - Full summary

## 🎊 You're Ready!

Everything is implemented and ready to test. Just follow the steps above and you'll have a fully working authentication system with:

- ✅ Email/password signup
- ✅ Google OAuth
- ✅ Email confirmation
- ✅ Onboarding wizard
- ✅ Trial management
- ✅ Password reset
- ✅ Automatic profile creation
- ✅ 7-day trial
- ✅ Trial reminder banner

**Happy testing! 🚀**

---

**Last Updated:** November 23, 2024
**Status:** Ready for Testing ✅
