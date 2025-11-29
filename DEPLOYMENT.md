# Personal Finance Management PWA - GitHub Pages Deployment Guide

## 🚀 Deployment Instructions

This project is now ready to be deployed to GitHub Pages with full PWA support!

### Prerequisites
- GitHub account
- Git installed locally
- Node.js 20+ installed

### Step 1: Create GitHub Repository
1. Go to [GitHub](https://github.com/new)
2. Create a new repository named `Personal-Finance-Management-PWA`
3. **Important:** Set repository visibility to **Public** (required for GitHub Pages on free accounts)

### Step 2: Update Base URL (if needed)
If your repository name is different, update the base URL in `vite.config.ts`:
```typescript
base: process.env.GITHUB_PAGES === 'true' ? '/your-repo-name/' : '/',
```

### Step 3: Push Code to GitHub
```bash
git init
git add .
git commit -m "Initial commit - PWA ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/Personal-Finance-Management-PWA.git
git push -u origin main
```

### Step 4: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Build and deployment":
   - Source: **GitHub Actions**
4. The workflow will automatically run and deploy your site

### Step 5: Access Your PWA
After deployment completes (2-3 minutes):
- Your site will be available at: `https://YOUR_USERNAME.github.io/Personal-Finance-Management-PWA/`

## 📱 PWA Features

Your app now includes:
- ✅ Service Worker for offline functionality
- ✅ Web App Manifest for installability
- ✅ PWA meta tags for mobile devices
- ✅ Apple-specific PWA support
- ✅ Install prompt for supported browsers
- ✅ Offline fallback page

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📝 Important Notes

### Supabase Configuration
- Make sure your Supabase project allows requests from your GitHub Pages domain
- Add your GitHub Pages URL to Supabase Dashboard → Authentication → URL Configuration → Site URL
- Add `https://YOUR_USERNAME.github.io` to allowed redirect URLs

### Icons
The project includes an SVG icon. For production, you should generate PNG icons:
- icon-180.png (180x180) - Apple Touch Icon
- icon-192.png (192x192) - Standard PWA icon
- icon-512.png (512x512) - Large PWA icon
- icon-1024.png (1024x1024) - High-res icon

You can use tools like:
- [PWA Asset Generator](https://www.npmjs.com/package/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- Or use your Figma design to export the icons

### Testing PWA Installation

**On Desktop (Chrome/Edge):**
1. Open your deployed site
2. Look for the install icon in the address bar
3. Click to install

**On Mobile (iOS Safari):**
1. Open your site in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

**On Mobile (Android Chrome):**
1. Open your site in Chrome
2. Tap the menu (three dots)
3. Select "Add to Home screen"

## 🔄 Auto-Deployment

Every time you push to the `main` branch, GitHub Actions will:
1. Install dependencies
2. Build the project
3. Deploy to GitHub Pages automatically

## 🐛 Troubleshooting

**Pages not deploying?**
- Check Actions tab for build errors
- Ensure Pages is enabled in Settings
- Verify the repository is Public

**404 errors?**
- Check that base URL in vite.config.ts matches your repo name
- Ensure all assets are in the public folder

**PWA not installing?**
- Verify HTTPS is enabled (GitHub Pages uses HTTPS by default)
- Check browser console for service worker errors
- Ensure manifest.json is accessible

## 📚 Additional Resources
- [Vite PWA Documentation](https://vite-pwa-org.netlify.app/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

