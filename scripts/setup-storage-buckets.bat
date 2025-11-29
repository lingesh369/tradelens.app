@echo off
REM Script to create all storage buckets for TradeLens
REM Run this after setting up your Supabase project

echo Creating storage buckets...
echo.

REM Create buckets using Supabase CLI
call supabase storage create trade-images --public
call supabase storage create trade-chart-images --public
call supabase storage create journal-images --public
call supabase storage create notes-images --public
call supabase storage create strategy-images
call supabase storage create profile-pictures --public
call supabase storage create traders-profile-about --public
call supabase storage create tradelens

echo.
echo Storage buckets created successfully!
echo.
echo Buckets created:
echo   - trade-images (public)
echo   - trade-chart-images (public)
echo   - journal-images (public)
echo   - notes-images (public)
echo   - strategy-images (private)
echo   - profile-pictures (public)
echo   - traders-profile-about (public)
echo   - tradelens (private)
echo.
pause
