# Shopkeeper's Assistant — Project Specification (v2.0)

> **Enhanced Edition** — Reviewed, fixed, and upgraded with best-in-class POS/retail features, improved UI/UX patterns, data model additions, and new modules. Pass this file directly to Cursor to apply all changes.

---

## 1. Project Overview

**Shopkeeper's Assistant** (Smart Money) is a **retail management and POS system** for small shops. It covers:

- Point-of-sale (POS) and sales
- Inventory and products
- Customers and suppliers
- Expenses and reporting
- Orders and todos
- HR (staff, attendance, salaries)
- Assets
- User management and role-based access
- Loyalty program (NEW)
- Profit & loss analytics (NEW)
- Stock purchase / receiving (NEW)
- SMS / digital receipt delivery (NEW)
- Bilingual support (English / Swahili)
- Light/dark theme and PWA

**Target users:** Shop owners, managers, cashiers, and staff in a single-shop or multi-user setup.

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| **Build** | Vite 5 |
| **Language** | TypeScript |
| **UI framework** | React 18 |
| **Routing** | React Router 6 |
| **UI components** | shadcn/ui (Radix primitives) |
| **Styling** | Tailwind CSS |
| **State / server state** | TanStack Query (React Query) |
| **Backend / auth / DB** | Supabase (PostgreSQL, Auth, RLS) |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Forms** | React Hook Form + Zod |
| **Toasts** | Sonner |
| **PWA** | vite-plugin-pwa |
| **Date handling** | date-fns |
| **CSV export** | papaparse |
| **PDF/receipt** | react-to-print |

> **Bug fix:** `vite-plugin-pWA` → corrected to `vite-plugin-pwa` (lowercase) in `package.json` and `vite.config.ts`.

---

## 3. UI/UX Design System

### 3.1 Layout

- **App shell:** Sidebar (collapsible) + top Header + main content area.
- **Sidebar:** Navigation grouped into **Operations**, **Management**, **Admin**. Collapses to icon-only on desktop (width: 64px icon mode / 240px expanded). Drawer/Sheet on mobile (full-screen overlay).
- **Header:** Global product search, theme toggle, language toggle, calculator shortcut, notification bell (NEW), user menu, command palette (`Ctrl+K`).
- **Main content:** Breadcrumb trail + page title + action buttons, then content. Consistent `p-4 md:p-6` padding and Framer Motion fade/slide on route change.
- **Floating Action Button (FAB):** On mobile, show a prominent `+` FAB on list pages (Sales, Inventory, Expenses, etc.) for quick "Add" actions without needing the header button.

### 3.2 Theming and Accessibility

- **Theme:** Light / dark via `next-themes` and CSS variables (`--background`, `--foreground`, `--primary`, etc.).
- **Primary accent:** Teal (`#10B981`) with blue-to-teal gradient for primary buttons and active states.
- **System theme detection:** Auto-detect OS theme preference on first visit; store user override in `localStorage`.
- **Responsive:** Mobile-first. Breakpoints: `sm` 640px, `md` 768px, `lg` 1024px. All touch targets ≥ 44×44px.
- **Accessibility (NEW):** All interactive elements must have `aria-label` or visible label. Use `role="status"` for live loading regions. Keyboard navigation must work for all dialogs and dropdowns. Color contrast must meet WCAG AA (4.5:1 for text).
- **Focus ring:** Visible focus ring on all focusable elements (`ring-2 ring-primary ring-offset-2`).
- **Reduced motion:** Respect `prefers-reduced-motion` — wrap all Framer Motion animations in a check and reduce/disable them when true.

### 3.3 Color Tokens (CSS Variables)

Define in `src/index.css` under `:root` and `.dark`:

```css
--background, --foreground
--card, --card-foreground
--primary (#10B981), --primary-foreground
--secondary, --secondary-foreground
--muted, --muted-foreground
--accent, --accent-foreground
--destructive (#EF4444), --destructive-foreground
--border, --input, --ring
--success (#22C55E), --warning (#F59E0B), --info (#3B82F6)
```

### 3.4 Typography

- **Font:** `Inter` (via Google Fonts or local) — clean, neutral, highly legible.
- **Scale:** `text-xs` (12px) for labels/badges, `text-sm` (14px) for table/body, `text-base` (16px) for inputs, `text-lg`/`text-xl` for page titles, `text-2xl`/`text-3xl` for dashboard KPI numbers.
- **Weight:** 400 body, 500 medium labels, 600 semi-bold headings, 700 bold KPIs.

### 3.5 Components (shadcn/ui)

Used across the app:

- **Layout / navigation:** Button, Card, Tabs, Sidebar, Sheet, Dialog, AlertDialog, Breadcrumb, Separator.
- **Forms:** Input, Label, Select, Checkbox, Switch, Textarea, Calendar, Popover, RadioGroup, Combobox (for searchable selects).
- **Data display:** Table, Badge, Avatar, Progress, Skeleton, ScrollArea.
- **Feedback:** Toast (Sonner), Alert, Tooltip, HoverCard.
- **Overlays:** Dialog, AlertDialog, Drawer (Vaul), Popover, Dropdown, ContextMenu.

Custom / domain-specific:

- **Calculator** — floating widget accessible from header and dashboard.
- **CommandPalette** — global Ctrl+K: navigate pages, search products, quick actions (new sale, add expense, etc.).
- **Receipt** — print layout with shop logo, header, items table, totals, footer, QR/barcode, tax.
- **BarcodeGenerator** — generate and download EAN/Code128.
- **BarcodeScanner** — camera-based scan using `quagga2` or `zxing-js/browser`.
- **ImageUpload** — drag-and-drop or click, preview, compress before upload to Supabase Storage.
- **KPICard** — reusable stat card: icon, label, value, trend arrow + percentage vs prior period.
- **EmptyState** — centered illustration + message + CTA button; used on all empty list views.
- **DataTable** — reusable table component with built-in search, column sort, pagination, and row actions.
- **NotificationPanel** — slide-in panel from header bell; list of unread notifications with mark-all-read.
- **PrintButton** — wraps `react-to-print`; renders print-only layout.

