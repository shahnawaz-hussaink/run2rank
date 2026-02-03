# Deployment Guide - Run2Rank

## 🚀 Quick Deploy

Your Run2Rank app is now on GitHub: https://github.com/shahnawaz-hussaink/run2rank

### Option 1: Vercel (Recommended - Easiest)

1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import from GitHub: `shahnawaz-hussaink/run2rank`
4. Configure:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables:
   ```
   VITE_SUPABASE_PROJECT_ID=vapvyuhkbchcnplwwelu
   VITE_SUPABASE_URL=https://vapvyuhkbchcnplwwelu.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```
6. Click **"Deploy"**

✅ Your app will be live at `https://run2rank.vercel.app` in 2 minutes!

---

### Option 2: Netlify

1. Go to https://netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select `shahnawaz-hussaink/run2rank`
4. Configure:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/dist`
5. Add Environment Variables (same as Vercel)
6. Click **"Deploy site"**

✅ Live at `https://run2rank.netlify.app`

---

### Option 3: GitHub Pages (Static Only)

1. In your repo settings → Pages
2. Source: GitHub Actions
3. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install and Build
        run: |
          cd client
          npm ci
          npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./client/dist
```

4. Add env variables in repo secrets
5. Push to trigger deployment

✅ Live at `https://shahnawaz-hussaink.github.io/run2rank`

---

## 📊 Deployment Comparison

| Platform | Speed | Free Tier | Custom Domain | SSL | Auto-Deploy |
|----------|-------|-----------|---------------|-----|-------------|
| **Vercel** | ⚡️⚡️⚡️ | ✅ Generous | ✅ Free | ✅ Auto | ✅ Yes |
| **Netlify** | ⚡️⚡️ | ✅ Good | ✅ Free | ✅ Auto | ✅ Yes |
| **GitHub Pages** | ⚡️ | ✅ Free | ⚠️ Paid | ✅ Auto | ✅ Yes |

**Recommendation**: Use **Vercel** - fastest and easiest!

---

## 🔒 Environment Variables

### Required for All Platforms

```env
VITE_SUPABASE_PROJECT_ID=vapvyuhkbchcnplwwelu
VITE_SUPABASE_URL=https://vapvyuhkbchcnplwwelu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Never commit these to git!** They're already in `.gitignore`.

---

## ✅ Post-Deployment Checklist

### 1. Update Supabase Allowed URLs

In your Supabase Dashboard:
1. Go to **Authentication** → **URL Configuration**
2. Add your deployment URL to:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: `https://your-app.vercel.app/**`

### 2. Test Authentication

1. Visit your deployed app
2. Try signing up
3. Check email confirmation (if enabled)
4. Test login
5. Verify profile saves

### 3. Configure CORS (if needed)

In Supabase → **API** → **CORS**:
- Add your deployment domain

### 4. Monitor Logs

- **Vercel**: Dashboard → Deployments → Logs
- **Netlify**: Site → Deploys → Deploy log
- **Supabase**: Dashboard → Logs

---

## 🎯 Custom Domain Setup

### Vercel
1. Go to Project Settings → Domains
2. Add your domain (e.g., `run2rank.app`)
3. Follow DNS configuration
4. SSL auto-configured

### Netlify
1. Site settings → Domain management
2. Add custom domain
3. Configure DNS
4. SSL auto-configured

---

## 🔄 Continuous Deployment

All platforms support auto-deploy on git push:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Automatically triggers:
# 1. Build on platform
# 2. Run tests (if configured)
# 3. Deploy to production
# 4. Live in 1-2 minutes
```

---

## 📱 Mobile App (Future)

To convert to mobile app:

### Option A: PWA (Progressive Web App)
Already configured! Users can "Add to Home Screen"

### Option B: Capacitor (Native)
```bash
cd client
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add android
npx cap add ios
```

### Option C: React Native
Rebuild with React Native (more work)

---

## 🐛 Troubleshooting

### Build Fails

**Problem**: `Module not found` errors

**Solution**:
```bash
cd client
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variables Not Working

**Problem**: Supabase connection fails

**Solution**:
1. Verify env vars in platform dashboard
2. Check they're prefixed with `VITE_`
3. Redeploy after adding vars

### Authentication Fails After Deploy

**Problem**: Redirect errors

**Solution**:
1. Add deployment URL to Supabase allowed URLs
2. Update `VITE_SUPABASE_URL` if needed
3. Clear browser cache

---

## 📊 Monitoring & Analytics

### Add Google Analytics

1. Get GA tracking ID
2. Add to `client/index.html`:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Vercel Analytics

1. Enable in Vercel dashboard
2. Automatically tracks:
   - Page views
   - Performance
   - Errors

---

## 🚀 Performance Optimization

### Enable Caching

Add `vercel.json` in client folder:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Image Optimization

Use Vercel Image Optimization:

```typescript
import Image from 'next/image'
// or use vercel/image
```

---

## 💰 Cost Breakdown

### Free Tier Limits

**Vercel Free:**
- 100 GB bandwidth/month
- Unlimited sites
- Automatic SSL
- Custom domains

**Supabase Free:**
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth/month
- 50,000 monthly active users

**Total Cost**: $0/month for small-medium apps! 🎉

### When to Upgrade

Upgrade when you hit:
- 100k+ users/month
- Need >500 MB database
- Want advanced features
- Need priority support

---

## 📞 Support

**Deployed URL**: Will be available after deployment
**GitHub Repo**: https://github.com/shahnawaz-hussaink/run2rank
**Supabase Dashboard**: https://app.supabase.com/project/vapvyuhkbchcnplwwelu

---

## ✨ Next Steps

1. ✅ Deploy to Vercel
2. ✅ Configure custom domain (optional)
3. ✅ Add to Supabase allowed URLs
4. ✅ Test full user flow
5. ✅ Share with users! 🎉

**Run2Rank** - Now live on the web! 🏃‍♂️💨
