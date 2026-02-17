# Vercel Deployment Guide

Complete guide to deploy Smart Money to Vercel and purchase a domain.

## Prerequisites

- GitHub account (recommended) or GitLab/Bitbucket
- Vercel account (free tier works)
- Supabase project with credentials

## Step 1: Prepare Your Repository

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Verify `.env.example` exists** (for reference):
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)** and sign in/sign up

2. **Click "Add New Project"**

3. **Import your repository:**
   - Connect your GitHub account if not already connected
   - Select your `shopkeeper-s-assistant` repository
   - Click "Import"

4. **Configure Project Settings:**
   - **Framework Preset:** Vite (auto-detected)
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `npm run build` (auto-filled)
   - **Output Directory:** `dist` (auto-filled)
   - **Install Command:** `npm install` (auto-filled)

5. **Add Environment Variables:**
   Click "Environment Variables" and add:
   - **Name:** `VITE_SUPABASE_URL`
     **Value:** `https://your-project.supabase.co`
     **Environment:** Production, Preview, Development (select all)
   
   - **Name:** `VITE_SUPABASE_ANON_KEY`
     **Value:** `your-anon-key-here`
     **Environment:** Production, Preview, Development (select all)

6. **Click "Deploy"**
   - Vercel will build and deploy your app
   - Wait 2-3 minutes for the build to complete

7. **Get your deployment URL:**
   - After deployment, you'll get a URL like: `https://shopkeeper-s-assistant.vercel.app`
   - This is your temporary Vercel domain

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   Follow the prompts:
   - Link to existing project? No (first time)
   - Project name: shopkeeper-s-assistant (or your choice)
   - Directory: `./`
   - Override settings? No

4. **Add environment variables:**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```
   Enter values when prompted, select all environments.

5. **Deploy to production:**
   ```bash
   vercel --prod
   ```

## Step 3: Purchase Domain via Vercel

1. **Go to your project dashboard** on Vercel

2. **Click "Domains"** in the project menu

3. **Click "Add Domain"**

4. **Search for your desired domain:**
   - Enter domain name (e.g., `smartmoney.app` or `smartmoney.co.tz`)
   - Vercel will show availability and pricing

5. **Purchase Domain:**
   - Select your domain
   - Choose registration period (1-10 years)
   - Add to cart and checkout
   - Complete payment (Vercel accepts credit cards)

6. **Domain Configuration (Automatic):**
   - Vercel automatically configures DNS
   - SSL certificate is auto-generated (free)
   - Wait 5-10 minutes for DNS propagation

7. **Verify Domain:**
   - Your app will be accessible at your custom domain
   - Example: `https://smartmoney.app`

## Step 4: Configure Supabase

After deployment, configure Supabase to allow your domain:

1. **Go to Supabase Dashboard** → Your Project → Authentication → URL Configuration

2. **Add Site URL:**
   - Add your Vercel domain: `https://your-domain.com`
   - Or keep Vercel's default: `https://shopkeeper-s-assistant.vercel.app`

3. **Add Redirect URLs:**
   Add these URLs:
   ```
   https://your-domain.com
   https://your-domain.com/auth/callback
   https://your-domain.com/login
   https://your-domain.com/signup
   https://shopkeeper-s-assistant.vercel.app
   https://shopkeeper-s-assistant.vercel.app/auth/callback
   ```

4. **Save Changes**

## Step 5: Verify Deployment

1. **Visit your domain** (e.g., `https://your-domain.com`)

2. **Test Authentication:**
   - Try signing up
   - Try logging in
   - Verify redirects work

3. **Test PWA:**
   - Open on mobile device
   - Check "Add to Home Screen" option
   - Verify app installs correctly

4. **Check Browser Console:**
   - Open DevTools (F12)
   - Verify no errors
   - Check network tab for API calls

## Step 6: Set Up Custom Domain (If Purchased)

If you purchased a domain through Vercel, it's automatically configured. If you purchased elsewhere:

1. **In Vercel Dashboard** → Domains → Add Domain
2. **Enter your domain** (e.g., `smartmoney.com`)
3. **Follow DNS instructions:**
   - Add CNAME record: `@` → `cname.vercel-dns.com`
   - Or A record: `@` → Vercel's IP (shown in dashboard)
4. **Wait for DNS propagation** (up to 48 hours, usually < 1 hour)

## Vercel-Specific Optimizations

### Automatic Features:
- ✅ **HTTPS:** Automatically enabled (free SSL)
- ✅ **CDN:** Global edge network
- ✅ **Auto-scaling:** Handles traffic spikes
- ✅ **Preview Deployments:** Every push creates preview URL
- ✅ **Analytics:** Available in Vercel dashboard

### Performance:
- Vercel automatically optimizes your Vite build
- Edge functions available if needed
- Image optimization available

## Environment Variables Management

### For Production:
- Set in Vercel Dashboard → Project → Settings → Environment Variables
- Select "Production" environment

### For Preview/Development:
- Same variables, select "Preview" and "Development"
- Useful for testing before production

### Updating Variables:
1. Go to Project → Settings → Environment Variables
2. Edit or add new variables
3. Redeploy (automatic or manual)

## Continuous Deployment

Vercel automatically deploys on every push to:
- **Production:** `main` branch
- **Preview:** Other branches (feature branches)

### Manual Deployment:
1. Go to Deployments tab
2. Click "..." on any deployment
3. Click "Promote to Production"

## Monitoring & Analytics

1. **Go to Analytics tab** in Vercel dashboard
2. **Enable Analytics** (free tier available)
3. **View:**
   - Page views
   - Unique visitors
   - Performance metrics
   - Error rates

## Troubleshooting

### Build Fails:
- Check build logs in Vercel dashboard
- Verify environment variables are set
- Check `package.json` scripts are correct

### Domain Not Working:
- Wait 24-48 hours for DNS propagation
- Check DNS records in domain registrar
- Verify SSL certificate is issued (check in Vercel dashboard)

### Authentication Issues:
- Verify Supabase redirect URLs include your domain
- Check environment variables are correct
- Verify HTTPS is enabled (required for Supabase)

### PWA Not Installing:
- Ensure HTTPS is enabled (automatic on Vercel)
- Check manifest.json is accessible
- Verify icons exist at `/icon-192.png` and `/icon-512.png`

## Cost Estimate

### Vercel Free Tier (Hobby):
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic SSL
- ✅ Preview deployments
- ✅ **Perfect for starting out**

### Vercel Pro ($20/month):
- Everything in Hobby
- More bandwidth
- Team collaboration
- Advanced analytics

### Domain Cost:
- `.com`: ~$12-15/year
- `.app`: ~$15-20/year
- `.co.tz`: ~$20-30/year
- Prices vary by registrar

## Next Steps After Deployment

1. ✅ Test all features thoroughly
2. ✅ Set up monitoring/analytics
3. ✅ Configure backups (Supabase handles this)
4. ✅ Set up error tracking (optional: Sentry)
5. ✅ Document your deployment process
6. ✅ Share your app URL with users!

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Vercel Support:** Available in dashboard
- **Supabase Docs:** https://supabase.com/docs

---

**Your app is now live! 🚀**
