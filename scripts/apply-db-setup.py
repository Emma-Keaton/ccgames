"""
Apply supabase/db-setup.sql to the CCGames 2026 database.

Why not `supabase db push`? The dashboard's direct connection string
(`db.<ref>.supabase.co`) is IPv6-only, which is unreachable from this machine,
and the CLI needs an access token. The IPv4 **pooler** endpoint works without
either — but it needs the `postgres.<project-ref>` username, and the pooler
hostname encodes the region, so `scripts/find-db-endpoint.py` is what found it.

Behaviour: the file is split on its `-- ====` PART banners and each section is
executed on its own, with autocommit on. That means
  * a failure names the exact section it happened in, and
  * sections already applied stay applied.
Every statement in the file is idempotent, so re-running is always safe.

Usage:  python scripts/apply-db-setup.py [path-to-sql]
"""

import os
import re
import sys
import time

import psycopg2

# Credentials live in `.env.local` (gitignored) — see scripts/db_conn.py.
from db_conn import connect

DEFAULT_SQL = os.path.join("supabase", "db-setup.sql")

# `-- ====…` / `-- PART 04 — 04_seed_ccgames2026.sql` / `-- ====…`
BANNER = re.compile(r"^-- ={20,}\r?\n-- (.+?)\r?\n-- ={20,}\r?\n", re.MULTILINE)


def split_sections(sql):
    """[(label, sql)] — one entry per PART banner, plus any preamble."""
    matches = list(BANNER.finditer(sql))
    if not matches:
        return [("whole file", sql)]

    sections = []
    if matches[0].start() > 0:
        sections.append(("preamble", sql[: matches[0].start()]))
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(sql)
        sections.append((match.group(1).strip(), sql[match.start():end]))
    return sections


def has_statements(chunk):
    """
    True when the chunk contains something other than comments and blanks.

    The generated file opens with a pure-comment header block, and Postgres
    rejects a statement list that contains nothing ("can't execute an empty
    query"), so those chunks must be skipped rather than executed.
    """
    for line in chunk.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("--"):
            continue
        return True
    return False


def main():
    sql_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SQL
    if not os.path.exists(sql_path):
        print(f"FAIL: {sql_path} not found")
        return 1

    with open(sql_path, "r", encoding="utf-8-sig") as handle:
        sql = handle.read()

    sections = split_sections(sql)
    print(f"Applying {sql_path} ({len(sql) // 1024} KB, {len(sections)} sections)")

    started = time.time()
    try:
        conn, target = connect()
    except SystemExit as exc:
        print(f"FAIL: {exc}")
        return 1
    except Exception as exc:  # noqa: BLE001
        print(f"FAIL: could not connect — {' '.join(str(exc).split())}")
        return 1
    conn.autocommit = True
    print(f"Target   {target}\n")

    applied = 0
    with conn:
        with conn.cursor() as cur:
            cur.execute("SELECT current_database(), version()")
            database, version = cur.fetchone()
            print(f"Connected to {database} ({version.split(',')[0]})\n")

            for label, chunk in sections:
                if not chunk.strip() or not has_statements(chunk):
                    continue
                section_started = time.time()
                try:
                    cur.execute(chunk)
                except psycopg2.Error as exc:
                    print(f"  FAIL  {label}")
                    print(f"        {exc.diag.message_primary or exc}")
                    if exc.diag.message_detail:
                        print(f"        detail: {exc.diag.message_detail}")
                    if exc.diag.context:
                        print(f"        context: {exc.diag.context}")
                    if exc.diag.statement_position:
                        position = int(exc.diag.statement_position)
                        snippet = chunk[max(0, position - 160): position + 160]
                        print(f"        near: {' '.join(snippet.split())}")
                    print(f"\nApplied {applied} section(s) before failing. Re-run after fixing — every statement is idempotent.")
                    return 1
                applied += 1
                print(f"  OK    {label}  ({time.time() - section_started:.1f}s)")

    conn.close()
    print(f"\nSUCCESS — {applied} sections applied in {time.time() - started:.1f}s.")
    print("Next: npm run verify:db")
    return 0


if __name__ == "__main__":
    sys.exit(main())
