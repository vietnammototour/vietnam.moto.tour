#!/bin/bash
#
# One-shot VPS migration: drop legacy Tour.title and Destination.name columns.
#
# Designed to run AS-CI-CD on the VPS BEFORE merging this branch to main
# (so the destructive ALTER happens with a backup at hand, not silently
# during the regular `prisma migrate deploy` in deploy.sh).
#
# Usage (as root on VPS):
#   su - ci-cd -c "bash /var/www/vietnam-moto-tours/scripts/vps-drop-legacy-title-name.sh"
#
# Or directly as ci-cd:
#   cd /var/www/vietnam-moto-tours && bash scripts/vps-drop-legacy-title-name.sh
#
# Flags:
#   --dry-run    Show pre-check counts and the SQL, do nothing destructive.
#   --skip-backup  Skip pg_dump (NOT recommended).

set -euo pipefail

REPO_DIR="/var/www/vietnam-moto-tours"
BACKUP_DIR="/var/backups/vmt"
DB_NAME="vietnam_moto_tours"
MIGRATION_NAME="20260519000000_drop_legacy_title_name"
DRY_RUN=0
SKIP_BACKUP=0

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --skip-backup) SKIP_BACKUP=1 ;;
    *) echo "Unknown arg: $arg" >&2; exit 2 ;;
  esac
done

log() { printf '[%s] %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*"; }

if [ "$(id -un)" != "ci-cd" ]; then
  echo "ERROR: must run as ci-cd (current: $(id -un)). See header for invocation." >&2
  exit 1
fi

cd "$REPO_DIR"

export PATH="/home/ci-cd/.nvm/versions/node/v24.14.0/bin:$PATH"
set -a && source .env && set +a

psql_q() {
  sudo -n -u postgres psql -d "$DB_NAME" -tAc "$1"
}

log "pre-check: counting rows on legacy and localized columns"
psql_q "
  SELECT
    'Tour' AS tbl,
    COUNT(*) FILTER (WHERE title IS NOT NULL AND title <> '') AS legacy_filled,
    COUNT(*) FILTER (WHERE \"titleVi\" = '' AND title <> '') AS need_vi_backfill,
    COUNT(*) FILTER (WHERE \"titleEn\" = '' AND title <> '') AS need_en_backfill
  FROM \"Tour\";
"
psql_q "
  SELECT
    'Destination' AS tbl,
    COUNT(*) FILTER (WHERE name IS NOT NULL AND name <> '') AS legacy_filled,
    COUNT(*) FILTER (WHERE \"nameVi\" = '' AND name <> '') AS need_vi_backfill,
    COUNT(*) FILTER (WHERE \"nameEn\" = '' AND name <> '') AS need_en_backfill
  FROM \"Destination\";
"

log "pre-check: confirming legacy columns still present"
LEGACY_TOUR=$(psql_q "SELECT 1 FROM information_schema.columns WHERE table_name='Tour' AND column_name='title';" || true)
LEGACY_DEST=$(psql_q "SELECT 1 FROM information_schema.columns WHERE table_name='Destination' AND column_name='name';" || true)
if [ -z "$LEGACY_TOUR" ] && [ -z "$LEGACY_DEST" ]; then
  log "legacy columns already absent. Nothing to do."
  exit 0
fi

if [ "$DRY_RUN" = "1" ]; then
  log "DRY RUN — showing migration SQL and exiting"
  cat "prisma/migrations/${MIGRATION_NAME}/migration.sql"
  exit 0
fi

if [ "$SKIP_BACKUP" != "1" ]; then
  mkdir -p "$BACKUP_DIR"
  TS=$(date -u '+%Y%m%dT%H%M%SZ')
  BACKUP_FILE="${BACKUP_DIR}/pre-drop-legacy-title-name-${TS}.sql.gz"
  log "backing up DB to ${BACKUP_FILE}"
  sudo -n -u postgres pg_dump --clean --if-exists "$DB_NAME" | gzip -c > "$BACKUP_FILE"
  log "backup size: $(du -h "$BACKUP_FILE" | cut -f1)"
else
  log "WARNING: --skip-backup set, no pg_dump taken"
fi

log "running: npx prisma migrate deploy"
npx prisma migrate deploy

log "post-check: confirming legacy columns dropped"
STILL_TOUR=$(psql_q "SELECT 1 FROM information_schema.columns WHERE table_name='Tour' AND column_name='title';" || true)
STILL_DEST=$(psql_q "SELECT 1 FROM information_schema.columns WHERE table_name='Destination' AND column_name='name';" || true)
if [ -n "$STILL_TOUR" ] || [ -n "$STILL_DEST" ]; then
  log "ERROR: legacy columns still present after migration. Investigate."
  exit 3
fi

log "post-check: rows with empty localized titles/names (should be the same set that had empty legacy too)"
psql_q "SELECT COUNT(*) FROM \"Tour\" WHERE \"titleVi\" = '' OR \"titleEn\" = '';"
psql_q "SELECT COUNT(*) FROM \"Destination\" WHERE \"nameVi\" = '' OR \"nameEn\" = '';"

log "done. Migration applied. Backup retained at ${BACKUP_FILE:-<skipped>}"
log "Next: merge the branch so deploy.sh picks up the new app code (or pm2ci restart vietnam-moto-tours if already deployed)."
