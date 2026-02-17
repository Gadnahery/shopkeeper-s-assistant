# Supabase Database

## Moving to a New Supabase Account

When you migrate to a new Supabase project:

1. **Create** a new project at [supabase.com](https://supabase.com)
2. **Run migrations** in the SQL Editor, in order:
   - `migrations/001_products_variants_stock_sales.sql`
   - `migrations/002_purchase_orders_customers_loyalty.sql`
   - `migrations/003_locations_transfers_expenses_discounts.sql`
   - `migrations/004_todos_assign_user_permissions.sql`
3. **Update environment variables** (`.env`):
   - `VITE_SUPABASE_URL` = new project URL
   - `VITE_SUPABASE_ANON_KEY` = new project anon key
4. **No code changes** required—the app reads these from env.
