# 🎯 Quick Setup Guide

## 📋 Prerequisites
- Node.js 20 or higher
- npm or yarn
- Git
- A GitHub account
- A Supabase account

## 🚀 Setup Steps

### 1️⃣ Generate PWA Icons (IMPORTANT!)

Before deploying, you need to generate the PNG icons:

1. Open `generate-icons.html` in your web browser
2. The page will auto-generate 4 icon sizes
3. Click the download button under each icon
4. Save all 4 PNG files to the `public/` folder:
   - `icon-180.png`
   - `icon-192.png`
   - `icon-512.png`
   - `icon-1024.png`

### 2️⃣ Configure Supabase

1. Go to [Supabase](https://supabase.com) and create a project
2. Get your project URL and anon key from Settings → API
3. Update `src/utils/supabase/client.ts` with your credentials:

```typescript
const supabaseUrl = 'YOUR_PROJECT_URL';
const supabaseAnonKey = 'YOUR_ANON_KEY';
```

### 3️⃣ Install Dependencies

```bash
npm install
```

### 4️⃣ Test Locally

```bash
npm run dev
```

Visit `http://localhost:3000` to test the app.

### 5️⃣ Deploy to GitHub Pages

#### A. Create GitHub Repository
1. Go to GitHub and create a new repository
2. Name it: `Personal-Finance-Management-PWA` (or any name you prefer)
3. **Important**: Make it **Public** (required for free GitHub Pages)

#### B. Update Base URL (if repository name differs)
If you used a different name, update `vite.config.ts`:
```typescript
base: process.env.GITHUB_PAGES === 'true' ? '/your-repo-name/' : '/',
```

#### C. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit - Ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

#### D. Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Build and deployment", select **Source**: `GitHub Actions`
4. The deployment will start automatically

#### E. Wait for Deployment
- Check the **Actions** tab to see deployment progress
- Usually takes 2-3 minutes
- Once complete, your app will be live at:
  `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

### 6️⃣ Configure Supabase for Production

After deployment, add your GitHub Pages URL to Supabase:

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add your GitHub Pages URL to:
   - Site URL: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`
   - Redirect URLs: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/**`

## ✅ Verification Checklist

- [ ] All 4 PNG icons generated and placed in `public/` folder
- [ ] Supabase credentials configured in `client.ts`
- [ ] Dependencies installed (`npm install`)
- [ ] Local testing works (`npm run dev`)
- [ ] GitHub repository created (Public)
- [ ] Base URL updated in `vite.config.ts` (if needed)
- [ ] Code pushed to GitHub
- [ ] GitHub Pages enabled (Source: GitHub Actions)
- [ ] Deployment successful (check Actions tab)
- [ ] GitHub Pages URL added to Supabase

## 🎉 Testing Your PWA

### Desktop (Chrome/Edge)
1. Visit your GitHub Pages URL
2. Look for the install icon (⊕) in the address bar
3. Click to install the app

### Mobile (iOS Safari)
1. Visit your GitHub Pages URL in Safari
2. Tap the Share button (square with arrow)
3. Select "Add to Home Screen"
4. Tap "Add"

### Mobile (Android Chrome)
1. Visit your GitHub Pages URL in Chrome
2. Tap the menu (⋮)
3. Select "Add to Home screen"
4. Tap "Add"

## 🔧 Troubleshooting

### Icons not showing?
- Make sure all 4 PNG files are in `public/` folder
- Clear browser cache and reload

### 404 error after deployment?
- Check base URL in `vite.config.ts` matches your repository name
- Repository name is case-sensitive!

### Can't install PWA?
- Ensure you're using HTTPS (GitHub Pages uses HTTPS by default)
- Check browser console for service worker errors
- Try clearing cache and hard reload (Ctrl+Shift+R)

### Supabase authentication not working?
- Verify credentials in `client.ts`
- Check that GitHub Pages URL is added to Supabase allowed URLs
- Look for CORS errors in browser console

## 📱 Auto-Updates

Every time you push to the `main` branch:
1. GitHub Actions automatically builds the app
2. Deploys to GitHub Pages
3. Users will get updates when they refresh

## 📚 Need Help?

- Check `README.md` for full documentation
- Read `DEPLOYMENT.md` for detailed deployment guide
- Review `PWA-README.md` for PWA-specific information

---

**Estimated Setup Time**: 15-20 minutes

Good luck! 🚀

