# Scheduled PostgreSQL Backup

## Overview

Monthly automated backup of the `vietnam_moto_tours` PostgreSQL database on the production VPS, with 6-month retention.

## Context

- **VPS:** Ubuntu 24.04, 961MB RAM + 2GB swap
- **DB:** PostgreSQL, database `vietnam_moto_tours`, user `vmtuser`
- **Scale:** ~5-10 destinations, ~10-30 tours, translations — dumps will be a few MB at most
- **Images:** Stored at `/var/www/uploads/`, outside the repo and unaffected by deploys — excluded from this backup

## Design

### Backup script

**Location:** `/home/ci-cd/db-backup.sh` (next to `deploy.sh`, outside the repo)

**Backup directory:** `/var/backups/postgres/`

```bash
#!/bin/bash
set -e

BACKUP_DIR="/var/backups/postgres"
DB_NAME="vietnam_moto_tours"
RETENTION_DAYS=180

mkdir -p "$BACKUP_DIR"

FILENAME="${DB_NAME}_$(date +%Y-%m-%d).sql.gz"

pg_dump "$DB_NAME" | gzip > "$BACKUP_DIR/$FILENAME"

# Delete backups older than 6 months
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete

logger "DB backup completed: $FILENAME"
```

### Cron schedule

Run on the 1st of every month at 03:00 server time, under the `postgres` user's crontab:

```
0 3 1 * * /home/ci-cd/db-backup.sh
```

Using `postgres` user because it has native DB access without needing credentials.

### Setup commands (one-time on VPS)

```bash
# Create backup directory
sudo mkdir -p /var/backups/postgres
sudo chown postgres:postgres /var/backups/postgres

# Create the script
sudo nano /home/ci-cd/db-backup.sh
# (paste script contents)
sudo chmod +x /home/ci-cd/db-backup.sh
sudo chown postgres:postgres /home/ci-cd/db-backup.sh

# Add cron entry for postgres user
sudo crontab -u postgres -e
# Add: 0 3 1 * * /home/ci-cd/db-backup.sh

# Test it manually
sudo -u postgres /home/ci-cd/db-backup.sh
ls -la /var/backups/postgres/
```

### Restore process

```bash
# Full restore (replaces all data)
gunzip -c /var/backups/postgres/vietnam_moto_tours_2026-05-01.sql.gz | sudo -u postgres psql -d vietnam_moto_tours

# Restore to a different database (for verification)
sudo -u postgres createdb vietnam_moto_tours_restore
gunzip -c /var/backups/postgres/vietnam_moto_tours_2026-05-01.sql.gz | sudo -u postgres psql -d vietnam_moto_tours_restore
```

## What's NOT included

- **Image backups:** Images at `/var/www/uploads/` are outside the repo, not affected by deploys, and don't need automated backup at this scale
- **Off-site backup:** All backups stay on the VPS. Acceptable for current scale
- **WAL archiving / point-in-time recovery:** Overkill for this dataset size
