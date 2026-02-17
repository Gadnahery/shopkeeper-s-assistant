# Smart Money - Retail Management System

A complete POS and retail management system with inventory, sales, orders, customers, expenses, HR, assets, and reporting.

## Tech Stack

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (auth, database, storage)

## Setup

1. Clone the repository
2. Install dependencies: `npm i`
3. Copy `.env.example` to `.env` and set your Supabase credentials
4. Run `001_schema.sql` and `002_extensions.sql` in your Supabase SQL Editor (see `supabase/migrations/`)
5. Start dev server: `npm run dev`

## Supabase credentials

In `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get these from Supabase Dashboard → Project Settings → API.

## Environment Variables

**Required for deployment:**
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

The application will fail to start if these are missing. Get them from:
Supabase Dashboard → Project Settings → API

## Deploy

### Quick Deploy to Vercel (Recommended)

**See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for complete guide**

1. Push code to GitHub
2. Import project in Vercel dashboard
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!
5. Purchase domain through Vercel (optional)

### Other Hosting Options

1. **Set environment variables** in your hosting platform:
   - `VITE_SUPABASE_URL=https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=your-anon-key`

2. **Build**: `npm run build`

3. **Deploy** the `dist/` folder to any static host:
   - Vercel (recommended) - See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
   - Netlify
   - Cloudflare Pages
   - GitHub Pages
   - AWS S3 + CloudFront

4. **HTTPS required** – PWA and Supabase auth require HTTPS

5. **Configure Supabase**:
   - Add your deployment URL to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
   - Example: `https://your-domain.com`, `https://your-domain.com/auth/callback`

6. **Verify deployment**:
   - Check browser console for errors
   - Test authentication flow
   - Verify PWA installation works

## PWA (Progressive Web App)

- Installable on phones, tablets, and desktops
- Works offline (cached assets)
- Add to home screen: browser menu → "Add to Home Screen" or "Install app"
- Orientation: any (portrait & landscape supported)

## Responsiveness

- Mobile-first layout with collapsible sidebar
- Breakpoints: `sm` 640px, `md` 768px, `lg` 1024px
- Touch-friendly controls and viewport-fit for notched devices
