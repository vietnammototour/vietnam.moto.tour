/**
 * Tours, destinations, highlights, and translations are managed exclusively
 * via the admin UI and live in the database. There is no JSON source of
 * truth to seed from. This script is intentionally a no-op so that
 * `prisma db seed` (invoked by the deploy pipeline) succeeds without
 * touching production data.
 *
 * To bootstrap an initial admin user, run `pnpm db:seed-admin`.
 */
async function main(): Promise<void> {
  console.log('seed: db-driven mode, nothing to seed.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .then(() => process.exit(0));
