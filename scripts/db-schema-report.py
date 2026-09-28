"""
Print a hard inventory of the deployed CCGames 2026 schema.

Reads the catalogue directly from Postgres (via the IPv4 pooler — see
scripts/find-db-endpoint.py for why the direct host is not used), so it is the
authoritative answer to "did the deployment actually land?" independent of
PostgREST's schema cache.
"""

import psycopg2

# Credentials live in `.env.local` (gitignored) — see scripts/db_conn.py.
from db_conn import connect

RPC_NAMES = (
    "record_score",
    "record_stat",
    "update_match_clock",
    "record_match_event",
)

QUERIES = [
    (
        "tables in public",
        "SELECT count(*) FROM pg_tables WHERE schemaname = 'public'",
    ),
    (
        "tables with RLS enabled",
        """
        SELECT count(*) FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity
        """,
    ),
    ("sports seeded", "SELECT count(*) FROM public.sports"),
    ("sports enabled for ccgames2026", "SELECT count(*) FROM public.tournament_sports"),
    ("sport divisions", "SELECT count(*) FROM public.sport_divisions"),
    (
        "active tournament",
        "SELECT name || ' | ' || status || ' | ' || start_date || ' -> ' || end_date "
        "FROM public.tournaments WHERE is_active",
    ),
    (
        "write RPCs present",
        """
        SELECT p.proname || '(' || pg_get_function_arguments(p.oid) || ')'
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = ANY(%s)
        ORDER BY p.proname
        """,
    ),
    (
        "profiles of the 20 sports (format-bearing config keys)",
        """
        SELECT s.code || ': type=' || s.scoring_type
               || ' clock=' || COALESCE(s.scoring_config->'clock'->>'type', 'MISSING')
               || ' medals_team=' || COALESCE(s.scoring_config->'medals'->>'team', 'MISSING')
        FROM public.sports s ORDER BY s.code
        """,
    ),
]


def main():
    conn, target = connect()
    print(f"Target   {target}\n")
    with conn, conn.cursor() as cur:
        for label, query in QUERIES:
            print(f"\n{label}")
            if "%s" in query:
                cur.execute(query, (list(RPC_NAMES),))
            else:
                cur.execute(query)
            rows = cur.fetchall()
            if len(rows) == 1 and len(rows[0]) == 1 and isinstance(rows[0][0], int):
                print(f"  {rows[0][0]}")
                continue
            for row in rows:
                print(f"  {' | '.join(str(value) for value in row)}")
    conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
