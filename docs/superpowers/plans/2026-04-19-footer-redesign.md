# Footer Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the heavy 4-column footer with a compact two-tier strip layout.

**Architecture:** Single component rewrite (`Footer`) plus cleanup of unused translation keys and the `instagramLink` field from `ContactInfo`. No new files — all edits to existing files.

**Tech Stack:** React 19, Next.js Pages Router, next-intl, Tailwind CSS v4, FontAwesome icons.

**Spec:** `docs/superpowers/specs/2026-04-19-footer-redesign.md`

---

### Task 1: Remove `instagramLink` from ContactInfo

**Files:**

- Modify: `src/types/index.ts:22-31`
- Modify: `src/utils/index.ts:6-16`

- [ ] **Step 1: Remove `instagramLink` from the `ContactInfo` interface**

In `src/types/index.ts`, change the `ContactInfo` interface to:

```typescript
export interface ContactInfo {
  phone: string;
  email: string;
  youtubeLink: string;
  tripadvisorLink: string;
  whatsApp: string;
  address: string;
  city: string;
}
```

- [ ] **Step 2: Remove `instagramLink` from the contact info object**

In `src/utils/index.ts`, remove the `instagramLink: "#",` line from the `contactInfo` object.

- [ ] **Step 3: Verify build passes**

Run: `pnpm build`
Expected: Build succeeds with no type errors (nothing else references `instagramLink`).

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/utils/index.ts
git commit -m "refactor: remove instagramLink from ContactInfo"
```

---

### Task 2: Clean up translation files

**Files:**

- Modify: `src/messages/en.json:11-26`
- Modify: `src/messages/vi.json:11-26`

- [ ] **Step 1: Remove unused footer keys from `en.json`**

The `footer` section in `src/messages/en.json` should contain only these keys:

```json
"footer": {
  "aboutUs": "About Us",
  "contactUs": "Contact Us",
  "rental": "Rental",
  "tours": "Tours",
  "copyright": "© All Copyright {year}"
}
```

Remove: `aboutText`, `company`, `explore`, `newsletter`, `legal`, `privacyPolicy`, `emailPlaceholder`, `subscribe`, `agreeTerms`, `contact`.

- [ ] **Step 2: Remove unused footer keys from `vi.json`**

The `footer` section in `src/messages/vi.json` should contain only these keys:

```json
"footer": {
  "aboutUs": "Về Chúng Tôi",
  "contactUs": "Liên Hệ",
  "rental": "Cho Thuê",
  "tours": "Tour",
  "copyright": "© Bản quyền {year}"
}
```

Remove the same keys as in Step 1.

- [ ] **Step 3: Commit**

```bash
git add src/messages/en.json src/messages/vi.json
git commit -m "refactor: remove unused footer translation keys"
```

---

### Task 3: Rewrite the Footer component

**Files:**

- Modify: `src/components/footer/index.tsx` (full rewrite)

- [ ] **Step 1: Rewrite the Footer component**

Replace the entire contents of `src/components/footer/index.tsx` with:

```tsx
import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {getUrl, contactInfo} from '@/utils';

export const Footer = () => {
  const t = useTranslations('footer');

  return (
    <footer className="bg-surface-inverse text-on-surface-secondary">
      {/* Top tier: Logo | Nav links | Social icons */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <img
              src={getUrl('assets/images/logo/logo-white.png')}
              alt="Logo"
              className="h-11 opacity-90"
            />
          </Link>

          {/* Nav links */}
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-2 type-body-sm">
            <Link
              href="/about-us"
              className="hover:text-on-surface-inverse transition-colors"
            >
              {t('aboutUs')}
            </Link>
            <Link
              href="/tours"
              className="hover:text-on-surface-inverse transition-colors"
            >
              {t('tours')}
            </Link>
            <Link
              href="/rental"
              className="hover:text-on-surface-inverse transition-colors"
            >
              {t('rental')}
            </Link>
            <Link
              href="/contact"
              className="hover:text-on-surface-inverse transition-colors"
            >
              {t('contactUs')}
            </Link>
          </nav>

          {/* Social icons */}
          <div className="flex items-center gap-4">
            <a
              href={contactInfo.youtubeLink}
              className="hover:text-on-surface-inverse transition-colors"
            >
              <i className="fab fa-youtube" />
            </a>
            <a
              href={contactInfo.tripadvisorLink}
              className="hover:text-on-surface-inverse transition-colors"
            >
              <i className="fab fa-tripadvisor" />
            </a>
            <a
              href={`https://wa.me/${contactInfo.whatsApp.replace(/[^0-9]/g, '')}`}
              className="hover:text-on-surface-inverse transition-colors"
            >
              <i className="fab fa-whatsapp" />
            </a>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-on-surface-inverse/10">
        {/* Bottom tier: Copyright | Contact info */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="type-body-sm">
            {t('copyright', {year: new Date().getFullYear()})}
          </p>
          <div className="flex items-center gap-2 type-body-sm">
            <a
              href={`tel:${contactInfo.phone}`}
              className="hover:text-on-surface-inverse transition-colors"
            >
              {contactInfo.phone}
            </a>
            <span>·</span>
            <a
              href={`mailto:${contactInfo.email}`}
              className="hover:text-on-surface-inverse transition-colors"
            >
              {contactInfo.email}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
```

- [ ] **Step 2: Verify build passes**

Run: `pnpm build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Visual check**

Run: `pnpm dev`
Open the site and verify:

- Top tier: logo left, 4 nav links centered, 3 social icons right
- Divider line between tiers
- Bottom tier: copyright left, phone · email right
- On mobile width: everything stacks and centers
- All links navigate correctly

- [ ] **Step 4: Commit**

```bash
git add src/components/footer/index.tsx
git commit -m "feat: redesign footer as compact two-tier strip"
```
