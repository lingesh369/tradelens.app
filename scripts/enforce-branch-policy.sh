#!/bin/bash
# Enforce Supabase branch policy for database changes
# This script checks if database-related files are being modified and enforces the use of a Supabase branch
# Can be bypassed by setting BYPASS_BRANCH_POLICY=true environment variable

# Define database-related file patterns
databasePatterns=(
    "supabase/migrations/*"
    "*.sql"
    "**/database/*.ts"
    "**/database/*.js"
)

# Function to check if any staged files match database patterns
function check_database_changes() {
    stagedFiles=$(git diff --cached --name-only)
    
    for pattern in "${databasePatterns[@]}"; do
        if echo "$stagedFiles" | grep -q "$pattern"; then
            return 0 # True, found database changes
        fi
    done
    
    return 1 # False, no database changes
}

# Function to check if we're using a Supabase branch or if bypass is enabled
function check_using_supabase_branch() {
    # Check if bypass is enabled
    if [ "$BYPASS_BRANCH_POLICY" = "true" ]; then
        echo "WARNING: Branch policy check bypassed. Changes will be applied directly to production!" >&2
        return 0 # True
    fi
    
    # Check if SUPABASE_BRANCH environment variable is set
    if [ -n "$SUPABASE_BRANCH" ]; then
        return 0 # True
    fi
    
    # Check if .env file contains SUPABASE_BRANCH or BYPASS_BRANCH_POLICY
    if [ -f ".env" ]; then
        if grep -q "SUPABASE_BRANCH=.\+" ".env"; then
            return 0 # True
        fi
        if grep -q "BYPASS_BRANCH_POLICY=true" ".env"; then
            echo "WARNING: Branch policy check bypassed via .env file. Changes will be applied directly to production!" >&2
            return 0 # True
        fi
    fi
    
    # Check if .env.local file contains SUPABASE_BRANCH or BYPASS_BRANCH_POLICY
    if [ -f ".env.local" ]; then
        if grep -q "SUPABASE_BRANCH=.\+" ".env.local"; then
            return 0 # True
        fi
        if grep -q "BYPASS_BRANCH_POLICY=true" ".env.local"; then
            echo "WARNING: Branch policy check bypassed via .env.local file. Changes will be applied directly to production!" >&2
            return 0 # True
        fi
    fi
    
    return 1 # False
}

# Main execution
if check_database_changes; then
    if ! check_using_supabase_branch; then
        echo "ERROR: Database changes detected but not using a Supabase branch" >&2
        exit 1
    fi
fi

# All checks passed
exit 0