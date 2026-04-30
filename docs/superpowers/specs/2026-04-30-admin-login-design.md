# Admin Login & Content Management — Design Spec

**Date:** 2026-04-30
**Status:** Approved

## Overview

Add an admin login flow with email/password authentication and a custom admin panel for managing tours, destinations, and translations. Data moves from static JSON files to PostgreSQL. The public site continues to work with minimal changes via ISR.

## Decisions

- **Auth:** NextAuth.js with credentials provider
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Session:** JWT stored in httpOnly secure cookie (stateless)
- **Admin panel:** Custom UI at `/admin/*` routes, built with Tailwind
- **Account creation:** No self-registration. First admin via seed script, additional admins via admin panel
- **Public site rendering:** ISR with `revalidate: 60` (replaces current static JSON imports)
- **Future scope (not in this spec):** Photo uploads, additional user roles

## Database Schema

### Users

| Column       | Type     | Notes                      |
| ------------ | -------- | -------------------------- |
| id           | UUID     | Primary key                |
| email        | String   | Unique                     |
| passwordHash | String   | bcrypt                     |
| name         | String   | Display name               |
| role         | Enum     | `ADMIN` (extensible later) |
| createdAt    | DateTime |                            |
| updatedAt    | DateTime |                            |

### Tours

| Column         | Type     | Notes                       |
| -------------- | -------- | --------------------------- |
| id             | UUID     | Primary key                 |
| slug           | String   | Unique                      |
| destinationId  | String   | Foreign key to Destinations |
| title_vi       | String   |                             |
| title_en       | String   |                             |
| description_vi | Text     |                             |
| description_en | Text     |                             |
| duration       | String   |                             |
| transport      | String   |                             |
| pricing        | JSONB    | Array of pricing tiers      |
| itinerary      | JSONB    | Array of itinerary items    |
| images         | JSONB    | Array of image URLs         |
| included       | JSONB    | Array of strings            |
| excluded       | JSONB    | Array of strings            |
| isActive       | Boolean  | Default true, soft delete   |
| createdAt      | DateTime |                             |
| updatedAt      | DateTime |                             |

### Destinations

| Column         | Type     | Notes        |
| -------------- | -------- | ------------ |
| id             | UUID     | Primary key  |
| slug           | String   | Unique       |
| name_vi        | String   |              |
| name_en        | String   |              |
| description_vi | Text     |              |
| description_en | Text     |              |
| image          | String   |              |
| isActive       | Boolean  | Default true |
| createdAt      | DateTime |              |
| updatedAt      | DateTime |              |

### Translations

| Column    | Type     | Notes                                      |
| --------- | -------- | ------------------------------------------ |
| id        | UUID     | Primary key                                |
| key       | String   | Dot-notation path (e.g. `home.hero.title`) |
| namespace | String   | e.g. `home`, `tours`, `common`             |
| value_vi  | Text     |                                            |
| value_en  | Text     |                                            |
| updatedAt | DateTime |                                            |

Unique constraint on `(namespace, key)`.

## Authentication Flow

### NextAuth Configuration

- Credentials provider: email + password
- bcrypt for password hashing/verification
- JWT strategy — token payload: `userId`, `email`, `name`, `role`
- Token stored in httpOnly, secure, sameSite cookie

### Login Flow

1. Admin clicks "Login" button in the site header (top right corner)
2. A modal window opens with email + password form
3. Submits credentials via NextAuth
4. Success: JWT cookie set, modal closes, header switches to show logout button
5. Failure: error message displayed inside the modal

### Header Integration

- **Logged out:** A "Login" button appears in the top right of the existing site Header
- **Logged in:** The "Login" button is replaced with admin name + "Logout" button
- The login modal is a shared component rendered in the Layout, controlled by state
- Clicking outside the modal or pressing Escape closes it

### Route Protection

- `middleware.ts` intercepts all `/admin/*` requests
- Also excludes `/api/auth/*` (NextAuth endpoints must be public)
- Checks for valid JWT in cookie via NextAuth's `getToken()`
- No valid token: redirect to `/` (home page)
- Valid token: request proceeds

### Account Management

- First admin: created via `pnpm db:seed-admin` CLI script
- Additional admins: created by existing admins through `/admin/users` (email, name, temporary password)
- Logout: clears JWT cookie via NextAuth signOut, header reverts to "Login" button

## Admin Panel

### Layout

Separate layout from public site — sidebar navigation + content area. No public header/footer.

