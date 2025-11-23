# Auth Flow Updates - Username, User Role & Industry Standards

## Summary of Changes

Updated the TradeLens authentication flow specification to align with the actual signup form implementation and industry best practices for user management.

## Key Updates

### 1. Enhanced app_users Schema

**Added Fields:**
- `username` (TEXT UNIQUE NOT NULL) - Unique username (3-20 chars, alphanumeric + underscore)
- `first_name` (TEXT) - User's first name (optional)
- `last_name` (TEXT) - User's last name (optional)
- `full_name` (TEXT GENERATED) - Auto-generated from first_name + last_name
- `user_role` (TEXT) - Access level: 'user' (default), 'manager', 'admin'
- `signup_source` (TEXT) - Tracks how user signed up: 'direct', 'google', 'affiliate', 'referral'
- `affiliate_code` (TEXT) - User's unique affiliate code for referrals
- `referred_by` (TEXT) - Affiliate code of referrer (if any)

**Updated Fields:**
- `subscription_status` - Now includes 'past_due' status
- `trial_end_date` - Defaults to NOW() + 7 days (was 14 days)

### 2. Username Validation

**Frontend Validation (Already Implemented):**
```typescript
username: z.string()
  .min(3, { message: "Username must be at least 3 characters" })
  .max(20, { message: "Username must be at most 20 characters" })
  .regex(/^[a-zA-Z0-9_]+$/, { 
    message: "Username can only contain letters, numbers, and underscores" 
  })
```

**Backend Validation (In Database Trigger):**
- Validates username format
- Ensures uniqueness
- Auto-generates from email if not provided
- Adds random suffix if collision occurs

### 3. User Role System

**Role Hierarchy:**
1. **user** (default) - Standard user with basic access
2. **manager** - Enhanced access for team management
3. **admin** - Full platform access

**Implementation:**
- Stored in `app_users.user_role`
- Defaults to 'user' on signup
- Can be upgraded by admins
- Used for access control throughout platform

### 4. Enhanced Signup Flow

**Direct Signup (Email/Password):**
```typescript
// Collected fields:
- email (required)
- password (required)
- username (required)
- firstName (optional)
- lastName (optional)

// Stored in auth.users.raw_user_meta_data:
{
  first_name: "John",
  last_name: "Doe",
  username: "johndoe",
  signup_source: "direct"
}
```

**OAuth Signup (Google):**
```typescript
// Auto-extracted from Google profile:
- email
- full_name (split into first_name/last_name)
- avatar_url

// Username generated from email if not provided
// signup_source set to "google"
```

### 5. Affiliate Tracking

**Automatic Affiliate Code Generation:**
- Each user gets unique 8-character code on signup
- Generated from: `UPPER(SUBSTRING(MD5(user_id + timestamp) FROM 1 FOR 8))`
- Example: `A7F3B2E1`

**Referral Tracking:**
- Referral code can be passed in signup URL: `?ref=A7F3B2E1`
- Stored in `app_users.referred_by`
- Used for commission calculations

### 6. Updated Database Trigger

**handle_new_signup() Function:**
```sql
-- Now handles:
✅ Username validation and uniqueness
✅ First name and last name extraction
✅ Full name auto-generation
✅ User role assignment (default: 'user')
✅ Affiliate code generation
✅ Referral tracking
✅ Signup source tracking
✅ Retry logic with exponential backoff
✅ Error logging
```

### 7. Full-Text Search

**Added Search Index:**
```sql
CREATE INDEX idx_app_users_search ON app_users USING gin(
    to_tsvector('english', coalesce(username, '') || ' ' || coalesce(full_name, ''))
);
```

**Use Cases:**
- Search users by username
- Search users by name
- Admin user management
- Community features

### 8. Updated Requirements

**Requirement 1 - User Registration:**
- Added username validation criteria
- Added referral code handling
- Added duplicate username error handling

**Requirement 8 - Profile Initialization:**
- Added username generation logic
- Added user_role assignment
- Added affiliate_code generation
- Added full_name auto-generation

## Industry Best Practices Implemented

### 1. Username Standards
✅ Minimum 3 characters (prevents abuse)
✅ Maximum 20 characters (keeps UI clean)
✅ Alphanumeric + underscore only (URL-safe)
✅ Unique constraint (prevents confusion)
✅ Case-insensitive search (better UX)

### 2. Name Handling
✅ Separate first_name and last_name fields
✅ Auto-generated full_name (computed column)
✅ Optional fields (not everyone wants to share)
✅ Proper NULL handling

### 3. Role-Based Access Control (RBAC)
✅ Simple 3-tier system (user, manager, admin)
✅ Extensible for future roles
✅ Stored in user table (fast access)
✅ Used in RLS policies

### 4. Audit Trail
✅ signup_source tracks acquisition channel
✅ referred_by tracks referrals
✅ created_at and updated_at timestamps
✅ profile_data JSONB for flexible metadata

### 5. Data Integrity
✅ Foreign key constraints
✅ CHECK constraints on enums
✅ UNIQUE constraints on email/username
✅ NOT NULL on required fields
✅ Generated columns for computed values

### 6. Performance
✅ Indexes on frequently queried columns
✅ Partial indexes for filtered queries
✅ GIN index for full-text search
✅ Composite indexes where needed

### 7. Security
✅ Row Level Security enabled
✅ Users can only access own data
✅ Public profiles accessible to all
✅ Secure password hashing (Supabase Auth)
✅ Email verification option

## Migration Path

### For New Installations:
1. Run the updated migration from QUICKSTART.md
2. All fields will be created correctly
3. Trigger will handle user creation automatically

