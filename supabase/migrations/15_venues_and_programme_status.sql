-- ============================================================================
-- Migration 15 — Venues + programme reconciliation (NSF 2026)
-- ============================================================================
-- Purpose:
--   * Add `public.venues` — the confirmed Coal City Games 2026 venues, plus a
--     nullable `fixtures.venue_id` link. The organiser brief named five venues
--     (see FESO.md "NSF 2026 reference data"); capacity/address are unknown so
--     every non-name column is nullable rather than guessed.
--   * Reconcile the sport count. The brief's "20 core sports" is 15 ordinary
--     sports + 5 para/disability variants, and the schema models those variants
--     as `sport_divisions` on a parent sport (Para Athletics, Para Badminton,
--     Wheelchair Basketball, Para Table Tennis, Para Powerlifting). So the
--     brief's 20 maps onto `sports` rows only if the optional programmes are
--     counted separately — which is what §3 makes explicit.
--   * Tag each sport as `core` or `optional` so the app can show optional
--     programmes as coming-soon rather than silently dropping them.
--
-- Idempotency: venues use ON CONFLICT (slug) DO UPDATE; the core/optional tag
--   is a guarded UPDATE against the explicit code list; venue_id is
--   ADD COLUMN IF NOT EXISTS.
--
-- Depends on: 02_tournaments_core.sql, 03_sports_catalog.sql (sports),
--   04_seed_ccgames2026.sql (seed rows).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Venues
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.venues (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  -- Free text until the organisers publish precise locations; deliberately
  -- nullable so a half-known venue can be recorded without inventing data.
  address     TEXT,
  city        TEXT DEFAULT 'Enugu',
  capacity    INTEGER,
  -- Which part of the festival this venue serves. Drives the venue filter and
  -- the "where do I go" guidance for visitors.
  kind        TEXT NOT NULL DEFAULT 'other'
              CHECK (kind IN ('stadium','indoor','aquatics','village','conference','other')),
  notes       TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.venues (slug, name, kind, notes) VALUES
  ('nnamdi-azikiwe-stadium', 'Nnamdi Azikiwe Stadium, Enugu', 'stadium',
   'Major revamp underway. Hosts track and field (athletics), football, and the opening/closing ceremonies.'),
  ('enugu-international-conference-centre',
   'Enugu International Conference Centre (ICC)', 'conference',
   'Landmark facility hub; indoor sports backdrop and official presentation ceremonies.'),
  ('enugu-indoor-sports-hall',
   'Enugu State Indoor Sports Hall (Enugu State Sports Complex)', 'indoor',
   'Federal-government-approved rehabilitation. Hosts indoor sports — combat and racket categories.'),
  ('olympic-size-swimming-pool', 'Olympic-Size Swimming Pool', 'aquatics',
   'New build, constructed explicitly for the swimming events. Address not yet confirmed by the organisers.'),
  ('awgu-games-village', 'Awgu Games Village', 'village',
   'Rehabilitated for athlete housing, training and logistical support.')
ON CONFLICT (slug) DO UPDATE SET
  name  = EXCLUDED.name,
  kind  = EXCLUDED.kind,
  notes = EXCLUDED.notes,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- 2. Link fixtures to a venue.
--    fixtures.venue is a free-text column that predates this table, so it is
--    left in place; venue_id is the structured counterpart for new writes.
-- ---------------------------------------------------------------------------
ALTER TABLE public.fixtures
  ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_fixtures_venue_id ON public.fixtures (venue_id);

-- Backfill: match the existing free-text venue names to the seeded rows where
-- they are unambiguous. Anything that does not match exactly is left NULL for
-- an admin to set through the fixture editor.
UPDATE public.fixtures f
SET venue_id = v.id
FROM public.venues v
WHERE f.venue_id IS NULL
  AND lower(btrim(f.venue)) = lower(v.name);

-- ---------------------------------------------------------------------------
-- 3. Programme status: core vs optional.
--    The brief lists 15 compulsory + 5 host-selected ordinary sports, with the
--    para variants carried as divisions. Cricket, canoeing, darts, golf and
--    shooting are named as *optional* festival programmes — they stay seeded
--    (the catalogue is shared with other tournaments) but are flagged so the app
--    can present them as coming-soon instead of implying they are scheduled.
-- ---------------------------------------------------------------------------
ALTER TABLE public.sports
  ADD COLUMN IF NOT EXISTS programme_status TEXT NOT NULL DEFAULT 'core'
  CHECK (programme_status IN ('core','optional'));

UPDATE public.sports SET programme_status = 'optional'
WHERE code IN ('cricket','canoeing','darts','golf','shooting');

COMMENT ON COLUMN public.sports.programme_status IS
  'core = part of the 20-sport Coal City Games programme; optional = seeded in '
  'the shared catalogue but an optional festival programme, shown as coming-soon.';

-- ---------------------------------------------------------------------------
-- 4. RLS: venues are public reference data, writes are app_admin only.
-- ---------------------------------------------------------------------------
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS venues_select_public ON public.venues;
CREATE POLICY venues_select_public ON public.venues
  FOR SELECT USING (is_active);

DROP POLICY IF EXISTS venues_admin_all ON public.venues;
CREATE POLICY venues_admin_all ON public.venues
  FOR ALL USING (is_app_admin()) WITH CHECK (is_app_admin());

COMMENT ON TABLE public.venues IS
  'Confirmed Coal City Games 2026 venues. Seeded from the organiser brief; '
  'address/capacity are nullable because the brief did not specify them.';

CREATE INDEX IF NOT EXISTS idx_venues_active ON public.venues (is_active);
