# Supabase Database Branch Policy

## Overview

This document outlines the policy for making database changes to the TradeLens application. To protect our production database and ensure safe development practices, all database changes must be made using Supabase development branches.

## Why Use Branches?

1. **Safety**: Branches provide an isolated environment to test database changes without affecting production data.
2. **Collaboration**: Multiple developers can work on different features without conflicts.
3. **Review**: Changes can be reviewed before being merged to production.
4. **Rollback**: If issues occur, branches can be reset without affecting production.

## Policy Requirements

### For All Database Changes

The following types of changes **MUST** use a Supabase development branch:

- Schema modifications (tables, columns, indexes, etc.)
- Database function changes
- RLS policy updates
- Stored procedure modifications
- Any SQL migrations

### Enforcement

This policy is enforced through:

1. Pre-commit hooks that detect database-related changes
2. CI/CD pipeline checks
3. Code review requirements

## How to Use Supabase Branches

Please refer to the [SUPABASE_BRANCHING_GUIDE.md](./SUPABASE_BRANCHING_GUIDE.md) for detailed instructions on:

- Creating a development branch
- Connecting your local environment to a branch
- Testing changes on a branch
- Merging changes to production

## Exceptions

In rare emergency situations, direct production changes may be necessary. These exceptions:

- Must be approved by a team lead
- Must be documented with a reason
- Must be followed by proper migration files
- Should be avoided whenever possible

### Bypass Option

In exceptional circumstances, the branch policy can be bypassed by setting `BYPASS_BRANCH_POLICY=true` in your environment variables or in your `.env`/`.env.local` file. **This should only be used in emergency situations or when explicitly authorized by the team lead.**

> ⚠️ **WARNING**: Bypassing the branch policy allows changes to be applied directly to the production database. Use with extreme caution!

## Consequences of Policy Violation

Failure to follow this policy may result in:

- Rejected pull requests
- Reverted commits
- Potential data loss or corruption
- Additional review requirements

## Questions and Support

If you have questions about this policy or need help with Supabase branches, please contact the development team lead.

---

**Last Updated**: June 2024