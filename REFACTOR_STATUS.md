# WiseCash product refactor status

Master prompt: complete product refactor & iOS-style UX.

## Done (this commit)

| Phase | Item | Status |
|-------|------|--------|
| 2 | Rename `OLLY_NAVIGATION_ITEMS` → `APP_NAVIGATION_ITEMS` (compat alias kept) | Done |
| 2 | Design token comment / brand alignment in `index.css` | Done |
| 3 | Simpler nav group labels (Home, Money, Team…) | Done |
| 4 | Mobile bottom nav: Home · Sales · **FAB New Sale** · Inventory · Customers · More | Done |
| 11 | Landing redesign (earlier commits) | Done |

## Next (priority order)

1. **POS payment UX** — single “Pay with mobile money” flow + waiting / success / failed states (no provider picker)
2. **Skeleton loading** system for dashboard, lists, POS
3. **Dashboard** — action-first home (today’s numbers + quick actions + needs attention)
4. **Progressive forms** — product / customer sheets (name + price / name + phone)
5. **Permission checkbox double-toggle** fix in UserPermissionsDialog
6. Feature folder split (`src/features/*`) — gradual
7. Offline / sync indicator polish
8. Full OLLY string sweep in LanguageContext translations if any remain

## Payment rule (UI)

- User sees: **Mobile Money** only
- Provider id remains `harakapay` server-side
- API key only in Edge Function secrets
- No HarakaPay brand name in user-facing app strings (per product decision)

## Do not

- Rebuild from scratch
- Break sales / inventory / offline / RLS
- Expose payment API keys in Vite
