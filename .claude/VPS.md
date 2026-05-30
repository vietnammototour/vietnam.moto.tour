# VPS Production Server

## Server Info

- **OS:** Ubuntu 24.04
- **RAM:** 961MB + 2GB swap (`/swapfile`)
- **Hostname:** server1.vietnam-moto.tours

## Users

- **root** — main admin, has nvm/node/pnpm at `/root/.nvm/`
- **ci-cd** — GitHub Actions SSH user, has nvm/node/pnpm at `/home/ci-cd/.nvm/`
- **deploy** — exists but not actively used

## Node.js

- **Version:** v24.14.0 (via nvm)
- **pnpm:** v10.33.2
- **Node bin (ci-cd):** `/home/ci-cd/.nvm/versions/node/v24.14.0/bin/`
- **Node bin (root):** `/root/.nvm/versions/node/v24.14.0/bin/`

## PostgreSQL

- **DB name:** `vietnam_moto_tours`
- **DB user:** `vmtuser`
- **Roles:** `postgres` (superuser), `vmtuser`, `mototours`
- **Access:** localhost:5432
- **Query example:** `sudo -u postgres psql -d vietnam_moto_tours -c 'SELECT id, email, name, role FROM "User";'`
- Note: Prisma uses uppercase table names — always quote them (`"User"`, `"Tour"`, etc.)

## Command Convention

**Always `cd /var/www/vietnam-moto-tours` first.** Every VPS command suggested to the user must start by entering the project directory, even when the command would technically work from `$HOME`. Keeps logs, `.env` access, `pnpm`, `prisma`, and relative paths consistent and avoids accidentally running against the wrong working dir.

Example:

```bash
cd /var/www/vietnam-moto-tours && pm2ci restart vietnam-moto-tours
cd /var/www/vietnam-moto-tours && pm2ci logs vietnam-moto-tours --lines 50
```

## Application

- **Path:** `/var/www/vietnam-moto-tours`
- **Process manager:** pm2 (runs under `ci-cd` user, NOT root)
- **pm2 name:** `vietnam-moto-tours`
- **pm2 binary:** `/home/ci-cd/.nvm/versions/node/v24.14.0/lib/node_modules/pm2/bin/pm2`
- **Ownership:** `ci-cd:ci-cd` (required for CI/CD deploys)
- **Environment:** `.env` at project root (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL)

### pm2 Commands

**IMPORTANT:** Always use ci-cd's pm2, never root's. Running `pm2` as root creates a second daemon that fights for port 3000.

Set up alias (one-time): `echo 'alias pm2ci="sudo -u ci-cd /home/ci-cd/.nvm/versions/node/v24.14.0/lib/node_modules/pm2/bin/pm2"' >> /root/.bashrc`

```bash
pm2ci status                           # Check app status
pm2ci logs vietnam-moto-tours          # View logs
pm2ci restart vietnam-moto-tours       # Restart app
pm2ci save                             # Save process list for reboot
```

## CI/CD Deployment

### GitHub Secrets

- `SSH_HOST` — VPS IP
- `SSH_USER` — `ci-cd`
- `SSH_PRIVATE_KEY` — SSH private key (public key in `/home/ci-cd/.ssh/authorized_keys`)

### Deploy Script

Located at `/home/ci-cd/deploy.sh` (**outside the repo** — repo files get reset by `git checkout -- .`).

```bash
#!/bin/bash
set -e
export CI=true
export PATH="/home/ci-cd/.nvm/versions/node/v24.14.0/bin:$PATH"
cd /var/www/vietnam-moto-tours
git checkout -- .
git pull origin main
set -a && source .env && set +a
rm -rf node_modules
pnpm install --frozen-lockfile
npx prisma generate
npx prisma migrate deploy
# Copy uploads for build (Turbopack rejects symlinks outside project root)
rm -rf public/uploads
cp -r /var/www/uploads public/uploads
rm -rf .next
# Required — Next 16.2 Turbopack worker OOMs at ~478MB under default v8 heap cap
export NODE_OPTIONS="--max-old-space-size=2048"
pnpm build
# Replace copy with symlink for runtime serving (new uploads go to /var/www/uploads)
rm -rf public/uploads
ln -sfn /var/www/uploads public/uploads
pm2 restart vietnam-moto-tours
```

