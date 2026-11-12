#!/usr/bin/env bash
# Cloud smoke rig: the whole app, running inside a Claude Code cloud session,
# so the session can smoke a wave in a phone-profile browser BEFORE Seth
# smokes on his phone. Staging is not reachable from the cloud container, so
# this stands up a throwaway copy: local Postgres -> real API -> seeded smoke
# account (dates shifted so "last 7 days" is populated) -> Vite client.
#
# Usage (repo root):  bash scripts/cloud-smoke-up.sh
# Then drive it with scripts/smoke-rig.cjs (see its header).
# Linux cloud container only. Never touches staging or prod: server/.env is
# written to point at localhost (dbHostGuard allows it) and only if absent.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG="${SMOKE_LOG_DIR:-/tmp/logchamp-smoke}"; mkdir -p "$LOG"
export NO_PROXY=localhost,127.0.0.1 no_proxy=localhost,127.0.0.1

pg_ctlcluster 16 main start 2>/dev/null || true
sleep 2
su postgres -c "psql -tc \"select 1 from pg_roles where rolname='smoke'\"" | grep -q 1 ||
  su postgres -c "psql -c \"CREATE USER smoke WITH PASSWORD 'smoke' CREATEDB\""
su postgres -c "psql -tc \"select 1 from pg_database where datname='logchamp_smoke'\"" | grep -q 1 ||
  su postgres -c "psql -c 'CREATE DATABASE logchamp_smoke OWNER smoke'"

if [ ! -f "$ROOT/server/.env" ]; then
  cat > "$ROOT/server/.env" <<ENV
DATABASE_URL="postgresql://smoke:smoke@localhost:5432/logchamp_smoke"
DIRECT_URL="postgresql://smoke:smoke@localhost:5432/logchamp_smoke"
SESSION_SECRET="cloud-smoke-rig-only"
JWT_SECRET="cloud-smoke-rig-only"
COACH_PROVIDER=mock
ENV
fi
grep -q "localhost:5432/logchamp_smoke" "$ROOT/server/.env" ||
  { echo "server/.env exists and is not the smoke rig's - refusing to continue"; exit 1; }

cd "$ROOT/server"
[ -d node_modules ] || npm ci --no-audit --no-fund >"$LOG/server-install.log" 2>&1
npx prisma generate >"$LOG/prisma.log" 2>&1
npx prisma migrate deploy >>"$LOG/prisma.log" 2>&1
npx prisma db seed >>"$LOG/prisma.log" 2>&1
curl -s -o /dev/null http://localhost:3000/auth/me || (nohup node src/server.js >"$LOG/server.log" 2>&1 &)
for _ in $(seq 20); do curl -s -o /dev/null http://localhost:3000/auth/me && break; sleep 1; done

SMOKE_BASE=http://localhost:3000 node "$ROOT/scripts/seed-staging-smoke.mjs" >"$LOG/seed.log" 2>&1
# The seed's 8 weeks are fixed dates; slide them so the newest workout was yesterday.
PGPASSWORD=smoke psql -h localhost -U smoke logchamp_smoke -qc "
  with d as (select (current_date - 1) - max(\"performedAt\")::date as n from \"WorkoutSession\")
  update \"WorkoutSession\" set
    \"performedAt\" = \"performedAt\" + make_interval(days => d.n),
    \"startedAt\"   = \"performedAt\" + make_interval(days => d.n),
    \"completedAt\" = \"performedAt\" + make_interval(days => d.n) + interval '55 minutes'
  from d where d.n <> 0"

cd "$ROOT/client"
[ -d node_modules ] || npm ci --no-audit --no-fund >"$LOG/client-install.log" 2>&1
curl -s -o /dev/null http://localhost:5173/ || (nohup npx vite --port 5173 >"$LOG/vite.log" 2>&1 &)
for _ in $(seq 20); do curl -s -o /dev/null http://localhost:5173/ && break; sleep 1; done

echo "smoke rig up: client http://localhost:5173  api http://localhost:3000"
echo "login smoke-b8@example.com / SmokeTest-B8-2026   logs in $LOG"
