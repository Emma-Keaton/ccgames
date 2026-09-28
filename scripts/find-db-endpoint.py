"""
Find a reachable Postgres endpoint for the CCGames 2026 Supabase project.

The dashboard's direct connection string (`db.<ref>.supabase.co`) is IPv6-only.
On a host without an IPv6 route the pooler endpoint is the only way in, and the
pooler hostname encodes the project's region — which the dashboard shows but a
connection string does not. So: try the direct host first, then walk the pooler
regions until one accepts the credentials.

Prints the first working (host, port, user) triple and exits 0.
"""

import socket
import sys

import psycopg2

from db_conn import connection_kwargs

REF = "ztpmwcfcwsmphvgiczpt"
# Password + dbname come from DATABASE_URL in `.env.local`, never from source.
CREDENTIALS = connection_kwargs()
PASSWORD = CREDENTIALS["password"]
DATABASE = CREDENTIALS["dbname"]
POOLER_USER = CREDENTIALS["user"]

REGIONS = [
    "us-east-1",
    "us-east-2",
    "us-west-1",
    "us-west-2",
    "eu-central-1",
    "eu-west-1",
    "eu-west-2",
    "eu-west-3",
    "eu-north-1",
    "ap-southeast-1",
    "ap-southeast-2",
    "ap-northeast-1",
    "ap-northeast-2",
    "ap-south-1",
    "sa-east-1",
    "ca-central-1",
]


def ipv6_reachable():
    """Is there any IPv6 route at all? Decides whether the direct host is viable."""
    try:
        info = socket.getaddrinfo(f"db.{REF}.supabase.co", 5432, socket.AF_INET6)
    except OSError as exc:
        return f"no AAAA record ({exc})", None
    if not info:
        return "no AAAA record", None
    address = info[0][4][0]
    sock = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
    sock.settimeout(4)
    try:
        sock.connect((address, 5432))
        return "reachable", address
    except OSError as exc:
        return f"unreachable ({exc})", address
    finally:
        sock.close()


def try_connect(label, host, port, user, timeout):
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=PASSWORD,
            dbname=DATABASE,
            connect_timeout=timeout,
            sslmode="require",
        )
    except Exception as exc:  # noqa: BLE001 - we want the reason in every case
        message = " ".join(str(exc).split())[:120]
        print(f"  {label:<34} {message}")
        return None
    print(f"  {label:<34} OK")
    return conn


def main():
    print("IPv6 route check")
    status, address = ipv6_reachable()
    print(f"  db.{REF}.supabase.co -> {address or 'n/a'}: {status}\n")

    print("Direct host (5432)")
    conn = try_connect("direct ipv6", f"db.{REF}.supabase.co", 5432, "postgres", 5)
    if conn:
        print("\nWORKING ENDPOINT")
        print(f"  host=db.{REF}.supabase.co port=5432 user=postgres")
        conn.close()
        return 0

    print("\nPooler hosts (5432, then 6543)")
    for region in REGIONS:
        for prefix in ("aws-0", "aws-1"):
            host = f"{prefix}-{region}.pooler.supabase.com"
            for port in (5432, 6543):
                label = f"{prefix}-{region}:{port}"
                conn = try_connect(label, host, port, POOLER_USER, 5)
                if conn:
                    print("\nWORKING ENDPOINT")
                    print(f"  host={host} port={port} user={POOLER_USER}")
                    conn.close()
                    return 0

    print("\nNO WORKING ENDPOINT — every candidate refused or timed out.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
