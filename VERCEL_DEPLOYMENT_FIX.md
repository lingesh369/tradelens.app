# Vercel Deployment Fix

## Problem
The deployment was failing with "vite: command not found" error because Vite was in devDependencies and not accessible during the build process.

## Solutions Applied

### 1. Updated package.json
- Moved `vite` and `typescript` from `devDependencies` to `dependencies`
- Updated build scripts to use `npx vite build` instead of `vite build`
- Added Node.js engine requirement (`>=18.0.0`)

### 2. Updated vercel.json
- Set framework to "vite" to help Vercel understand the project structure

### 3. Added .nvmrc
- Specified Node.js version 18 for consistent deployment environment

## Files Changed
- `package.json` - Dependencies and scripts updated
- `vercel.json` - Framework specification added
- `.nvmrc` - Node.js version specified

## Next Steps
1. Commit and push these changes to your GitHub repository
2. Vercel will automatically trigger a new deployment
3. The build should now succeed

## Build Command Used
```bash
npx vite build
```

This ensures Vite is found even if it's in node_modules/.bin/ directory.