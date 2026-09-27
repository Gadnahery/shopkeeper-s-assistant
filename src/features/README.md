# WiseCash feature modules

```
src/features/
  sales/       POS, history, dialogs + hooks re-exports
  inventory/   Product sheets, stock correction + hooks
  customers/   Quick-add customer + hooks
  dashboard/   Home KPIs, quick actions, charts
  payments/    Subscription payment waiting / success / failed overlays
  billing/     Subscription billing (uses payments overlays)
  sync/        Offline status + pending queue dialog
```

## Payment rules (product)

| Surface | Behavior |
|---------|----------|
| **POS** | Record only (Cash / Mobile / Split / Credit). No USSD push. |
| **Billing / subscription** | Mobile money prompt via secure Edge Function. UI shows "Pay by phone" / "Waiting for payment". Provider name is not user-facing. |

## Import style

```ts
import { POSSaleView, useCreateSale } from "@/features/sales";
import { PaymentWaiting } from "@/features/payments";
```

Legacy `@/components/...` paths re-export feature modules for compatibility.
