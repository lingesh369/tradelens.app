# GitHub Secrets Configuration Guide

This guide provides the exact GitHub secrets you need to configure for your TradeLens deployment pipeline.

## Step-by-Step Setup

### 1. Access GitHub Secrets

1. Go to your GitHub repository: `https://github.com/YOUR_USERNAME/tradelens`
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret** for each secret below

### 2. Required Secrets

Copy and paste these exact values:

#### Supabase Configuration

**SUPABASE_PROJECT_ID**
```
tzhhxeyisppkzyjacodu
```

**VITE_SUPABASE_URL**
```
https://tzhhxeyisppkzyjacodu.supabase.co
```

**VITE_SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6aGh4ZXlpc3Bwa3p5amFjb2R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3NTY4OTgsImV4cCI6MjA1NzMzMjg5OH0.EKPF5lFGlnRN1pvWU9WIJDLTXEJxRZxcTNjQCHpcXi0
```

**SUPABASE_ACCESS_TOKEN** ⚠️ **YOU NEED TO GET THIS**
```
[GET FROM SUPABASE DASHBOARD - See instructions below]
```

**SUPABASE_DB_PASSWORD** ⚠️ **YOU NEED TO GET THIS**
```
[GET FROM SUPABASE DASHBOARD - See instructions below]
```

#### Vercel Configuration ⚠️ **YOU NEED TO GET THESE**

**VERCEL_TOKEN**
```
[GET FROM VERCEL DASHBOARD - See instructions below]
```

**VERCEL_ORG_ID**
```
team_DCyv8LxQqKJv60dzyVoF48zQ
```

**VERCEL_PROJECT_ID**
```
prj_7n4S3gLahE2EIHVE9m8H4YBiJRCL
```

## How to Get Missing Values

### Getting Supabase Access Token

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click your profile picture (top right)
3. Select **Access Tokens**
4. Click **Generate new token**
5. Give it a name like "GitHub Actions"
6. Copy the token (starts with `sbp_`)

### Getting Supabase Database Password

1. Go to your [Supabase project dashboard](https://supabase.com/dashboard/project/tzhhxeyisppkzyjacodu)
2. Click **Settings** → **Database**
3. Scroll down to **Connection parameters**
4. Copy the **Password** (you set this when creating the project)
5. If you forgot it, you can reset it in the same section

### Getting Vercel Configuration

#### Step 1: Get Vercel Token
1. Go to [Vercel Dashboard](https://vercel.com/account/tokens)
2. Click **Create Token**
3. Give it a name like "GitHub Actions"
4. Set expiration (recommend 1 year)
5. Copy the token

#### Step 2: Vercel Project IDs (Already Found!)
Your Vercel project is already linked! I found your configuration:
- **VERCEL_ORG_ID**: `team_DCyv8LxQqKJv60dzyVoF48zQ`
- **VERCEL_PROJECT_ID**: `prj_7n4S3gLahE2EIHVE9m8H4YBiJRCL`

These values are already provided above - just copy them into GitHub secrets.

## Verification Checklist

After adding all secrets, verify you have:

- ✅ **SUPABASE_PROJECT_ID**: `tzhhxeyisppkzyjacodu`
- ✅ **VITE_SUPABASE_URL**: `https://tzhhxeyisppkzyjacodu.supabase.co`
- ✅ **VITE_SUPABASE_ANON_KEY**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- ⚠️ **SUPABASE_ACCESS_TOKEN**: `sbp_...` (from Supabase dashboard)
- ⚠️ **SUPABASE_DB_PASSWORD**: Your database password
- ⚠️ **VERCEL_TOKEN**: Your Vercel token
- ✅ **VERCEL_ORG_ID**: `team_DCyv8LxQqKJv60dzyVoF48zQ`
- ✅ **VERCEL_PROJECT_ID**: `prj_7n4S3gLahE2EIHVE9m8H4YBiJRCL`

## Test the Pipeline

Once all secrets are configured:

1. Make a small change to your code
2. Commit and push to main branch:
   ```bash
   git add .
   git commit -m "test: deployment pipeline"
   git push origin main
   ```
3. Go to **Actions** tab in GitHub to watch the deployment
4. Check your Vercel dashboard for the deployment

## Troubleshooting

### Common Issues

**"Invalid Supabase credentials"**
- Double-check your `SUPABASE_ACCESS_TOKEN`
- Ensure the token has the right permissions

**"Vercel deployment failed"**
- Verify `VERCEL_TOKEN` is valid
- Check `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` match your project

**"Database migration failed"**
- Verify `SUPABASE_DB_PASSWORD` is correct
- Check if there are any syntax errors in your migrations

### Getting Help

1. Check the **Actions** tab for detailed error logs
2. Verify all secrets are exactly as shown (no extra spaces)
3. Ensure your Vercel project is properly linked

## Security Notes

- Never commit these secrets to your repository
- Regularly rotate your access tokens
- Use environment-specific secrets (don't use production secrets for development)
- The deployment pipeline only runs on pushes to the `main` branch for security

---

**Next Step**: After configuring all secrets, test the pipeline by making a small change and pushing to main!