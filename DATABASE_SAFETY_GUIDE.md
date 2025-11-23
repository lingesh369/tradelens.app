# Database Safety Guide

## ⚠️ CRITICAL WARNING

**NEVER run `supabase db reset` without proper safeguards!**

This command can permanently delete production data if not used carefully.

## Production Protection System

This project implements a comprehensive protection system to prevent accidental production database resets:

### 1. Environment Variables Protection

The following environment variables must be properly configured:

```bash
# Development Environment (.env)
NODE_ENV=development
ALLOW_DATABASE_RESET=true
IS_PRODUCTION_ENVIRONMENT=false

# Production Environment
NODE_ENV=production
ALLOW_DATABASE_RESET=false
IS_PRODUCTION_ENVIRONMENT=true
```

### 2. Safe Reset Scripts

Always use the provided safe reset scripts instead of direct Supabase commands:

- **Windows PowerShell**: `./safe-db-reset.ps1`
- **Linux/macOS Bash**: `./safe-db-reset.sh`

These scripts include:
- Environment variable validation
- Multiple user confirmations
- Project verification
- Local-only execution

### 3. Configuration Safeguards

The `supabase/config.toml` file includes:
- Production safety warnings
- Best practices documentation
- Clear instructions for safe usage

## Safe Database Operations

### Local Development Reset

```bash
# SAFE: Use the protection script
./safe-db-reset.ps1

# DANGEROUS: Direct command (avoid)
supabase db reset
```

### Production Schema Changes

```bash
# SAFE: Use MCP Supabase tools for migrations
# These tools provide controlled, reversible changes

# NEVER: Direct reset on production
# supabase db reset --linked  # ❌ NEVER DO THIS
```

### Database Backup Procedures

#### Before Any Major Changes

```bash
# 1. Full database backup
supabase db dump -f "backup_$(date +%Y%m%d_%H%M%S).sql"

# 2. Data-only backup
supabase db dump --data-only -f "data_backup_$(date +%Y%m%d_%H%M%S).sql"

# 3. Compress backups
zip "database_backups_$(date +%Y%m%d_%H%M%S).zip" *.sql
```

#### Backup Verification

```bash
# Check backup file size and content
ls -la *.sql
head -20 backup_*.sql
```

## Emergency Recovery

### If Production Data is Lost

1. **Stop all operations immediately**
2. **Do not run any more database commands**
3. **Check for recent backups**:
   - Supabase automatic backups
   - Manual backup files
   - Docker volume backups
4. **Contact Supabase support** if using hosted service
5. **Restore from most recent backup**

### Recovery Commands

```bash
# Restore from SQL backup
psql -h localhost -p 54322 -U postgres -d postgres -f backup_file.sql

# Or use Supabase CLI (if available)
supabase db reset --db-url "postgresql://..." --linked
```

## Best Practices

### ✅ DO

- Always use environment variables for configuration
- Use the safe reset scripts for local development
- Create backups before any major changes
- Test migrations on development branches first
- Use MCP Supabase tools for production changes
- Verify environment settings before operations

### ❌ DON'T

- Run `supabase db reset` without safeguards
- Skip environment variable checks
- Perform database operations without backups
- Use development scripts in production
- Ignore safety warnings in scripts

## Environment Setup Checklist

### Development Environment

- [ ] `.env` file created from `.env.example`
- [ ] `NODE_ENV=development`
- [ ] `ALLOW_DATABASE_RESET=true`
- [ ] `IS_PRODUCTION_ENVIRONMENT=false`
- [ ] Safe reset scripts are executable
- [ ] Regular backups scheduled

### Production Environment

- [ ] `NODE_ENV=production`
- [ ] `ALLOW_DATABASE_RESET=false`
- [ ] `IS_PRODUCTION_ENVIRONMENT=true`
- [ ] Automatic backups configured
- [ ] Access controls implemented
- [ ] Monitoring and alerts set up

## Troubleshooting

### "Do you want to reset the remote database?" Prompt

If you see this prompt:

1. **IMMEDIATELY type 'N' or press Ctrl+C**
2. **Do not proceed with the reset**
3. **Check your environment variables**
4. **Use the safe reset scripts instead**

### Script Execution Issues

```bash
# Make scripts executable (Linux/macOS)
chmod +x safe-db-reset.sh

# PowerShell execution policy (Windows)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Environment Variable Issues

```bash
# Check current environment
echo $NODE_ENV
echo $ALLOW_DATABASE_RESET
echo $IS_PRODUCTION_ENVIRONMENT

# Reload environment variables
source .env  # Linux/macOS
# Or restart terminal/IDE
```

## Support

For additional help:

1. Review this guide thoroughly
2. Check the safe reset scripts for detailed error messages
3. Verify environment variable configuration
4. Consult Supabase documentation
5. Contact your development team lead

---

**Remember: It's better to be overly cautious with database operations than to lose valuable production data.**