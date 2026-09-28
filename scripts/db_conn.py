"""
Shared database connection for the CCGames 2026 maintenance scripts.

Credentials come from the environment or from `.env.local` (gitignored), never
from source: committing a password to the repository would leak it to anyone
with repo access.

    DATABASE_URL=postgresql://postgres:<password>@<host>:5432/postgres
"""

import os
from urllib.parse import urlparse, unquote

DEFAULT_HOST = "aws-1-eu-west-1.pooler.supabase.com"
DEFAULT_PORT = 5432
DEFAULT_USER = "postgres.ztpmwcfcwsmphvgiczpt"
DEFAULT_DATABASE = "postgres"

MISSING = (
    "DATABASE_URL is not set. Add it to `.env.local` (gitignored):\n"
    "  DATABASE_URL=postgresql://postgres.<project-ref>:<password>"
    "@aws-1-eu-west-1.pooler.supabase.com:5432/postgres\n"
    "Credentials: Supabase dashboard → Settings → Database → Connection string.\n"
    "Note: the pooler needs the tenant-qualified username `postgres.<ref>` — a\n"
    "bare `postgres` user fails with `no tenant identifier provided`."
)


def load_env_file(path=".env.local"):
    if not os.path.exists(path):
        return {}
    values = {}
    with open(path, "r", encoding="utf-8") as handle:
        for line in handle:
            if line.lstrip().startswith("#"):
                continue
            if "=" not in line:
                continue
            key, _, value = line.partition("=")
            values[key.strip()] = value.strip()
    return values


def connection_kwargs():
    """psycopg2 keyword arguments. Raises SystemExit when unset/malformed."""
    file_env = load_env_file()
    url = os.environ.get("DATABASE_URL") or file_env.get("DATABASE_URL") or ""
    if not url:
        raise SystemExit(MISSING)

    parsed = urlparse(url)
    if not parsed.hostname:
        raise SystemExit(f"DATABASE_URL is not a valid connection string: {url!r}")

    return {
        "host": parsed.hostname,
        "port": parsed.port or DEFAULT_PORT,
        "user": parsed.username or DEFAULT_USER,
        "password": unquote(parsed.password) if parsed.password else "",
        "dbname": (parsed.path or "/").lstrip("/") or DEFAULT_DATABASE,
        "connect_timeout": 15,
        "sslmode": "require",
    }


def connect():
    import psycopg2  # imported lazily so this module stays importable without it

    kwargs = connection_kwargs()
    label = f"{kwargs['user']}@{kwargs['host']}:{kwargs['port']}/{kwargs['dbname']}"
    return psycopg2.connect(**kwargs), label
