<!-- stitch-project: 4683768170577706110 -->
<!-- stitch-design-system: Apex Cinematic Tactical -->
<!-- last-synced: 2026-05-28 -->

# Vietnam Moto Tour — Design System

> **Source of truth:** Google Stitch project `4683768170577706110`.
> Mirrors the `designMd` block from the project theme. Sync direction:
>
> - **Pull:** Stitch → this file + `src/styles/design-tokens.css`.
> - **Push:** this file → Stitch via `upload_design_md`.
>
> Components are NOT generated. Only tokens flow between Stitch and the repo.
> `src/styles/design-tokens.css` is auto-generated and currently NOT imported by
> `globals.css`. The repo still uses the existing light theme; design-tokens.css
> is staged for an explicit migration step.

---

name: Apex Cinematic Tactical

## Tokens (mirrors Stitch `designMd`)

### Colors

| Token                      | Value     |
| -------------------------- | --------- |
| surface                    | `#131313` |
| surface-dim                | `#131313` |
| surface-bright             | `#3a3939` |
| surface-container-lowest   | `#0e0e0e` |
| surface-container-low      | `#1c1b1b` |
| surface-container          | `#201f1f` |
| surface-container-high     | `#2a2a2a` |
| surface-container-highest  | `#353534` |
| on-surface                 | `#e5e2e1` |
| on-surface-variant         | `#cfc6ab` |
| inverse-surface            | `#e5e2e1` |
| inverse-on-surface         | `#313030` |
| outline                    | `#989177` |
| outline-variant            | `#4c4732` |
| surface-tint               | `#e6c500` |
| primary                    | `#fff8ec` |
| on-primary                 | `#393000` |
| primary-container          | `#ffdb00` |
| on-primary-container       | `#716000` |
| inverse-primary            | `#6e5e00` |
| secondary                  | `#c8c6c5` |
| on-secondary               | `#313030` |
| secondary-container        | `#474746` |
| on-secondary-container     | `#b7b5b4` |
| tertiary                   | `#fbf8f8` |
| on-tertiary                | `#303030` |
| tertiary-container         | `#dedcdc` |
| on-tertiary-container      | `#616060` |
| error                      | `#ffb4ab` |
| on-error                   | `#690005` |
| error-container            | `#93000a` |
| on-error-container         | `#ffdad6` |
| primary-fixed              | `#ffe25c` |
| primary-fixed-dim          | `#e6c500` |
| on-primary-fixed           | `#221b00` |
| on-primary-fixed-variant   | `#534600` |
| secondary-fixed            | `#e5e2e1` |
| secondary-fixed-dim        | `#c8c6c5` |
| on-secondary-fixed         | `#1c1b1b` |
| on-secondary-fixed-variant | `#474746` |
| tertiary-fixed             | `#e4e2e1` |
| tertiary-fixed-dim         | `#c8c6c6` |
| on-tertiary-fixed          | `#1b1c1c` |
| on-tertiary-fixed-variant  | `#474747` |
| background                 | `#131313` |
| on-background              | `#e5e2e1` |
| surface-variant            | `#353534` |

### Typography

| Token              | Family         | Size | Weight | Line | Letter  |
| ------------------ | -------------- | ---- | ------ | ---- | ------- |
| display-lg         | Hanken Grotesk | 64px | 800    | 1.1  | -0.02em |
| headline-lg        | Hanken Grotesk | 32px | 700    | 1.2  | 0.05em  |
| headline-lg-mobile | Hanken Grotesk | 24px | 700    | 1.2  | 0.05em  |
| headline-md        | Hanken Grotesk | 18px | 700    | 1.4  | 0.1em   |
| body-lg            | Hanken Grotesk | 16px | 400    | 1.6  | 0.01em  |
| body-md            | Hanken Grotesk | 14px | 400    | 1.6  | 0.01em  |
| mono-label         | JetBrains Mono | 12px | 500    | 1    | 0.05em  |
| mono-data          | JetBrains Mono | 13px | 400    | 1.4  | 0       |

### Spacing

| Token         | Value  |
| ------------- | ------ |
| unit          | 4px    |
| gutter        | 1px    |
| margin-xs     | 16px   |
| margin-md     | 32px   |
| margin-lg     | 48px   |
| container-max | 1920px |

---

## Brand & Style

Forged in the aesthetic of modern investigative documentaries and high-stakes
tactical interfaces. Prioritizes technical precision, urgency, and
field-equipment utility. Unapologetically raw, authoritative, cinematic.

Visual direction: **Brutalist-Minimalist** hybrid. Rejects softness of modern
consumer web in favor of hard edges, high-contrast monochromatic foundations,
high-visibility hazard accents. Every element should feel pulled from a
technical readout or military-grade surveillance monitor. Layouts lean
ultra-wide, cinematic — documentary film frame proportions.

## Colors

Strictly functional, high-contrast, designed for low-light legibility.

- **Primary (`#ffdb00`)** — Electric Mustard. CTAs, active states, critical warnings.
- **Neutral / Background (`#0a0a0a`)** — Pure Black. Depth, cinematic weight.
- **Surface (`#1a1a1a`)** — Charcoal. UI containers, secondary hierarchy.
- **Border (`#333333`)** — Muted grey. Mandatory 1px outlines defining structure.
- **Text (`#ffffff`)** — Pure white. Maximum readability on dark surfaces.

## Typography

Used as a structural element.

1. **Hanken Grotesk** — primary communication. Headlines and labels always
   **All-Caps** with generous letter spacing — professional labeling feel.
