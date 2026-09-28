-- ============================================================================
-- Migration 14 — Programme guard + multi-sport constraints
-- ============================================================================
-- The catalogue itself — all 20 sports, their vocabulary, their clock/medal
-- configuration, their divisions and their per-tournament enablement — is owned
-- by `04_seed_ccgames2026.sql`. This file holds only what must be true *after*
-- the catalogue is in place:
--
--   1. A guard that removes any sport outside the approved programme. It is a
--      no-op on a fresh database, and the cleanup path for any database that
--      ran the earlier speculative catalogue (migrations 10/13 used to seed 21
--      extra sports plus futsal).
--   2. `teams.team_type` — the legacy CHECK allowed eight values, so a judo,
--      swimming or athletics team could only be registered as "Other".
--   3. `fixtures.stage` — football's ladder is not the only shape a Games
--      fixture takes: heats, pools and rounds.
--
-- Idempotency: guarded DELETE/UPDATE and constraint swaps. Safe to re-run.
-- Depends on: 03_sports_catalog, 04_seed_ccgames2026, 05 (team_type CHECK).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------------
-- 1. Guard: only the 20 programme sports may exist.
--    The list is inlined as a CTE rather than a temp table so this file behaves
--    identically whether it runs inside one transaction (the Supabase migration
--    runner) or statement-by-statement (SQL editor paste).
-- --------------------------------------------------------------------------
WITH programme(code) AS (
    VALUES
    ('athletics'), ('badminton'), ('basketball'), ('boxing'),
    ('canoeing'), ('cricket'), ('cycling'), ('darts'),
    ('football'), ('golf'), ('gymnastics'), ('judo'),
    ('mma'), ('shooting'), ('swimming'), ('table_tennis'),
    ('taekwondo'), ('tennis'), ('weightlifting'), ('wrestling')
)
DELETE FROM public.sports s
WHERE NOT EXISTS (SELECT 1 FROM programme p WHERE p.code = s.code);

-- Divisions are owned by their sport (ON DELETE CASCADE), so removing the
-- sports above already removed theirs. This is an explicit safety net for any
-- orphaned row.
DELETE FROM public.sport_divisions d
WHERE NOT EXISTS (SELECT 1 FROM public.sports s WHERE s.id = d.sport_id);

-- --------------------------------------------------------------------------
-- 2. teams.team_type — replace the eight-value legacy CHECK with the programme.
--    Out-of-scope values are normalised first so the swap cannot fail (a
--    'Futsal' team, for instance, becomes 'Football').
-- --------------------------------------------------------------------------
UPDATE public.teams SET team_type = 'Football' WHERE team_type = 'Futsal';

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'public'
          AND t.relname = 'teams'
          AND c.conname = 'teams_team_type_check'
    ) THEN
        ALTER TABLE public.teams DROP CONSTRAINT teams_team_type_check;
    END IF;
END
$$;

UPDATE public.teams
SET team_type = 'Other'
WHERE team_type IS NOT NULL
  AND team_type NOT IN (
    'Athletics', 'Badminton', 'Basketball', 'Boxing',
    'Canoeing', 'Cricket', 'Cycling', 'Darts',
    'Football', 'Golf', 'Gymnastics', 'Judo',
    'Mixed Martial Arts', 'Shooting', 'Swimming', 'Table Tennis',
    'Taekwondo', 'Tennis', 'Weightlifting & Para Powerlifting', 'Wrestling',
    'Other'
  );

ALTER TABLE public.teams
    ADD CONSTRAINT teams_team_type_check
    CHECK (
        team_type IS NULL OR team_type IN (
            'Athletics', 'Badminton', 'Basketball', 'Boxing',
            'Canoeing', 'Cricket', 'Cycling', 'Darts',
            'Football', 'Golf', 'Gymnastics', 'Judo',
            'Mixed Martial Arts', 'Shooting', 'Swimming', 'Table Tennis',
            'Taekwondo', 'Tennis', 'Weightlifting & Para Powerlifting', 'Wrestling',
            'Other'
        )
    );

-- --------------------------------------------------------------------------
-- 3. fixtures.stage — heats, pools and rounds, not just group/knockout.
--    NULL stays legal ("not drawn yet"). Legacy values outside the list are
--    cleared first so the swap can never fail, and the guard drops any
--    pre-existing stage constraint before re-adding it.
-- --------------------------------------------------------------------------
UPDATE public.fixtures
SET stage = NULL
WHERE stage IS NOT NULL
  AND stage NOT IN (
    'group_stage', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final',
    'heat', 'semi_final_heat', 'qualification', 'pool', 'round_robin',
    'elimination_round', 'repechage', 'medal_final'
  );

DO $$
DECLARE
    existing TEXT;
BEGIN
    FOR existing IN
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'public'
          AND t.relname = 'fixtures'
          AND c.contype = 'c'
          AND c.conname LIKE 'fixtures_stage%'
    LOOP
        EXECUTE format('ALTER TABLE public.fixtures DROP CONSTRAINT %I', existing);
    END LOOP;
END
$$;

ALTER TABLE public.fixtures
    ADD CONSTRAINT fixtures_stage_check
    CHECK (
        stage IS NULL OR stage IN (
            'group_stage', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final',
            'heat', 'semi_final_heat', 'qualification', 'pool', 'round_robin',
            'elimination_round', 'repechage', 'medal_final'
        )
    );
