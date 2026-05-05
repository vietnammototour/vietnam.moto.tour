# Scheduled DB Backup Implementation Plan

> **Note:** This is a VPS ops task. All steps are executed on the production server via SSH, not locally.

**Goal:** Set up a monthly automated PostgreSQL backup with 6-month retention on the VPS.

**Architecture:** A bash script run by cron under the `postgres` user dumps the database, compresses it, and cleans up old backups.

**Tech Stack:** pg_dump, gzip, cron, bash

---

### Task 1: Create backup directory

**On VPS as root:**

- [ ] **Step 1: Create directory and set ownership**

```bash
mkdir -p /var/backups/postgres
chown postgres:postgres /var/backups/postgres
```

- [ ] **Step 2: Verify**

```bash
ls -la /var/backups/ | grep postgres
```

Expected: `drwxr-xr-x postgres postgres ... postgres`

---

### Task 2: Create backup script

- [ ] **Step 1: Create the script file**

```bash
cat > /home/ci-cd/db-backup.sh << 'EOF'
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
EOF
```

- [ ] **Step 2: Set permissions**

```bash
chmod +x /home/ci-cd/db-backup.sh
chown postgres:postgres /home/ci-cd/db-backup.sh
```

- [ ] **Step 3: Verify script exists and is executable**

```bash
ls -la /home/ci-cd/db-backup.sh
```

Expected: `-rwxr-xr-x postgres postgres ... /home/ci-cd/db-backup.sh`

---

### Task 3: Test the script manually

- [ ] **Step 1: Run the script as postgres user**

```bash
sudo -u postgres /home/ci-cd/db-backup.sh
```

- [ ] **Step 2: Verify backup was created**

```bash
ls -la /var/backups/postgres/
```

Expected: `vietnam_moto_tours_2026-05-05.sql.gz` (few KB/MB)

- [ ] **Step 3: Verify backup is valid by inspecting contents**

```bash
gunzip -c /var/backups/postgres/vietnam_moto_tours_2026-05-05.sql.gz | head -20
```

Expected: SQL statements starting with `--` comments and `SET` commands

- [ ] **Step 4: Check syslog for success message**

```bash
grep "DB backup completed" /var/log/syslog | tail -1
```

Expected: `DB backup completed: vietnam_moto_tours_2026-05-05.sql.gz`

---

### Task 4: Set up cron job

- [ ] **Step 1: Add cron entry for postgres user**

```bash
sudo crontab -u postgres -e
```

Add this line:

```
0 3 1 * * /home/ci-cd/db-backup.sh
```

This runs at 03:00 on the 1st of every month.

- [ ] **Step 2: Verify cron entry was saved**

```bash
sudo crontab -u postgres -l
```

Expected: Shows the line `0 3 1 * * /home/ci-cd/db-backup.sh`

---

### Task 5: Document in VPS.md

- [ ] **Step 1: Add backup section to VPS.md**

Add after the "Useful Commands on VPS" section:

````markdown
## Database Backups

- **Script:** `/home/ci-cd/db-backup.sh` (runs as `postgres` user)
- **Schedule:** 1st of every month at 03:00 (cron)
- **Location:** `/var/backups/postgres/`
- **Retention:** 6 months (180 days), older dumps auto-deleted
- **Format:** `vietnam_moto_tours_YYYY-MM-DD.sql.gz`

```bash
# Check existing backups
ls -la /var/backups/postgres/

# Manual backup
sudo -u postgres /home/ci-cd/db-backup.sh

# Restore (replaces all data)
gunzip -c /var/backups/postgres/vietnam_moto_tours_YYYY-MM-DD.sql.gz | sudo -u postgres psql -d vietnam_moto_tours

# Restore to separate database (for verification)
sudo -u postgres createdb vietnam_moto_tours_restore
gunzip -c /var/backups/postgres/vietnam_moto_tours_YYYY-MM-DD.sql.gz | sudo -u postgres psql -d vietnam_moto_tours_restore
```
````

````

- [ ] **Step 2: Commit VPS.md update**

```bash
git add VPS.md
git commit -m "docs: add database backup instructions to VPS.md"
````
