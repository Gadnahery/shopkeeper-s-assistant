# WISECASH PRODUCT REFACTOR & iOS-STYLE UX MASTER PRINCIPLES

## 1. CORE PHILOSOPHY
- **Simplicity in UI, Complexity in Architecture**:
  The backend contains RLS, audit logs, payment state machines, offline synchronization, and accounting logic. The user sees: Sell, Add, Pay, Save, Done.
- **Do Things, Don't Fill Forms**:
  Progressive disclosure. Ask for essential info first, reveal advanced settings only when needed.
- **One Primary Action per Screen**:
  Avoid competing primary buttons.
  - POS: Complete sale
  - Customer: Add customer
  - Billing: Pay TZS 25,000

---

## 2. VISUAL & INTERACTION SYSTEM (iOS-INSPIRED)
- Clean, quiet, spacious, tactile, rounded surfaces, soft borders (`#E5E7EB`).
- Primary ink: `#1A1D29`, Brand amber: `#D99A4E`, Soft amber: `#FEF7E6`, Background: `#F7F7F5`.
- Bottom sheets (using `vaul`) for quick actions, drawers, floating primary action button.
- Smooth spring transitions (150–350ms), subtle haptic-like active scale (0.98 on press).
- Never feel frozen: Contextual loading states (skeletons with shimmer), optimistic updates, local Dexie cache.

---

## 3. OFFLINE-FIRST POS
- POS must remain functional even when disconnected from the internet.
- Local cache in IndexedDB via Dexie (products, categories, customers, settings).
- Offline sales stored locally in sync queue with idempotency keys.
- Automatic background sync when connection restores without intrusive blocking dialogs.

---

## 4. ARCHITECTURAL STRUCTURE (`src/features/`)
Gradual modular organization:
- `src/features/sales/` (POS sale view, sales history, sale dialogs)
- `src/features/inventory/` (Quick add product, stock adjustments, catalog)
- `src/features/customers/` (Quick add customer sheet, customer credit)
- `src/features/dashboard/` (Greeting, KPIs, quick actions, attention alerts)
- `src/features/payments/` (HarakaPay waiting, success, failed dialogs/overlays)
- `src/features/sync/` (Offline status listener, sync queue manager)
- `src/features/billing/` (Subscription management)

---

## 5. REPOSITORY CLEANUP & CONTINUITY
- All remnants of "Olly" replaced with "WiseCash" (`WISECASH_NAVIGATION_ITEMS`, etc.).
- Fix `UserPermissionsDialog.tsx` double-toggle bug (clicking label vs checkbox).
- POS is record-only (Cash, M-Pesa, Split, Credit) — USSD push is strictly for subscriptions on `/billing`.
