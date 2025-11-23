# Enforce Supabase branch policy for database changes
# This script checks if database-related files are being modified and enforces the use of a Supabase branch
# Can be bypassed by setting BYPASS_BRANCH_POLICY=true environment variable

# Define database-related file patterns
$databasePatterns = @(
    "supabase/migrations/*",
    "*.sql",
    "**/database/*.ts",
    "**/database/*.js"
)

# Function to check if any staged files match database patterns
function Test-DatabaseChanges {
    $stagedFiles = git diff --cached --name-only
    
    foreach ($pattern in $databasePatterns) {
        $matchingFiles = $stagedFiles | Where-Object { $_ -like $pattern }
        if ($matchingFiles) {
            return $true
        }
    }
    
    return $false
}

# Function to check if we're using a Supabase branch or if bypass is enabled
function Test-UsingSupabaseBranch {
    # Check if bypass is enabled
    $bypassPolicy = [System.Environment]::GetEnvironmentVariable("BYPASS_BRANCH_POLICY")
    if ($bypassPolicy -eq "true") {
        Write-Host "WARNING: Branch policy check bypassed. Changes will be applied directly to production!" -ForegroundColor Yellow
        return $true
    }
    
    # Check if SUPABASE_BRANCH environment variable is set
    $branchEnv = [System.Environment]::GetEnvironmentVariable("SUPABASE_BRANCH")
    if ($branchEnv) {
        return $true
    }
    
    # Check if .env file contains SUPABASE_BRANCH or BYPASS_BRANCH_POLICY
    if (Test-Path ".env") {
        $envContent = Get-Content ".env" -Raw
        if ($envContent -match "SUPABASE_BRANCH=.+") {
            return $true
        }
        if ($envContent -match "BYPASS_BRANCH_POLICY=true") {
            Write-Host "WARNING: Branch policy check bypassed via .env file. Changes will be applied directly to production!" -ForegroundColor Yellow
            return $true
        }
    }
    
    # Check if .env.local file contains SUPABASE_BRANCH or BYPASS_BRANCH_POLICY
    if (Test-Path ".env.local") {
        $envContent = Get-Content ".env.local" -Raw
        if ($envContent -match "SUPABASE_BRANCH=.+") {
            return $true
        }
        if ($envContent -match "BYPASS_BRANCH_POLICY=true") {
            Write-Host "WARNING: Branch policy check bypassed via .env.local file. Changes will be applied directly to production!" -ForegroundColor Yellow
            return $true
        }
    }
    
    return $false
}

# Main execution
$hasDatabaseChanges = Test-DatabaseChanges

if ($hasDatabaseChanges) {
    $usingBranch = Test-UsingSupabaseBranch
    
    if (-not $usingBranch) {
        Write-Host "ERROR: Database changes detected but not using a Supabase branch" -ForegroundColor Red
        exit 1
    }
}

# All checks passed
exit 0