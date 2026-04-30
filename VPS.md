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

## Application

- **Path:** `/var/www/vietnam-moto-tours`
- **Process manager:** pm2
- **pm2 name:** `vietnam-moto-tours`
- **Ownership:** `ci-cd:ci-cd` (required for CI/CD deploys)
- **Environment:** `.env` at project root (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL)

### pm2 Commands

```bash
pm2 status                           # Check app status
pm2 logs vietnam-moto-tours          # View logs
pm2 restart vietnam-moto-tours       # Restart app
pm2 save                             # Save process list for reboot
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
rm -rf .next
pnpm build
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

Uploaded images are stored in `/var/www/uploads/` and symlinked into the project:

```bash
# Create persistent uploads directory (one-time)
mkdir -p /var/www/uploads/destinations /var/www/uploads/tours
chown -R ci-cd:ci-cd /var/www/uploads

# Add to deploy script after build step:
ln -sfn /var/www/uploads /var/www/vietnam-moto-tours/public/uploads
```

The `UPLOAD_DIR` environment variable can override the default path (defaults to `{project}/public/uploads` for local dev).

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

# Manual deploy
bash /home/ci-cd/deploy.sh    # as root
# or
bash ~/deploy.sh              # as ci-cd user

# Generate bcrypt hash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('PASSWORD', 10).then(h => console.log(h));"

# Create admin user (after generating hash)
sudo -u postgres psql -d vietnam_moto_tours -c "INSERT INTO \"User\" (id, email, \"passwordHash\", name, role, \"createdAt\", \"updatedAt\") VALUES (gen_random_uuid(), 'user@example.com', 'BCRYPT_HASH', 'Name', 'ADMIN', now(), now());"

# Check resources
free -h
df -h
```