### Pages

| Route                           | Purpose                                          |
| ------------------------------- | ------------------------------------------------ |
| `/admin`                        | Dashboard — overview stats (tour count, etc.)    |
| `/admin/tours`                  | Tours list with edit/delete/activate controls    |
| `/admin/tours/new`              | Create new tour form                             |
| `/admin/tours/[id]/edit`        | Edit tour form                                   |
| `/admin/destinations`           | Destinations list with edit/delete controls      |
| `/admin/destinations/new`       | Create destination                               |
| `/admin/destinations/[id]/edit` | Edit destination                                 |
| `/admin/translations`           | Translation editor — searchable/filterable table |
| `/admin/users`                  | Manage admin users (list, create, delete)        |

### Content Editing UX

- Tour/destination forms: side-by-side vi/en fields for localized content
- JSONB fields (pricing, itinerary): repeatable field groups (add/remove rows)
- Translations page: filterable table, inline editing, bulk save
- Client and server-side validation on all forms

### Styling

Tailwind CSS utility classes only. No UI library. Functional admin aesthetic.

## API Routes

All admin API routes protected by JWT validation via NextAuth session check.

### Auth

- `POST /api/auth/[...nextauth]` — NextAuth handler

### Tours

- `GET /api/admin/tours` — list all tours
- `POST /api/admin/tours` — create tour
- `GET /api/admin/tours/[id]` — get single tour
- `PUT /api/admin/tours/[id]` — update tour
- `DELETE /api/admin/tours/[id]` — soft delete (sets `isActive: false`)

### Destinations

- `GET /api/admin/destinations` — list all
- `POST /api/admin/destinations` — create
- `GET /api/admin/destinations/[id]` — get single
- `PUT /api/admin/destinations/[id]` — update
- `DELETE /api/admin/destinations/[id]` — soft delete

### Translations

- `GET /api/admin/translations?namespace=home` — list, filterable by namespace
- `PUT /api/admin/translations` — bulk update (array of `{key, value_vi, value_en}`)

### Users

- `GET /api/admin/users` — list admins
- `POST /api/admin/users` — create admin
- `DELETE /api/admin/users/[id]` — remove admin (cannot delete yourself)

## Data Migration & Public Site Integration

### Migration

- `pnpm db:seed` — reads `tours.json`, `destinations.json`, `vi.json`, `en.json` and inserts into database
- `pnpm db:seed-admin` — creates first admin user

### Public Site Data Flow

- **Before:** Pages import from `src/data/index.ts` which reads JSON files
- **After:** `src/data/index.ts` refactored to query PostgreSQL via Prisma
- Helper function signatures remain the same — minimal page code changes
- Pages switch from `getStaticProps` to `getStaticProps` with ISR (`revalidate: 60`)

### Translation Integration

- Helper fetches translations from Translations table, grouped by namespace
- Returns the same shape `next-intl` expects
- Fallback: if DB unreachable, fall back to static JSON files

## New Dependencies

- `next-auth` — authentication
- `@prisma/client` + `prisma` (dev) — ORM
- `bcrypt` + `@types/bcrypt` (dev) — password hashing

## File Structure (new files)

```
prisma/
  schema.prisma              # Prisma schema
  seed.ts                    # Data migration script
src/
  lib/
    prisma.ts                # Prisma client singleton
    auth.ts                  # NextAuth configuration
  pages/
    api/
      auth/[...nextauth].ts  # NextAuth API route
      admin/
        tours/
          index.ts           # GET (list), POST (create)
          [id].ts            # GET, PUT, DELETE
        destinations/
          index.ts           # GET, POST
          [id].ts            # GET, PUT, DELETE
        translations.ts      # GET, PUT
        users/
          index.ts           # GET, POST
          [id].ts            # DELETE
    admin/
      index.tsx              # Dashboard
      tours/
        index.tsx            # Tour list
        new.tsx              # Create tour
        [id]/
          edit.tsx           # Edit tour
      destinations/
        index.tsx
        new.tsx
        [id]/
          edit.tsx
      translations.tsx
      users.tsx
  components/
    admin/
      AdminLayout.tsx        # Sidebar + content layout
      LoginModal.tsx         # Login form modal (rendered in Layout)
      TourForm.tsx           # Shared create/edit tour form
      DestinationForm.tsx    # Shared create/edit destination form
      TranslationEditor.tsx  # Inline translation table
  middleware.ts              # Route protection
```
