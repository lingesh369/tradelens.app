#!/bin/bash
# Safe Database Reset Script with Production Protection
# This script prevents accidental production database resets

set -e  # Exit on any error

echo "=== SUPABASE DATABASE RESET SAFETY SCRIPT ==="
echo "This script includes multiple safeguards to prevent accidental production database resets."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to check environment variables
check_environment_safety() {
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        echo -e "${RED}ERROR: .env file not found. Please create one from .env.example${NC}"
        return 1
    fi

    # Source environment variables
    set -a  # automatically export all variables
    source .env
    set +a

    # Check NODE_ENV
    if [ "$NODE_ENV" = "production" ]; then
        echo -e "${RED}CRITICAL ERROR: NODE_ENV is set to 'production'${NC}"
        echo -e "${RED}Database reset is BLOCKED for production environments!${NC}"
        return 1
    fi

    # Check ALLOW_DATABASE_RESET
    if [ "$ALLOW_DATABASE_RESET" != "true" ]; then
        echo -e "${RED}ERROR: ALLOW_DATABASE_RESET is not set to 'true'${NC}"
        echo -e "${RED}Database reset is disabled. Set ALLOW_DATABASE_RESET=true in .env for local development.${NC}"
        return 1
    fi

    # Check IS_PRODUCTION_ENVIRONMENT
    if [ "$IS_PRODUCTION_ENVIRONMENT" = "true" ]; then
        echo -e "${RED}CRITICAL ERROR: IS_PRODUCTION_ENVIRONMENT is set to 'true'${NC}"
        echo -e "${RED}Database reset is BLOCKED for production environments!${NC}"
        return 1
    fi

    echo -e "${GREEN}✓ Environment safety checks passed${NC}"
    return 0
}

# Function to get user confirmation
get_user_confirmation() {
    local message="$1"
    local required_response="$2"
    
    echo -e "${YELLOW}$message${NC}"
    read -r response
    [ "$response" = "$required_response" ]
}

# Main execution
main() {
    # Step 1: Environment Safety Check
    echo -e "${CYAN}Step 1: Checking environment safety...${NC}"
    if ! check_environment_safety; then
        echo -e "\n${RED}Database reset ABORTED due to safety checks.${NC}"
        exit 1
    fi

    # Step 2: Project Verification
    echo -e "\n${CYAN}Step 2: Project verification...${NC}"
    echo "Current directory: $(pwd)"
    if [ ! -f "supabase/config.toml" ]; then
        echo -e "${RED}ERROR: Not in a Supabase project directory${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Supabase project detected${NC}"

    # Step 3: Multiple Confirmations
    echo -e "\n${CYAN}Step 3: Safety confirmations...${NC}"
    
    # First confirmation
    if ! get_user_confirmation "Are you absolutely sure you want to reset the LOCAL database? Type 'YES' to continue:" "YES"; then
        echo -e "${YELLOW}Database reset cancelled.${NC}"
        exit 0
    fi

    # Second confirmation
    if ! get_user_confirmation "This will DELETE ALL LOCAL DATA. Type 'CONFIRM' to proceed:" "CONFIRM"; then
        echo -e "${YELLOW}Database reset cancelled.${NC}"
        exit 0
    fi

    # Third confirmation with project name
    local project_name="tradelens"
    if ! get_user_confirmation "Type the project name '$project_name' to confirm:" "$project_name"; then
        echo -e "${YELLOW}Database reset cancelled.${NC}"
        exit 0
    fi

    # Step 4: Execute Reset
    echo -e "\n${CYAN}Step 4: Executing database reset...${NC}"
    echo "Running: supabase db reset --local"
    
    # Execute the reset command
    if supabase db reset --local; then
        echo -e "\n${GREEN}✓ Database reset completed successfully${NC}"
    else
        echo -e "\n${RED}✗ Database reset failed${NC}"
        exit 1
    fi

    echo -e "\n${GREEN}=== RESET COMPLETE ===${NC}"
    echo -e "${GREEN}Your local database has been reset safely.${NC}"
}

# Run main function
main "$@"