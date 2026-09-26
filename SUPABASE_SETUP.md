# WiseCash — Supabase setup (run these once)

Project: `ureibirtkbyzfauoepah`  
URL: https://ureibirtkbyzfauoepah.supabase.co

---

## 1. SQL migrations (Dashboard → SQL Editor → New query → Run)

```sql
-- ========== A) HarakaPay provider + fee columns ==========
ALTER TABLE public.subscription_payments
  DROP CONSTRAINT IF EXISTS subscription_payments_provider_check;

ALTER TABLE public.subscription_payments
  ADD CONSTRAINT subscription_payments_provider_check
    CHECK (provider IN ('manual', 'azampay', 'harakapay'));

ALTER TABLE public.subscription_payments
  ADD COLUMN IF NOT EXISTS gross_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS fee_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS net_amount NUMERIC;

COMMENT ON COLUMN public.subscription_payments.gross_amount IS 'Amount charged to customer before provider fees';
COMMENT ON COLUMN public.subscription_payments.fee_amount IS 'Provider fee deducted';
COMMENT ON COLUMN public.subscription_payments.net_amount IS 'Amount received after provider fees';

-- ========== B) Terms acceptance (PDPA) ==========
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.terms_accepted_at IS 'When user accepted Terms + Privacy at signup';

CREATE OR REPLACE FUNCTION public.sync_terms_accepted_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb;
  accepted_at text;
BEGIN
  SELECT raw_user_meta_data INTO meta
  FROM auth.users
  WHERE id = NEW.id;

  IF meta IS NULL THEN
    RETURN NEW;
  END IF;

  IF COALESCE((meta->>'terms_accepted')::boolean, false) IS TRUE THEN
    accepted_at := meta->>'terms_accepted_at';
    NEW.terms_accepted_at := COALESCE(
      NULLIF(accepted_at, '')::timestamptz,
      now()
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_sync_terms_accepted ON public.profiles;
CREATE TRIGGER trg_profiles_sync_terms_accepted
  BEFORE INSERT OR UPDATE OF id ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_terms_accepted_from_auth();
```

---

## 2. Edge Function secrets (Dashboard → Edge Functions → Secrets)

| Name | Value |
|------|--------|
| `HARAKAPAY_API_KEY` | your key (`hpk_...`) |
| `HARAKAPAY_BASE_URL` | `https://api.harakapay.net` (optional if that is the default) |

Or CLI:

```bash
supabase link --project-ref ureibirtkbyzfauoepah
supabase secrets set HARAKAPAY_API_KEY=hpk_YOUR_KEY_HERE
```

---

## 3. Deploy Edge Functions (CLI from repo root)

```bash
supabase functions deploy harakapay-initiate-subscription
supabase functions deploy harakapay-webhook
```

Functions are already in the repo under:

- `supabase/functions/harakapay-initiate-subscription/`
- `supabase/functions/harakapay-webhook/`

Webhook URL (give to payment provider if required):

```
https://ureibirtkbyzfauoepah.supabase.co/functions/v1/harakapay-webhook
```

---

## 4. After deploy — smoke test

1. Hard-refresh the app (clear cache) so the new frontend loads.
2. Open **Billing** → **Pay by phone** → enter a test number.
3. Confirm the function logs in Supabase → Edge Functions → Logs.
4. Signup with the Terms checkbox checked → `profiles.terms_accepted_at` should fill on profile create.

---

## Security notes

- Never put the payment API key in Vite/`VITE_*` or the React bundle.
- Rotate any keys/tokens that were shared in chat.
