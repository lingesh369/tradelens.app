# Deployment Guide for Tradelens Journal

This guide explains how to deploy your Tradelens Journal application from Trae to your GitHub repository.

## Repository Information
- **GitHub Repository**: https://github.com/Lee5595/tradelens-journal.git
- **Live Site**: https://lee5595.github.io/tradelens-journal/

## Deployment Methods

### Method 1: Automated GitHub Actions (Recommended)
The project includes a GitHub Actions workflow that automatically deploys your application when you push to the `main` branch.

**Setup Steps:**
1. Push your code to the `main` branch
2. Go to your GitHub repository settings
3. Navigate to "Pages" section
4. Set source to "GitHub Actions"
5. The workflow will automatically build and deploy your site

### Method 2: Manual Deployment Scripts

#### For Windows Users:
```bash
npm run deploy:windows
```
or directly run:
```bash
deploy.bat
```

#### For Unix/Linux/Mac Users:
```bash
npm run deploy:unix
```
or directly run:
```bash
chmod +x deploy.sh
./deploy.sh
```

#### Quick Deploy (Cross-platform):
```bash
npm run deploy
```

### Method 3: Manual Git Commands
```bash
# Build the project
npm run build

# Add all changes
git add .

# Commit changes
git commit -m "Deploy: $(date)"

# Push to GitHub
git push origin main
```

## Configuration Details

### Vite Configuration
The `vite.config.ts` has been configured with:
- Base path set to `/tradelens-journal/` for production (GitHub Pages)
- Base path set to `/` for development

### GitHub Actions Workflow
Located at `.github/workflows/deploy.yml`, this workflow:
- Triggers on pushes to the `main` branch
- Installs Node.js 18
- Installs dependencies with `npm ci`
- Builds the project with `npm run build`
- Deploys to GitHub Pages using the built `dist` folder

### Build Output
- Development server: `npm run dev` (runs on localhost)
- Production build: `npm run build` (outputs to `dist/` folder)
- Preview build: `npm run preview` (preview the production build locally)

## Troubleshooting

### Common Issues:

1. **GitHub Pages not enabled**: 
   - Go to repository Settings → Pages
   - Set source to "GitHub Actions"

2. **Build fails**:
   - Check that all dependencies are installed: `npm install`
   - Verify the build works locally: `npm run build`

3. **Site not loading correctly**:
   - Ensure the base path in `vite.config.ts` matches your repository name
   - Check browser console for any asset loading errors

4. **Git authentication issues**:
   - Make sure you're authenticated with GitHub
   - Use personal access tokens if needed

### Environment Variables
If your application uses environment variables, add them to:
- GitHub repository Settings → Secrets and variables → Actions
- Create environment variables with the `VITE_` prefix for client-side usage

## Development Workflow

1. **Local Development**: `npm run dev`
2. **Make Changes**: Edit your code in Trae
3. **Test Build**: `npm run build && npm run preview`
4. **Deploy**: Use any of the deployment methods above
5. **Verify**: Check your live site at https://lee5595.github.io/tradelens-journal/

## Additional Notes

- The deployment scripts automatically handle git initialization if needed
- All builds are optimized for production
- The site uses GitHub Pages for hosting (free for public repositories)
- Changes to the `main` branch trigger automatic deployments via GitHub Actions