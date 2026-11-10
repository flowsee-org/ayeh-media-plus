#!/usr/bin/env bash
# Explicit PostgreSQL migration deploy helper (Task 13).
# Never runs automatically on application container start.
# Never use `prisma db push` for Staging/Production.
#
# Usage:
#   ./scripts/migrate-deploy.sh --env-file .env.production.docker \
#     --compose-file docker-compose.prod.example.yml
#
# Or against a host-reachable DATABASE_URL (after pnpm db:generate:pg):
#   ./scripts/migrate-deploy.sh --database-url 'postgresql://…' --local
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE=""
COMPOSE_FILE="docker-compose.prod.example.yml"
DATABASE_URL_OVERRIDE=""
USE_LOCAL=0
ASSUME_YES=0
SKIP_BACKUP_PROMPT=0

usage() {
  cat <<'EOF'
Ayeh Media Plus — safe Prisma migrate deploy

Options:
  --env-file PATH         Env file with DATABASE_URL (Compose path)
  --compose-file PATH     Compose file (default: docker-compose.prod.example.yml)
  --database-url URL      Explicit PostgreSQL URL (overrides env file for --local)
  --local                 Run `pnpm db:migrate` on the host (requires PG client generate)
  --yes                   Skip interactive confirmation (still prints backup reminder)
  --skip-backup-prompt    Do not ask the backup confirmation question (CI/rehearsal only)
  -h, --help              Show help

Safety:
  - Refuses sqlite: / file: URLs
  - Requires DATABASE_PROVIDER=postgresql when set
  - Reminds operator to back up before applying
  - Does not connect to remote Staging/Production unless YOUR URL points there
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file) ENV_FILE="${2:-}"; shift 2 ;;
    --compose-file) COMPOSE_FILE="${2:-}"; shift 2 ;;
    --database-url) DATABASE_URL_OVERRIDE="${2:-}"; shift 2 ;;
    --local) USE_LOCAL=1; shift ;;
    --yes) ASSUME_YES=1; shift ;;
    --skip-backup-prompt) SKIP_BACKUP_PROMPT=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage; exit 2 ;;
  esac
done

load_env_file() {
  local f="$1"
  if [[ ! -f "$f" ]]; then
    echo "ERROR: env file not found: $f" >&2
    exit 1
  fi
  # shellcheck disable=SC1090
  set -a
  # Only export simple KEY=VALUE lines (no command substitution)
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line// }" ]] && continue
    if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
      export "$line"
    fi
  done < "$f"
  set +a
}

if [[ -n "$ENV_FILE" ]]; then
  load_env_file "$ENV_FILE"
fi

if [[ -n "$DATABASE_URL_OVERRIDE" ]]; then
  export DATABASE_URL="$DATABASE_URL_OVERRIDE"
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is required (via --env-file or --database-url)." >&2
  exit 1
fi

export DATABASE_PROVIDER="${DATABASE_PROVIDER:-postgresql}"

echo "════════════════════════════════════════════════════════════"
echo " Ayeh migrate deploy — preflight"
echo "════════════════════════════════════════════════════════════"
echo " DATABASE_PROVIDER = $DATABASE_PROVIDER"
# Redact password in URL for display
REDACTED_URL="$(echo "$DATABASE_URL" | sed -E 's#(postgresql://[^:]+:)[^@]+@#\1***@#')"
echo " DATABASE_URL      = $REDACTED_URL"
echo " Mode              = $([[ $USE_LOCAL -eq 1 ]] && echo 'host pnpm db:migrate' || echo "compose profile migrate ($COMPOSE_FILE)")"
echo

if [[ "$DATABASE_PROVIDER" != "postgresql" ]]; then
  echo "ERROR: DATABASE_PROVIDER must be postgresql (got: $DATABASE_PROVIDER)." >&2
  echo "Refusing to run production migrations against a non-Postgres provider." >&2
  exit 1
fi

if [[ "$DATABASE_URL" == file:* ]] || [[ "$DATABASE_URL" == *sqlite* ]]; then
  echo "ERROR: DATABASE_URL looks like SQLite. Production migrations require PostgreSQL." >&2
  exit 1
fi

if [[ "$DATABASE_URL" != postgresql://* && "$DATABASE_URL" != postgres://* ]]; then
  echo "ERROR: DATABASE_URL must start with postgresql:// or postgres://" >&2
  exit 1
fi

echo "REMINDER: Take a restore-tested database backup before migrating any shared environment."
echo "          Preferred rollback = restore backup + redeploy previous app revision."
echo "          Prisma does not ship automatic down migrations in this repo."
echo

if [[ $SKIP_BACKUP_PROMPT -eq 0 ]]; then
  if [[ $ASSUME_YES -eq 0 ]]; then
    read -r -p "Have you backed up (or is this a disposable local DB)? Type YES to continue: " ans
    if [[ "$ans" != "YES" ]]; then
      echo "Aborted — no migrations applied."
      exit 1
    fi
  else
    echo "(--yes) Proceeding after backup reminder without interactive prompt."
  fi
else
  echo "(--skip-backup-prompt) Skipping backup confirmation (local rehearsal / CI only)."
fi

echo
echo "→ Applying: prisma migrate deploy --schema server/prisma/schema.production.prisma"

if [[ $USE_LOCAL -eq 1 ]]; then
  echo "→ Ensuring PostgreSQL Prisma Client is generated…"
  pnpm db:generate:pg
  pnpm db:migrate
  echo "→ Migration status:"
  npx prisma migrate status --schema server/prisma/schema.production.prisma || true
  echo "→ Restoring SQLite Prisma Client for local app/tests…"
  pnpm db:generate
else
  if [[ ! -f "$COMPOSE_FILE" ]]; then
    echo "ERROR: compose file not found: $COMPOSE_FILE" >&2
    exit 1
  fi
  COMPOSE_ARGS=(-f "$COMPOSE_FILE")
  if [[ -n "$ENV_FILE" ]]; then
    COMPOSE_ARGS+=(--env-file "$ENV_FILE")
  fi
  # Ensure api image exists (migrate service uses ayeh-api:local)
  if ! docker image inspect ayeh-api:local >/dev/null 2>&1; then
    echo "→ Building api image (ayeh-api:local)…"
    docker compose "${COMPOSE_ARGS[@]}" build api
  fi
  echo "→ Ensuring database is healthy…"
  docker compose "${COMPOSE_ARGS[@]}" up -d db
  docker compose "${COMPOSE_ARGS[@]}" run --rm --no-deps migrate
  echo "→ Verifying migration status via one-shot container…"
  docker compose "${COMPOSE_ARGS[@]}" run --rm --no-deps --entrypoint \
    npx api prisma migrate status --schema server/prisma/schema.production.prisma || true
fi

echo
echo "✅ migrate deploy finished (check status output above for failures)."
echo "   If deploy failed: stop, inspect _prisma_migrations, prefer restore-from-backup."
echo "   See docs/DEPLOYMENT_RUNBOOK.md §§5–10."