2. **JetBrains Mono** — technical data, specs, timestamps, numerical readouts.
   Reinforces unedited raw-data-feed aesthetic.

Hierarchy through weight and letter spacing, not scale. Boldness over elegance.

## Layout & Spacing

**Rigid Tactical Grid.** 12 columns, boundaries defined by visible 1px lines, not whitespace.

- **Cinematic widescreen** — horizontal bias. Desktop uses wide margins for letterboxed feel.
- **Gutterless** — components sit flush, separated by 1px border (`#333333`).
- **Rhythm** — all padding/margin on 4px base. Internal padding tight (8/12px) for data density.
- **Adaptive reflow** — mobile collapses to single column; 1px border still mandatory around every block.

## Elevation & Depth

**Zero-shadow policy.** Depth is architectural — color value and containment.

- **Level 0 (base)** — `#0a0a0a` background canvas.
- **Level 1 (surface)** — `#1a1a1a` workspace, cards, modals.
- **Structural definition** — every surface change demarcated by 1px solid border (`#333333`).
- **Tactile feedback** — depth simulated by inverting colors on interaction (button → `#ffdb00` bg + `#0a0a0a` text), not by raising.

## Shapes

Strictly **sharp/angular.** 0px radius applies to every element — buttons,
inputs, cards, selection indicators. Lines feel cut from steel.

## Components

- **Buttons** — perfectly rectangular. Primary: `#ffdb00` bg + `#0a0a0a` text. Secondary: `#333333` border + white text. Labels uppercase Hanken Grotesk.
- **Inputs** — 1px border all sides. Label (JetBrains Mono) above the box or nested as a header section inside the field.
- **Chips/Tags** — small rectangles, JetBrains Mono text. Primary mustard for alerts, `#333333` for metadata.
- **Cards** — `#1a1a1a` bg + `#333333` 1px border. No container padding if it has nested sections — let internal borders work.
- **Lists** — separated by 1px horizontal lines. Each item = ledger row. Monospaced for IDs/timestamps.
- **Status indicators** — small squares (0px radius), not circles.
- **Tactical accents** — crosshair corner marks or 45° snipped corners via `clip-path`, sparingly on hero elements.

---

## Sync workflow

| Command                          | Effect                                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Ask Claude: `design:pull`        | Fetch Stitch project `4683768170577706110`, rewrite this file + `src/styles/design-tokens.css`.                                      |
| Ask Claude: `design:push`        | Read this file's frontmatter + tokens block, call Stitch MCP `upload_design_md`.                                                     |
| `pnpm design:verify`             | Batch screenshots all default routes (desktop + mobile) into `.design-snapshots/`. Claude reads PNGs and diffs against tokens above. |
| `pnpm design:audit-page -- /foo` | Single-page screenshot pair. Same script, one route.                                                                                 |
| Ask Claude: `design:audit`       | Interactive Playwright MCP loop — navigate, screenshot, inspect computed styles via `browser_evaluate`, compare against this file.   |
| `pnpm impeccable`                | Static scan: 27 UI anti-patterns (AI-slop tells, WCAG contrast, layout monotony, typography flatness, motion smell) over `src/`.     |
| `pnpm impeccable:fast`           | Regex-only mode of above — skips jsdom, faster, less accurate. Suitable for pre-commit / staged-files runs.                          |
| `pnpm impeccable:live`           | Same rules engine but run against `http://localhost:3000` via Puppeteer. Catches issues only visible after render.                   |
| Ask Claude: `/impeccable …`      | Impeccable skill slash commands: `/audit`, `/critique`, `/polish`, `/typeset`, `/layout`, `/harden`, `/shape`, `/craft`, etc.        |

## Visual verification loop (Playwright MCP)

```
Stitch (designMd) ──pull──▶ DESIGN.md / design-tokens.css
                                      │
                                      ▼
                          Next dev server (localhost:3000)
                                      │
                  Playwright MCP ─────┤
                                      ▼
                       PNG screenshots → Claude (multimodal)
                                      ▼
                       diff vs tokens in this file
                                      ▼
                       fix code OR push corrected tokens (design:push)
```

- **MCP server:** `@playwright/mcp` configured in `.mcp.json`. Tools available:
  `browser_navigate`, `browser_screenshot`, `browser_click`, `browser_snapshot`
  (a11y tree), `browser_evaluate`.
- **Animations frozen** before screenshot (`scripts/design-verify.ts` injects a
  `* { animation-duration: 0s; transition: none; }` style tag) to avoid Framer
  Motion / Swiper flake.
- **Static guards (two passes):**
  - `pnpm lint:design` — token-purity check (hardcoded hex / off-palette).
  - `pnpm impeccable` — anti-pattern check (AI-slop tells, WCAG, layout/typography).
  - Both are cheap and run without rendering. Use them as the first line of defence.
- **Rendered guards (two passes):**
  - `pnpm design:verify` — Claude-driven visual diff via screenshots.
  - `pnpm impeccable:live` — automated rules engine against the live page.
  - Use these when the static passes are clean but something still looks wrong.
- **Stitch governs design language; Impeccable governs design hygiene.** Stitch
  enforces brand-specific tokens (mustard accent, 0 radius, 1px borders).
  Impeccable enforces universal rules (no gradient text, AA contrast, no purple
  accents). Both apply. Conflicts: Stitch wins on brand choices, Impeccable wins
  on accessibility/contrast violations.
- **`/document` (Impeccable skill) is disabled by convention.** It rewrites
  `DESIGN.md` from scratch — would clobber the Stitch sync block at the top of
  this file. Use `design:pull` instead.
