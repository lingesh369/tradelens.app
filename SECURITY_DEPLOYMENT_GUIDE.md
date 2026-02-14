# 🔐 Security Deployment Guide - Step by Step
**Complete Manual for Deploying Security Fixes**

---

## 📋 Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Step 1: Rotate Supabase Keys](#step-1-rotate-supabase-keys)
3. [Step 2: Update CORS Configuration](#step-2-update-cors-configuration)
4. [Step 3: Run Database Migrations](#step-3-run-database-migrations)
5. [Step 4: Deploy Edge Functions](#step-4-deploy-edge-functions)
6. [Step 5: Integrate Password Strength](#step-5-integrate-password-strength)
6. [Step 6: Replace Console.log Statements](#step-6-replace-consolelog-statements)
7. [Step 7: Test Security Features](#step-7-test-security-features)
8. [Step 8: Deploy to Production](#step-8-deploy-to-production)
9. [Post-Deployment Verification](#post-deployment-verification)
10. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Before starting, ensure you have:
- [ ] Access to Supabase Dashboard (admin account)
- [ ] Access to your deployment platform (Vercel/Netlify/etc)
- [ ] Git repository access
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Node.js and npm installed
- [ ] Backup of current database (recommended)

**Estimated Time:** 2-3 hours

---

## Step 1: Rotate Supabase Keys

### 🚨 CRITICAL - Do This First!

Your production Supabase keys were exposed in the `.env` file. You MUST rotate them immediately.

### 1.1 Access Supabase Dashboard


1. Go to https://supabase.com/dashboard
2. Sign in with your account
3. Select your project: `tjbrbmywiucblznkjqyi`

### 1.2 Rotate API Keys

**For Anon Key:**
1. Navigate to **Settings** → **API**
2. Scroll to **Project API keys** section
3. Find **anon public** key
4. Click **Regenerate** button
5. Copy the new key immediately
6. Save it securely (you'll need it in step 1.4)

**For Service Role Key:**
1. In the same **API** settings page
2. Find **service_role** key
3. Click **Regenerate** button
4. ⚠️ **WARNING:** This is a sensitive key - handle with extreme care
5. Copy the new key immediately
6. Save it securely (you'll need it in step 1.4)

### 1.3 Update Local Environment

Update your `.env.local` file (for local development):

```bash
# Open .env.local
# Replace the old keys with new ones

VITE_SUPABASE_URL=http://127.0.0.1:54321  # Keep local URL
VITE_SUPABASE_ANON_KEY=<your-new-local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-new-local-service-key>
```


### 1.4 Update Production Environment Variables

**For Vercel:**
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Update these variables:
   - `VITE_SUPABASE_URL` = `https://tjbrbmywiucblznkjqyi.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `<your-new-anon-key>`
   - `SUPABASE_SERVICE_ROLE_KEY` = `<your-new-service-role-key>`
5. Click **Save**
6. Redeploy your application

**For Netlify:**
1. Go to https://app.netlify.com
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Update the same variables as above
5. Click **Save**
6. Trigger a new deploy

**For Other Platforms:**
- Follow your platform's documentation for updating environment variables
- Ensure all three variables are updated
- Redeploy after updating

### 1.5 Verify Key Rotation

Test that old keys no longer work:

```bash
# Try using old anon key (should fail)
curl https://tjbrbmywiucblznkjqyi.supabase.co/rest/v1/app_users \
  -H "apikey: <old-anon-key>" \
  -H "Authorization: Bearer <old-anon-key>"

# Should return: {"message":"Invalid API key"}
```

✅ **Checkpoint:** Old keys should be rejected, new keys should work.

---


## Step 2: Update CORS Configuration

### 2.1 Identify Your Domains

List all domains that should access your API:
- Production: `https://your-domain.com`
- Staging: `https://staging.your-domain.com`
- Development: `http://localhost:3000`, `http://localhost:5173`

### 2.2 Update CORS File

Open `supabase/functions/_shared/cors.ts`:

```typescript
const ALLOWED_ORIGINS = [
  'https://your-production-domain.com',      // ← Replace with your actual domain
  'https://your-staging-domain.com',         // ← Replace with your staging domain
  ...(Deno.env.get('NODE_ENV') === 'development' || Deno.env.get('ENVIRONMENT') === 'local' 
    ? ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'] 
    : []
  )
];
```

### 2.3 Update Edge Functions to Use New CORS

Find all edge functions using `corsHeaders` and update them:

**Example - Update `ai-chat/index.ts`:**

```typescript
// Old:
import { corsHeaders } from '../_shared/cors.ts';

// New:
import { getCorsHeaders } from '../_shared/cors.ts';

// In the handler:
const origin = req.headers.get('origin');
const headers = getCorsHeaders(origin);

return new Response(JSON.stringify(data), {
  headers: { ...headers, 'Content-Type': 'application/json' }
});
```

### 2.4 Test CORS Configuration

```bash
# Test from allowed origin (should work)
curl -X OPTIONS https://your-project.supabase.co/functions/v1/ai-chat \
  -H "Origin: https://your-production-domain.com" \
  -H "Access-Control-Request-Method: POST"

# Test from disallowed origin (should fail)
curl -X OPTIONS https://your-project.supabase.co/functions/v1/ai-chat \
  -H "Origin: https://malicious-site.com" \
  -H "Access-Control-Request-Method: POST"
```

✅ **Checkpoint:** Only allowed origins should receive CORS headers.

---


## Step 3: Run Database Migrations

### 3.1 Connect to Your Database

```bash
# Link to your Supabase project
supabase link --project-ref tjbrbmywiucblznkjqyi

# Enter your database password when prompted
```

### 3.2 Review Migrations

Check the new security migrations:

```bash
# List all migrations
ls -la supabase/migrations/

# You should see:
# 20260214200000_security_audit_logging.sql
# 20260214210000_prevent_self_role_promotion.sql
```

### 3.3 Apply Migrations (Local First)

Test on local Supabase first:

```bash
# Start local Supabase
supabase start

# Apply migrations locally
supabase db push

# Verify tables were created
supabase db diff
```

### 3.4 Apply to Production

⚠️ **IMPORTANT:** Backup your database first!

```bash
# Create backup
supabase db dump -f backup-$(date +%Y%m%d).sql

# Apply migrations to production
supabase db push --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.tjbrbmywiucblznkjqyi.supabase.co:5432/postgres"
```

### 3.5 Verify Migration Success

```bash
# Check if tables exist
supabase db execute "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'security%';"

# Should return:
# - security_audit_log
# - failed_login_attempts
# - account_lockouts
# - suspicious_activity_log
```

✅ **Checkpoint:** All security tables should be created successfully.

---


## Step 4: Deploy Edge Functions

### 4.1 Review Updated Functions

Check which functions were updated:
- `handle-payment-webhook/index.ts` - Webhook signature verification
- `_shared/cors.ts` - CORS configuration
- `_shared/response.ts` - Security headers
- `_shared/security-headers.ts` - New security headers
- `_shared/validation.ts` - Input validation

### 4.2 Deploy All Functions

```bash
# Deploy all edge functions
supabase functions deploy

# Or deploy specific functions:
supabase functions deploy handle-payment-webhook
supabase functions deploy ai-chat
supabase functions deploy validate-coupon
```

### 4.3 Set Environment Variables for Functions

```bash
# Set secrets for edge functions
supabase secrets set NOWPAYMENTS_IPN_SECRET=your-secret
supabase secrets set CASHFREE_SECRET_KEY=your-secret
supabase secrets set PAYPAL_CLIENT_SECRET=your-secret
supabase secrets set OPENAI_API_KEY=your-key

# Verify secrets are set
supabase secrets list
```

### 4.4 Test Edge Functions

```bash
# Test webhook with valid signature
curl -X POST https://tjbrbmywiucblznkjqyi.supabase.co/functions/v1/handle-payment-webhook \
  -H "Content-Type: application/json" \
  -H "x-nowpayments-sig: valid-signature" \
  -d '{"payment_status":"finished","order_id":"test-123"}'

# Should process successfully or return signature error
```

✅ **Checkpoint:** Edge functions should deploy without errors.

---


## Step 5: Integrate Password Strength Indicator

### 5.1 Update Signup Form

Open `src/pages/Auth.tsx` and add password strength indicator:

```typescript
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { validatePassword } from '@/lib/password-validation';

// In your signup form component:
const [password, setPassword] = useState('');
const [passwordValid, setPasswordValid] = useState(false);

// Add validation on password change
const handlePasswordChange = (value: string) => {
  setPassword(value);
  const validation = validatePassword(value);
  setPasswordValid(validation.isValid);
};

// In your JSX:
<FormField
  control={signupForm.control}
  name="password"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Password</FormLabel>
      <FormControl>
        <Input
          type="password"
          {...field}
          onChange={(e) => {
            field.onChange(e);
            handlePasswordChange(e.target.value);
          }}
        />
      </FormControl>
      <PasswordStrengthIndicator password={field.value} />
      <FormMessage />
    </FormItem>
  )}
/>

// Disable submit if password invalid
<Button type="submit" disabled={!passwordValid || isLoading}>
  Sign Up
</Button>
```

### 5.2 Update Password Change Form

Open `src/components/profile/ProfileSecurity.tsx`:

```typescript
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';

// Add to new password field
<FormField
  control={form.control}
  name="newPassword"
  render={({ field }) => (
    <FormItem>
      <FormLabel>New Password</FormLabel>
      <FormControl>
        <Input type="password" {...field} />
      </FormControl>
      <PasswordStrengthIndicator password={field.value} />
      <FormMessage />
    </FormItem>
  )}
/>
```

### 5.3 Update Password Reset Form

Open `src/pages/ResetPassword.tsx` and add the same indicator.

### 5.4 Test Password Validation

Try these passwords to test:
- ❌ `password` - Too weak
- ❌ `Password1` - Too short
- ❌ `Password123` - No special character
- ✅ `MySecureP@ssw0rd2024!` - Strong

✅ **Checkpoint:** Password strength indicator should show for all password inputs.

---


## Step 6: Replace Console.log Statements

### 6.1 Run Automated Replacement (Dry Run First)

```bash
# Install glob if not already installed
npm install --save-dev glob

# Run in dry-run mode to see what would change
node scripts/replace-console-logs.js --dry-run

# Review the output
# If everything looks good, run for real:
node scripts/replace-console-logs.js
```

### 6.2 Manual Cleanup for Complex Cases

Some console.log statements may need manual attention:

**Before:**
```typescript
console.log('User data:', user);
```

**After:**
```typescript
import { logger } from '@/lib/logger';

logger.info('User data loaded', { 
  userId: user.id,
  component: 'Dashboard'
});
```

### 6.3 Update Test Files

Test files can keep console.log, but add a comment:

```typescript
// eslint-disable-next-line no-console
console.log('Test output:', result);
```

### 6.4 Verify No Console.log in Production Code

```bash
# Search for remaining console.log
grep -r "console\.log" src/ --include="*.ts" --include="*.tsx"

# Should only find test files or commented lines
```

✅ **Checkpoint:** All console.log replaced with logger utility.

---


## Step 7: Test Security Features

### 7.1 Test XSS Protection

1. Create a trade with malicious notes:
```html
<script>alert('XSS')</script>
<img src=x onerror="alert('XSS')">
```

2. View the trade
3. ✅ Script should NOT execute
4. ✅ HTML should be sanitized

### 7.2 Test Webhook Signature Verification

```bash
# Test with invalid signature (should fail)
curl -X POST https://your-project.supabase.co/functions/v1/handle-payment-webhook \
  -H "Content-Type: application/json" \
  -H "x-nowpayments-sig: invalid-signature" \
  -d '{"payment_status":"finished","order_id":"test-123"}'

# Should return: "Invalid webhook signature"
```

### 7.3 Test Account Lockout

1. Try to login with wrong password 5 times
2. ✅ Account should be locked for 30 minutes
3. Check database:
```sql
SELECT * FROM account_lockouts WHERE email = 'test@example.com';
```

### 7.4 Test Password Strength

1. Go to signup page
2. Try weak password: `password123`
3. ✅ Should show "Weak" with red indicator
4. Try strong password: `MySecureP@ssw0rd2024!`
5. ✅ Should show "Strong" with green indicator

### 7.5 Test CORS

```bash
# From allowed origin (should work)
curl -X POST https://your-project.supabase.co/functions/v1/ai-chat \
  -H "Origin: https://your-domain.com" \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'

# From disallowed origin (should fail)
curl -X POST https://your-project.supabase.co/functions/v1/ai-chat \
  -H "Origin: https://evil.com" \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'
```

### 7.6 Test Security Headers

```bash
# Check security headers
curl -I https://your-domain.com

# Should include:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Content-Security-Policy: ...
# Strict-Transport-Security: ...
```

### 7.7 Test Security Logging

1. Perform a security-sensitive action (change password, update role)
2. Check security audit log:
```sql
SELECT * FROM security_audit_log 
WHERE event_category = 'security' 
ORDER BY created_at DESC 
LIMIT 10;
```

✅ **Checkpoint:** All security features should work as expected.

---


## Step 8: Deploy to Production

### 8.1 Commit All Changes

```bash
# Stage all security fixes
git add .

# Commit with descriptive message
git commit -m "security: implement comprehensive security fixes

- Fix XSS vulnerability with DOMPurify
- Implement webhook signature verification
- Add CORS origin whitelist
- Add security headers
- Implement password strength validation
- Add security audit logging
- Add account lockout mechanism
- Replace console.log with logger utility

BREAKING CHANGES:
- Supabase keys rotated (update environment variables)
- CORS now restricts origins (update allowed origins list)
- Password requirements now enforced (min 12 chars)
"

# Push to repository
git push origin main
```

### 8.2 Deploy to Staging First

```bash
# If you have a staging environment
git push origin staging

# Wait for deployment to complete
# Test all features in staging
```

### 8.3 Deploy to Production

**For Vercel:**
```bash
# Automatic deployment on push to main
# Or manual deployment:
vercel --prod
```

**For Netlify:**
```bash
# Automatic deployment on push to main
# Or manual deployment:
netlify deploy --prod
```

### 8.4 Monitor Deployment

1. Watch deployment logs
2. Check for any errors
3. Verify environment variables are set
4. Test critical paths:
   - User signup
   - User login
   - Trade creation
   - Payment webhook

✅ **Checkpoint:** Application deployed successfully with no errors.

---


## Post-Deployment Verification

### 9.1 Smoke Tests

Run these tests immediately after deployment:

**Test 1: User Authentication**
```bash
# Test signup with strong password
# Test login
# Test password reset
```

**Test 2: API Endpoints**
```bash
# Test trade creation
# Test trade retrieval
# Test user profile
```

**Test 3: Payment Webhooks**
```bash
# Send test webhook from payment provider
# Verify signature validation works
# Check payment is processed correctly
```

### 9.2 Security Verification

**Check 1: No Exposed Secrets**
```bash
# Verify .env file has placeholders only
cat .env | grep -E "(SUPABASE_URL|ANON_KEY|SERVICE_ROLE)"

# Should show placeholder values, not actual keys
```

**Check 2: XSS Protection**
- Create trade with `<script>alert('test')</script>` in notes
- View trade - script should NOT execute

**Check 3: CORS Protection**
- Try API call from unauthorized origin
- Should be rejected

**Check 4: Account Lockout**
- Try 5 failed logins
- Account should lock for 30 minutes

### 9.3 Monitor Security Logs

```sql
-- Check security audit log
SELECT 
  event_type,
  event_category,
  severity,
  COUNT(*) as count
FROM security_audit_log
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY event_type, event_category, severity
ORDER BY count DESC;

-- Check failed login attempts
SELECT 
  email,
  COUNT(*) as attempts,
  MAX(attempt_time) as last_attempt
FROM failed_login_attempts
WHERE attempt_time > NOW() - INTERVAL '1 hour'
GROUP BY email
HAVING COUNT(*) >= 3;
```

### 9.4 Performance Check

```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/api/trades

# Should be < 500ms
```

✅ **Checkpoint:** All post-deployment checks pass.

---


## Troubleshooting

### Issue 1: "Invalid API Key" Error

**Symptoms:** API calls fail with "Invalid API key"

**Solution:**
1. Verify new keys are set in environment variables
2. Redeploy application
3. Clear browser cache
4. Check Supabase dashboard for key status

```bash
# Verify environment variables
vercel env ls

# Should show VITE_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY
```

### Issue 2: CORS Errors

**Symptoms:** "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution:**
1. Check `ALLOWED_ORIGINS` in `cors.ts`
2. Ensure your domain is in the list
3. Redeploy edge functions
4. Clear browser cache

```bash
# Test CORS
curl -I -X OPTIONS https://your-project.supabase.co/functions/v1/ai-chat \
  -H "Origin: https://your-domain.com"

# Should return Access-Control-Allow-Origin header
```

### Issue 3: Webhook Signature Verification Fails

**Symptoms:** Webhooks rejected with "Invalid signature"

**Solution:**
1. Verify webhook secret is set correctly
2. Check webhook payload format
3. Ensure timestamp is included (for Cashfree)
4. Test with webhook provider's test tool

```bash
# Check secrets
supabase secrets list

# Should show NOWPAYMENTS_IPN_SECRET, CASHFREE_SECRET_KEY
```

### Issue 4: Database Migration Fails

**Symptoms:** Migration error during `supabase db push`

**Solution:**
1. Check migration file syntax
2. Verify database connection
3. Check for conflicting table names
4. Rollback and retry

```bash
# Rollback last migration
supabase db reset

# Reapply migrations
supabase db push
```

### Issue 5: Password Validation Not Showing

**Symptoms:** Password strength indicator doesn't appear

**Solution:**
1. Verify `PasswordStrengthIndicator` component is imported
2. Check that `password-validation.ts` is in correct location
3. Ensure component is added to form
4. Check browser console for errors

```bash
# Verify files exist
ls -la src/lib/password-validation.ts
ls -la src/components/auth/PasswordStrengthIndicator.tsx
```

### Issue 6: Account Lockout Not Working

**Symptoms:** Users can attempt login more than 5 times

**Solution:**
1. Verify migration was applied
2. Check `log_failed_login` function exists
3. Ensure auth endpoint calls the function
4. Check database logs

```sql
-- Verify function exists
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'log_failed_login';

-- Check failed attempts
SELECT * FROM failed_login_attempts 
ORDER BY attempt_time DESC 
LIMIT 10;
```

### Issue 7: Console.log Still in Production

**Symptoms:** Console logs visible in production

**Solution:**
1. Run replacement script again
2. Check for missed files
3. Update build configuration to strip console.log

```bash
# Find remaining console.log
grep -r "console\.log" src/ --include="*.ts" --include="*.tsx"

# Run replacement script
node scripts/replace-console-logs.js
```

---


## Quick Reference Commands

### Supabase Commands
```bash
# Link project
supabase link --project-ref tjbrbmywiucblznkjqyi

# Apply migrations
supabase db push

# Deploy functions
supabase functions deploy

# Set secrets
supabase secrets set KEY=value

# View logs
supabase functions logs <function-name>
```

### Git Commands
```bash
# Commit changes
git add .
git commit -m "security: implement fixes"
git push origin main

# Create backup branch
git checkout -b backup-before-security-fixes
git push origin backup-before-security-fixes
```

### Testing Commands
```bash
# Run npm audit
npm audit

# Fix vulnerabilities
npm audit fix

# Test locally
npm run dev

# Build for production
npm run build
```

### Database Queries
```sql
-- Check security logs
SELECT * FROM security_audit_log ORDER BY created_at DESC LIMIT 10;

-- Check failed logins
SELECT * FROM failed_login_attempts ORDER BY attempt_time DESC LIMIT 10;

-- Check account lockouts
SELECT * FROM account_lockouts WHERE unlocked_at IS NULL;

-- Check suspicious activity
SELECT * FROM suspicious_activity_log WHERE reviewed = false;
```

---

## Success Criteria

Your deployment is successful when:

- ✅ Old Supabase keys are rotated and no longer work
- ✅ New keys are set in all environments
- ✅ XSS attacks are blocked (scripts don't execute)
- ✅ Webhook signatures are verified
- ✅ CORS only allows your domains
- ✅ Password strength is enforced
- ✅ Account lockout works after 5 failed attempts
- ✅ Security events are logged
- ✅ No console.log in production code
- ✅ All tests pass
- ✅ Application works normally

---

## Next Steps

After successful deployment:

1. **Monitor for 24 hours**
   - Watch error logs
   - Check security audit logs
   - Monitor user feedback

2. **Schedule Security Review**
   - Review security logs weekly
   - Check for suspicious activity
   - Update dependencies monthly

3. **Document Incidents**
   - Create incident response plan
   - Document any security issues
   - Update this guide with learnings

4. **Plan Next Security Improvements**
   - Implement MFA
   - Add rate limiting to more endpoints
   - Set up automated security scanning
   - Consider penetration testing

---

## Support & Resources

**Documentation:**
- Supabase Docs: https://supabase.com/docs
- Security Best Practices: https://owasp.org/www-project-top-ten/

**Tools:**
- Supabase CLI: https://supabase.com/docs/guides/cli
- DOMPurify: https://github.com/cure53/DOMPurify
- Zod Validation: https://zod.dev/

**Getting Help:**
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: Create issue in your repository
- Security Issues: Email security@your-domain.com

---

## Completion Checklist

Print this checklist and check off each item:

### Pre-Deployment
- [ ] Backed up database
- [ ] Reviewed all changes
- [ ] Tested locally
- [ ] Created backup branch

### Deployment Steps
- [ ] Step 1: Rotated Supabase keys
- [ ] Step 2: Updated CORS configuration
- [ ] Step 3: Ran database migrations
- [ ] Step 4: Deployed edge functions
- [ ] Step 5: Integrated password strength
- [ ] Step 6: Replaced console.log statements
- [ ] Step 7: Tested all security features
- [ ] Step 8: Deployed to production

### Post-Deployment
- [ ] Ran smoke tests
- [ ] Verified security features
- [ ] Monitored logs for 1 hour
- [ ] Documented any issues
- [ ] Notified team of deployment

### Follow-Up
- [ ] Scheduled 24-hour check-in
- [ ] Scheduled 1-week security review
- [ ] Updated documentation
- [ ] Planned next security improvements

---

**🎉 Congratulations!** You've successfully deployed comprehensive security fixes to your application.

**Last Updated:** February 14, 2026  
**Version:** 1.0  
**Maintainer:** Security Team
