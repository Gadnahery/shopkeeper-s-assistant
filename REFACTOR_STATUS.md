# WiseCash product refactor status

## Done

| Item | Notes |
|------|--------|
| Landing redesign | Editorial, ink/amber, EN default, TZS 25k |
| Nav: APP_NAVIGATION_ITEMS | OLLY alias deprecated |
| Mobile tab bar + New Sale FAB | iOS-style |
| POS payment | **Record only** (Cash / M-Pesa / Split / Credit) — no USSD |
| Subscription payments | HarakaPay via Edge Functions only |
| Permission dialog | Fixed double-toggle on checkbox |

## Payment rules (confirmed)

- **POS:** record how the customer paid (cash, mobile ref, credit). No USSD push.
- **Subscription / Billing:** mobile money USSD via secure Edge Function only.

## Next

1. Dashboard action-first polish + skeletons
2. Progressive product/customer sheets
3. Offline sync indicator polish
4. Feature folder migration (gradual)
