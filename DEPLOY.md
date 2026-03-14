# Deploy: Git → Vercel + Supabase

Run these from the project root when you want to ship changes.

## 1. Push to Git (triggers Vercel)

```bash
git add .
git status   # ensure .env is NOT staged
git commit -m "Your message"
git push origin main
```

- **Vercel**: If the repo is connected, pushing `main` auto-deploys. Check the Vercel dashboard for the new deployment.

---

## 2. Apply Supabase changes (migrations)

Set `SUPABASE_PROJECT_REF` in your local `.env` before linking this repo to a remote Supabase project:

```bash
SUPABASE_PROJECT_REF=your-supabase-project-ref
```

Then apply migrations from this repo to the correct project:

### Install Supabase CLI (once)

- **Windows (Scoop):** `scoop install supabase`
- **Windows (npm):** Supabase CLI is not supported as a global npm install; use [Scoop](https://github.com/supabase/cli#install-the-cli) or the binary from [Releases](https://github.com/supabase/cli/releases).
- **macOS/Linux:** `brew install supabase/tap/supabase` or see the link above.

### Link and push (from project root)

```bash
# One-time: link this folder to your remote Supabase project
# Get your DB password from: Supabase Dashboard → Project Settings → Database
npm run supabase:link
# Apply all pending migrations to the linked project
npm run supabase:push
```

- **First time:** Run `npm run supabase:link`; it will prompt for your database password (Supabase Dashboard → Project Settings → Database).
- **Later:** After link is done, only `npm run supabase:push` is needed to apply new migrations.

### Check migration status

```bash
npm run supabase:status
# or: supabase db remote status
```

---

## Summary

| Step            | Command / Action                                      |
|----------------|--------------------------------------------------------|
| Verify release | `npm run deploy:check`                                 |
| Deploy frontend| `git push origin main` (Vercel builds from `main`)     |
| Link Supabase  | `npm run supabase:link` (once per machine)             |
| Apply DB       | `npm run supabase:push` after changing migrations      |
