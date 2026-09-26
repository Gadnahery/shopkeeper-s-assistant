-- Record explicit Terms + Privacy consent at signup (PDPA evidence)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.terms_accepted_at IS 'Timestamp when user accepted Terms of Service and Privacy Policy at signup';

-- When a profile is created/updated, copy terms_accepted_at from auth.users metadata if present
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
