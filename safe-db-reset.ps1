# Safe Database Reset Script with Production Protection
# This script prevents accidental production database resets

Write-Host "=== SUPABASE DATABASE RESET SAFETY SCRIPT ===" -ForegroundColor Yellow
Write-Host "This script includes multiple safeguards to prevent accidental production database resets." -ForegroundColor Yellow
Write-Host ""

# Function to check environment variables
function Test-EnvironmentSafety {
    # Check if .env file exists
    if (-not (Test-Path ".env")) {
        Write-Host "ERROR: .env file not found. Please create one from .env.example" -ForegroundColor Red
        return $false
    }

    # Read environment variables from .env file
    $envVars = @{}
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $envVars[$matches[1]] = $matches[2]
        }
    }

    # Check NODE_ENV
    $nodeEnv = $envVars["NODE_ENV"]
    if ($nodeEnv -eq "production") {
        Write-Host "CRITICAL ERROR: NODE_ENV is set to 'production'" -ForegroundColor Red
        Write-Host "Database reset is BLOCKED for production environments!" -ForegroundColor Red
        return $false
    }

    # Check ALLOW_DATABASE_RESET
    $allowReset = $envVars["ALLOW_DATABASE_RESET"]
    if ($allowReset -ne "true") {
        Write-Host "ERROR: ALLOW_DATABASE_RESET is not set to 'true'" -ForegroundColor Red
        Write-Host "Database reset is disabled. Set ALLOW_DATABASE_RESET=true in .env for local development." -ForegroundColor Red
        return $false
    }

    # Check IS_PRODUCTION_ENVIRONMENT
    $isProduction = $envVars["IS_PRODUCTION_ENVIRONMENT"]
    if ($isProduction -eq "true") {
        Write-Host "CRITICAL ERROR: IS_PRODUCTION_ENVIRONMENT is set to 'true'" -ForegroundColor Red
        Write-Host "Database reset is BLOCKED for production environments!" -ForegroundColor Red
        return $false
    }

    Write-Host "✓ Environment safety checks passed" -ForegroundColor Green
    return $true
}

# Function to get user confirmation
function Get-UserConfirmation {
    param(
        [string]$Message,
        [string]$RequiredResponse
    )
    
    Write-Host $Message -ForegroundColor Yellow
    $response = Read-Host
    return $response -eq $RequiredResponse
}

# Main execution
try {
    # Step 1: Environment Safety Check
    Write-Host "Step 1: Checking environment safety..." -ForegroundColor Cyan
    if (-not (Test-EnvironmentSafety)) {
        Write-Host "\nDatabase reset ABORTED due to safety checks." -ForegroundColor Red
        exit 1
    }

    # Step 2: Project Verification
    Write-Host "\nStep 2: Project verification..." -ForegroundColor Cyan
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor White
    if (-not (Test-Path "supabase\config.toml")) {
        Write-Host "ERROR: Not in a Supabase project directory" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Supabase project detected" -ForegroundColor Green

    # Step 3: Multiple Confirmations
    Write-Host "\nStep 3: Safety confirmations..." -ForegroundColor Cyan
    
    # First confirmation
    if (-not (Get-UserConfirmation "Are you absolutely sure you want to reset the LOCAL database? Type 'YES' to continue:" "YES")) {
        Write-Host "Database reset cancelled." -ForegroundColor Yellow
        exit 0
    }

    # Second confirmation
    if (-not (Get-UserConfirmation "This will DELETE ALL LOCAL DATA. Type 'CONFIRM' to proceed:" "CONFIRM")) {
        Write-Host "Database reset cancelled." -ForegroundColor Yellow
        exit 0
    }

    # Third confirmation with project name
    $projectName = "tradelens"
    if (-not (Get-UserConfirmation "Type the project name '$projectName' to confirm:" $projectName)) {
        Write-Host "Database reset cancelled." -ForegroundColor Yellow
        exit 0
    }

    # Step 4: Execute Reset
    Write-Host "\nStep 4: Executing database reset..." -ForegroundColor Cyan
    Write-Host "Running: supabase db reset --local" -ForegroundColor White
    
    # Execute the reset command
    & supabase db reset --local
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "\n✓ Database reset completed successfully" -ForegroundColor Green
    } else {
        Write-Host "\n✗ Database reset failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "\nERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "\n=== RESET COMPLETE ===" -ForegroundColor Green
Write-Host "Your local database has been reset safely." -ForegroundColor Green