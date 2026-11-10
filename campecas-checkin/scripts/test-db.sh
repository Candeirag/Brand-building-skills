#!/usr/bin/env bash
# Sobe um PostgreSQL temporário, aplica as migrations sobre uma emulação mínima
# do Supabase e executa os testes de segurança/regras de negócio.
# Requer os binários do PostgreSQL (initdb, pg_ctl, psql) — versão 15+.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PG_BIN="${PG_BIN:-$(dirname "$(command -v initdb 2>/dev/null || ls /usr/lib/postgresql/*/bin/initdb | tail -1)")}"
TMP="$(mktemp -d)"
PORT="${PGTEST_PORT:-55432}"
RUN_AS=()
if [ "$(id -u)" = "0" ]; then
  chown -R postgres "$TMP" 2>/dev/null || true
  RUN_AS=(runuser -u postgres --)
fi

cleanup() { "${RUN_AS[@]}" "$PG_BIN/pg_ctl" -D "$TMP/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$TMP"; }
trap cleanup EXIT

"${RUN_AS[@]}" "$PG_BIN/initdb" -D "$TMP/data" -U postgres -A trust >/dev/null
"${RUN_AS[@]}" "$PG_BIN/pg_ctl" -D "$TMP/data" -o "-p $PORT -k $TMP -c listen_addresses=''" -l "$TMP/pg.log" -w start >/dev/null

PSQL=(psql -X -q -v ON_ERROR_STOP=1 -h "$TMP" -p "$PORT" -U postgres -d postgres)

"${PSQL[@]}" -f "$ROOT/supabase/tests/00_supabase_stubs.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "→ migration $(basename "$f")"
  "${PSQL[@]}" -f "$f"
done
"${PSQL[@]}" -tA -f "$ROOT/supabase/tests/10_regras_seguranca.test.sql" 2>&1 | sed -E "s/^psql:[^ ]* (NOTICE|ERROR):  /  /" | grep -v "^$"
