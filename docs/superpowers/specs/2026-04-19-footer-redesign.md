# Footer Redesign — Two-Tier Compact Strip

## Problem

The current footer has dead content (Newsletter form not planned), duplicate links (Tours and Contact in both columns), dead links (Legal and Privacy Policy point to `#`), and two link columns for only 4 unique destinations. It feels heavy and cluttered.

## Design

A compact two-tier dark footer (`bg-surface-inverse`) that focuses on navigation, trust signals, and quick contact.

### Top Tier

Single flex row, vertically centered, max-width container (`max-w-7xl`), horizontal padding matching current site layout:

- **Left:** White logo (`h-11`, links to `/`)
- **Center:** 4 nav links in a horizontal row with consistent spacing:
  - About Us → `/about-us`
  - Tours → `/tours`
  - Rental → `/rental`
  - Contact → `/contact`
  - Style: `type-body-sm text-on-surface-secondary`, hover → `text-on-surface-inverse transition-colors`
- **Right:** 3 social icons in a horizontal row with `gap-4`:
  - YouTube (`fab fa-youtube`) → real link
  - TripAdvisor (`fab fa-tripadvisor`) → `#` placeholder
  - WhatsApp (`fab fa-whatsapp`) → `https://wa.me/...` computed from contact info
  - Style: `text-on-surface-secondary`, hover → `text-on-surface-inverse transition-colors`

Vertical padding: `py-8` for breathing room.

### Divider

`border-t border-on-surface-inverse/10` — thin separator.

### Bottom Tier

Single flex row, vertically centered, same container:

- **Left:** Copyright text — `type-body-sm text-on-surface-secondary`
- **Right:** Phone and email as inline links, separated by a middle dot (`·`), `type-body-sm text-on-surface-secondary`, hover → `text-on-surface-inverse`

Vertical padding: `py-4` — tighter than top tier.

### Responsive (Mobile < `sm`)

- **Top tier:** Stacks vertically, all items centered:
  1. Logo
  2. Nav links (wrap allowed, centered)
  3. Social icons
- **Bottom tier:** Stacks vertically, centered:
  1. Copyright
  2. Contact info

### Content Removed

- About text paragraph
- Address and city lines
- Newsletter form (email input, subscribe button, terms checkbox)
- "Legal" link (no page exists)
- "Privacy Policy" link (no page exists)
- "Company" and "Explore" section headers
- Instagram from `contactInfo` type and utils

### Translation Key Cleanup

Remove from both `src/messages/en.json` and `src/messages/vi.json`:

- `footer.aboutText`
- `footer.company`
- `footer.explore`
- `footer.newsletter`
- `footer.legal`
- `footer.privacyPolicy`
- `footer.emailPlaceholder`
- `footer.subscribe`
- `footer.agreeTerms`
- `footer.contact` (keep `footer.contactUs`)

### ContactInfo Type Cleanup

Remove `instagramLink` from:

- `src/types/index.ts` (`ContactInfo` interface)
- `src/utils/index.ts` (contact info object)

## Files Changed

1. `src/components/footer/index.tsx` — full rewrite to two-tier layout
2. `src/messages/en.json` — remove unused footer keys
3. `src/messages/vi.json` — remove unused footer keys
4. `src/types/index.ts` — remove `instagramLink` from `ContactInfo`
5. `src/utils/index.ts` — remove `instagramLink` from contact info object
