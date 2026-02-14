#!/bin/bash

# Script to replace user_subscriptions_new with user_subscriptions

echo "Fixing subscription table name references..."

# Find and replace in all TypeScript/TSX files
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i 's/user_subscriptions_new/user_subscriptions/g' {} +

echo "✓ Fixed all references from user_subscriptions_new to user_subscriptions"
echo ""
echo "Files affected:"
grep -r "user_subscriptions" src --include="*.ts" --include="*.tsx" | cut -d: -f1 | sort -u