### 3.6 Interaction Patterns

- **Lists:** `DataTable` component with search, filter chips, column sort, pagination (10/25/50 per page), row hover actions (edit, delete, view), and bulk-select for bulk delete.
- **Create/Edit:** Dialog for small forms (≤ 6 fields). Full page for complex forms (e.g. POS terminal, Add Product). Never mix both on the same entity.
- **Delete confirmation:** Always `AlertDialog` with the item name shown in the message body.
- **Empty states:** Illustration + short message + primary CTA (e.g. "No products yet — Add your first product").
- **Loading:** `Skeleton` for initial page load; `Loader2` spinner inside buttons while submitting; `Progress` bar for file uploads.
- **Offline:** Persistent banner (yellow) at top of page when `navigator.onLine === false`. Message: "You're offline. Some features are limited. Data will sync when reconnected."
- **Form validation:** Zod schemas; inline error messages under each field; toast on success.
- **Optimistic updates:** For toggle/quick actions (e.g. mark todo done, mark notification read) use TanStack Query `onMutate` optimistic update + rollback on error.

### 3.7 Page Layout Template

Every protected page follows this structure:

```
<PageWrapper>                        // max-w, horizontal padding
  <PageHeader>                       // Breadcrumb + Title + Action buttons
  <StatsRow>                         // optional: 2–4 KPICards
  <FiltersRow>                       // Search input + filter dropdowns + date range
  <DataTable or Content>             // main content
</PageWrapper>
```

### 3.8 Language (i18n)

- **Languages:** English (`en`) and Swahili (`sw`).
- **Context:** `LanguageContext` with `language` and `t(key)` function.
- **Keys:** Namespaced (e.g. `nav.dashboard`, `expenses.title`, `common.save`, `common.cancel`, `common.delete`, `common.edit`, `common.add`, `common.search`, `common.filter`, `common.export`).
- **Storage:** User language preference persisted in `localStorage` and synced to `profiles.language`.
- **Coverage:** Every user-facing string must use `t()` — no hardcoded English in JSX.

---

## 4. Application Structure (Routes and Pages)

### 4.1 Public (no auth)

| Route | Page | Purpose |
|-------|------|---------|
| `/` | LandingPage | Hero, Features, Pricing, Testimonials, FAQ, CTA, Footer |
| `/login` | LoginPage | Email/password login with "Remember me" |
| `/signup` | SignupPage | Shop owner signup (creates shop + profile) |
| `/auth` | Auth | OAuth/callback handler |
| `/forgot-password` | ForgotPassword | Send password reset email |
| `/reset-password` | ResetPassword | Set new password (from email link) |

### 4.2 Protected (auth required, inside MainLayout)

| Route | Page | Purpose |
|-------|------|---------|
| `/dashboard` | Dashboard | KPIs, charts, quick stats, calculator widget, shortcuts, notifications |
| `/sales` | Sales | Sales list, filters, receipt view, void/refund |
| `/sales/terminal` | POSTerminal | POS: cart, product search/scan, payment, print/send receipt |
| `/inventory` | Inventory | Product list, search/filter, stock status, edit/delete, export CSV |
| `/inventory/add` | AddProduct | Add/edit product form |
| `/inventory/receive` | ReceiveStock | Record stock received from supplier (NEW) |
| `/categories` | Categories | Product categories CRUD |
| `/orders` | Orders | Order list, status pipeline, create/edit |
| `/todo` | Todo | Task list with priority and due date |
| `/customers` | Customers | Customer list, CRUD, credit balance, purchase history |
| `/customers/:id` | CustomerDetail | Full customer profile + transaction history (NEW) |
| `/suppliers` | Suppliers | Supplier list, CRUD, payment tracking |
| `/suppliers/:id` | SupplierDetail | Supplier profile + orders + payment history (NEW) |
| `/expenses` | Expenses | Expense list, add/edit/delete, category breakdown, export |
| `/hrm` | HRM | Tabs: Staff, Attendance, Salaries |
| `/reports` | Reports | Tabs: Sales, Expenses, Profit & Loss, Inventory, Staff |
| `/loyalty` | Loyalty | Customer loyalty program — points, tiers, redemptions (NEW) |
| `/user-management` | UserManagement | Users list, add, edit, remove, page access, password reset |
| `/assets` | Assets | Fixed assets, depreciation tracking |
| `/settings` | Settings | Tabs: Shop, Receipt, Notifications, Integrations, Danger Zone |
| `/notifications` | Notifications | Full notifications list (NEW) |

### 4.3 Other

| Route | Page | Purpose |
|-------|------|---------|
| `*` | NotFound | 404 with link back to dashboard |

### 4.4 Navigation Groups (Sidebar)

