@echo off
REM Deployment script for Tradelens Journal (Windows)
REM This script builds the project and pushes to GitHub repository

echo 🚀 Starting deployment process...

REM Check if we're in a git repository
if not exist ".git" (
    echo ❌ Not a git repository. Initializing...
    git init
    git remote add origin https://github.com/Lee5595/tradelens-journal.git
)

REM Check if origin remote exists
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo 📡 Adding GitHub remote...
    git remote add origin https://github.com/Lee5595/tradelens-journal.git
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Build the project
echo 🔨 Building project...
npm run build

REM Add all changes
echo 📝 Adding changes to git...
git add .

REM Commit changes with timestamp
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do set mydate=%%c-%%a-%%b
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set mytime=%%a:%%b
git commit -m "Deploy: %mydate% %mytime%" || echo No changes to commit

REM Push to GitHub
echo ⬆️ Pushing to GitHub...
git push origin main

echo ✅ Deployment completed successfully!
echo 🌐 Your site will be available at: https://lee5595.github.io/tradelens-journal/

pause