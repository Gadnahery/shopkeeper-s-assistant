# Deployment Checklist

## Pre-Deployment

- [x] Environment variables validated
- [x] Error boundaries implemented
- [x] Console statements removed/guarded for production
- [x] Build configuration optimized
- [x] QueryClient configured with proper defaults
- [x] Error handling in critical paths
- [x] Route-level lazy loading enabled
- [x] Protected routes + role checks enabled
- [x] Realtime notifications subscription enabled
- [x] Audit logging integrated for sensitive mutations

## Environment Variables

**Required:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Supabase Edge Functions (required for secure admin user creation):**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
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

## Release Gate (Recommended)

Run all checks before every production deploy:

```bash
npm run env:check
npm run lint
npm run test
npm run build
node scripts/responsive-check.cjs
```

Expected status:
- `env:check`: required frontend env vars are present and not placeholders
- `lint`: no errors (warnings are currently tolerated)
- `test`: all tests pass
- `build`: success
- `responsive-check`: `failed: 0`

For the full automated release gate, run:

```bash
npm run deploy:check
```

## Database and Function Deployment

### Supabase migrations

Apply all migrations (including `008_spec_v2_core_updates.sql`) before deploying frontend:

```bash
supabase db push
```

### Supabase Edge Function

Deploy admin user creation function:

```bash
supabase functions deploy admin-create-user
```

If function secrets are not already set, configure them first:

```bash
supabase secrets set SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=...
```

## Deployment Steps

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy!
6. Deploy Supabase migrations/functions from CI or manually

### Netlify

1. Connect repository
2. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add environment variables in Site settings
4. Deploy!
5. Deploy Supabase migrations/functions from CI or manually

### Cloudflare Pages

1. Connect repository
2. Build settings:
   - Framework preset: Vite
   - Build command: `npm run build`
   - Build output directory: `dist`
3. Add environment variables
4. Deploy!
5. Deploy Supabase migrations/functions from CI or manually

## Post-Deployment Configuration

### Supabase Configuration

1. **Add Redirect URLs:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your production URL: `https://your-domain.com`
   - Add callback URL: `https://your-domain.com/auth/callback`

2. **Verify RLS Policies:**
   - Ensure Row Level Security is enabled on all tables
   - Test authentication flow
   - Confirm `audit_log` insert/select policies are active
   - Confirm `stock_received` and `stock_received_items` policies are active

### PWA Configuration

- PWA is automatically configured via `vite-plugin-pwa`
- Icons should be at `/icon-192.png` and `/icon-512.png`
- Service worker is auto-generated on build
- Outdated caches are cleaned automatically (`cleanupOutdatedCaches`)
- New versions activate quickly (`skipWaiting`, `clientsClaim`)

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
- [ ] Admin user creation works via Edge Function
- [ ] Password reset flow works end-to-end
- [ ] Receive stock writes to stock tables correctly
- [ ] Notification unread badge updates in realtime
- [ ] Audit logs are recorded for sensitive actions

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

### `admin-create-user` does not work
- Confirm function is deployed: `supabase functions list`
- Confirm required secrets are set
- Check function logs in Supabase dashboard
- Verify caller has `owner` or `manager` role in current shop

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
- Keep dependencies patched (`npm audit`) and prioritize high vulnerabilities
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to frontend code
