# Supabase Branching Guide

## Introduction

This guide provides step-by-step instructions for using Supabase development branches with the TradeLens application. Following these practices ensures safe database development without risking production data.

## Why Use Supabase Branches?

Supabase development branches provide isolated environments for database development, allowing you to:

- Make schema changes without affecting production
- Test migrations safely
- Collaborate with team members
- Get proper code review for database changes

## Bypassing Branch Policy

In exceptional circumstances (such as emergency hotfixes), you can bypass the branch policy by setting `BYPASS_BRANCH_POLICY=true` in your environment variables or in your `.env`/`.env.local` file. This should only be used when absolutely necessary and with proper authorization.

```bash
# Add to .env.local or set as environment variable
BYPASS_BRANCH_POLICY=true
```

> ⚠️ **WARNING**: This will allow database changes to be applied directly to production. Use with extreme caution and only in exceptional circumstances.

## Prerequisites

- Supabase CLI installed (`npm install -g supabase`)
- Access to the Supabase project
- Proper authentication configured

## Creating a Development Branch

### 1. Create a New Branch

```bash
# Login to Supabase (if not already logged in)
supabase login

# Create a new branch (replace branch-name with your feature name)
supabase db branch create branch-name

# List branches to verify creation
supabase db branch list
```

### 2. Connect to Your Branch

After creating a branch, you need to configure your local environment to use it:

```bash
# Add this to your .env.local file (not .env)
SUPABASE_BRANCH=branch-name
```

## Working with Branches

### Creating Migrations

When making database changes:

```bash
# Create a new migration
supabase migration new add_feature_x

# Edit the generated migration file in supabase/migrations/
# Then apply it to your branch
supabase db push
```

### Testing Your Changes

```bash
# Start your application with the branch environment
npm run dev

# Your app will now connect to your branch database
```

### Viewing Branch Data

```bash
# Open Supabase Studio for your branch
supabase db studio

# Or connect directly to the branch database
supabase db connect
```

## Merging Changes to Production

When your changes are ready for production:

### 1. Review Your Changes

```bash
# See what migrations will be applied
supabase db diff
```

### 2. Create a Pull Request

- Push your code changes to GitHub
- Create a pull request with your migration files
- Request a review from a team member

### 3. Merge the Branch

After approval:

```bash
# Merge your branch to production
supabase db branch merge branch-name
```

## Branch Management

### Updating Your Branch

If production has changed while you were working:

```bash
# Update your branch with production changes
supabase db branch update branch-name
```

### Deleting a Branch

When you're done with a branch:

```bash
# Delete the branch
supabase db branch delete branch-name
```

## Troubleshooting

### Common Issues

1. **Branch creation fails**:
   - Ensure you're logged in with `supabase login`
   - Check your project permissions

2. **Can't connect to branch**:
   - Verify `SUPABASE_BRANCH` is set correctly
   - Restart your development server

3. **Merge conflicts**:
   - Update your branch with `supabase db branch update`
   - Resolve conflicts in migration files

4. **Migration errors**:
   - Check SQL syntax
   - Ensure dependencies exist before referencing them

## Best Practices

1. **Branch Naming**:
   - Use descriptive names: `feature-user-profiles`, `fix-auth-issue`
   - Include ticket numbers if applicable: `TRAD-123-add-analytics`

2. **Migration Organization**:
   - One migration per logical change
   - Include comments explaining complex changes
   - Test migrations thoroughly before merging

3. **Branch Lifecycle**:
   - Keep branches short-lived (days, not weeks)
   - Delete branches after merging
   - Regularly update long-running branches

4. **Documentation**:
   - Document schema changes in code comments
   - Update API documentation if endpoints change
   - Include migration notes in pull requests

## Getting Help

If you encounter issues with Supabase branches:

1. Check the [Supabase Documentation](https://supabase.com/docs/guides/database/branching)
2. Ask in the team's development channel
3. Contact the database administrator

---

**Last Updated**: June 2024