**Operations**
- Dashboard
- Sales (badge: today's sale count)
- POS Terminal (prominent button style)
- Inventory (badge: low-stock count if > 0)
- Categories
- Orders (badge: pending count)
- Todo (badge: incomplete count)

**Management**
- Customers
- Suppliers
- Expenses
- HRM
- Reports
- Loyalty (NEW)

**Admin**
- User Management
- Assets
- Settings

> Sidebar badges must update reactively using TanStack Query data (no polling — use Supabase realtime subscriptions for live counts).

---

## 5. Features (by Area)

### 5.1 Auth and Users

- **Supabase Auth:** Email/password. Optional Google OAuth (if configured in Supabase dashboard).
- **Remember me:** Persist session if checked; otherwise session-only.
- **Post-signup trigger:** Creates `shops`, `profiles`, and `user_roles` for the new owner automatically via Supabase DB trigger.
- **Invited users:** Metadata `invited_to_shop_id` + `invited_role` links them to existing shop on signup.
- **Session:** `AuthContext` exposes `user`, `profile`, `shop`, `role`, `logout()`, `isOwner`, `isManager`, `isCashier`.
- **Protected routes:** `<ProtectedRoute>` wrapper redirects unauthenticated users to `/login` and unauthorized roles to a "Not allowed" page.

**Bug fix:** The `forgot-password` and `reset-password` routes are missing from the current spec and codebase. Add them as public routes. `ForgotPasswordPage` calls `supabase.auth.resetPasswordForEmail(email, { redirectTo })`. `ResetPasswordPage` calls `supabase.auth.updateUser({ password: newPassword })` after reading the session from the URL hash.

### 5.2 User Management (Admin)

- **List:** Table with avatar, name, email, role badge, status (active/invited), date added.
- **Add user:** Dialog — email, full name, password (auto-generate toggle), role. Calls `supabase.auth.admin.createUser` (server-side via Supabase Edge Function to avoid exposing service key). Restores admin session afterward.
- **View details:** Drawer (not dialog — more space) with avatar, name, email, phone, role, last login, page access summary.
- **Edit user:** Dialog — name, email, phone, role. Updates `profiles` + `user_roles`.
- **Remove user:** `AlertDialog` confirm → delete from `user_roles` and `profiles` for this shop. Show user name in confirmation text.
- **Page access:** Checkboxes per route group (Operations, Management, Admin); stored in `user_page_access`.
- **Password reset:** Button calls `supabase.auth.resetPasswordForEmail(email)` + success toast.
- **Activity log (NEW):** Show last 10 actions by this user (sales created, products edited, etc.) using `audit_log` table.

### 5.3 Dashboard

**KPI Cards (row of 4):**
- Today's Revenue (vs yesterday — trend arrow)
- Today's Transactions count
- Low Stock Items (red if > 0)
- Pending Orders

**Charts:**
- Sales trend — line chart, last 7 or 30 days (toggle)
- Revenue vs Expenses — bar chart, current month by week
- Top 5 selling products — horizontal bar chart
- Sales by payment method — donut chart (Cash, M-Pesa, Credit, etc.)

**Widgets:**
- Calculator (collapsible)
- Quick actions: New Sale, Add Product, Add Expense, Add Customer
- Recent sales — last 5 rows with customer name, total, time
- Stock alerts — list of products below low-stock threshold with restock link
- Todo summary — count of today's tasks with quick add

**Bug fix (NEW):** Dashboard currently loads all data at once causing slow initial render. Fix: use `Suspense` + `lazy` for each chart section. Each widget uses its own `useQuery` with independent loading state and `Skeleton` placeholder.

### 5.4 Sales and POS

**Sales list:**
- Table: Invoice #, Customer, Items count, Payment method, Total, Status badge, Date.
- Filters: Date range, payment method, status (completed/draft/cancelled/refunded).
- Search: Invoice number or customer name.
- Row actions: View receipt, Print, Void/Refund (owner/manager only), Download PDF.
- Export: CSV export of filtered results.

**Void/Refund (NEW):**
- Mark sale as `cancelled` or `refunded`.
- Refunded sales automatically restore stock quantities.
- Refund reason is required (text field).
- Only roles: owner, manager.

**POS Terminal:**
- Product search (name, code, barcode) — real-time as you type.
- Barcode scan via camera or USB scanner (keyboard wedge input in a hidden field).
- Cart: product name, qty (stepper), unit price, line total. Tap row to edit qty or remove.
- Cart persists in `localStorage` as draft (survives page refresh).
- Discount: per item (amount or %) and/or cart-level (amount or %).
- Customer selection (Combobox — search existing or add new inline).
- Payment methods: Cash, M-Pesa, Card, Credit (to customer account). M-Pesa shows reference code field.
- Cash tendered field with change calculation displayed prominently.
- Hold sale: save as draft, resume later.
- On-screen numpad for touch-first devices.
- Complete sale: generates `INV-YYYYMMDD-XXXX` invoice number, saves to DB, decrements stock, awards loyalty points (if loyalty enabled).
- Print receipt: browser print of `<Receipt>` component.
- Send digital receipt: SMS or email (via Supabase Edge Function calling an SMS API or Resend for email) — NEW.
- Receipt: shop logo, name, address, phone, invoice #, date, cashier name, items table (name, qty, price, total), subtotal, discount, tax, grand total, payment method, change given, receipt header/footer from settings.

**Bug fix:** Currently invoice numbers may collide under concurrent inserts. Fix: use a Supabase sequence (`invoice_seq`) and a DB function `generate_invoice_number()` called inside the `INSERT` trigger instead of generating in the frontend.

### 5.5 Inventory and Products

**Products:**
- Fields: code (auto or manual), name, name_sw, barcode (EAN13/Code128), category, buying price, selling price, stock quantity, low-stock alert threshold, unit type (pcs/kg/g/ltr/ml/box), images (up to 3), notes.
- **Profit margin** displayed on product card/row: `((selling - buying) / buying * 100)%` — NEW.
- **Stock value** column: `stock × buying_price` — NEW.

**Inventory page:**
- Search by name, code, barcode.
- Filter by category, stock status (in stock / low stock / out of stock).
- Sort by name, stock, price, profit margin.
- Table columns: Image thumbnail, Code, Name, Category, Buying price, Selling price, Profit %, Stock, Status badge, Actions.
- **Quick stock edit:** Click stock number inline to edit without opening full form — NEW.
- Bulk actions: Delete selected, Export selected.
- Export CSV button — exports all (or filtered) products.
- **Low stock alert:** Products below threshold highlighted in amber; out-of-stock highlighted in red.

**Add/Edit Product page:**
- Multi-section form: Basic Info, Pricing, Stock, Images.
- Barcode field: scan or manually enter; show barcode preview and Generate button.
- Category: dropdown with "Add new category" inline.
- Buying/Selling price: show live profit margin and amount as you type.

**Receive Stock (NEW) — `/inventory/receive`:**
- Select supplier (or "No supplier").
- Add products with quantity received and buying price (can differ from stored buying price).
- Notes field (e.g. invoice/delivery note number).
- On save: increments `products.stock`, creates `stock_history` record (reason: "Stock received"), optionally updates `buying_price` if changed, creates `supplier_purchase` record.
- This flow replaces manual stock editing for restocking.

**Stock History tab (NEW):**
- Per product: timeline of stock changes (sales, receives, adjustments) with reason and quantity.
- Accessible from product detail / edit page.

**Categories:**
- CRUD: name (EN), name_sw (SW).
- Show product count per category.
- Prevent deletion of categories that have products (show warning).

### 5.6 Customers and Suppliers

**Customers:**
- Fields: name, phone, email (NEW), address (NEW), type (retail/wholesale), credit limit (NEW), credit balance, loyalty points, notes.
- List: search by name/phone, filter by type, sort by credit balance.
- **Customer detail page (`/customers/:id`):** Profile card, credit balance, loyalty points, purchase history table (last 20 sales), total spent, total credit repayments.
- **Credit repayment (NEW):** Button in customer detail to record credit payment (amount, date, notes) → reduces `credit_balance`.
- **Credit limit enforcement:** POS should warn (not block, unless configured) when customer credit would exceed limit.

**Suppliers:**
- Fields: name, contact person, phone, email, address, notes, pending payment.
- **Supplier detail page (`/suppliers/:id`):** Profile, purchases history (from `stock_received`), payment history, total owed.
- **Payment recording:** Button to record payment to supplier → creates `supplier_payment` record, reduces pending balance.
- Payment methods: Cash, Bank Transfer, M-Pesa.

### 5.7 Expenses

- **List:** Date, description, category, amount, payment method; search by description; filter by category and date range.
- **Add expense:** Dialog — date (default today), description, category (combobox — existing categories or type new), amount, payment method (Cash/M-Pesa/Bank), notes, receipt image upload (NEW).
- **Edit/Delete:** Inline row actions with confirmation.
- **Stats row:** Total this month, top category, vs last month (trend).
- **Category breakdown:** Doughnut chart + list with amounts and percentages.
- **Export CSV** of filtered expenses.
- **Recurring expenses (NEW):** Mark an expense as recurring (daily/weekly/monthly). A Supabase scheduled job (pg_cron) or a manual "Apply recurring" button creates the next expense automatically.

### 5.8 Orders

- **List:** Status pipeline view (Pending → Confirmed → In Progress → Ready → Completed / Cancelled). Kanban-style cards OR table with status filter.
- **Create/Edit:** Select customer or supplier, add order items (product, qty, price), set expected date, status, notes.
- **Order notes:** Per-order timestamped notes thread.
- **Link to sale:** When order is completed, "Convert to Sale" button opens POS terminal pre-filled with order items — NEW.

### 5.9 Reports

**Date range selector:** Today, Yesterday, This Week, Last Week, This Month, Last Month, Custom (date picker). Default: This Month.

**Tabs:**

1. **Sales Report**
   - Total revenue, total transactions, average transaction value, total items sold.
   - Line chart: revenue over time.
   - Table: sales grouped by day with totals.
   - Top products table: name, qty sold, revenue.
   - Sales by payment method: pie chart + table.

2. **Expenses Report**
   - Total expenses, breakdown by category.
   - Bar chart: expenses by category.
   - Table: all expenses in range.

3. **Profit & Loss (NEW)**
   - Gross Revenue − Cost of Goods Sold (COGS, from buying prices) = Gross Profit.
   - Gross Profit − Expenses = Net Profit.
   - Net Profit Margin %.
   - Monthly P&L bar chart (revenue vs expenses vs net profit).
   - COGS calculated from `sale_items.quantity × product.buying_price` at time of sale.

   > **Bug fix / data model:** Store `buying_price_at_sale` in `sale_items` so P&L is historically accurate even if buying price changes later.

4. **Inventory Report (NEW)**
   - Total stock value (sum of `stock × buying_price`).
   - Total retail value (sum of `stock × selling_price`).
   - Potential profit (retail value − stock value).
   - Low stock and out-of-stock lists.
   - Category breakdown of stock value.

5. **Staff Report (NEW)**
   - Attendance summary per staff: present days, absent days, late days.
   - Salary payments summary for the period.

**Export:** Each report tab has "Export CSV" and "Print" buttons.

### 5.10 Loyalty Program (NEW) — `/loyalty`

- **Earn points:** Configured points per currency unit spent (e.g. 1 point per 100 TZS). Set in Settings.
- **Tiers (optional):** Bronze / Silver / Gold based on total points. Each tier may have a discount %.
- **Redeem:** At POS, if customer has points, show "Redeem points" toggle. Points convert to discount (configurable rate).
- **Management page:**
  - Overview: total active members, points issued this month, redemptions this month.
  - Customer table: name, phone, points balance, tier, total spent.
  - Adjust points: manually add or deduct points with reason.
  - Settings: points per unit, redemption rate, tiers config.

**Data model additions:** `loyalty_transactions` table — customer_id, type (earn/redeem/adjust), points, reference_id (sale_id or null), note, created_at.

### 5.11 HRM

**Tabs: Staff | Attendance | Salaries**

**Staff:**
- CRUD: name, role/position, phone, email, address, ID number, date hired, notes.
- Status: Active / Inactive.

**Attendance:**
- Date picker to select date.
- Table: each staff row with Check In time, Check Out time, Status (Present/Absent/Late/Half Day), notes.
- Bulk mark all present button.
- Monthly attendance calendar view per staff (NEW) — colored grid, click day to edit.

**Salaries:**
- List: staff, month/year, base salary, deductions, bonuses, net, payment date, payment method, notes.
- Add payment dialog with above fields.
- Summary: total payroll this month, breakdown by staff.

### 5.12 Assets

- Fields: name, category, purchase date, purchase price, depreciation rate (% per year), current value (auto-calculated = purchase price × (1 - rate)^years), location, condition (Good/Fair/Poor/Disposed), notes, image.
- **Auto-calculate current value** based on purchase date and depreciation rate — displayed in table and recalculated on view.
- **Condition filter** and sort by current value.
- Export CSV.

### 5.13 Settings

**Tabs: Shop | Receipt | Notifications | Danger Zone**

**Shop tab:**
- Name, phone, email, address, logo (ImageUpload → Supabase Storage).
- Tax rate (%), currency (dropdown: TZS, KES, USD, etc.), currency symbol position.
- Financial year start month.

**Receipt tab:**
- Receipt header (rich text or plain), footer, show/hide: logo, tax line, cashier name, barcode, shop phone.
- Receipt width: 58mm / 80mm.
- Preview panel: live receipt preview as you edit settings.

**Notifications tab (NEW):**
- Toggle: low stock alert (when stock < threshold).
- Toggle: daily sales summary (end of day notification).
- Toggle: new order created.
- Notification delivery: in-app only (always), email (if configured).

**Danger Zone tab:**
- Export all data (JSON).
- Delete all sales (requires typed confirmation).

### 5.14 Notifications (NEW)

- **In-app notifications:** Bell icon in header with unread count badge.
- **NotificationPanel:** Slide-in from right. Lists notifications: icon, message, timestamp, read/unread state.
- **Types:** Low stock alert, daily summary, new order, user added, sale voided.
- **Mark as read:** Click notification or "Mark all read" button.
- **Full list page:** `/notifications` — paginated list with filter by type.
- **Data model:** `notifications` table — id, shop_id, user_id (null = all users in shop), type, message, read, created_at.
- **Realtime:** Subscribe to `notifications` via Supabase Realtime for live bell badge updates.

### 5.15 Global UX

- **Header search:** Searches products (name/code/barcode) → navigates to `/inventory?search=...`. Also searches customers and shows quick results in dropdown.
- **Command palette (`Ctrl+K`):** Navigate to any page, create new sale, add product, add expense, add customer, toggle theme, toggle language.
- **Offline banner:** Fixed top bar (yellow) when `navigator.onLine === false`.
- **Session expiry:** When Supabase token expires, show a modal "Session expired. Please log in again." — not a silent redirect.
- **Error boundaries:** Wrap each page in a React `ErrorBoundary` that shows a "Something went wrong" card with a retry button instead of crashing the whole app.

---

## 6. Data Model (Supabase / PostgreSQL)

All tenant-scoped tables use `shop_id` with RLS: `USING (shop_id = get_user_shop_id(auth.uid()))`.

### 6.1 Core and Auth

```sql
shops (
  id uuid PK,
  name text NOT NULL,
  phone text,
  email text,
  address text,
  logo_url text,
  tax_rate numeric DEFAULT 0,
  currency text DEFAULT 'TZS',
  currency_symbol text DEFAULT 'TSh',
  receipt_header text,
  receipt_footer text,
  receipt_width text DEFAULT '80mm',
  loyalty_enabled boolean DEFAULT false,
  loyalty_points_per_unit numeric DEFAULT 1,
  loyalty_redemption_rate numeric DEFAULT 1,
  financial_year_start_month integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

profiles (
  id uuid PK DEFAULT gen_random_uuid(),
  user_id uuid FK auth.users UNIQUE,
  shop_id uuid FK shops,
  full_name text,
  phone text,
  avatar_url text,
  language text DEFAULT 'en',
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

user_roles (
  id uuid PK,
  user_id uuid FK auth.users,
  shop_id uuid FK shops,
  role text CHECK (role IN ('owner','manager','cashier','staff','hr')),
  UNIQUE (user_id, shop_id)
)

user_page_access (
  user_id uuid FK auth.users,
  shop_id uuid FK shops,
  path text,
  PRIMARY KEY (user_id, shop_id, path)
)

audit_log (                    -- NEW
  id uuid PK DEFAULT gen_random_uuid(),
  shop_id uuid FK shops,
  user_id uuid,
  action text,                 -- e.g. 'sale.created', 'product.edited'
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
)
```

### 6.2 Catalog and Inventory

```sql
categories (
  id uuid PK DEFAULT gen_random_uuid(),
  shop_id uuid FK shops,
  name text NOT NULL,
  name_sw text
)

products (
  id uuid PK DEFAULT gen_random_uuid(),
  shop_id uuid FK shops,
  code text,
  name text NOT NULL,
  name_sw text,
  barcode text,
  category_id uuid FK categories,
  buying_price numeric NOT NULL DEFAULT 0,
  selling_price numeric NOT NULL DEFAULT 0,
  stock numeric NOT NULL DEFAULT 0,
  low_stock_alert numeric DEFAULT 5,
  unit_type text DEFAULT 'pcs',
  images jsonb DEFAULT '[]',   -- array of storage URLs
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

stock_history (
  id uuid PK DEFAULT gen_random_uuid(),
  shop_id uuid FK shops,
  product_id uuid FK products,
  quantity_change numeric NOT NULL,  -- positive = in, negative = out
  reason text,                       -- 'sale', 'receive', 'adjustment', 'refund'
  reference_id uuid,                 -- sale_id or stock_received_id
  notes text,
  created_at timestamptz DEFAULT now()
)

stock_received (                     -- NEW (was missing)
  id uuid PK DEFAULT gen_random_uuid(),
  shop_id uuid FK shops,
  supplier_id uuid FK suppliers,
  received_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
)

stock_received_items (              -- NEW
  id uuid PK DEFAULT gen_random_uuid(),
  stock_received_id uuid FK stock_received,
  product_id uuid FK products,
  quantity numeric NOT NULL,
  buying_price numeric NOT NULL
)
```

### 6.3 Sales

```sql
-- Sequence for invoice numbers (bug fix)
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1;

sales (
  id uuid PK DEFAULT gen_random_uuid(),
  shop_id uuid FK shops,
  invoice_number text UNIQUE NOT NULL,  -- generated by DB trigger
  customer_id uuid FK customers,
  customer_name text,
  cashier_id uuid FK auth.users,        -- NEW: who processed the sale
  payment_method text,
  mpesa_code text,
  status text DEFAULT 'completed' CHECK (status IN ('draft','completed','cancelled','refunded')),
  subtotal numeric NOT NULL DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  discount_percent numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,         -- NEW: stored tax so historical reports are accurate
  total numeric NOT NULL DEFAULT 0,
  loyalty_points_earned integer DEFAULT 0,  -- NEW
  loyalty_points_redeemed integer DEFAULT 0, -- NEW
  refund_reason text,                   -- NEW
  created_at timestamptz DEFAULT now()
)

sale_items (
  id uuid PK DEFAULT gen_random_uuid(),
  sale_id uuid FK sales,
  product_id uuid FK products,
  product_name text NOT NULL,
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  buying_price_at_sale numeric NOT NULL DEFAULT 0,  -- BUG FIX: store for P&L
  discount_amount numeric DEFAULT 0,
  total numeric NOT NULL
)
```

### 6.4 Orders

```sql
orders (
  id uuid PK DEFAULT gen_random_uuid(),
  shop_id uuid FK shops,
  order_number text UNIQUE,
  customer_id uuid FK customers,
  supplier_id uuid FK suppliers,
  status text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','in_progress','ready','completed','cancelled')),
  expected_date date,
  total numeric DEFAULT 0,
  notes text,
  created_by uuid FK auth.users,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

order_items (
  id uuid PK DEFAULT gen_random_uuid(),
  order_id uuid FK orders,
  product_id uuid FK products,
  product_name text,
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  total numeric NOT NULL
)

order_notes (
  id uuid PK DEFAULT gen_random_uuid(),
  order_id uuid FK orders,
  user_id uuid FK auth.users,
  note text NOT NULL,
  created_at timestamptz DEFAULT now()
)
```

### 6.5 Customers and Suppliers

```sql
customers (
  id uuid PK DEFAULT gen_random_uuid(),
  shop_id uuid FK shops,
  name text NOT NULL,
  phone text,
  email text,                    -- NEW
  address text,                  -- NEW
  customer_type text DEFAULT 'retail' CHECK (customer_type IN ('retail','wholesale')),
  credit_balance numeric DEFAULT 0,
  credit_limit numeric DEFAULT 0, -- NEW
  loyalty_points integer DEFAULT 0, -- NEW
  notes text,
  created_at timestamptz DEFAULT now()
)

credit_repayments (              -- NEW
  id uuid PK DEFAULT gen_random_uuid(),
  shop_id uuid FK shops,
  customer_id uuid FK customers,
  amount numeric NOT NULL,
  payment_method text,
  notes text,
  created_at timestamptz DEFAULT now()
)

suppliers (
  id uuid PK DEFAULT gen_random_uuid(),
  shop_id uuid FK shops,
  name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  address text,
  pending_payment numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
)

supplier_payments (              -- NEW (was implied but not defined)
  id uuid PK DEFAULT gen_random_uuid(),
  shop_id uuid FK shops,
  supplier_id uuid FK suppliers,
  amount numeric NOT NULL,
  payment_method text,
  notes text,
  paid_at timestamptz DEFAULT now()
)
```

### 6.6 Expenses

```sql
expense_categories (
  id uuid PK DEFAULT gen_random_uuid(),
  shop_id uuid FK shops,
  name text NOT NULL,
  name_sw text
)

expenses (
  id uuid PK DEFAULT gen_random_uuid(),
  shop_id uuid FK shops,
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  category text,
  amount numeric NOT NULL,
  payment_method text,
  receipt_url text,               -- NEW: uploaded receipt image
  is_recurring boolean DEFAULT false, -- NEW
  recurring_frequency text,       -- 'daily','weekly','monthly'
  notes text,
  created_at timestamptz DEFAULT now()
)
```

### 6.7 HR and Assets

```sql
staff (
  id uuid PK DEFAULT gen_random_uuid(),
  shop_id uuid FK shops,
  name text NOT NULL,
  position text,
  phone text,
  email text,
  address text,
  id_number text,
  date_hired date,
  base_salary numeric DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active','inactive')),
  notes text,
  created_at timestamptz DEFAULT now()
)

attendance (
  id uuid PK DEFAULT gen_random_uuid(),
  shop_id uuid FK shops,
  staff_id uuid FK staff,
  date date NOT NULL,
  check_in time,
  check_out time,
  status text DEFAULT 'present' CHECK (status IN ('present','absent','late','half_day')),
  notes text,
  UNIQUE (shop_id, staff_id, date)
)

salary_payments (
  id uuid PK DEFAULT gen_random_uuid(),
  shop_id uuid FK shops,
  staff_id uuid FK staff,
  month integer NOT NULL,
  year integer NOT NULL,
  base_salary numeric NOT NULL,
  bonuses numeric DEFAULT 0,
  deductions numeric DEFAULT 0,
  net_salary numeric GENERATED ALWAYS AS (base_salary + bonuses - deductions) STORED,
  payment_method text,
  payment_date date,
  notes text,
  created_at timestamptz DEFAULT now()
)

assets (
  id uuid PK DEFAULT gen_random_uuid(),
  shop_id uuid FK shops,
  name text NOT NULL,
  category text,
  purchase_date date,
  purchase_price numeric NOT NULL DEFAULT 0,
  depreciation_rate numeric DEFAULT 0,
  location text,
  condition text DEFAULT 'good' CHECK (condition IN ('good','fair','poor','disposed')),
  image_url text,
  notes text,
  created_at timestamptz DEFAULT now()
)
```

### 6.8 Loyalty and Notifications

```sql
loyalty_transactions (           -- NEW
  id uuid PK DEFAULT gen_random_uuid(),
  shop_id uuid FK shops,
  customer_id uuid FK customers,
  type text CHECK (type IN ('earn','redeem','adjust')),
  points integer NOT NULL,
  reference_id uuid,             -- sale_id or null
  note text,
  created_at timestamptz DEFAULT now()
)

notifications (
  id uuid PK DEFAULT gen_random_uuid(),
  shop_id uuid FK shops,
  user_id uuid,                  -- null = all users in shop
  type text,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
)

todos (
  id uuid PK DEFAULT gen_random_uuid(),
  shop_id uuid FK shops,
  created_by uuid FK auth.users,
  title text NOT NULL,
  description text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  due_date date,                 -- NEW
  done boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
)
```

---

## 7. Architecture and Code Organization

### 7.1 Folder Structure

```
src/
  App.tsx                   # Routes, providers (Query, Auth, Language, Theme)
  main.tsx
  index.css                 # CSS variables, base styles
  contexts/
    AuthContext.tsx
    LanguageContext.tsx
    ThemeContext.tsx
    SidebarContext.tsx
    NotificationContext.tsx  # NEW: unread count, real-time subscription
  hooks/
    useShopUsers.ts
    useExpenses.ts
    useOrders.ts
    useProducts.ts
    useUserPageAccess.ts
    useDraftForm.ts          # persist form draft in localStorage
    useSales.ts
    useCustomers.ts
    useSuppliers.ts
    useStaff.ts
    useAttendance.ts
    useSalaries.ts
    useAssets.ts
    useNotifications.ts      # NEW
    useLoyalty.ts            # NEW
    useStockHistory.ts       # NEW
    useReports.ts            # NEW: P&L, inventory value calculations
  integrations/
    supabase/
      client.ts
      types.ts               # generated types
  components/
    layout/
      MainLayout.tsx
      Header.tsx
      Sidebar.tsx
      SidebarNavItem.tsx
      NotificationPanel.tsx  # NEW
    ui/                      # shadcn components (do not edit)
    common/
      DataTable.tsx           # NEW: reusable table with search/sort/pagination
      KPICard.tsx             # NEW: stat card with trend
      EmptyState.tsx          # NEW: illustration + message + CTA
      PageHeader.tsx          # NEW: breadcrumb + title + actions
      BarcodeScanner.tsx
      BarcodeGenerator.tsx
      ImageUpload.tsx
      Calculator.tsx
      CommandPalette.tsx
      Receipt.tsx
      ReceiptPrint.tsx        # NEW: print-optimized layout wrapper
      ErrorBoundary.tsx       # NEW
      ConfirmDialog.tsx       # NEW: reusable delete/action confirm
    landing/
      Hero.tsx
      Features.tsx
      Pricing.tsx
      Testimonials.tsx        # NEW
      FAQ.tsx                 # NEW
      Navbar.tsx
      Footer.tsx
  pages/
    Dashboard.tsx
    Sales.tsx
    POSTerminal.tsx
    Inventory.tsx
    AddProduct.tsx
    ReceiveStock.tsx          # NEW
    Categories.tsx
    Orders.tsx
    Todo.tsx
    Customers.tsx
    CustomerDetail.tsx        # NEW
    Suppliers.tsx
    SupplierDetail.tsx        # NEW
    Expenses.tsx
    HRM.tsx
    Reports.tsx
    Loyalty.tsx               # NEW
    UserManagement.tsx
    Assets.tsx
    Settings.tsx
    Notifications.tsx         # NEW
    ForgotPassword.tsx        # NEW
    ResetPassword.tsx         # NEW
    NotFound.tsx
    LandingPage.tsx
    LoginPage.tsx
    SignupPage.tsx
    Auth.tsx
  lib/
    utils.ts                  # cn(), formatCurrency(), formatDate(), calcMargin()
    constants.ts              # roles, payment methods, unit types, etc.
    schemas.ts                # Zod schemas for all forms
    reportHelpers.ts          # NEW: P&L calculations, COGS, report aggregations
```

### 7.2 Data Fetching and State

- **Server state:** TanStack Query with keys like `["products", shopId]`, `["expenses", shopId, filters]`.
- **Cache invalidation:** On every mutation, invalidate the relevant query key and related keys (e.g. after sale, invalidate `["products"]` for stock update, `["sales"]`, `["dashboard-stats"]`).
- **Supabase Realtime:** Subscribe to `notifications` and badge-count queries. Unsubscribe on cleanup.
- **Optimistic updates:** For toggles and quick actions.
- **Local state:** `useState` for modals, selected rows, form drafts.
- **Draft persistence:** POS cart stored in `localStorage`; expense draft in `useDraftForm`.

### 7.3 Auth Flow

1. User signs in → Supabase Auth sets session.
2. `AuthContext` listens to `onAuthStateChange`, loads `profile` and `shop` from DB.
3. `<ProtectedRoute>` checks `isAuthenticated`; page-access checked for per-user restrictions.
4. On logout: `supabase.auth.signOut()` → clear context → redirect to `/`.
5. Session token expiry: `onAuthStateChange` fires with `SIGNED_OUT` → show session-expired modal.

### 7.4 Performance

- Route-level code splitting with `React.lazy` + `Suspense` for all page components.
- Images: compress on upload client-side before storing. Use Supabase Storage image transformations for thumbnails.
- Heavy charts: render only when tab is active; use `IntersectionObserver` to defer off-screen charts.
- TanStack Query `staleTime: 5 * 60 * 1000` (5 min) for rarely-changing data (products, categories, staff). `staleTime: 0` for real-time data (sales, notifications).

### 7.5 PWA

- `vite-plugin-pwa` with Workbox.
- Cache strategy: network-first for API calls, cache-first for static assets.
- Manifest: name "Shopkeeper's Assistant", short name "Smart Money", icons at 192×192 and 512×512, theme color `#10B981`, background color `#ffffff`.
- Offline fallback page for uncached routes.

---

## 8. Known Bugs to Fix

| # | Bug | Fix |
|---|-----|-----|
| 1 | `vite-plugin-pWA` casing in `package.json` | Change to `vite-plugin-pwa` |
| 2 | Invoice number collisions on concurrent inserts | Use DB sequence + trigger instead of frontend generation |
| 3 | `buying_price_at_sale` missing from `sale_items` | Add column and populate on insert; required for P&L |
| 4 | No `forgot-password` / `reset-password` routes | Add pages and routes |
| 5 | Dashboard loads all widgets at once (slow) | Wrap each widget in Suspense with Skeleton fallback |
| 6 | No `ErrorBoundary` — one crash kills whole app | Add `<ErrorBoundary>` wrapper per page |
| 7 | Category delete allowed even with products | Add FK constraint + UI warning |
| 8 | `net-themes` referenced as theme library | The spec mentions `next-themes` — confirm it's installed; if not, use `class` strategy with custom `ThemeContext` |
| 9 | Credit balance can go negative without limit check | Add `credit_limit` field + POS warning |
| 10 | Supplier payments table not defined | Add `supplier_payments` table (see data model) |
| 11 | `stock_received` table not defined | Add `stock_received` and `stock_received_items` tables |
| 12 | User-facing strings may be hardcoded | Audit all JSX for hardcoded English strings; wrap in `t()` |
| 13 | No `cashier_id` on sales | Add to `sales` table so reports can break down by cashier |
| 14 | Tax amount not stored on sale | Add `tax_amount` column so historical reports show correct tax |

---

## 9. UI/UX Improvements Summary

| Area | Improvement |
|------|-------------|
| Dashboard | Real KPI cards with trend vs prior period; charts; recent activity feed |
| POS | Hold sale, on-screen numpad, send digital receipt, loyalty points integration |
| Inventory | Profit margin column, stock value, quick inline stock edit, bulk actions |
| Customers | Full detail page, credit repayment flow, purchase history |
| Suppliers | Detail page, payment recording, purchase history |
| Reports | Profit & Loss tab, Inventory value report, Staff report, CSV export on all tabs |
| Expenses | Receipt image upload, recurring expenses |
| Orders | Kanban status view, "Convert to Sale" button |
| Todo | Priority field, due date, overdue highlighting |
| Settings | Receipt live preview, notification preferences |
| Navigation | Sidebar badges (counts), FAB on mobile list pages |
| Global | Notification center, session-expiry modal, per-page error boundaries |
| Accessibility | ARIA labels, keyboard nav, WCAG AA contrast, reduced-motion support |
| Performance | Code splitting, optimistic updates, selective stale times |

---

## 10. How to Build / Extend

### 10.1 Setup

1. Vite + React + TypeScript → add Tailwind, shadcn/ui, Framer Motion, Recharts, Lucide.
2. Create Supabase project; run migrations in order; enable RLS.
3. Configure Supabase Auth (email/password + optional Google OAuth); set redirect URLs.
4. Copy `.env.example` → `.env`; set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. `npm run dev`.

### 10.2 Adding a New Module

1. Create DB table(s) with RLS.
2. Create `src/hooks/useMyModule.ts` with TanStack Query hooks.
3. Create `src/pages/MyModule.tsx` using `PageHeader`, `DataTable`, and Dialog patterns.
4. Add route in `App.tsx` inside `<ProtectedRoute>`.
5. Add nav item in `Sidebar.tsx` under appropriate group.
6. Add translation keys in `LanguageContext`.
7. Add to `user_page_access` path list in User Management.

### 10.3 Deployment

- Build: `npm run build` → `dist/`.
- Deploy `dist/` to Vercel / Netlify / Cloudflare Pages.
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in the hosting platform.
- Add your app domain to Supabase Auth → URL Configuration → Redirect URLs.

### 10.4 Customization

- **Branding:** Change `--primary` in `index.css`; update logo in Settings and manifest icons.
- **Currency:** Add currency option in Settings; all `formatCurrency()` calls use shop's currency.
- **Languages:** Add keys in `LanguageContext`; extend language switcher dropdown.
- **Roles:** Adjust role enum in DB and RLS; update sidebar visibility checks and `AuthContext` helpers.

---

## 11. File Checklist

- **Config:** `package.json`, `vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `.env.example`, `public/manifest.webmanifest`.
- **Entry:** `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`.
- **Contexts:** `AuthContext`, `LanguageContext`, `ThemeContext`, `SidebarContext`, `NotificationContext`.
- **Layout:** `MainLayout`, `Header`, `Sidebar`, `NotificationPanel`.
- **Common:** `DataTable`, `KPICard`, `EmptyState`, `PageHeader`, `ErrorBoundary`, `ConfirmDialog`, `BarcodeScanner`, `BarcodeGenerator`, `ImageUpload`, `Calculator`, `CommandPalette`, `Receipt`.
- **Pages:** All listed under §4.2 + public pages in §4.1.
- **Hooks:** All listed under §7.1.
- **Supabase:** `client.ts`, `types.ts`, `supabase/migrations/*.sql` (one per table or migration group).

---

*This specification covers everything needed to replicate, extend, or hand off the Shopkeeper's Assistant system. All bugs identified have been documented with fixes. All new features have data model, UI, and hook guidance included.*
