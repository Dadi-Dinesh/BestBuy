# BestBuy PostgreSQL setup

BestBuy's Windows desktop app reads its connection settings in Electron's main process. For development, use the ignored `.env` at the project root. A packaged Windows installation reads `.env` from Electron's user-data folder, usually `%APPDATA%\BestBuy`. Environment variables set by the launcher take precedence.

Set these values using your own database credential.

```dotenv
DATA_ADAPTER=postgres
DATABASE_URL=
```

Use `DATA_ADAPTER=mock` for the existing demo. The browser-only Vite app uses demo services. To work with PostgreSQL locally, build and open the Electron application from the project root.

```text
npm run build
npm start
```

## Provision the database

Run `npm run db:migrate` with a migration credential that owns the BestBuy schema. The migration is transactional and versioned. It creates the `bestbuy` schema and leaves other schemas alone. The app checks the schema on startup. A fresh database starts with no marketplace accounts or sample records.

Create the first administrator using `npm run db:create-admin`. Supply `BESTBUY_ADMIN_EMAIL`, `BESTBUY_ADMIN_NAME`, and `BESTBUY_ADMIN_PASSWORD` in your process environment. Choose a password of at least 12 characters. Public registration is limited to customers and dealers. Remove the bootstrap password from the process environment when you finish.

The installed app should use a dedicated PostgreSQL login for the runtime connection and keep the migration credential in a separate operator environment. Grant the runtime login access only to the BestBuy schema. At minimum, the application needs schema usage, table reads, application data inserts and updates, and usage on its identity sequences. Database credentials on an installed computer are accessible to that computer's operator. Use this direct connection on managed installations. A deployment to customer-owned computers needs a server-side service that holds the database credentials.

## Data and service boundaries

- React services in `client/src/services` retain their existing interfaces and browser demo data. Electron preload exposes workflow requests through a restricted bridge.
- `electron/ipcHandlers.ts` keeps sessions in the main process and checks identity, role, and ownership. App restart requires a new sign-in.
- `src/database/adapters/PostgresDatabaseAdapter.ts` implements registration, dealership and inventory management, queue, offer and booking workflows, notifications, and administrative queries. `postgresQueries.ts` maps relational results to the existing TypeScript models.
- `src/database/migrations/001_initial.sql` defines the relational schema, constraints, and indexes. Canonical variants reference their vehicle model. A shared queue is unique per variant and city. Queue creation and monotonic position allocation occur within the same transaction, with a partial unique index enforcing one active entry per customer.
- Offer acceptance and booking creation are atomic. The booking saves its accepted price and lock expiry independently of later inventory updates. Listing removal retains the records needed by booking history and pricing audits.

Run `npm run db:verify` with a credential allowed to create schemas to test actual PostgreSQL operations. The test creates a uniquely named schema and drops only that schema after verification. All three database commands accept `BESTBUY_ENV_FILE` as an optional path to a private configuration file.

## India Edition

Run `npm run db:migrate` before using the India Edition against an existing database. Migration 002 seeds 88 reference models and adds test-drive slots, requests, history and a marketplace booking-window setting. It does not create dealer inventory or change existing listing, offer or booking amounts. Review historical currency and location data before exposing older records in the INR interface.

Dealer slots use India Standard Time. A database index permits just one occupying request per dealer, day and time, even across different variants. Requests await dealer confirmation. The Electron demo stores catalogue edits and test-drive requests under the local application profile. Demo accounts and inventory still reset when the mock adapter restarts. Browser-demo preferences and favourites are per device.

`npm run test:desktop` checks the Electron demo flows. `npm run db:verify` checks the database workflows in a disposable schema.

## Marketplace redesign and demo seed

Migration 003 declares INR for new inventory, offers and bookings, and adds seed ownership and password recovery tables. Apply it with `npm run db:migrate`. Monetary records from before migration 003 keep an unclassified currency and are excluded from marketplace screens. Review their source denomination before setting a historical record's currency to INR. The migration does not drop or convert any historical records.

Use a dedicated demo database for the Indian demo dataset. Set `DATABASE_URL` and `BESTBUY_DEMO_PASSWORD` (at least 12 characters) privately, then run:

```bash
npm run db:migrate
npm run db:seed:india
```

The seed creates five clearly labelled demo dealers, four customers, 48 listings, queue activity, a dealer offer, a vehicle booking and four test-drive examples. Its ownership registry and stable IDs make reruns skip existing seed rows. It reports created, updated, skipped and verified totals. The account emails use the reserved `india-demo.bestbuy.example` domain. The seed leaves existing accounts untouched.

For PostgreSQL password recovery, verify the account owner's identity before issuing a code with `npm run db:recovery -- account@example.com`. Share the one-time code securely with that account owner. The reset page accepts the code for 30 minutes. The application has no email delivery service.
