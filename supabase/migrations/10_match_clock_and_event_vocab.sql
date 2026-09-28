-- ============================================================================
-- Migration 10 — Match clock RPC + the multi-sport event vocabulary
-- ============================================================================
-- Scope note: this file used to carry a speculative 21-sport pan-African Games
-- catalogue, its clock/medal blocks and eight para divisions. All of that is
-- gone — the catalogue is now owned in full by `04_seed_ccgames2026.sql`, which
-- seeds exactly the 20 sports the National Sports Commission approved for the
-- 2026 Coal City Games. What remains here is the two pieces that are genuinely
-- 10's responsibility:
--
--   1. `update_match_clock()` — the duty-checked, atomic clock save. It merges
--      ONLY the clock keys into `fixtures.stats`, so a clock write can never
--      clobber statistics recorded concurrently through `record_stat()`.
--   2. The `match_events.event_type` vocabulary widened past football's 21
--      tokens to everything the 20-sport programme writes.
--
-- Idempotency: CREATE OR REPLACE + a guarded constraint swap. Re-runnable.
-- Depends on: 04_seed_ccgames2026.sql, 06 (duty helpers), 09.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Atomic match-clock RPC (duty-checked exactly like record_score)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_match_clock(
    p_fixture_id UUID,
    p_status TEXT,
    p_minute INT,
    p_elapsed_seconds INT,
    p_timer_started_at TIMESTAMPTZ
)
RETURNS public.fixtures
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tournament_id UUID;
    v_row public.fixtures%ROWTYPE;
BEGIN
    SELECT f.tournament_id INTO v_tournament_id
    FROM public.fixtures f
    WHERE f.id = p_fixture_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Fixture % not found', p_fixture_id;
    END IF;

    IF p_status NOT IN ('scheduled', 'in_progress', 'half_time', 'paused',
                        'extra_time', 'full_time', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid match status %', p_status;
    END IF;
    IF p_minute IS NULL OR p_minute < 0 OR p_elapsed_seconds IS NULL OR p_elapsed_seconds < 0 THEN
        RAISE EXCEPTION 'Clock values must be non-negative';
    END IF;

    IF NOT public.is_app_admin() THEN
        IF v_tournament_id IS NULL OR NOT EXISTS (
            SELECT 1
            FROM public.tournament_members m
            WHERE m.tournament_id = v_tournament_id
              AND m.user_id = auth.uid()
              AND (m.duties @> ARRAY['*'] OR m.duties @> ARRAY['score'])
        ) THEN
            RAISE EXCEPTION 'Not authorized to update the clock for this fixture';
        END IF;
    END IF;

    UPDATE public.fixtures
    SET status = p_status,
        current_minute = p_minute,
        stats = jsonb_set(
                    jsonb_set(
                        COALESCE(stats, '{}'::jsonb),
                        '{elapsed_seconds}',
                        to_jsonb(p_elapsed_seconds),
                        TRUE
                    ),
                    '{timer_started_at}',
                    COALESCE(to_jsonb(p_timer_started_at), 'null'::jsonb),
                    TRUE
                ),
        updated_at = NOW()
    WHERE id = p_fixture_id
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_match_clock(UUID, TEXT, INT, INT, TIMESTAMPTZ)
    TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Widen match_events.event_type to the vocabulary the 20-sport programme
--    writes. Migration 05 allowed 21 football-centric tokens; the tokens below
--    are exactly the union of the event_vocab seeded per sport in migration 04,
--    so nothing out-of-programme (rugby's try, squash's let, esports' map win)
--    survives here.
--
--    Migration 13 later swaps this hardcoded list for a *format* CHECK, because
--    the live vocabulary belongs in `sports.event_vocab` and
--    `fixtures.rules_override`, not in a constraint that needs a migration to
--    edit. This block stays as the historical widening.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'public'
          AND t.relname = 'match_events'
          AND c.conname = 'match_events_event_type_check'
    ) THEN
        ALTER TABLE public.match_events DROP CONSTRAINT match_events_event_type_check;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'public'
          AND t.relname = 'match_events'
          AND c.conname = 'match_events_event_type_check'
    ) THEN
        ALTER TABLE public.match_events
            ADD CONSTRAINT match_events_event_type_check
            CHECK (event_type IN (
                -- open scoring
                'point', 'score',
                -- football
                'goal', 'own_goal', 'penalty_goal', 'penalty_missed', 'penalty',
                'corner', 'free_kick', 'yellow_card', 'red_card', 'substitution',
                'half_time_whistle', 'full_time_whistle', 'kick_off',
                -- sets (badminton, table tennis, tennis)
                'set_win',
                -- bouts (boxing, judo, taekwondo, wrestling, MMA)
                'round_win',
                -- cricket
                'wicket',
                -- attempts (gymnastics, weightlifting, golf, shooting)
                'attempt', 'birdie', 'par', 'bogey', 'eagle', 'shot', 'hit', 'miss',
                -- race (athletics, swimming, cycling, canoeing)
                'time_record', 'distance_record', 'false_start', 'heat_win', 'lap',
                -- universal officiating
                'foul', 'injury', 'disqualification', 'timeout'
            ));
    END IF;
END
$$;
