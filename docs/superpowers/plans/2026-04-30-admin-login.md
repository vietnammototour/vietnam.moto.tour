# Admin Login & Content Management — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin authentication, PostgreSQL database, and an admin panel for managing tours, destinations, translations, and users.

**Architecture:** NextAuth.js handles JWT-based auth with credentials provider. Prisma ORM manages the PostgreSQL schema and queries. The existing static JSON data is migrated to the database. Public pages switch to ISR with `revalidate: 60`. Admin pages live under `/admin/*` with a separate layout. Login is a modal in the site header.

**Tech Stack:** NextAuth.js, Prisma, PostgreSQL, bcrypt, Tailwind CSS

---

## File Map

### New files

```
prisma/
  schema.prisma                              # Prisma schema (all models)
  seed.ts                                    # Data migration: JSON → DB
  seed-admin.ts                              # Create first admin user

src/
  lib/
    prisma.ts                                # Prisma client singleton
    auth.ts                                  # NextAuth config (credentials provider, JWT callbacks)
    admin-auth.ts                            # Helper: validate admin session in API routes

  pages/
    api/
      auth/[...nextauth].ts                  # NextAuth catch-all API route
      admin/
        tours/
          index.ts                           # GET (list), POST (create)
          [id].ts                            # GET, PUT, DELETE
        destinations/
          index.ts                           # GET, POST
          [id].ts                            # GET, PUT, DELETE
        translations.ts                      # GET, PUT (bulk)
        users/
          index.ts                           # GET, POST
          [id].ts                            # DELETE
    admin/
      index.tsx                              # Dashboard
      tours/
        index.tsx                            # Tour list
        new.tsx                              # Create tour
        [id]/
          edit.tsx                           # Edit tour
      destinations/
        index.tsx                            # Destination list
        new.tsx                              # Create destination
        [id]/
          edit.tsx                           # Edit destination
      translations.tsx                       # Translation editor
      users.tsx                              # User management

  components/
    admin/
      AdminLayout.tsx                        # Sidebar + content area wrapper
      LoginModal.tsx                         # Login modal (email/password form)
      TourForm.tsx                           # Shared create/edit tour form
      DestinationForm.tsx                    # Shared create/edit destination form
      TranslationEditor.tsx                  # Inline translation table

  middleware.ts                              # Protect /admin/* routes
```

### Modified files

```
src/components/header/index.tsx              # Add Login/Logout button
src/components/layout/index.tsx              # Render LoginModal, pass auth state
src/data/index.ts                            # Query Prisma instead of JSON imports
src/types/index.ts                           # Add admin-related types
src/pages/_app.tsx                           # Wrap with SessionProvider
src/pages/index.tsx                          # Switch to ISR (add revalidate)
src/pages/tours.tsx                          # Switch to ISR
src/pages/tours/[slug].tsx                   # Switch to ISR
src/pages/about-us.tsx                       # Switch to ISR
src/pages/contact.tsx                        # Switch to ISR
src/messages/en.json                         # Add admin/login translation keys
src/messages/vi.json                         # Add admin/login translation keys
package.json                                 # Add dependencies (next-auth, prisma, bcrypt)
```

---

## Task 1: Install dependencies and configure Prisma

**Files:**

- Modify: `package.json`
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`

- [ ] **Step 1: Install dependencies**

```bash
pnpm add next-auth @prisma/client bcrypt
pnpm add -D prisma @types/bcrypt
```

- [ ] **Step 2: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

This creates `prisma/schema.prisma` and `.env`. The `.env` file will contain `DATABASE_URL`.

- [ ] **Step 3: Write the Prisma schema**

Replace the generated `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  name         String
  role         Role     @default(ADMIN)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Tour {
  id             String   @id @default(uuid())
  slug           String   @unique
  destinationId  String
  destination    Destination @relation(fields: [destinationId], references: [id])
  title          String
  titleVi        String   @default("")
  titleEn        String   @default("")
  imageUrl       String   @default("")
  rating         String   @default("")
  price          Float    @default(0)
  duration       String   @default("")
  distance       String   @default("")
  descriptionVi  String   @default("")
  descriptionEn  String   @default("")
  transportation String   @default("")
  groupSize      String   @default("")
  hotel          String   @default("")
  guided         String   @default("")
  heroImage      String   @default("")
  images         Json     @default("[]")
  highlights     Json     @default("[]")
  itinerary      Json     @default("[]")
  pricingGroups  Json     @default("[]")
  included       Json     @default("[]")
  excluded       Json     @default("[]")
  paymentDetails Json     @default("{}")
  notes          Json     @default("[]")
  mealsInfo      Json     @default("{}")
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model Destination {
  id             String   @id @default(uuid())
  slug           String   @unique
  name           String
  nameVi         String   @default("")
  nameEn         String   @default("")
  imageUrl       String   @default("")
  descriptionVi  String   @default("")
  descriptionEn  String   @default("")
  size           String   @default("small")
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  tours          Tour[]
}

model Translation {
  id        String   @id @default(uuid())
  namespace String
  key       String
  valueVi   String   @default("")
  valueEn   String   @default("")
  updatedAt DateTime @updatedAt

  @@unique([namespace, key])
}
```

- [ ] **Step 4: Create Prisma client singleton**

Create `src/lib/prisma.ts`:

```typescript
import {PrismaClient} from '@prisma/client';

const globalForPrisma = globalThis as unknown as {prisma: PrismaClient};

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

- [ ] **Step 5: Set up the database URL**

Add to `.env` (create if not exists):

```
DATABASE_URL="postgresql://user:password@localhost:5432/vietnam_moto_tours?schema=public"
```

Make sure `.env` is in `.gitignore`.

- [ ] **Step 6: Run first migration**

```bash
npx prisma migrate dev --name init
```

- [ ] **Step 7: Verify migration**

```bash
npx prisma studio
```

Confirm all four tables (User, Tour, Destination, Translation) exist with correct columns.

- [ ] **Step 8: Commit**

```bash
git add prisma/schema.prisma src/lib/prisma.ts package.json pnpm-lock.yaml .gitignore
git commit -m "feat: add Prisma schema with User, Tour, Destination, Translation models"
```

---

## Task 2: Data migration — seed scripts

**Files:**

- Create: `prisma/seed.ts`
- Create: `prisma/seed-admin.ts`
- Modify: `package.json` (add seed scripts)

- [ ] **Step 1: Write the data seed script**

Create `prisma/seed.ts`:

```typescript
import {PrismaClient} from '@prisma/client';
import toursJson from '../src/data/tours.json';
import destinationsJson from '../src/data/destinations.json';
import enMessages from '../src/messages/en.json';
import viMessages from '../src/messages/vi.json';

const prisma = new PrismaClient();

function flattenMessages(
  obj: Record<string, unknown>,
  prefix = '',
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(
        result,
        flattenMessages(value as Record<string, unknown>, fullKey),
      );
    } else {
      result[fullKey] = String(value);
    }
  }
  return result;
}

async function main() {
  console.log('Seeding destinations...');

  const destinationIdMap = new Map<number, string>();

  for (const dest of destinationsJson) {
    const created = await prisma.destination.create({
      data: {
        slug: dest.name.toLowerCase().replace(/\s+/g, '-'),
        name: dest.name,
        nameVi: dest.name,
        nameEn: dest.name,
        imageUrl: dest.imageUrl,
        size: dest.size,
      },
    });
    destinationIdMap.set(dest.id, created.id);
  }

  console.log(`Seeded ${destinationsJson.length} destinations.`);

  console.log('Seeding tours...');

  for (const tour of toursJson) {
    const destId = destinationIdMap.get(tour.destinationId);
    if (!destId) {
      console.warn(
        `Skipping tour "${tour.title}": destination ${tour.destinationId} not found`,
      );
      continue;
    }

    await prisma.tour.create({
      data: {
        slug: tour.slug,
        destinationId: destId,
        title: tour.title,
        titleVi: tour.title,
        titleEn: tour.title,
        imageUrl: tour.imageUrl,
        rating: tour.rating,
        price: tour.price,
        duration: tour.duration,
        distance: tour.distance,
        descriptionVi: tour.description.vi,
        descriptionEn: tour.description.en,
        transportation: tour.transportation,
        groupSize: tour.groupSize,
        hotel: tour.hotel,
        guided: tour.guided,
        heroImage: tour.heroImage,
        images: tour.images,
        highlights: tour.highlights,
        itinerary: tour.itinerary,
        pricingGroups: tour.pricingGroups,
        included: tour.included,
        excluded: tour.excluded,
        paymentDetails: tour.paymentDetails,
        notes: tour.notes,
        mealsInfo: tour.mealsInfo,
      },
    });
  }

  console.log(`Seeded ${toursJson.length} tours.`);

  console.log('Seeding translations...');

  const flatEn = flattenMessages(enMessages as Record<string, unknown>);
  const flatVi = flattenMessages(viMessages as Record<string, unknown>);

  const allKeys = new Set([...Object.keys(flatEn), ...Object.keys(flatVi)]);
  let translationCount = 0;

  for (const fullKey of allKeys) {
    const dotIndex = fullKey.indexOf('.');
    const namespace = dotIndex > -1 ? fullKey.slice(0, dotIndex) : 'common';
    const key = dotIndex > -1 ? fullKey.slice(dotIndex + 1) : fullKey;

    await prisma.translation.create({
      data: {
        namespace,
        key,
        valueEn: flatEn[fullKey] ?? '',
        valueVi: flatVi[fullKey] ?? '',
      },
    });
    translationCount++;
  }

  console.log(`Seeded ${translationCount} translations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Write the admin seed script**

Create `prisma/seed-admin.ts`:

```typescript
import {PrismaClient} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Admin';

  if (!email || !password) {
    console.error(
      'Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... pnpm db:seed-admin',
    );
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({where: {email}});
  if (existing) {
    console.log(`Admin with email "${email}" already exists.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: 'ADMIN',
    },
  });

  console.log(`Admin created: ${user.email} (${user.name})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 3: Add seed scripts to package.json**

Add to `"scripts"` in `package.json`:

```json
"db:seed": "npx tsx prisma/seed.ts",
"db:seed-admin": "npx tsx prisma/seed-admin.ts",
"db:migrate": "npx prisma migrate dev",
"db:studio": "npx prisma studio"
```

- [ ] **Step 4: Run seed and verify**

```bash
pnpm db:seed
```

Expected: logs showing seeded destinations, tours, and translations with correct counts.

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=changeme ADMIN_NAME=Admin pnpm db:seed-admin
```

Expected: `Admin created: admin@example.com (Admin)`

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts prisma/seed-admin.ts package.json
git commit -m "feat: add data seed scripts for tours, destinations, translations, and admin user"
```

---

## Task 3: NextAuth configuration

**Files:**

- Create: `src/lib/auth.ts`
- Create: `src/lib/admin-auth.ts`
- Create: `src/pages/api/auth/[...nextauth].ts`
- Modify: `src/pages/_app.tsx`

- [ ] **Step 1: Create NextAuth configuration**

Create `src/lib/auth.ts`:

```typescript
import type {NextAuthOptions} from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import {prisma} from './prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: {label: 'Email', type: 'email'},
        password: {label: 'Password', type: 'password'},
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: {email: credentials.email},
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash,
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({token, user}) {
      if (user) {
        token.role = user.role;
        token.userId = user.id;
      }
      return token;
    },
    async session({session, token}) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/', // No dedicated sign-in page; modal handles it
  },
};
```

- [ ] **Step 2: Create admin auth helper**

Create `src/lib/admin-auth.ts`:

```typescript
import type {NextApiRequest, NextApiResponse} from 'next';
import {getServerSession} from 'next-auth';
import {authOptions} from './auth';

