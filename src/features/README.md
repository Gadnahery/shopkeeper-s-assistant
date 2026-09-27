# WiseCash feature modules

Domain code lives under `src/features/<domain>/`.

```
src/features/
  sales/          POS, sale history, sale dialogs
  inventory/      Product sheets, stock correction
  customers/      Customer quick-add
  dashboard/      Home KPIs, quick actions, charts
  payments/       Subscription payment waiting UI helpers
  sync/           Offline banner toasts + pending queue dialog
```

## Public API

Import from the barrel when possible:

```ts
import { POSSaleView, SalesHistoryView } from "@/features/sales";
import { QuickAddProductSheet } from "@/features/inventory";
import { QuickActions } from "@/features/dashboard";
```

## Compatibility

Legacy paths under `src/components/{sales,inventory,customers,dashboard,sync}/`
re-export the feature modules so existing imports keep working.

## Next (gradual)

1. Move domain hooks (`useSales`, `useProducts`, …) into `features/*/hooks` and re-export from `src/hooks/`.
2. Colocate feature-specific types and validation.
3. Split large pages (`Inventory.tsx`, `POSSaleView.tsx`) further inside the feature.
