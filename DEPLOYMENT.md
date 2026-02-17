# Deployment Checklist

## Pre-Deployment

- [x] Environment variables validated
- [x] Error boundaries implemented
- [x] Console statements removed/guarded for production
- [x] Build configuration optimized
- [x] QueryClient configured with proper defaults
- [x] Error handling in critical paths

## Environment Variables

**Required:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Validation:** The app will fail to start if these are missing (throws error on initialization).

## Build Process

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set environment variables** (in your hosting platform or `.env` file)

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Verify build output:**
   - Check `dist/` folder exists
   - Verify all assets are present
   - Check for build errors/warnings

## Deployment Steps

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy!

### Netlify

1. Connect repository
2. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add environment variables in Site settings
4. Deploy!

### Cloudflare Pages

1. Connect repository
2. Build settings:
   - Framework preset: Vite
   - Build command: `npm run build`
   - Build output directory: `dist`
3. Add environment variables
4. Deploy!

## Post-Deployment Configuration

### Supabase Configuration

1. **Add Redirect URLs:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your production URL: `https://your-domain.com`
   - Add callback URL: `https://your-domain.com/auth/callback`

2. **Verify RLS Policies:**
   - Ensure Row Level Security is enabled on all tables
   - Test authentication flow

### PWA Configuration

- PWA is automatically configured via `vite-plugin-pwa`
- Icons should be at `/icon-192.png` and `/icon-512.png`
- Service worker is auto-generated on build

## Testing Checklist

After deployment, verify:

- [ ] App loads without errors
- [ ] Authentication (login/signup) works
- [ ] Redirect URLs work correctly
- [ ] PWA can be installed
- [ ] All pages load correctly
- [ ] API calls to Supabase work
- [ ] Error boundaries catch errors gracefully
- [ ] No console errors in production
- [ ] Mobile responsiveness works
- [ ] Dark mode works

## Troubleshooting

### App fails to start
- Check environment variables are set correctly
- Verify Supabase URL and key are valid
- Check browser console for specific errors

### Authentication not working
- Verify redirect URLs are added in Supabase
- Check HTTPS is enabled (required for Supabase auth)
- Verify CORS settings in Supabase

### Build fails
- Check Node.js version (should be 18+)
- Clear `node_modules` and reinstall
- Check for TypeScript errors: `npm run build`

### PWA not installing
- Verify HTTPS is enabled
- Check manifest.json is accessible
- Verify icons exist at correct paths

## Performance Optimization

- Build includes code splitting (vendor, supabase, ui chunks)
- Assets are minified in production
- Source maps only in development
- PWA caching configured for offline support

## Security Notes

- Never commit `.env` file (already in `.gitignore`)
- Use environment variables for all sensitive data
- Supabase RLS policies should be properly configured
- HTTPS is required for production (enforced by Supabase)