export async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<boolean> {
  const session = await getServerSession(req, res, authOptions);

  if (!session || session.user?.role !== 'ADMIN') {
    res.status(401).json({error: 'Unauthorized'});
    return false;
  }

  return true;
}
```

- [ ] **Step 3: Create NextAuth API route**

Create `src/pages/api/auth/[...nextauth].ts`:

```typescript
import NextAuth from 'next-auth';
import {authOptions} from '@/lib/auth';

export default NextAuth(authOptions);
```

- [ ] **Step 4: Add NextAuth type augmentation**

Create `src/types/next-auth.d.ts`:

```typescript
import 'next-auth';

declare module 'next-auth' {
  interface User {
    role: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    userId: string;
  }
}
```

- [ ] **Step 5: Wrap \_app.tsx with SessionProvider**

Modify `src/pages/_app.tsx` — add SessionProvider:

```typescript
import type {AppProps} from 'next/app';
import {SessionProvider} from 'next-auth/react';
import {NextIntlClientProvider} from 'next-intl';
import {useRouter} from 'next/router';
import {DM_Sans} from 'next/font/google';
import localFont from 'next/font/local';
import {ThemeProvider} from '@/components/theme-provider';
import {Layout} from '../components/layout/index';
import '@/styles/globals.css';
import viMessages from '@/messages/vi.json';
import enMessages from '@/messages/en.json';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '600', '700'],
  display: 'swap',
});

