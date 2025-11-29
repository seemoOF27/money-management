# 📱 Personal Finance Management PWA

A Progressive Web App for managing personal finances, budgets, debts, and investments with Supabase backend.

## ✨ Features

- 💰 **Budget Management**: Track income and expenses
- 📊 **Debt Tracking**: Monitor debts and payments
- 📈 **Investment Portfolio**: Track investments and returns
- 💳 **Operations Log**: Record all financial transactions
- 📱 **PWA Ready**: Install on any device, works offline
- 🔐 **Secure**: Supabase authentication and database
- 🌐 **RTL Support**: Full Arabic language support

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

Update your Supabase credentials in `src/utils/supabase/client.ts`:

```typescript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
```

### 3. Generate PWA Icons

1. Open `generate-icons.html` in your browser
2. Download all generated PNG icons
3. Place them in the `public/` folder

### 4. Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## 📦 Build for Production

```bash
npm run build
```

Built files will be in the `dist/` folder.

## 🌐 Deploy to GitHub Pages

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Steps:

1. Create a GitHub repository named `Personal-Finance-Management-PWA`
2. Update the base URL in `vite.config.ts` if repository name differs
3. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_REPO_URL
   git push -u origin main
   ```
4. Enable GitHub Pages in repository settings (Source: GitHub Actions)
5. Your site will be live at `https://YOUR_USERNAME.github.io/Personal-Finance-Management-PWA/`

## 🔧 Configuration

### Supabase Setup

1. Create tables in Supabase:
   - `users`: User profiles with salary and income info
   - `budgets`: Budget allocations
   - `debts`: Debt tracking
   - `investments`: Investment portfolio
   - `operations`: Financial transactions

2. Add your GitHub Pages URL to Supabase:
   - Go to Authentication → URL Configuration
   - Add your GitHub Pages URL to allowed redirect URLs

### Environment Variables

For local development, create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📱 PWA Features

- ✅ **Offline Support**: Works without internet connection
- ✅ **Installable**: Add to home screen on any device
- ✅ **Fast Loading**: Service worker caching
- ✅ **Responsive**: Works on mobile, tablet, and desktop
- ✅ **Native-like**: Behaves like a native app

### Testing PWA

**Desktop (Chrome/Edge):**
- Look for install icon in address bar
- Or click menu → Install app

**iOS Safari:**
- Tap Share → Add to Home Screen

**Android Chrome:**
- Tap menu → Add to Home screen
- Or follow the install banner prompt

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Backend**: Supabase (Auth + Database)
- **PWA**: Service Worker + Web Manifest

## 📁 Project Structure

```
├── public/               # Static assets
│   ├── manifest.json    # PWA manifest
│   ├── service-worker.js # Service worker
│   ├── offline.html     # Offline fallback
│   └── *.png           # PWA icons
├── src/
│   ├── components/      # React components
│   ├── utils/          # Utility functions
│   │   └── supabase/   # Supabase client
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── .github/
│   └── workflows/
│       └── deploy.yml   # GitHub Actions workflow
└── vite.config.ts      # Vite configuration
```

## 🐛 Troubleshooting

**Service Worker not registering?**
- Ensure HTTPS is enabled (or localhost)
- Check browser console for errors
- Clear browser cache and reload

**Icons not showing?**
- Run `generate-icons.html` and download all icons
- Verify icons are in `public/` folder
- Check manifest.json paths are correct

**Supabase connection issues?**
- Verify credentials in client.ts
- Check network requests in browser DevTools
- Ensure Supabase project is not paused

**GitHub Pages 404 errors?**
- Check base URL in vite.config.ts
- Verify repository name matches
- Ensure files are in `dist/` folder after build

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - GitHub Pages deployment
- [PWA Guide](./PWA-README.md) - PWA setup and features
- [iOS PWA Guide](./IOS-PWA-GUIDE.md) - iOS-specific instructions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Created with Figma Make
- UI components from Radix UI
- Icons from Lucide
- Backend powered by Supabase

---

Made with ❤️ for better personal finance management
