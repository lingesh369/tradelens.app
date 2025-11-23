# Quick GitHub Secrets Setup

Since your GitHub repository is already connected to Vercel, you just need to add these secrets to GitHub for the deployment pipeline to work.

## Go to GitHub Secrets

1. Go to your GitHub repository: `https://github.com/lingesh369/tradelens`
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret** for each one below

## Copy These Exact Values

### Supabase Secrets (Ready to Use)

**Secret Name:** `SUPABASE_PROJECT_ID`
**Value:**
```
tzhhxeyisppkzyjacodu
```

**Secret Name:** `VITE_SUPABASE_URL`
**Value:**
```
https://tzhhxeyisppkzyjacodu.supabase.co
```

**Secret Name:** `VITE_SUPABASE_ANON_KEY`
**Value:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6aGh4ZXlpc3Bwa3p5amFjb2R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3NTY4OTgsImV4cCI6MjA1NzMzMjg5OH0.EKPF5lFGlnRN1pvWU9WIJDLTXEJxRZxcTNjQCHpcXi0
```

### Vercel Secrets (Ready to Use)

**Secret Name:** `VERCEL_ORG_ID`
**Value:**
```
team_DCyv8LxQqKJv60dzyVoF48zQ
```

**Secret Name:** `VERCEL_PROJECT_ID`
**Value:**
```
prj_7n4S3gLahE2EIHVE9m8H4YBiJRCL
```

## Secrets You Need to Get

### SUPABASE_ACCESS_TOKEN
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click your profile picture → **Access Tokens**
3. Click **Generate new token** → Name it "GitHub Actions"
4. Copy the token (starts with `sbp_`)

**Secret Name:** `SUPABASE_ACCESS_TOKEN`
**Value:** `sbp_your_token_here`

### SUPABASE_DB_PASSWORD
1. Go to your [Supabase project](https://supabase.com/dashboard/project/tzhhxeyisppkzyjacodu)
2. **Settings** → **Database** → **Connection parameters**
3. Copy your database password

**Secret Name:** `SUPABASE_DB_PASSWORD`
**Value:** `your_database_password`

### VERCEL_TOKEN
1. Go to [Vercel Tokens](https://vercel.com/account/tokens)
2. Click **Create Token** → Name it "GitHub Actions"
3. Copy the token

**Secret Name:** `VERCEL_TOKEN`
**Value:** `your_vercel_token_here`

## Summary

You need to add **8 total secrets** to GitHub:

✅ **Ready to copy:**
- SUPABASE_PROJECT_ID
- VITE_SUPABASE_URL  
- VITE_SUPABASE_ANON_KEY
- VERCEL_ORG_ID
- VERCEL_PROJECT_ID

⚠️ **Need to get:**
- SUPABASE_ACCESS_TOKEN (from Supabase dashboard)
- SUPABASE_DB_PASSWORD (from Supabase project settings)
- VERCEL_TOKEN (from Vercel dashboard)

## Test It

Once all 8 secrets are added:
1. Make a small change to your code
2. Push to main branch
3. Check GitHub Actions tab to see the deployment

The pipeline will automatically deploy to both Supabase and Vercel! 🚀