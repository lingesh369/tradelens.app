# Security Fix - Exposed Supabase Token

## Issue
GitHub detected an exposed Supabase Personal Access Token in `.mcp-config.json` (commit ae169c64).

## Actions Taken

1. **Moved secret to environment variable**
   - Updated `.mcp-config.json` to use `${SUPABASE_ACCESS_TOKEN}` instead of hardcoded token
   - Added token to `.env.local` (which is already gitignored)

2. **Prevented future exposure**
   - Added `.mcp-config.json` to `.gitignore`
   - Created `.mcp-config.json.example` as a template for other developers

3. **Next Steps Required**
   - ⚠️ **ROTATE THE TOKEN IMMEDIATELY** in your Supabase dashboard
   - Update `.env.local` with the new token after rotation
   - Remove the exposed token from git history (see instructions below)

## Rotating the Supabase Token

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to Settings → API
3. Under "Personal Access Tokens", revoke the exposed token: `sbp_821571899f54a30953f777f3e4cd74fb726a03cc`
4. Generate a new token
5. Update `.env.local` with the new token

## Removing from Git History

To completely remove the exposed secret from git history:

```bash
# Install BFG Repo-Cleaner or use git-filter-repo
# Option 1: Using BFG (recommended)
bfg --replace-text passwords.txt

# Option 2: Using git filter-branch
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .mcp-config.json" \
  --prune-empty --tag-name-filter cat -- --all

# Force push to remote (WARNING: This rewrites history)
git push origin --force --all
```

## Prevention
- All secrets should be stored in `.env` or `.env.local` files
- Never commit files containing API keys, tokens, or passwords
- Always use `.example` template files for configuration
