-- OpGrid authentication and tenant-isolation migration.
-- Run once in the Supabase SQL editor after enabling Email auth.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'applications', 'resume_analyses', 'notif_log', 'resume_versions',
    'jd_analyses', 'saved_opportunities', 'notifications'
  ] LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE', table_name);
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id SET DEFAULT auth.uid()', table_name);
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(user_id)', 'idx_' || table_name || '_user_id', table_name);
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      EXECUTE format('DROP POLICY IF EXISTS user_owns_row ON public.%I', table_name);
      EXECUTE format('CREATE POLICY user_owns_row ON public.%I FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())', table_name);
    END IF;
  END LOOP;
END $$;

-- Existing rows deliberately remain ownerless and invisible to browser users.
-- Assign an owner manually only if they are known to belong to that account.

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS authenticated_read_opportunities ON public.opportunities;
CREATE POLICY authenticated_read_opportunities ON public.opportunities
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.opportunity_user_state (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  seen_at timestamptz,
  PRIMARY KEY (user_id, opportunity_id)
);
ALTER TABLE public.opportunity_user_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_owns_state ON public.opportunity_user_state;
CREATE POLICY user_owns_state ON public.opportunity_user_state FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Replace the legacy one-user-only saved-opportunity constraint with a per-user key.
ALTER TABLE public.saved_opportunities DROP CONSTRAINT IF EXISTS saved_opportunities_opportunity_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS saved_opportunities_user_opportunity_key
  ON public.saved_opportunities(user_id, opportunity_id);

CREATE TABLE IF NOT EXISTS public.user_sources (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, url)
);
ALTER TABLE public.user_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_owns_source ON public.user_sources;
CREATE POLICY user_owns_source ON public.user_sources FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.telegram_links (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.telegram_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_owns_telegram_link ON public.telegram_links;
CREATE POLICY user_owns_telegram_link ON public.telegram_links FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