### For Existing Installations:
```sql
-- Add new columns to app_users
ALTER TABLE app_users 
    ADD COLUMN IF NOT EXISTS username TEXT,
    ADD COLUMN IF NOT EXISTS first_name TEXT,
    ADD COLUMN IF NOT EXISTS last_name TEXT,
    ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'user',
    ADD COLUMN IF NOT EXISTS signup_source TEXT DEFAULT 'direct',
    ADD COLUMN IF NOT EXISTS affiliate_code TEXT,
    ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- Add constraints
ALTER TABLE app_users 
    ADD CONSTRAINT app_users_username_unique UNIQUE (username),
    ADD CONSTRAINT app_users_user_role_check 
        CHECK (user_role IN ('user', 'manager', 'admin')),
    ADD CONSTRAINT app_users_signup_source_check 
        CHECK (signup_source IN ('direct', 'google', 'affiliate', 'referral'));

-- Generate usernames for existing users
UPDATE app_users 
SET username = SPLIT_PART(email, '@', 1) || '_' || SUBSTRING(id::TEXT FROM 1 FOR 4)
WHERE username IS NULL;

-- Make username NOT NULL after populating
ALTER TABLE app_users ALTER COLUMN username SET NOT NULL;

-- Generate affiliate codes for existing users
UPDATE app_users 
SET affiliate_code = UPPER(SUBSTRING(MD5(id::TEXT || NOW()::TEXT) FROM 1 FOR 8))
WHERE affiliate_code IS NULL;

-- Add generated column for full_name
ALTER TABLE app_users 
    ADD COLUMN full_name TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN first_name IS NOT NULL AND last_name IS NOT NULL 
            THEN first_name || ' ' || last_name
            WHEN first_name IS NOT NULL THEN first_name
            WHEN last_name IS NOT NULL THEN last_name
            ELSE NULL
        END
    ) STORED;

-- Add new indexes
CREATE INDEX IF NOT EXISTS idx_app_users_username ON app_users(username);
CREATE INDEX IF NOT EXISTS idx_app_users_user_role ON app_users(user_role);
CREATE INDEX IF NOT EXISTS idx_app_users_referred_by ON app_users(referred_by) 
    WHERE referred_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_app_users_search ON app_users USING gin(
    to_tsvector('english', coalesce(username, '') || ' ' || coalesce(full_name, ''))
);
```

## Frontend Integration

### Signup Form (Already Implemented ✅)
```typescript
// src/pages/Auth.tsx
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z.string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/),
});
```

### AuthContext Updates Needed
```typescript
// src/context/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  userRole: string | null;  // ✅ Already exists
  username: string | null;  // ⚠️ Add this
  isAdmin: boolean;         // ✅ Already exists
  isManager: boolean;       // ✅ Already exists
  // ... rest of interface
}
```

### Profile Display
```typescript
// Use full_name for display
const displayName = user.full_name || user.username || user.email;

// Use username for URLs
const profileUrl = `/profile/${user.username}`;

// Use user_role for access control
const canAccessAdmin = user.user_role === 'admin';
const canManageTeam = ['admin', 'manager'].includes(user.user_role);
```

## Testing Checklist

### Signup Flow
- [ ] Sign up with all fields (email, password, username, first_name, last_name)
- [ ] Sign up with only required fields (email, password, username)
- [ ] Sign up with duplicate username (should fail)
- [ ] Sign up with duplicate email (should fail)
- [ ] Sign up with invalid username format (should fail)
- [ ] Sign up with referral code
- [ ] Sign up via Google OAuth

### Profile Creation
- [ ] Verify app_users record created
- [ ] Verify username is set correctly
- [ ] Verify full_name is generated correctly
- [ ] Verify user_role defaults to 'user'
- [ ] Verify affiliate_code is generated
- [ ] Verify referred_by is set if referral code used
- [ ] Verify trader_profiles created
- [ ] Verify user_settings created
- [ ] Verify user_subscriptions created with trial

### Access Control
- [ ] User can view own profile
- [ ] User cannot view other private profiles
- [ ] User can view public trader profiles
- [ ] Manager has enhanced access
- [ ] Admin has full access

### Search & Discovery
- [ ] Search users by username
- [ ] Search users by name
- [ ] Username appears in URLs
- [ ] Full name appears in UI

## Documentation Updates

### Updated Files:
1. ✅ `.kiro/specs/tradelens-auth-flow/design.md`
   - Updated app_users schema
   - Updated handle_new_signup() function
   - Added username validation logic

2. ✅ `.kiro/specs/tradelens-auth-flow/requirements.md`
   - Updated Requirement 1 (User Registration)
   - Updated Requirement 8 (Profile Initialization)

3. ✅ `.kiro/specs/tradelens-auth-flow/QUICKSTART.md`
   - Updated migration SQL with all new fields
   - Added username validation examples

4. ✅ `.kiro/specs/tradelens-auth-flow/UPDATES.md` (this file)
   - Comprehensive changelog
   - Migration guide
   - Testing checklist

## Next Steps

1. **Review the updated specifications**
   - Ensure all fields match your requirements
   - Verify role hierarchy is correct
   - Confirm username validation rules

2. **Create the database migration**
   - Use SQL from QUICKSTART.md
   - Test locally first
   - Apply to production

3. **Update AuthContext if needed**
   - Add username to context
   - Ensure user_role is properly exposed
   - Update any role-checking logic

4. **Test thoroughly**
   - Follow testing checklist above
   - Test all signup paths
   - Verify profile creation
   - Test access control

5. **Deploy**
   - Apply migrations to production
   - Monitor for errors
   - Verify user signups work correctly

## Questions or Issues?

If you need any adjustments to:
- Username validation rules
- Role hierarchy
- Field requirements
- Affiliate system
- Any other aspect

Just let me know and I'll update the specifications accordingly!
