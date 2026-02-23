# Development Workflow Guide

## How Vercel Integration Works

**Short answer: Yes, you can continue editing locally and pushing changes!**

Vercel connects to your GitHub repository and automatically deploys whenever you push code. You don't need to do anything special - just work as you normally do.

## Your Daily Workflow

### 1. Edit Locally (As Usual)
```bash
# Open your project in Cursor/VS Code
# Make your changes
# Test locally
npm run dev
```

### 2. Commit and Push (As Usual)
```bash
git add .
git commit -m "Add new feature"
git push origin main
```

### 3. Vercel Automatically Deploys
- Vercel detects your push
- Builds your project automatically
- Deploys to production (if pushing to `main`)
- Creates preview URL (if pushing to feature branch)
- **You don't need to do anything!**

### 4. Check Deployment (Optional)
- Go to Vercel dashboard
- See deployment status
- View logs if needed
- Your site is live at your domain!

## Branch Strategy

### Main Branch (Production)
```bash
# Work on main branch
git checkout main
git pull origin main

# Make changes
# ... edit files ...

# Commit and push
git add .
git commit -m "Update feature"
git push origin main

# → Vercel automatically deploys to production
# → Live at: https://your-domain.com
```

### Feature Branches (Preview)
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
# ... edit files ...

# Commit and push
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# → Vercel creates preview deployment
# → Preview URL: https://shopkeeper-s-assistant-git-feature-new-feature.vercel.app
# → Test before merging to main
```

## What Happens When You Push

1. **GitHub receives your push**
2. **Vercel webhook triggers** (automatic)
3. **Vercel clones your repo**
4. **Runs `npm install`**
5. **Runs `npm run build`**
6. **Deploys to edge network**
7. **Your site is live!**

**Time:** Usually 1-3 minutes

## Environment Variables

### Setting Up (One Time)
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Select all environments (Production, Preview, Development)

### Updating Variables
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Edit the variable
3. Redeploy (or wait for next push)

**Note:** Environment variables are stored in Vercel, not in your code. You still use `.env` locally.

## Local Development

### Your `.env` File (Local Only)
```bash
# .env (never commit this!)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- Keep using `.env` for local development
- Vercel uses its own environment variables
- Both work independently

## Common Scenarios

### Scenario 1: Quick Fix
```bash
# Fix a bug locally
# Test: npm run dev
git add .
git commit -m "Fix bug"
git push origin main
# → Live in 2 minutes!
```

### Scenario 2: New Feature
```bash
# Create branch
git checkout -b feature/inventory-improvements

# Work on feature
# ... make changes ...
# Test locally: npm run dev

# Push for preview
git push origin feature/inventory-improvements
# → Get preview URL from Vercel
# → Test preview URL
# → Merge to main when ready
```

### Scenario 3: Rollback
```bash
# If something breaks
# Go to Vercel Dashboard → Deployments
# Find previous working deployment
# Click "..." → "Promote to Production"
# → Instant rollback!
```

## Benefits of This Workflow

✅ **No manual deployment** - Push code, it deploys automatically  
✅ **Preview deployments** - Test features before production  
✅ **Instant rollback** - One click to revert  
✅ **Build logs** - See what went wrong  
✅ **Analytics** - Track performance  
✅ **Free SSL** - Automatic HTTPS  
✅ **Global CDN** - Fast everywhere  

## Troubleshooting

### Build Fails
1. Check Vercel build logs
2. Fix the issue locally
3. Test: `npm run build`
4. Push again

### Changes Not Showing
1. Check deployment status in Vercel
2. Wait 1-2 minutes (CDN cache)
3. Hard refresh browser (Ctrl+Shift+R)

### Environment Variables Not Working
1. Verify variables are set in Vercel dashboard
2. Check they're set for correct environment
3. Redeploy after adding variables

## Summary

**You can edit locally and push changes exactly as you do now!**

- ✅ Edit in Cursor/VS Code
- ✅ Commit and push to GitHub
- ✅ Vercel deploys automatically
- ✅ Your site updates automatically

**No need to:**
- ❌ Log into Vercel for every change
- ❌ Manually trigger deployments
- ❌ Change your workflow
- ❌ Learn new commands

Just keep coding and pushing - Vercel handles the rest! 🚀