const outBrave = localFont({
  src: [
    {
      path: '../../public/assets/fonts/outbrave.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/assets/fonts/outbrave.otf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-outbrave',
  display: 'swap',
});

const allMessages: Record<string, typeof viMessages> = {
  vi: viMessages,
  en: enMessages,
};

export default function App({
  Component,
  pageProps: {session, ...pageProps},
}: AppProps) {
  const router = useRouter();
  const locale = router.locale ?? 'vi';
  const messages = pageProps.messages ?? allMessages[locale];

  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          timeZone="Asia/Ho_Chi_Minh"
        >
          <div className={`${dmSans.variable} ${outBrave.variable} font-sans`}>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </div>
        </NextIntlClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
```

- [ ] **Step 6: Add NEXTAUTH_SECRET to .env**

Add to `.env`:

```
NEXTAUTH_SECRET="generate-a-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

- [ ] **Step 7: Verify auth works**

Start the dev server and test:

```bash
pnpm dev
```

Open browser console and test the NextAuth endpoints exist:

```
curl -X POST http://localhost:3000/api/auth/csrf
```

Expected: JSON response with `csrfToken`.

- [ ] **Step 8: Commit**

```bash
git add src/lib/auth.ts src/lib/admin-auth.ts src/pages/api/auth/ src/types/next-auth.d.ts src/pages/_app.tsx
git commit -m "feat: configure NextAuth with credentials provider and JWT strategy"
```

---

## Task 4: Login modal and header integration

**Files:**

- Create: `src/components/admin/LoginModal.tsx`
- Modify: `src/components/header/index.tsx`
- Modify: `src/components/layout/index.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/vi.json`

- [ ] **Step 1: Add translation keys for login/logout**

Add to `src/messages/en.json` inside the `"header"` object:

```json
"login": "Login",
"logout": "Logout",
"loginTitle": "Admin Login",
"emailLabel": "Email",
"passwordLabel": "Password",
"loginButton": "Sign In",
"loginError": "Invalid email or password"
```

Add the same keys to `src/messages/vi.json` inside `"header"`:

```json
"login": "Đăng nhập",
"logout": "Đăng xuất",
"loginTitle": "Đăng nhập quản trị",
"emailLabel": "Email",
"passwordLabel": "Mật khẩu",
"loginButton": "Đăng nhập",
"loginError": "Email hoặc mật khẩu không đúng"
```

- [ ] **Step 2: Create the LoginModal component**

Create `src/components/admin/LoginModal.tsx`:

```tsx
'use client';

import {useState, useEffect} from 'react';
import {signIn} from 'next-auth/react';
import {useTranslations} from 'next-intl';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({isOpen, onClose}: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const t = useTranslations('header');

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(t('loginError'));
      return;
    }

    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div
          className="bg-surface-elevated rounded-xl shadow-2xl w-full max-w-md p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="type-title-lg text-on-surface">{t('loginTitle')}</h2>
            <button
              onClick={onClose}
              className="text-on-surface-secondary hover:text-on-surface transition-colors"
              aria-label="Close"
            >
              <i className="fa fa-times text-xl" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block type-label-sm text-on-surface-secondary mb-1"
              >
                {t('emailLabel')}
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block type-label-sm text-on-surface-secondary mb-1"
              >
                {t('passwordLabel')}
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="type-body-sm text-red-500" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-light text-on-primary type-label-sm uppercase py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? '...' : t('loginButton')}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Add Login/Logout button to Header**

Modify `src/components/header/index.tsx`:

Add imports at the top:

```typescript
import {useSession, signOut} from 'next-auth/react';
```

Inside the `Header` component, add after the existing state declarations:

```typescript
const {data: session} = useSession();
const [loginOpen, setLoginOpen] = useState(false);
```

In the desktop nav section, after the `<LanguageSwitcher />` div (line ~127-129), add the login/logout button:

Replace:

```tsx
<div className="hidden lg:flex items-center ml-4">
  <LanguageSwitcher />
</div>
```

With:

```tsx
<div className="hidden lg:flex items-center gap-4 ml-4">
  <LanguageSwitcher />
  {session ? (
    <div className="flex items-center gap-3">
      <span className="type-label-sm text-on-surface-secondary">
        {session.user.name}
      </span>
      <button
        onClick={() => signOut({redirect: false})}
        className="type-label-sm text-on-surface-secondary hover:text-primary transition-colors"
      >
        {t('logout')}
      </button>
    </div>
  ) : (
    <button
      onClick={() => setLoginOpen(true)}
      className="type-label-sm uppercase text-on-surface hover:text-primary transition-colors"
    >
      {t('login')}
    </button>
  )}
</div>
```

In the mobile nav panel, after the `<ThemeToggle />` div (before the closing `</div>` of the mobile panel), add:

```tsx
<div className="mt-4 pt-4 border-t border-on-surface-inverse/10">
  {session ? (
    <div className="space-y-2">
      <p className="type-label-sm text-on-surface-inverse/70">
        {session.user.name}
      </p>
      <button
        onClick={() => {
          signOut({redirect: false});
          setMobileOpen(false);
        }}
        className="type-label-sm text-on-surface-inverse hover:text-primary-light transition-colors"
      >
        {t('logout')}
      </button>
    </div>
  ) : (
    <button
      onClick={() => {
        setLoginOpen(true);
        setMobileOpen(false);
      }}
      className="type-label-sm text-on-surface-inverse hover:text-primary-light transition-colors"
    >
      {t('login')}
    </button>
  )}
</div>
```

Export `loginOpen` and `setLoginOpen` — but since Header is a component, we need to lift state up. Instead, add the LoginModal render at the end of the Header return, before the final `</>`:

```tsx
<LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
```

And add the import at the top:

```typescript
import {LoginModal} from '@/components/admin/LoginModal';
```

- [ ] **Step 4: Verify login modal works**

```bash
pnpm dev
```

1. Open `http://localhost:3000`
2. Click "Login" in header top-right — modal should open
3. Enter the seeded admin credentials
4. On success: modal closes, header shows admin name + "Logout"
5. Click "Logout" — header reverts to "Login" button
6. Test Escape key closes modal
7. Test clicking backdrop closes modal

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/LoginModal.tsx src/components/header/index.tsx src/messages/en.json src/messages/vi.json
git commit -m "feat: add login modal and Login/Logout button in header"
```

---

## Task 5: Middleware for admin route protection

**Files:**

- Create: `src/middleware.ts`

- [ ] **Step 1: Create middleware**

Create `src/middleware.ts`:

```typescript
import {getToken} from 'next-auth/jwt';
import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';

export async function middleware(request: NextRequest) {
  const token = await getToken({req: request});

  if (!token || token.role !== 'ADMIN') {
    const url = new URL('/', request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

- [ ] **Step 2: Verify protection**

```bash
pnpm dev
```

1. Open `http://localhost:3000/admin` while logged out — should redirect to `/`
2. Log in via the modal, then navigate to `/admin` — should load (even if page doesn't exist yet, no redirect means middleware passed)

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add middleware to protect /admin/* routes"
```

---

## Task 6: Refactor data layer — Prisma queries replace JSON imports

**Files:**

- Modify: `src/data/index.ts`
- Modify: `src/pages/index.tsx`
- Modify: `src/pages/tours.tsx`
- Modify: `src/pages/tours/[slug].tsx`
- Modify: `src/pages/about-us.tsx`
- Modify: `src/pages/contact.tsx`

- [ ] **Step 1: Rewrite src/data/index.ts to use Prisma**

Replace `src/data/index.ts` with:

```typescript
import {prisma} from '@/lib/prisma';
import type {Tour, Destination} from '@/types';

// Keep JSON imports as fallback during transition
import destinationsJson from './destinations.json';
import toursJson from './tours.json';

/** Convert DB tour row to the Tour type components expect */
function dbTourToTour(dbTour: {
  id: string;
  slug: string;
  destinationId: string;
  title: string;
  imageUrl: string;
  rating: string;
  price: number;
  duration: string;
  distance: string;
  descriptionVi: string;
  descriptionEn: string;
  transportation: string;
  groupSize: string;
  hotel: string;
  guided: string;
  heroImage: string;
  images: unknown;
  highlights: unknown;
  itinerary: unknown;
  pricingGroups: unknown;
  included: unknown;
  excluded: unknown;
  paymentDetails: unknown;
  notes: unknown;
  mealsInfo: unknown;
}): Tour {
  return {
    id: dbTour.id as unknown as number,
    slug: dbTour.slug,
    destinationId: dbTour.destinationId as unknown as number,
    title: dbTour.title,
    imageUrl: dbTour.imageUrl,
    rating: dbTour.rating,
    price: dbTour.price,
    duration: dbTour.duration,
    distance: dbTour.distance,
    description: {en: dbTour.descriptionEn, vi: dbTour.descriptionVi},
    transportation: dbTour.transportation,
    groupSize: dbTour.groupSize,
    hotel: dbTour.hotel,
    guided: dbTour.guided,
    heroImage: dbTour.heroImage,
    images: dbTour.images as string[],
    highlights: dbTour.highlights as Tour['highlights'],
    itinerary: dbTour.itinerary as Tour['itinerary'],
    pricingGroups: dbTour.pricingGroups as Tour['pricingGroups'],
    included: dbTour.included as Tour['included'],
    excluded: dbTour.excluded as Tour['excluded'],
    paymentDetails: dbTour.paymentDetails as Tour['paymentDetails'],
    notes: dbTour.notes as Tour['notes'],
    mealsInfo: dbTour.mealsInfo as Tour['mealsInfo'],
  };
}

function dbDestToDestination(dbDest: {
  id: string;
  name: string;
  imageUrl: string;
  size: string;
}): Destination {
  return {
    id: dbDest.id as unknown as number,
    name: dbDest.name,
    imageUrl: dbDest.imageUrl,
    size: dbDest.size as 'small' | 'large',
  };
}

/** Fetch all active tours from DB */
export async function getAllTours(): Promise<Tour[]> {
  try {
    const dbTours = await prisma.tour.findMany({
      where: {isActive: true},
      orderBy: {createdAt: 'asc'},
    });
    return dbTours.map(dbTourToTour);
  } catch {
    return toursJson as Tour[];
  }
}

/** Fetch a single tour by slug */
export async function getTourBySlug(slug: string): Promise<Tour | undefined> {
  try {
    const dbTour = await prisma.tour.findUnique({where: {slug}});
    return dbTour ? dbTourToTour(dbTour) : undefined;
  } catch {
    return (toursJson as Tour[]).find((t) => t.slug === slug);
  }
}

/** All tours for a destination */
export async function getToursByDestination(
  destinationId: string,
): Promise<Tour[]> {
  try {
    const dbTours = await prisma.tour.findMany({
      where: {destinationId, isActive: true},
      orderBy: {createdAt: 'asc'},
    });
    return dbTours.map(dbTourToTour);
  } catch {
    return (toursJson as Tour[]).filter(
      (t) => String(t.destinationId) === String(destinationId),
    );
  }
}

/** Get all active destinations with tour counts and transport types */
export async function getActiveDestinations(): Promise<
  (Destination & {tourCount: number; hasCar: boolean; hasBike: boolean})[]
> {
  try {
    const destinations = await prisma.destination.findMany({
      where: {isActive: true},
      include: {
        tours: {where: {isActive: true}, select: {transportation: true}},
      },
      orderBy: {createdAt: 'asc'},
    });

    return destinations
      .filter((d) => d.tours.length > 0)
      .map((d) => ({
        ...dbDestToDestination(d),
        tourCount: d.tours.length,
        hasCar: d.tours.some((t) => /car/i.test(t.transportation)),
        hasBike: d.tours.some((t) => /motorbike/i.test(t.transportation)),
      }));
  } catch {
    const fallbackDests = destinationsJson as Destination[];
    const fallbackTours = toursJson as Tour[];
    const countMap = new Map<number, number>();
    const carSet = new Set<number>();
    const bikeSet = new Set<number>();
    for (const tour of fallbackTours) {
      countMap.set(
        tour.destinationId,
        (countMap.get(tour.destinationId) ?? 0) + 1,
      );
      if (/car/i.test(tour.transportation)) carSet.add(tour.destinationId);
      if (/motorbike/i.test(tour.transportation))
        bikeSet.add(tour.destinationId);
    }
    return fallbackDests
      .filter((d) => countMap.has(d.id))
      .map((d) => ({
        ...d,
        tourCount: countMap.get(d.id)!,
        hasCar: carSet.has(d.id),
        hasBike: bikeSet.has(d.id),
      }));
  }
}

/** Fetch all tour slugs (for getStaticPaths) */
export async function getAllTourSlugs(): Promise<string[]> {
  try {
    const tours = await prisma.tour.findMany({
      where: {isActive: true},
      select: {slug: true},
    });
    return tours.map((t) => t.slug);
  } catch {
    return (toursJson as Tour[]).map((t) => t.slug);
  }
}

/** Fetch translations for a locale, returning the shape next-intl expects */
export async function getTranslationsFromDb(
  locale: string,
): Promise<Record<string, unknown> | null> {
  try {
    const rows = await prisma.translation.findMany();
    const result: Record<string, Record<string, string>> = {};

    for (const row of rows) {
      if (!result[row.namespace]) result[row.namespace] = {};
      result[row.namespace][row.key] =
        locale === 'vi' ? row.valueVi : row.valueEn;
    }

    return result;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Update src/pages/index.tsx**

Change the imports and `getStaticProps`. Replace:

```typescript
import {getActiveDestinations, toursData} from '@/data';
```

With:

```typescript
import {getActiveDestinations, getAllTours} from '@/data';
import type {Tour, Destination} from '@/types';
```

Add props interface and update the component to receive data as props:

```typescript
interface HomeProps {
  tours: Tour[];
  destinations: (Destination & {tourCount: number; hasCar: boolean; hasBike: boolean})[];
}

export default function Home({tours, destinations}: HomeProps) {
```

Remove the line inside the component:

```typescript
const destinations = getActiveDestinations();
```

Replace `toursData` with `tours` in the `<TourCarousel>`:

```tsx
<TourCarousel tours={tours} />
```

Replace `getStaticProps`:

```typescript
export async function getStaticProps({locale}: GetStaticPropsContext) {
  const [tours, destinations] = await Promise.all([
    getAllTours(),
    getActiveDestinations(),
  ]);

  return {
    props: {
      tours,
      destinations,
      messages: (await import(`@/messages/${locale}.json`)).default,
    },
    revalidate: 60,
  };
}
```

- [ ] **Step 3: Update src/pages/tours.tsx**

Change imports — replace:

```typescript
import {toursData, getToursByDestination} from '@/data';
```

With:

```typescript
import {getAllTours, getToursByDestination} from '@/data';
```

Add props and update the component to receive tours as props. Update `getStaticProps` to fetch from DB with ISR:

```typescript
export async function getStaticProps({locale}: GetStaticPropsContext) {
  const tours = await getAllTours();

  return {
    props: {
      allTours: tours,
      messages: (await import(`@/messages/${locale}.json`)).default,
    },
    revalidate: 60,
  };
}
```

Update the component signature to receive `allTours` prop and use it instead of `toursData`. The client-side destination filtering can use the full list from props.

- [ ] **Step 4: Update src/pages/tours/[slug].tsx**

Replace:

```typescript
import {toursData} from '@/data';
```

With:

```typescript
import {getTourBySlug, getAllTourSlugs} from '@/data';
```

Update `getStaticPaths`:

```typescript
export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = await getAllTourSlugs();
  const paths = slugs.flatMap((slug) =>
    ['vi', 'en'].map((locale) => ({params: {slug}, locale})),
  );

  return {
    paths,
    fallback: 'blocking',
  };
};
```

Update `getStaticProps`:

```typescript
export async function getStaticProps({params, locale}: GetStaticPropsContext) {
  const tour = await getTourBySlug(params?.slug as string);

  if (!tour) {
    return {notFound: true};
  }

  return {
    props: {
      tour,
      messages: (await import(`@/messages/${locale}.json`)).default,
    },
    revalidate: 60,
  };
}
```

- [ ] **Step 5: Update remaining pages (about-us.tsx, contact.tsx)**

Add `revalidate: 60` to their `getStaticProps` return objects.

- [ ] **Step 6: Verify public site still works**

```bash
pnpm dev
```

1. Home page loads with destinations and tours from DB
2. Tours page lists all tours
3. Individual tour pages load correctly
4. Language switching works
5. Destination filtering on /tours works

- [ ] **Step 7: Verify build**

```bash
pnpm build
```

Expected: no TypeScript errors, all pages build successfully with ISR.

- [ ] **Step 8: Commit**

```bash
git add src/data/index.ts src/pages/index.tsx src/pages/tours.tsx src/pages/tours/\\[slug\\].tsx src/pages/about-us.tsx src/pages/contact.tsx
git commit -m "feat: switch data layer from JSON to Prisma with ISR"
```

---

## Task 7: Admin layout and dashboard

**Files:**

- Create: `src/components/admin/AdminLayout.tsx`
- Create: `src/pages/admin/index.tsx`
- Modify: `src/pages/_app.tsx`
- Modify: `src/messages/en.json`
- Modify: `src/messages/vi.json`

- [ ] **Step 1: Add admin translation keys**

Add to `src/messages/en.json`:

```json
"admin": {
  "dashboard": "Dashboard",
  "tours": "Tours",
  "destinations": "Destinations",
  "translations": "Translations",
  "users": "Users",
  "totalTours": "Total Tours",
  "totalDestinations": "Total Destinations",
  "totalUsers": "Total Users",
  "welcome": "Welcome, {name}"
}
```

Add equivalent Vietnamese translations to `src/messages/vi.json`.

- [ ] **Step 2: Create AdminLayout component**

Create `src/components/admin/AdminLayout.tsx`:

```tsx
'use client';

import {type ReactNode} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import {useSession, signOut} from 'next-auth/react';
import {useTranslations} from 'next-intl';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({children}: AdminLayoutProps) {
  const router = useRouter();
  const {data: session} = useSession();
  const t = useTranslations('admin');

  const navItems = [
    {href: '/admin', label: t('dashboard'), icon: 'fa-tachometer-alt'},
    {href: '/admin/tours', label: t('tours'), icon: 'fa-route'},
    {
      href: '/admin/destinations',
      label: t('destinations'),
      icon: 'fa-map-marker-alt',
    },
    {
      href: '/admin/translations',
      label: t('translations'),
      icon: 'fa-language',
    },
    {href: '/admin/users', label: t('users'), icon: 'fa-users'},
  ];

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="w-64 bg-surface-elevated border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <Link href="/" className="type-title-sm text-primary">
            VMT Admin
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? router.pathname === '/admin'
                : router.pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg type-label-sm transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface-secondary hover:bg-surface-alt hover:text-on-surface'
                }`}
              >
                <i className={`fas ${item.icon} w-5 text-center`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <p className="type-label-sm text-on-surface-secondary truncate">
            {session?.user.name}
          </p>
          <button
            onClick={() => signOut({callbackUrl: '/'})}
            className="type-label-sm text-on-surface-secondary hover:text-primary transition-colors mt-1"
          >
            {t('logout') ?? 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Modify \_app.tsx to skip Layout for admin pages**

Update `src/pages/_app.tsx` — conditionally render Layout vs AdminLayout:

Replace the layout wrapping logic. In the `App` function, add:

```typescript
import {useRouter} from 'next/router';
import {AdminLayout} from '@/components/admin/AdminLayout';
```

Then in the render, replace:

```tsx
<Layout>
  <Component {...pageProps} />
</Layout>
```

With:

```tsx
{
  router.pathname.startsWith('/admin') ? (
    <AdminLayout>
      <Component {...pageProps} />
    </AdminLayout>
  ) : (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
```

Note: `router` is already available via the existing `useRouter()` call in `App`.

- [ ] **Step 4: Create admin dashboard page**

Create `src/pages/admin/index.tsx`:

```tsx
import {useTranslations} from 'next-intl';
import {useSession} from 'next-auth/react';
import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {prisma} from '@/lib/prisma';

interface DashboardProps {
  stats: {
    tourCount: number;
    destinationCount: number;
    userCount: number;
  };
}

export default function AdminDashboard({stats}: DashboardProps) {
  const t = useTranslations('admin');
  const {data: session} = useSession();

  const statCards = [
    {label: t('totalTours'), value: stats.tourCount, icon: 'fa-route'},
    {
      label: t('totalDestinations'),
      value: stats.destinationCount,
      icon: 'fa-map-marker-alt',
    },
    {label: t('totalUsers'), value: stats.userCount, icon: 'fa-users'},
  ];

  return (
    <div>
      <h1 className="type-headline-sm mb-8">
        {t('welcome', {name: session?.user.name ?? ''})}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-surface-elevated rounded-xl border border-border p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <i className={`fas ${card.icon} text-xl text-primary`} />
              </div>
              <div>
                <p className="type-headline-sm">{card.value}</p>
                <p className="type-label-sm text-on-surface-secondary">
                  {card.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {redirect: {destination: '/', permanent: false}};
  }

  const [tourCount, destinationCount, userCount] = await Promise.all([
    prisma.tour.count({where: {isActive: true}}),
    prisma.destination.count({where: {isActive: true}}),
    prisma.user.count(),
  ]);

  return {
    props: {
      stats: {tourCount, destinationCount, userCount},
      messages: (await import(`@/messages/${context.locale}.json`)).default,
    },
  };
}
```

- [ ] **Step 5: Verify admin dashboard**

```bash
pnpm dev
```

1. Log in via header modal
2. Navigate to `/admin` — dashboard loads with sidebar and stats
3. Sidebar navigation highlights "Dashboard"
4. Stats show correct counts
5. Public site pages still use the regular layout (no sidebar)

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/AdminLayout.tsx src/pages/admin/index.tsx src/pages/_app.tsx src/messages/en.json src/messages/vi.json
git commit -m "feat: add admin layout with sidebar and dashboard page"
```

---

## Task 8: Admin API routes — Tours CRUD

**Files:**

- Create: `src/pages/api/admin/tours/index.ts`
- Create: `src/pages/api/admin/tours/[id].ts`

- [ ] **Step 1: Create tours list + create endpoint**

Create `src/pages/api/admin/tours/index.ts`:

```typescript
import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  if (req.method === 'GET') {
    const tours = await prisma.tour.findMany({
      orderBy: {createdAt: 'desc'},
      include: {destination: {select: {name: true}}},
    });
    return res.json(tours);
  }

  if (req.method === 'POST') {
    const data = req.body;
    const tour = await prisma.tour.create({
      data: {
        slug: data.slug,
        destinationId: data.destinationId,
        title: data.title,
        titleVi: data.titleVi ?? '',
        titleEn: data.titleEn ?? '',
        imageUrl: data.imageUrl ?? '',
        rating: data.rating ?? '',
        price: data.price ?? 0,
        duration: data.duration ?? '',
        distance: data.distance ?? '',
        descriptionVi: data.descriptionVi ?? '',
        descriptionEn: data.descriptionEn ?? '',
        transportation: data.transportation ?? '',
        groupSize: data.groupSize ?? '',
        hotel: data.hotel ?? '',
        guided: data.guided ?? '',
        heroImage: data.heroImage ?? '',
        images: data.images ?? [],
        highlights: data.highlights ?? [],
        itinerary: data.itinerary ?? [],
        pricingGroups: data.pricingGroups ?? [],
        included: data.included ?? [],
        excluded: data.excluded ?? [],
        paymentDetails: data.paymentDetails ?? {},
        notes: data.notes ?? [],
        mealsInfo: data.mealsInfo ?? {},
      },
    });
    return res.status(201).json(tour);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({error: 'Method not allowed'});
}
```

- [ ] **Step 2: Create tour get/update/delete endpoint**

Create `src/pages/api/admin/tours/[id].ts`:

```typescript
import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  const id = req.query.id as string;

  if (req.method === 'GET') {
    const tour = await prisma.tour.findUnique({where: {id}});
    if (!tour) return res.status(404).json({error: 'Tour not found'});
    return res.json(tour);
  }

  if (req.method === 'PUT') {
    const data = req.body;
    const tour = await prisma.tour.update({
      where: {id},
      data: {
        slug: data.slug,
        destinationId: data.destinationId,
        title: data.title,
        titleVi: data.titleVi,
        titleEn: data.titleEn,
        imageUrl: data.imageUrl,
        rating: data.rating,
        price: data.price,
        duration: data.duration,
        distance: data.distance,
        descriptionVi: data.descriptionVi,
        descriptionEn: data.descriptionEn,
        transportation: data.transportation,
        groupSize: data.groupSize,
        hotel: data.hotel,
        guided: data.guided,
        heroImage: data.heroImage,
        images: data.images,
        highlights: data.highlights,
        itinerary: data.itinerary,
        pricingGroups: data.pricingGroups,
        included: data.included,
        excluded: data.excluded,
        paymentDetails: data.paymentDetails,
        notes: data.notes,
        mealsInfo: data.mealsInfo,
        isActive: data.isActive,
      },
    });
    return res.json(tour);
  }

  if (req.method === 'DELETE') {
    await prisma.tour.update({where: {id}, data: {isActive: false}});
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
```

- [ ] **Step 3: Verify API routes**

```bash
pnpm dev
```

Test with curl (after logging in and grabbing the session cookie, or temporarily commenting out `requireAdmin` for testing):

```bash
curl http://localhost:3000/api/admin/tours
```

Expected: JSON array of all tours.

- [ ] **Step 4: Commit**

```bash
git add src/pages/api/admin/tours/
git commit -m "feat: add admin API routes for tours CRUD"
```

---

## Task 9: Admin API routes — Destinations CRUD

**Files:**

- Create: `src/pages/api/admin/destinations/index.ts`
- Create: `src/pages/api/admin/destinations/[id].ts`

- [ ] **Step 1: Create destinations list + create endpoint**

Create `src/pages/api/admin/destinations/index.ts`:

```typescript
import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  if (req.method === 'GET') {
    const destinations = await prisma.destination.findMany({
      orderBy: {createdAt: 'desc'},
      include: {_count: {select: {tours: true}}},
    });
    return res.json(destinations);
  }

  if (req.method === 'POST') {
    const data = req.body;
    const destination = await prisma.destination.create({
      data: {
        slug: data.slug,
        name: data.name,
        nameVi: data.nameVi ?? '',
        nameEn: data.nameEn ?? '',
        imageUrl: data.imageUrl ?? '',
        descriptionVi: data.descriptionVi ?? '',
        descriptionEn: data.descriptionEn ?? '',
        size: data.size ?? 'small',
      },
    });
    return res.status(201).json(destination);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({error: 'Method not allowed'});
}
```

- [ ] **Step 2: Create destination get/update/delete endpoint**

Create `src/pages/api/admin/destinations/[id].ts`:

```typescript
import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  const id = req.query.id as string;

  if (req.method === 'GET') {
    const destination = await prisma.destination.findUnique({where: {id}});
    if (!destination)
      return res.status(404).json({error: 'Destination not found'});
    return res.json(destination);
  }

  if (req.method === 'PUT') {
    const data = req.body;
    const destination = await prisma.destination.update({
      where: {id},
      data: {
        slug: data.slug,
        name: data.name,
        nameVi: data.nameVi,
        nameEn: data.nameEn,
        imageUrl: data.imageUrl,
        descriptionVi: data.descriptionVi,
        descriptionEn: data.descriptionEn,
        size: data.size,
        isActive: data.isActive,
      },
    });
    return res.json(destination);
  }

  if (req.method === 'DELETE') {
    await prisma.destination.update({where: {id}, data: {isActive: false}});
    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/admin/destinations/
git commit -m "feat: add admin API routes for destinations CRUD"
```

---

## Task 10: Admin API routes — Translations and Users

**Files:**

- Create: `src/pages/api/admin/translations.ts`
- Create: `src/pages/api/admin/users/index.ts`
- Create: `src/pages/api/admin/users/[id].ts`

- [ ] **Step 1: Create translations endpoint**

Create `src/pages/api/admin/translations.ts`:

```typescript
import type {NextApiRequest, NextApiResponse} from 'next';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  if (req.method === 'GET') {
    const namespace = req.query.namespace as string | undefined;
    const where = namespace ? {namespace} : {};
    const translations = await prisma.translation.findMany({
      where,
      orderBy: [{namespace: 'asc'}, {key: 'asc'}],
    });
    return res.json(translations);
  }

  if (req.method === 'PUT') {
    const updates: Array<{
      id: string;
      key: string;
      namespace: string;
      valueVi: string;
      valueEn: string;
    }> = req.body;

    const results = await Promise.all(
      updates.map((item) =>
        prisma.translation.upsert({
          where: {
            namespace_key: {namespace: item.namespace, key: item.key},
          },
          update: {valueVi: item.valueVi, valueEn: item.valueEn},
          create: {
            namespace: item.namespace,
            key: item.key,
            valueVi: item.valueVi,
            valueEn: item.valueEn,
          },
        }),
      ),
    );
    return res.json(results);
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({error: 'Method not allowed'});
}
```

- [ ] **Step 2: Create users list + create endpoint**

Create `src/pages/api/admin/users/index.ts`:

```typescript
import type {NextApiRequest, NextApiResponse} from 'next';
import bcrypt from 'bcrypt';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  if (req.method === 'GET') {
    const users = await prisma.user.findMany({
      select: {id: true, email: true, name: true, role: true, createdAt: true},
      orderBy: {createdAt: 'desc'},
    });
    return res.json(users);
  }

  if (req.method === 'POST') {
    const {email, name, password} = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({error: 'Email, name, and password are required'});
    }

    const existing = await prisma.user.findUnique({where: {email}});
    if (existing) {
      return res
        .status(409)
        .json({error: 'User with this email already exists'});
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {email, name, passwordHash, role: 'ADMIN'},
      select: {id: true, email: true, name: true, role: true, createdAt: true},
    });
    return res.status(201).json(user);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({error: 'Method not allowed'});
}
```

- [ ] **Step 3: Create user delete endpoint**

Create `src/pages/api/admin/users/[id].ts`:

```typescript
import type {NextApiRequest, NextApiResponse} from 'next';
import {getServerSession} from 'next-auth';
import {prisma} from '@/lib/prisma';
import {requireAdmin} from '@/lib/admin-auth';
import {authOptions} from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const isAuthed = await requireAdmin(req, res);
  if (!isAuthed) return;

  const id = req.query.id as string;

  if (req.method === 'DELETE') {
    const session = await getServerSession(req, res, authOptions);

    if (session?.user.id === id) {
      return res.status(400).json({error: 'Cannot delete your own account'});
    }

    await prisma.user.delete({where: {id}});
    return res.status(204).end();
  }

  res.setHeader('Allow', 'DELETE');
  return res.status(405).json({error: 'Method not allowed'});
}
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/api/admin/translations.ts src/pages/api/admin/users/
git commit -m "feat: add admin API routes for translations and users"
```

---

## Task 11: Admin tours list and form pages

**Files:**

- Create: `src/components/admin/TourForm.tsx`
- Create: `src/pages/admin/tours/index.tsx`
- Create: `src/pages/admin/tours/new.tsx`
- Create: `src/pages/admin/tours/[id]/edit.tsx`

- [ ] **Step 1: Create TourForm component**

Create `src/components/admin/TourForm.tsx`:

```tsx
'use client';

import {useState} from 'react';
import {useRouter} from 'next/router';

interface TourFormData {
  slug: string;
  destinationId: string;
  title: string;
  titleVi: string;
  titleEn: string;
  imageUrl: string;
  rating: string;
  price: number;
  duration: string;
  distance: string;
  descriptionVi: string;
  descriptionEn: string;
  transportation: string;
  groupSize: string;
  hotel: string;
  guided: string;
  heroImage: string;
  images: string[];
  highlights: Array<{en: string; vi: string}>;
  itinerary: Array<{
    dayLabel: {en: string; vi: string};
    items: Array<{time: string; description: {en: string; vi: string}}>;
  }>;
  pricingGroups: Array<{
    type: string;
    label: {en: string; vi: string};
    tiers: Array<{
      label: {en: string; vi: string};
      price: number;
      minGroupSize?: number;
      maxGroupSize?: number;
    }>;
  }>;
  included: Array<{en: string; vi: string}>;
  excluded: Array<{en: string; vi: string}>;
  paymentDetails: {en: string; vi: string};
  notes: Array<{en: string; vi: string}>;
  mealsInfo: {en: string; vi: string};
}

interface TourFormProps {
  initialData?: TourFormData;
  destinations: Array<{id: string; name: string}>;
  mode: 'create' | 'edit';
  tourId?: string;
}

const emptyForm: TourFormData = {
  slug: '',
  destinationId: '',
  title: '',
  titleVi: '',
  titleEn: '',
  imageUrl: '',
  rating: '',
  price: 0,
  duration: '',
  distance: '',
  descriptionVi: '',
  descriptionEn: '',
  transportation: '',
  groupSize: '',
  hotel: '',
  guided: '',
  heroImage: '',
  images: [],
  highlights: [],
  itinerary: [],
  pricingGroups: [],
  included: [],
  excluded: [],
  paymentDetails: {en: '', vi: ''},
  notes: [],
  mealsInfo: {en: '', vi: ''},
};

export function TourForm({
  initialData,
  destinations,
  mode,
  tourId,
}: TourFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<TourFormData>(initialData ?? emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function updateField<K extends keyof TourFormData>(
    key: K,
    value: TourFormData[K],
  ) {
    setForm((prev) => ({...prev, [key]: value}));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const url =
      mode === 'create' ? '/api/admin/tours' : `/api/admin/tours/${tourId}`;
    const method = mode === 'create' ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Failed to save');
      return;
    }

    router.push('/admin/tours');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg type-body-sm">
          {error}
        </div>
      )}

      {/* Basic fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Slug
          </label>
          <input
            type="text"
            required
            value={form.slug}
            onChange={(e) => updateField('slug', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Destination
          </label>
          <select
            required
            value={form.destinationId}
            onChange={(e) => updateField('destinationId', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select...</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block type-label-sm text-on-surface-secondary mb-1">
          Title
        </label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Localized descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Description (EN)
          </label>
          <textarea
            rows={4}
            value={form.descriptionEn}
            onChange={(e) => updateField('descriptionEn', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Description (VI)
          </label>
          <textarea
            rows={4}
            value={form.descriptionVi}
            onChange={(e) => updateField('descriptionVi', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Numeric / short fields */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Price ($)
          </label>
          <input
            type="number"
            value={form.price}
            onChange={(e) => updateField('price', Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Duration
          </label>
          <input
            type="text"
            value={form.duration}
            onChange={(e) => updateField('duration', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Distance
          </label>
          <input
            type="text"
            value={form.distance}
            onChange={(e) => updateField('distance', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Rating
          </label>
          <input
            type="text"
            value={form.rating}
            onChange={(e) => updateField('rating', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Transportation
          </label>
          <input
            type="text"
            value={form.transportation}
            onChange={(e) => updateField('transportation', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Group Size
          </label>
          <input
            type="text"
            value={form.groupSize}
            onChange={(e) => updateField('groupSize', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Hotel
          </label>
          <input
            type="text"
            value={form.hotel}
            onChange={(e) => updateField('hotel', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Guided
          </label>
          <input
            type="text"
            value={form.guided}
            onChange={(e) => updateField('guided', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Image URLs */}
      <div>
        <label className="block type-label-sm text-on-surface-secondary mb-1">
          Hero Image URL
        </label>
        <input
          type="text"
          value={form.heroImage}
          onChange={(e) => updateField('heroImage', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label className="block type-label-sm text-on-surface-secondary mb-1">
          Main Image URL
        </label>
        <input
          type="text"
          value={form.imageUrl}
          onChange={(e) => updateField('imageUrl', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Submit */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-primary hover:bg-primary-light text-on-primary px-6 py-2.5 rounded-lg type-label-sm uppercase transition-colors disabled:opacity-50"
        >
          {saving
            ? 'Saving...'
            : mode === 'create'
              ? 'Create Tour'
              : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/tours')}
          className="px-6 py-2.5 rounded-lg border border-border type-label-sm text-on-surface-secondary hover:bg-surface-alt transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Create tours list page**

Create `src/pages/admin/tours/index.tsx`:

```tsx
import {useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {prisma} from '@/lib/prisma';

interface AdminTour {
  id: string;
  title: string;
  slug: string;
  isActive: boolean;
  destination: {name: string};
  price: number;
  duration: string;
}

interface Props {
  tours: AdminTour[];
}

export default function AdminToursList({tours: initialTours}: Props) {
  const [tours, setTours] = useState(initialTours);
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm('Deactivate this tour?')) return;

    const res = await fetch(`/api/admin/tours/${id}`, {method: 'DELETE'});
    if (res.ok) {
      setTours((prev) => prev.filter((t) => t.id !== id));
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    const res = await fetch(`/api/admin/tours/${id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({isActive: !isActive}),
    });
    if (res.ok) {
      setTours((prev) =>
        prev.map((t) => (t.id === id ? {...t, isActive: !isActive} : t)),
      );
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">Tours</h1>
        <Link
          href="/admin/tours/new"
          className="bg-primary hover:bg-primary-light text-on-primary px-4 py-2 rounded-lg type-label-sm uppercase transition-colors"
        >
          + New Tour
        </Link>
      </div>

      <div className="bg-surface-elevated rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-alt">
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Title
              </th>
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Destination
              </th>
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Price
              </th>
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Status
              </th>
              <th className="text-right px-4 py-3 type-label-sm text-on-surface-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {tours.map((tour) => (
              <tr
                key={tour.id}
                className="border-b border-border last:border-0 hover:bg-surface-alt/50"
              >
                <td className="px-4 py-3 type-body-sm text-on-surface">
                  {tour.title}
                </td>
                <td className="px-4 py-3 type-body-sm text-on-surface-secondary">
                  {tour.destination.name}
                </td>
                <td className="px-4 py-3 type-body-sm text-on-surface">
                  ${tour.price}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggleActive(tour.id, tour.isActive)}
                    className={`type-label-sm px-2 py-0.5 rounded ${
                      tour.isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {tour.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/tours/${tour.id}/edit`}
                      className="type-label-sm text-primary hover:text-primary-light transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(tour.id)}
                      className="type-label-sm text-red-500 hover:text-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return {redirect: {destination: '/', permanent: false}};

  const tours = await prisma.tour.findMany({
    orderBy: {createdAt: 'desc'},
    select: {
      id: true,
      title: true,
      slug: true,
      isActive: true,
      price: true,
      duration: true,
      destination: {select: {name: true}},
    },
  });

  return {
    props: {
      tours: JSON.parse(JSON.stringify(tours)),
      messages: (await import(`@/messages/${context.locale}.json`)).default,
    },
  };
}
```

- [ ] **Step 3: Create new tour page**

Create `src/pages/admin/tours/new.tsx`:

```tsx
import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {TourForm} from '@/components/admin/TourForm';

interface Props {
  destinations: Array<{id: string; name: string}>;
}

export default function NewTour({destinations}: Props) {
  return (
    <div>
      <h1 className="type-headline-sm mb-6">Create New Tour</h1>
      <TourForm destinations={destinations} mode="create" />
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return {redirect: {destination: '/', permanent: false}};

  const destinations = await prisma.destination.findMany({
    where: {isActive: true},
    select: {id: true, name: true},
    orderBy: {name: 'asc'},
  });

  return {
    props: {
      destinations: JSON.parse(JSON.stringify(destinations)),
      messages: (await import(`@/messages/${context.locale}.json`)).default,
    },
  };
}
```

- [ ] **Step 4: Create edit tour page**

Create `src/pages/admin/tours/[id]/edit.tsx`:

```tsx
import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {TourForm} from '@/components/admin/TourForm';

interface Props {
  tour: Record<string, unknown>;
  destinations: Array<{id: string; name: string}>;
}

export default function EditTour({tour, destinations}: Props) {
  const initialData = {
    slug: tour.slug as string,
    destinationId: tour.destinationId as string,
    title: tour.title as string,
    titleVi: (tour.titleVi as string) ?? '',
    titleEn: (tour.titleEn as string) ?? '',
    imageUrl: (tour.imageUrl as string) ?? '',
    rating: (tour.rating as string) ?? '',
    price: (tour.price as number) ?? 0,
    duration: (tour.duration as string) ?? '',
    distance: (tour.distance as string) ?? '',
    descriptionVi: (tour.descriptionVi as string) ?? '',
    descriptionEn: (tour.descriptionEn as string) ?? '',
    transportation: (tour.transportation as string) ?? '',
    groupSize: (tour.groupSize as string) ?? '',
    hotel: (tour.hotel as string) ?? '',
    guided: (tour.guided as string) ?? '',
    heroImage: (tour.heroImage as string) ?? '',
    images: (tour.images as string[]) ?? [],
    highlights: (tour.highlights as Array<{en: string; vi: string}>) ?? [],
    itinerary: tour.itinerary as unknown[] as never,
    pricingGroups: tour.pricingGroups as unknown[] as never,
    included: (tour.included as Array<{en: string; vi: string}>) ?? [],
    excluded: (tour.excluded as Array<{en: string; vi: string}>) ?? [],
    paymentDetails: (tour.paymentDetails as {en: string; vi: string}) ?? {
      en: '',
      vi: '',
    },
    notes: (tour.notes as Array<{en: string; vi: string}>) ?? [],
    mealsInfo: (tour.mealsInfo as {en: string; vi: string}) ?? {en: '', vi: ''},
  };

  return (
    <div>
      <h1 className="type-headline-sm mb-6">Edit Tour</h1>
      <TourForm
        initialData={initialData}
        destinations={destinations}
        mode="edit"
        tourId={tour.id as string}
      />
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return {redirect: {destination: '/', permanent: false}};

  const id = context.params?.id as string;
  const tour = await prisma.tour.findUnique({where: {id}});
  if (!tour) return {notFound: true};

  const destinations = await prisma.destination.findMany({
    where: {isActive: true},
    select: {id: true, name: true},
    orderBy: {name: 'asc'},
  });

  return {
    props: {
      tour: JSON.parse(JSON.stringify(tour)),
      destinations: JSON.parse(JSON.stringify(destinations)),
      messages: (await import(`@/messages/${context.locale}.json`)).default,
    },
  };
}
```

- [ ] **Step 5: Verify tour management pages**

```bash
pnpm dev
```

1. Navigate to `/admin/tours` — list of tours appears
2. Click "New Tour" — form loads with destination dropdown
3. Fill out form, submit — tour created, redirected to list
4. Click "Edit" on a tour — form loads with existing data
5. Modify and save — changes persisted
6. Click "Delete" — tour removed from list

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/TourForm.tsx src/pages/admin/tours/
git commit -m "feat: add admin tour management pages (list, create, edit)"
```

---

## Task 12: Admin destinations pages

**Files:**

- Create: `src/components/admin/DestinationForm.tsx`
- Create: `src/pages/admin/destinations/index.tsx`
- Create: `src/pages/admin/destinations/new.tsx`
- Create: `src/pages/admin/destinations/[id]/edit.tsx`

- [ ] **Step 1: Create DestinationForm component**

Create `src/components/admin/DestinationForm.tsx`:

```tsx
'use client';

import {useState} from 'react';
import {useRouter} from 'next/router';

interface DestinationFormData {
  slug: string;
  name: string;
  nameVi: string;
  nameEn: string;
  imageUrl: string;
  descriptionVi: string;
  descriptionEn: string;
  size: string;
}

interface DestinationFormProps {
  initialData?: DestinationFormData;
  mode: 'create' | 'edit';
  destinationId?: string;
}

const emptyForm: DestinationFormData = {
  slug: '',
  name: '',
  nameVi: '',
  nameEn: '',
  imageUrl: '',
  descriptionVi: '',
  descriptionEn: '',
  size: 'small',
};

export function DestinationForm({
  initialData,
  mode,
  destinationId,
}: DestinationFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<DestinationFormData>(
    initialData ?? emptyForm,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function updateField<K extends keyof DestinationFormData>(
    key: K,
    value: DestinationFormData[K],
  ) {
    setForm((prev) => ({...prev, [key]: value}));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const url =
      mode === 'create'
        ? '/api/admin/destinations'
        : `/api/admin/destinations/${destinationId}`;
    const method = mode === 'create' ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Failed to save');
      return;
    }

    router.push('/admin/destinations');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg type-body-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Slug
          </label>
          <input
            type="text"
            required
            value={form.slug}
            onChange={(e) => updateField('slug', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Name
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Name (EN)
          </label>
          <input
            type="text"
            value={form.nameEn}
            onChange={(e) => updateField('nameEn', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Name (VI)
          </label>
          <input
            type="text"
            value={form.nameVi}
            onChange={(e) => updateField('nameVi', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Description (EN)
          </label>
          <textarea
            rows={3}
            value={form.descriptionEn}
            onChange={(e) => updateField('descriptionEn', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Description (VI)
          </label>
          <textarea
            rows={3}
            value={form.descriptionVi}
            onChange={(e) => updateField('descriptionVi', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Image URL
          </label>
          <input
            type="text"
            value={form.imageUrl}
            onChange={(e) => updateField('imageUrl', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block type-label-sm text-on-surface-secondary mb-1">
            Size
          </label>
          <select
            value={form.size}
            onChange={(e) => updateField('size', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="small">Small</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-primary hover:bg-primary-light text-on-primary px-6 py-2.5 rounded-lg type-label-sm uppercase transition-colors disabled:opacity-50"
        >
          {saving
            ? 'Saving...'
            : mode === 'create'
              ? 'Create Destination'
              : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/destinations')}
          className="px-6 py-2.5 rounded-lg border border-border type-label-sm text-on-surface-secondary hover:bg-surface-alt transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Create destinations list page**

Create `src/pages/admin/destinations/index.tsx`:

```tsx
import {useState} from 'react';
import Link from 'next/link';
import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {prisma} from '@/lib/prisma';

interface AdminDestination {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  _count: {tours: number};
}

interface Props {
  destinations: AdminDestination[];
}

export default function AdminDestinationsList({destinations: initial}: Props) {
  const [destinations, setDestinations] = useState(initial);

  async function handleDelete(id: string) {
    if (!confirm('Deactivate this destination?')) return;

    const res = await fetch(`/api/admin/destinations/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setDestinations((prev) => prev.filter((d) => d.id !== id));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">Destinations</h1>
        <Link
          href="/admin/destinations/new"
          className="bg-primary hover:bg-primary-light text-on-primary px-4 py-2 rounded-lg type-label-sm uppercase transition-colors"
        >
          + New Destination
        </Link>
      </div>

      <div className="bg-surface-elevated rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-alt">
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Name
              </th>
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Tours
              </th>
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Status
              </th>
              <th className="text-right px-4 py-3 type-label-sm text-on-surface-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {destinations.map((dest) => (
              <tr
                key={dest.id}
                className="border-b border-border last:border-0 hover:bg-surface-alt/50"
              >
                <td className="px-4 py-3 type-body-sm text-on-surface">
                  {dest.name}
                </td>
                <td className="px-4 py-3 type-body-sm text-on-surface-secondary">
                  {dest._count.tours}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`type-label-sm px-2 py-0.5 rounded ${
                      dest.isActive
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {dest.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/destinations/${dest.id}/edit`}
                      className="type-label-sm text-primary hover:text-primary-light transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(dest.id)}
                      className="type-label-sm text-red-500 hover:text-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return {redirect: {destination: '/', permanent: false}};

  const destinations = await prisma.destination.findMany({
    orderBy: {createdAt: 'desc'},
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      _count: {select: {tours: true}},
    },
  });

  return {
    props: {
      destinations: JSON.parse(JSON.stringify(destinations)),
      messages: (await import(`@/messages/${context.locale}.json`)).default,
    },
  };
}
```

- [ ] **Step 3: Create new destination page**

Create `src/pages/admin/destinations/new.tsx`:

```tsx
import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {DestinationForm} from '@/components/admin/DestinationForm';

export default function NewDestination() {
  return (
    <div>
      <h1 className="type-headline-sm mb-6">Create New Destination</h1>
      <DestinationForm mode="create" />
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return {redirect: {destination: '/', permanent: false}};

  return {
    props: {
      messages: (await import(`@/messages/${context.locale}.json`)).default,
    },
  };
}
```

- [ ] **Step 4: Create edit destination page**

Create `src/pages/admin/destinations/[id]/edit.tsx`:

```tsx
import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {DestinationForm} from '@/components/admin/DestinationForm';

interface Props {
  destination: Record<string, unknown>;
}

export default function EditDestination({destination}: Props) {
  const initialData = {
    slug: destination.slug as string,
    name: destination.name as string,
    nameVi: (destination.nameVi as string) ?? '',
    nameEn: (destination.nameEn as string) ?? '',
    imageUrl: (destination.imageUrl as string) ?? '',
    descriptionVi: (destination.descriptionVi as string) ?? '',
    descriptionEn: (destination.descriptionEn as string) ?? '',
    size: (destination.size as string) ?? 'small',
  };

  return (
    <div>
      <h1 className="type-headline-sm mb-6">Edit Destination</h1>
      <DestinationForm
        initialData={initialData}
        mode="edit"
        destinationId={destination.id as string}
      />
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return {redirect: {destination: '/', permanent: false}};

  const id = context.params?.id as string;
  const destination = await prisma.destination.findUnique({where: {id}});
  if (!destination) return {notFound: true};

  return {
    props: {
      destination: JSON.parse(JSON.stringify(destination)),
      messages: (await import(`@/messages/${context.locale}.json`)).default,
    },
  };
}
```

- [ ] **Step 5: Verify destination management**

```bash
pnpm dev
```

1. Navigate to `/admin/destinations` — list shows all destinations with tour counts
2. Create, edit, and delete destinations
3. Verify tour dropdown on tour form shows updated destinations

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/DestinationForm.tsx src/pages/admin/destinations/
git commit -m "feat: add admin destination management pages"
```

---

## Task 13: Admin translations page

**Files:**

- Create: `src/components/admin/TranslationEditor.tsx`
- Create: `src/pages/admin/translations.tsx`

- [ ] **Step 1: Create TranslationEditor component**

Create `src/components/admin/TranslationEditor.tsx`:

```tsx
'use client';

import {useState, useMemo} from 'react';

interface TranslationRow {
  id: string;
  namespace: string;
  key: string;
  valueVi: string;
  valueEn: string;
}

interface TranslationEditorProps {
  translations: TranslationRow[];
  namespaces: string[];
}

export function TranslationEditor({
  translations: initial,
  namespaces,
}: TranslationEditorProps) {
  const [translations, setTranslations] = useState(initial);
  const [filter, setFilter] = useState('');
  const [namespaceFilter, setNamespaceFilter] = useState('');
  const [modified, setModified] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    return translations.filter((t) => {
      const matchesNamespace =
        !namespaceFilter || t.namespace === namespaceFilter;
      const matchesSearch =
        !filter ||
        t.key.toLowerCase().includes(filter.toLowerCase()) ||
        t.valueEn.toLowerCase().includes(filter.toLowerCase()) ||
        t.valueVi.toLowerCase().includes(filter.toLowerCase());
      return matchesNamespace && matchesSearch;
    });
  }, [translations, filter, namespaceFilter]);

  function handleChange(
    id: string,
    field: 'valueVi' | 'valueEn',
    value: string,
  ) {
    setTranslations((prev) =>
      prev.map((t) => (t.id === id ? {...t, [field]: value} : t)),
    );
    setModified((prev) => new Set(prev).add(id));
  }

  async function handleSave() {
    setSaving(true);

    const toUpdate = translations
      .filter((t) => modified.has(t.id))
      .map((t) => ({
        id: t.id,
        namespace: t.namespace,
        key: t.key,
        valueVi: t.valueVi,
        valueEn: t.valueEn,
      }));

    const res = await fetch('/api/admin/translations', {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(toUpdate),
    });

    setSaving(false);

    if (res.ok) {
      setModified(new Set());
    }
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary w-64"
        />
        <select
          value={namespaceFilter}
          onChange={(e) => setNamespaceFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All namespaces</option>
          {namespaces.map((ns) => (
            <option key={ns} value={ns}>
              {ns}
            </option>
          ))}
        </select>
        {modified.size > 0 && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary-light text-on-primary px-4 py-2 rounded-lg type-label-sm uppercase transition-colors disabled:opacity-50 ml-auto"
          >
            {saving ? 'Saving...' : `Save ${modified.size} changes`}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface-elevated rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-alt">
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary w-48">
                Key
              </th>
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                English
              </th>
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Vietnamese
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr
                key={t.id}
                className={`border-b border-border last:border-0 ${
                  modified.has(t.id) ? 'bg-primary/5' : ''
                }`}
              >
                <td className="px-4 py-2 type-label-sm text-on-surface-secondary align-top">
                  <span className="text-on-surface-secondary/50">
                    {t.namespace}.
                  </span>
                  {t.key}
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={t.valueEn}
                    onChange={(e) =>
                      handleChange(t.id, 'valueEn', e.target.value)
                    }
                    className="w-full px-2 py-1 rounded border border-transparent hover:border-border focus:border-primary bg-transparent text-on-surface focus:outline-none type-body-sm"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={t.valueVi}
                    onChange={(e) =>
                      handleChange(t.id, 'valueVi', e.target.value)
                    }
                    className="w-full px-2 py-1 rounded border border-transparent hover:border-border focus:border-primary bg-transparent text-on-surface focus:outline-none type-body-sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create translations page**

Create `src/pages/admin/translations.tsx`:

```tsx
import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {TranslationEditor} from '@/components/admin/TranslationEditor';

interface Props {
  translations: Array<{
    id: string;
    namespace: string;
    key: string;
    valueVi: string;
    valueEn: string;
  }>;
  namespaces: string[];
}

export default function AdminTranslations({translations, namespaces}: Props) {
  return (
    <div>
      <h1 className="type-headline-sm mb-6">Translations</h1>
      <TranslationEditor translations={translations} namespaces={namespaces} />
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return {redirect: {destination: '/', permanent: false}};

  const translations = await prisma.translation.findMany({
    orderBy: [{namespace: 'asc'}, {key: 'asc'}],
  });

  const namespaces = [...new Set(translations.map((t) => t.namespace))].sort();

  return {
    props: {
      translations: JSON.parse(JSON.stringify(translations)),
      namespaces,
      messages: (await import(`@/messages/${context.locale}.json`)).default,
    },
  };
}
```

- [ ] **Step 3: Verify translations page**

```bash
pnpm dev
```

1. Navigate to `/admin/translations`
2. Filter by namespace — rows filter correctly
3. Search for a key or value — matching rows appear
4. Edit a value — row highlights as modified
5. Click "Save N changes" — changes persist (reload to verify)

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/TranslationEditor.tsx src/pages/admin/translations.tsx
git commit -m "feat: add admin translations editor page"
```

---

## Task 14: Admin users page

**Files:**

- Create: `src/pages/admin/users.tsx`

- [ ] **Step 1: Create users management page**

Create `src/pages/admin/users.tsx`:

```tsx
import {useState} from 'react';
import {useSession} from 'next-auth/react';
import type {GetServerSidePropsContext} from 'next';
import {getServerSession} from 'next-auth';
import {authOptions} from '@/lib/auth';
import {prisma} from '@/lib/prisma';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

interface Props {
  users: AdminUser[];
}

export default function AdminUsers({users: initial}: Props) {
  const {data: session} = useSession();
  const [users, setUsers] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({email: '', name: '', password: ''});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(newUser),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Failed to create user');
      return;
    }

    const created = await res.json();
    setUsers((prev) => [created, ...prev]);
    setNewUser({email: '', name: '', password: ''});
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this admin user?')) return;

    const res = await fetch(`/api/admin/users/${id}`, {method: 'DELETE'});
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="type-headline-sm">Users</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary hover:bg-primary-light text-on-primary px-4 py-2 rounded-lg type-label-sm uppercase transition-colors"
        >
          {showForm ? 'Cancel' : '+ New User'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-surface-elevated rounded-xl border border-border p-6 mb-6 max-w-lg"
        >
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg type-body-sm mb-4">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block type-label-sm text-on-surface-secondary mb-1">
                Name
              </label>
              <input
                type="text"
                required
                value={newUser.name}
                onChange={(e) =>
                  setNewUser((p) => ({...p, name: e.target.value}))
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block type-label-sm text-on-surface-secondary mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={newUser.email}
                onChange={(e) =>
                  setNewUser((p) => ({...p, email: e.target.value}))
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block type-label-sm text-on-surface-secondary mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newUser.password}
                onChange={(e) =>
                  setNewUser((p) => ({...p, password: e.target.value}))
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-primary hover:bg-primary-light text-on-primary px-6 py-2 rounded-lg type-label-sm uppercase transition-colors disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-surface-elevated rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface-alt">
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Name
              </th>
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Email
              </th>
              <th className="text-left px-4 py-3 type-label-sm text-on-surface-secondary">
                Role
              </th>
              <th className="text-right px-4 py-3 type-label-sm text-on-surface-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-border last:border-0 hover:bg-surface-alt/50"
              >
                <td className="px-4 py-3 type-body-sm text-on-surface">
                  {user.name}
                </td>
                <td className="px-4 py-3 type-body-sm text-on-surface-secondary">
                  {user.email}
                </td>
                <td className="px-4 py-3 type-label-sm text-on-surface-secondary">
                  {user.role}
                </td>
                <td className="px-4 py-3 text-right">
                  {session?.user.id !== user.id && (
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="type-label-sm text-red-500 hover:text-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return {redirect: {destination: '/', permanent: false}};

  const users = await prisma.user.findMany({
    select: {id: true, email: true, name: true, role: true, createdAt: true},
    orderBy: {createdAt: 'desc'},
  });

  return {
    props: {
      users: JSON.parse(JSON.stringify(users)),
      messages: (await import(`@/messages/${context.locale}.json`)).default,
    },
  };
}
```

- [ ] **Step 2: Verify users page**

```bash
pnpm dev
```

1. Navigate to `/admin/users` — shows seeded admin
2. Click "+ New User" — form appears
3. Create a new user — appears in list
4. Cannot delete yourself (no delete button on own row)
5. Can delete other users

- [ ] **Step 3: Commit**

```bash
git add src/pages/admin/users.tsx
git commit -m "feat: add admin users management page"
```

---

## Task 15: Final verification and build check

**Files:** None (verification only)

- [ ] **Step 1: Run lint**

```bash
pnpm lint
```

Fix any lint errors.

- [ ] **Step 2: Run production build**

```bash
pnpm build
```

Expected: no TypeScript errors, all pages compile successfully.

- [ ] **Step 3: End-to-end verification**

Start production server and verify:

```bash
pnpm start
```

1. **Public site:** Home, Tours, Tour detail pages load correctly with data from DB
2. **Login:** Click Login in header, enter credentials, modal closes, header shows Logout
3. **Admin dashboard:** Navigate to `/admin`, stats display correctly
4. **Tour CRUD:** Create, edit, deactivate a tour from admin
5. **Destination CRUD:** Create, edit, deactivate a destination
6. **Translations:** Edit translations, save, verify changes appear on public site (after ISR revalidation)
7. **Users:** Create and delete admin users
8. **Logout:** Click Logout, verify admin pages redirect to home
9. **Language switching:** Both vi/en work on public site and admin

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address lint and build issues"
```
