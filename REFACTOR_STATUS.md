# WiseCash product refactor status

## Done

| Phase | Item | Status |
|-------|------|--------|
| 2 | `OLLY_NAVIGATION_ITEMS` → `APP_NAVIGATION_ITEMS` | Done |
| 4 | Mobile tab bar + center **New Sale** FAB | Done |
| 7 (UI) | POS payment: Mobile first + waiting/success/failed overlays | Done |
| 11 | Landing redesign | Done |

## POS payment (this commit)

- Default method: **Mobile money** (phone → Pay TZS → waiting overlay → success)
- Secondary: **Cash**, **Credit** (credit needs a customer)
- Removed: Split / multi-provider picker noise
- Components: `PaymentWaiting`, `PaymentSuccess`, `PaymentFailed` under `src/features/payments/`
- Live HarakaPay USSD for **POS sales** still to wire via Edge Function (subscription path already exists)

## Next

1. Edge Function `payments-create` / status for **sale** amounts (server-side amount, idempotency)
2. Poll status while waiting; stop on success/fail
3. Dashboard action-first home + skeletons
4. Progressive product/customer sheets
5. Permission checkbox double-toggle fix

## Rules

- UI label: **Mobile money** (no provider brand in primary UI)
- API keys only in Edge secrets
- Cash kept for offline shops
