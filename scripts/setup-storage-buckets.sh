#!/bin/bash

# Script to create all storage buckets for TradeLens
# Run this after setting up your Supabase project

echo "Creating storage buckets..."

# Create buckets using Supabase CLI
supabase storage create trade-images --public
supabase storage create trade-chart-images --public
supabase storage create journal-images --public
supabase storage create notes-images --public
supabase storage create strategy-images
supabase storage create profile-pictures --public
supabase storage create traders-profile-about --public
supabase storage create tradelens

echo "Storage buckets created successfully!"
echo ""
echo "Buckets created:"
echo "  - trade-images (public)"
echo "  - trade-chart-images (public)"
echo "  - journal-images (public)"
echo "  - notes-images (public)"
echo "  - strategy-images (private)"
echo "  - profile-pictures (public)"
echo "  - traders-profile-about (public)"
echo "  - tradelens (private)"