### Why the Script Lives Outside the Repo

The deploy process runs `git checkout -- .` which reverts all local changes, then `git pull`. If `deploy.sh` were inside the repo, it would overwrite itself mid-execution.

### Key Gotchas

- **appleboy/ssh-action** runs a non-login shell — `export PATH` and `nvm use` don't persist between inline script lines. External bash script required.
- **`CI=true`** must be set or pnpm prompts for TTY confirmation on `node_modules` purge.
- **`rm -rf node_modules`** before install avoids EACCES permission errors when pnpm tries to recreate modules.
- **`set -a && source .env && set +a`** exports all .env vars so Prisma `env()` helper can read DATABASE_URL.
- **Swap is essential** — Next.js build uses 1-2GB RAM, VPS only has 961MB. Without swap, build crashes the server.
- **`NODE_OPTIONS=--max-old-space-size=2048` required for build** — without it, Next 16.2 Turbopack build worker SIGABRTs at ~478MB heap with `FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory`. Swap alone is not enough; v8 enforces the per-process cap before swap is touched.
- **Workflow can report ✅ while build fails** — `appleboy/ssh-action` does not default to `script_stop: true`. If `bash /home/ci-cd/deploy.sh` exits non-zero (e.g. build OOM), the next inline commands in the workflow (`prisma/seed*.ts` etc.) still run, and their success masks the failed build. Symptom: workflow green, pm2 still serving stale `.next/` (or worse, deploy.sh's `rm -rf .next` ran but `pnpm build` failed → no `.next/` at all → all SSR routes 500). Fix: add `script_stop: true` under the action's `with:` block.
- **`pm2ci` alias is root-only and interactive-only** — defined in `/root/.bashrc`. Does NOT work in non-login shells, scripts, or under any other user. From `ci-cd`'s shell use bare `pm2`. From anywhere else use the full path: `sudo -u ci-cd /home/ci-cd/.nvm/versions/node/v24.14.0/lib/node_modules/pm2/bin/pm2 <cmd> vietnam-moto-tours`.
- **No symlinks in `public/`** — Turbopack rejects symlinks pointing outside the project root. Use `cp -r` instead (see Image Uploads section).
- **Never run project commands as root** — creates files owned by root in `.next/`, `node_modules/`, etc. that ci-cd can't delete on next deploy. Always use `su - ci-cd` for manual operations. If this happens, fix with `chown -R ci-cd:ci-cd /var/www/vietnam-moto-tours`.

### Editing deploy.sh on the VPS

The deploy script lives at `/home/ci-cd/deploy.sh` and must be edited as root (or with `sudo`).

- **Ghostty / unknown terminal:** nano/vim error with `Error opening terminal: xterm-ghostty`. Prefix the command: `TERM=xterm nano /home/ci-cd/deploy.sh`.
- **No-editor one-liner** (insert a line before `pnpm build`):

  ```bash
  sed -i 's|^  pnpm build$|  export NODE_OPTIONS="--max-old-space-size=2048"\n  pnpm build|' /home/ci-cd/deploy.sh
  grep -n NODE_OPTIONS /home/ci-cd/deploy.sh  # verify
  ```

  If `sed` newline interpolation misbehaves on the host, use Python:

  ```bash
  python3 -c "
  p='/home/ci-cd/deploy.sh'
  s=open(p).read()
  s=s.replace('  pnpm build','  export NODE_OPTIONS=\"--max-old-space-size=2048\"\n  pnpm build')
  open(p,'w').write(s)"
  ```

### Recovery runbook — admin pages 500 / Next i18n ENOENT after a deploy

Symptom in `pm2 logs`: `Error: Failed to load static file for page: /en/admin ENOENT: no such file or directory, open '.../.next/server/pages/en/admin.html'`.

This means the new build was never produced (typically OOM) and pm2 is either serving a stale `.next/` or running with no `.next/` at all.

```bash
# 1. As root: confirm deploy.sh has the heap flag
grep -n NODE_OPTIONS /home/ci-cd/deploy.sh

# 2. Re-run the deploy as ci-cd
su - ci-cd -c 'bash /home/ci-cd/deploy.sh'

# 3. Verify build artifact
cat /var/www/vietnam-moto-tours/.next/BUILD_ID

# 4. Restart pm2 (only needed if deploy.sh's own restart line was skipped)
sudo -u ci-cd /home/ci-cd/.nvm/versions/node/v24.14.0/lib/node_modules/pm2/bin/pm2 restart vietnam-moto-tours

# 5. Smoke test — expect 307 (auth redirect), NOT 500
curl -sI http://localhost:3000/en/admin | head -3
curl -sI http://localhost:3000/en/admin/destinations | head -3
curl -sI http://localhost:3000/en/admin/translations | head -3

# 6. Confirm no ENOENT in error log
sudo -u ci-cd /home/ci-cd/.nvm/versions/node/v24.14.0/lib/node_modules/pm2/bin/pm2 logs vietnam-moto-tours --err --lines 30 --nostream
```

Note: pages using `getServerSideProps` (admin dashboard, destinations list, translations) deliberately produce no prerendered `.html`. After the fix, Next stops looking for the file and the ENOENT goes away.

## Swap

```bash
# Already configured, persists across reboots
/swapfile none swap sw 0 0    # in /etc/fstab
```

## Prisma

- **Config:** `prisma.config.ts` uses `env('DATABASE_URL')` from `prisma/config` (auto-loads `.env`)
- **Schema:** `prisma/schema.prisma` — datasource has no `url` (Prisma 7 requirement — URL comes from config only)
- **Migrations:** `npx prisma migrate deploy`
- **Seed data:** `npx tsx prisma/seed.ts` (tours, destinations from JSON)
- **Seed admin:** Create users via psql or `prisma/seed-admin.ts`

## Image Uploads

Uploaded images are stored persistently in `/var/www/uploads/` (outside the repo, survives deploys).

**Important:** Turbopack rejects symlinks outside the project root during `pnpm build`, but Next.js serves them fine at runtime. The deploy script handles this with a two-step approach:

1. **Before build:** `cp -r /var/www/uploads public/uploads` (real copy for Turbopack)
2. **After build:** `rm -rf public/uploads && ln -sfn /var/www/uploads public/uploads` (symlink for runtime — new uploads go to persistent storage and are served immediately)

```bash
# Create persistent uploads directory (one-time)
mkdir -p /var/www/uploads/destinations /var/www/uploads/tours
chown -R ci-cd:ci-cd /var/www/uploads
```

**Production `.env` must include:** `UPLOAD_DIR=/var/www/uploads` so the upload API writes to persistent storage, not the project copy.

For local dev, `UPLOAD_DIR` defaults to `{project}/public/uploads`.

## Auth

- **NextAuth v4** with credentials provider (email/username + bcrypt password)
- **JWT session**, 24h expiry
- **No signup route** — admin users created manually via DB
- **Login field:** accepts username (not email-validated)

## Useful Commands on VPS

```bash
# Check app
pm2 status
pm2 logs vietnam-moto-tours --lines 50

# Database
sudo -u postgres psql -d vietnam_moto_tours
sudo -u postgres psql -d vietnam_moto_tours -c 'SELECT email, name, role FROM "User";'

# Manual deploy — ALWAYS as ci-cd, never as root
su - ci-cd -c "cd /var/www/vietnam-moto-tours && bash ~/deploy.sh"

# Generate bcrypt hash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('PASSWORD', 10).then(h => console.log(h));"

# Create admin user (after generating hash)
sudo -u postgres psql -d vietnam_moto_tours -c "INSERT INTO \"User\" (id, email, \"passwordHash\", name, role, \"createdAt\", \"updatedAt\") VALUES (gen_random_uuid(), 'user@example.com', 'BCRYPT_HASH', 'Name', 'ADMIN', now(), now());"

# Check resources
free -h
df -h
```

## Image uploads (post-migration)

Files live at `/var/lib/vmt-uploads`, owned by the pm2 user. **Not** inside the repo. Deploys cannot touch them.

Bootstrap (run once as root):

    mkdir -p /var/lib/vmt-uploads
    chown <pm2-user>:<pm2-user> /var/lib/vmt-uploads
    chmod 0750 /var/lib/vmt-uploads

Set in `.env` on the VPS:

    UPLOAD_DIR=/var/lib/vmt-uploads

Health check: `curl localhost:3000/api/health/uploads` → `{writable, freeBytes}`.

### Weekly orphan sweep

Add to root crontab:

    0 4 * * 0 cd /var/www/vietnam-moto-tours && /home/ci-cd/.nvm/versions/node/v24.14.0/bin/pnpm sweep:uploads >> /var/log/vmt-sweep.log 2>&1

### Backup

    0 3 * * * rsync -a /var/lib/vmt-uploads/ /backup/vmt-uploads/

### One-shot legacy migration

Run once after deploying the new code, before the final cleanup commit:

    cd /var/www/vietnam-moto-tours
    pnpm migrate:uploads --dry-run    # review
    pnpm migrate:uploads

### Manual VPS migration runbook

1. SSH to VPS.
2. Run bootstrap commands above.
3. Confirm `/var/lib/vmt-uploads` exists and is writable by pm2 user.
4. Pull the deployed code (latest with upload changes).
5. Run `pnpm migrate:uploads --dry-run`, review output.
6. Run `pnpm migrate:uploads`.
7. Edit `/var/www/vietnam-moto-tours/.env`, add `UPLOAD_DIR=/var/lib/vmt-uploads`.
8. `pm2ci restart all`.
9. Open the site, verify destination/tour images render.
10. Verify admin panel upload + delete works end to end.

**Rollback:** comment out `UPLOAD_DIR` in `.env`, `pm2ci restart all`. Code falls back to `<cwd>/.uploads`. To restore service quickly: `mv /var/lib/vmt-uploads/* <repo>/public/uploads/`.

## Database Backups

Admin-triggered and monthly automated PostgreSQL backups (`pg_dump` custom format).

- **Storage:** `BACKUP_DIR=/var/lib/vmt-backups` (outside the repo). Contains user emails + bcrypt hashes — keep `0700`.
- **Retention:** newest 10 kept; each new backup deletes the oldest.
- **Format:** `pg_dump -Fc` → `.dump`, restored with `pg_restore`.

### Bootstrap (one-time, as root)

```bash
mkdir -p /var/lib/vmt-backups
chown ci-cd:ci-cd /var/lib/vmt-backups
chmod 0700 /var/lib/vmt-backups
```

Add `BACKUP_DIR=/var/lib/vmt-backups` to `/var/www/vietnam-moto-tours/.env`, then `pm2ci restart vietnam-moto-tours`.

### Seed the UI translations (one-time, on the DB)

```bash
cd /var/www/vietnam-moto-tours && npx tsx prisma/seed-backups-translations.ts
```

### Monthly cron (1st of month, 03:00) — root crontab

```cron
0 3 1 * * cd /var/www/vietnam-moto-tours && /home/ci-cd/.nvm/versions/node/v24.14.0/bin/pnpm backup:db >> /var/log/vmt-backup.log 2>&1
```

`pg_dump` must be on PATH (default `/usr/bin/pg_dump` from the postgres apt package). Override with `PG_DUMP_BIN` in `.env` if it lives elsewhere.

### Restore a backup

```bash
pg_restore -d vietnam_moto_tours --clean --if-exists /var/lib/vmt-backups/vmt-<timestamp>-<source>.dump
```

### Manual backup from the admin panel

`/admin/backups` → **Create backup**. Lists all backups with created time, source (manual/scheduled), size, and a Download button (ADMIN only; streamed through an auth-gated route).
