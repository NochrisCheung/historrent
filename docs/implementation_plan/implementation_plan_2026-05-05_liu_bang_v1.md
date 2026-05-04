# Implementation Plan — Phase 1: Liu Bang Timeline (v1)

**created_at:** 2026-05-05
**last_updated:** 2026-05-05
**status:** Architecture ratified (§6 confirmed 2026-05-05) — ready for Phase 0 git work; Phase 0.1 onwards unblocked
**topic:** Liu Bang (劉邦) timeline — first deployed version of Historrent
**owner:** Chris Cheung + Claude Code (Opus 4.7)

---

## Status legend

Every task in §4 carries one of the following tags. Tags are updated in-place as work progresses.

| Tag         | Meaning                                                                   |
| ----------- | ------------------------------------------------------------------------- |
| 🔴 `TODO`   | Not started.                                                              |
| 🟡 `DOING`  | In progress.                                                              |
| 🟢 `DONE`   | Complete and verified.                                                    |
| ⏸️ `BLOCK`  | Blocked by a dependency or pending decision. The blocker is named inline. |
| 🔁 `REVIEW` | Implemented; awaiting human review or visual sign-off.                    |
| ❌ `DROP`   | Deliberately dropped from this plan. Reason recorded inline.              |

When a task changes state, prepend the new tag and keep the old one struck through if it adds context (e.g. `🟢 ~~🟡~~`).

---

## 1. Context

### 1.1 Project background

Historrent (滔滔) is an open-source, AI-augmented, canvas-based tool for exploring history. The seed corpus is 史記 (Records of the Grand Historian); the default UI language is Chinese; the long-term ambition is a navigable space where historical events, people, places, and entities can be explored across time, related through causality, and grounded in primary sources. See [docs/vision.md](../vision.md) for the full vision, [docs/product-context.md](../product-context.md) for the product surface, and [docs/implementation-approach.md](../implementation-approach.md) for the phasing philosophy.

### 1.2 Phase 1 scope (settled with the user 2026-05-04)

The product-context document originally proposed Phase 1 around Sima Qian's life. The user has reframed Phase 1 as follows, and these are the binding constraints for this plan:

- **Subject:** Liu Bang (劉邦), Han Gaozu, ~256 BCE – 195 BCE.
- **Initial view:** the viewport fits Liu Bang's whole life — start to end visible without panning.
- **Zoom:** the user can zoom in to month and day granularity. At deeper zoom, panning is required because the whole life no longer fits.
- **Curve geometry:** the timeline is straight in the centre of the viewport and curls into "loose string" at the left and right edges. The curve is a property of the viewport, present at every zoom level.
- **Canvas:** pale, near-white background. Content (Liu Bang's life) floats above it. No chrome.
- **Visual frame:** Tate Modern / MoMA white-cube — content is the artwork; the gallery is silent.
- **Onboarding:** none. Page loads → user is looking at Liu Bang's timeline.
- **Mobile:** desktop only in v1.
- **Language:** Chinese only. Toggle between Simplified (default) and Traditional. English deferred.
- **Accounts:** none. No auth, no persistence, no per-user state.
- **Loading:** elegant centred progress bar with status text. Errors: centred message on a white overlay.
- **Interaction model:** pure free-roam.
- **AI:** source synthesis on event click (the bounded, lowest-risk AI feature in implementation-approach.md).
- **User-stated success criterion:** "can read, visualise and navigate the timeline and content very easily."

### 1.3 Design commitments inherited from upstream docs

These flow through the spec without re-debating:

- Evidence-grounded; every assertion cites a specific passage in a specific edition.
- Show what we don't know (fuzzy dates render as fuzzy; conflicting sources render side-by-side).
- Continuous flow, no discrete pages.
- Multilingual is a property of content, not a deployment toggle.
- Open source by construction.
- AI augments, never invents.
- Beautiful by default.

### 1.4 Architecture decisions already settled

Settled with the user across 2026-05-04 and 2026-05-05:

- **Rendering:** Three.js + React Three Fiber. The canvas is GPU-rendered (R3F over Three.js); Chinese text uses a DOM overlay (drei `<Html>`) to keep type crisp, since rasterised CJK on a WebGL canvas degrades visibly at common label sizes.
- **Frontend framework:** **Next.js 15+ (App Router) + React 19 + TypeScript**. Vercel-native; file-based routing for the small number of content pages we'll grow into; route handlers host the AI proxy.
- **State:** Zustand (Poimandres, native pairing with R3F).
- **Canvas animation:** react-spring/three (Poimandres).
- **UI animation:** Framer Motion.
- **Dev-time tuning:** Leva.
- **i18n:** **next-intl** — purpose-built for Next.js App Router; we use it for UI strings, not URL-based locale routing (zh-Hans default, zh-Hant via in-app toggle persisted to `sessionStorage`).
- **Fonts:** **`next/font/local`** + manual `pyftsubset` step. We subset LXGW WenKai and Source Han Sans to actually-used characters before serving.
- **Hosting:** **Vercel** — zero-config Next.js deploy, Vercel Functions for the AI route handler. **Cache backend:** Upstash Redis via `@upstash/redis` (provisioned through the Vercel Marketplace; the legacy `@vercel/kv` package is deprecated as of 2025 and is **not** used).
- **AI provider:** DeepSeek (better classical-Chinese understanding than competitors at our price point). Model: **`deepseek-v4-flash`** initially (1M-token context, $0.14/M input, $0.28/M output). User has provided `DEEPSEEK_API_KEY` for environment use; **the key is never committed.**
- **Phase 1 data shape:** **JSON file with Zod validation** at build time. No DB until corpus growth justifies it (Phase 1.5+).
- **Package manager:** **pnpm** (faster, content-addressable store, well-behaved lockfile).
- **Test runner:** **Vitest** (unit + integration) + **Playwright** (E2E, Chromium only in v1).
- **Lint + format:** **ESLint** (Next.js default config + `@typescript-eslint`, `react-hooks`, custom `no-bare-strings-in-jsx`) + **Prettier**.

### 1.5 Visual direction

- **Aesthetic frame:** Tate Modern / MoMA white-cube — content floats in white, generous spacing, no chrome.
- **Secondary inspiration:** Are.na — clean blocks, generous typography, content-as-blocks.
- **Palette source:** [colors.ichuantong.cn](https://colors.ichuantong.cn/) (Chinese painting tradition). Final 2–3 anchor colours to be chosen by the user when there is a running canvas to react to.
- **Primary type:** LXGW WenKai (霞鶩文楷) — user's favourite, has hand-felt warmth.
- **Secondary type:** Source Han Sans (思源黑體) for UI chrome, controls, navigation.
- **Reserve type:** Source Han Serif (思源宋體) for primary-source Chinese quotations rendered in their original form (Phase 1.5+).

### 1.6 Engineering practices

This plan adheres to:

- [docs/engineering-practices.md](../engineering-practices.md) — DRY, well-tested, engineered enough, thoughtfulness > speed, explicit > clever; citation-first, read-mostly canvas, performance-as-design-constraint, show-what-we-don't-know, AI-bounded, i18n-as-content.
- [CLAUDE.md](../../CLAUDE.md) — think before coding, simplicity first, surgical changes, goal-driven execution, implementation plans before code.
- The historiographical principles in `engineering-practices.md` §3 — cite specifically, distinguish primary/secondary, surface conflict, multiple causation, contingency, 直筆, 考據, awareness of 春秋筆法.

### 1.7 No backward compatibility

Per CLAUDE.md §5 rule 5: this is a new project. No legacy schema, no compatibility shims, no migration paths from non-existent prior versions. The latest schema and code are the only ones in production.

---

## 2. Goals

### 2.1 Primary goal

Ship a publicly deployed Liu Bang timeline that the user judges as easy to read, visualise, and navigate. The deployed URL is shareable; 3–5 friendly testers can try it; their feedback is collected.

### 2.2 Secondary goals

1. **Establish architectural foundations.** The choices made here (R3F, Next.js App Router, next-intl, Vercel + Upstash Redis, JSON-data-with-Zod) become the substrate for Phase 1.5 and beyond. This plan locks them down with reasoning so we don't relitigate.
2. **Establish citation discipline structurally.** Every event in the v1 corpus has a citation. The data model rejects events without citations. The UI surfaces citations on every detail panel. The pattern is set for AI-extracted data later.
3. **Establish visual language.** Curve geometry, palette, type system, motion easing, hover behaviour — all locked in v1 through visual iteration with the user, not retrofitted later.
4. **Establish performance discipline.** `frameloop="demand"`, animate-only-on-interaction, Zustand selectors, label de-clustering — these patterns are baked in from the first commit and enforced thereafter.
5. **Wire AI bounded-and-cited.** DeepSeek source synthesis is the only AI surface in v1, runs server-side only, is cached, and answers must include citations. This is the template for every later AI feature.

### 2.3 Concrete acceptance criteria for v1

The build is "Phase 1 done" when **all** of these are true:

1. Page loads at a public URL with the curved-string canvas visible within ≤ 1.5s on a typical home connection.
2. Liu Bang's whole life (256–195 BCE, 61 years) fits the viewport without panning at default zoom.
3. The curve is _real_ — vertex-shader-bent geometry, not a CSS distortion. Sharp at every zoom level.
4. ≥ 40 curated Liu Bang events, all with Shiji citations, render at correct year positions.
5. Hover an event → it lights to 朱砂 cinnabar; click → side panel slides in with name, date, citation, and a "show synthesis" affordance.
6. Side panel "show synthesis" calls the DeepSeek-backed `/api/synthesise` route handler, displays the synthesis with citations, caches the result in Upstash Redis.
7. Pan and zoom are smooth (≥ 60fps on the maintainer's mid-tier laptop). Year ↔ month ↔ day transitions animate continuously.
8. Simplified ↔ Traditional toggle works for all UI strings and event names; current selection persists per-tab (sessionStorage).
9. Loading screen shows progress with status text. A network or AI failure produces a centred error overlay with retry.
10. The whole canvas is visually the user's "Tate white cube" — no chrome, no ornament, generous space.
11. The codebase passes lint, typecheck, unit tests, and E2E smoke. CI green on the deploy branch.
12. The user has signed off on the curve, palette, and typography.

### 2.4 Non-goals (Phase 1)

These are _deliberately not built_ in v1, despite being natural impulses to expand. See §5 for full deferred-decision list.

- No multiple parallel timelines.
- No causality view.
- No knowledge-graph-at-a-moment view.
- No focus types other than People (Liu Bang).
- No other people, places, or entities visible alongside Liu Bang.
- No AI extraction or assisted curation.
- No mobile responsive design.
- No English UI.
- No accounts, no saved views, no user state.
- No real database (Postgres comes in Phase 1.5+).
- No semantic search, no embeddings.
- No public API.

---

## 3. Implementation specification

### 3.1 High-level architecture

```
   ┌──────────────────────────────────────────────────────────┐
   │                       Vercel (CDN)                       │
   │   Static assets: HTML shell, JS bundles, fonts, JSON     │
   │   + LXGW WenKai (subset), Source Han Sans (subset)       │
   │   + Next.js client + server runtime                      │
   └────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
                            ▼
                  ┌─────────────────────┐
                  │   Browser (desktop) │
                  │   Next.js client    │
                  │  ┌───────────────┐  │
                  │  │   React 19    │  │
                  │  │  ┌─────────┐  │  │
                  │  │  │   R3F   │  │  │
                  │  │  │ (Canvas)│  │  │
                  │  │  └─────────┘  │  │
                  │  │   <Html>      │  │  ← drei: DOM-text overlays
                  │  │   panels      │  │     positioned in 3D space
                  │  └───────────────┘  │
                  │      Zustand        │  ← canvas + UI state
                  │      next-intl      │  ← UI string catalog
                  └──────────┬──────────┘
                             │ POST /api/synthesise
                             │ { eventId, language }
                             ▼
              ┌────────────────────────────────┐
              │  Next.js Route Handler         │
              │  app/api/synthesise/route.ts   │
              │  (runs as Vercel Function)     │
              │                                │
              │  1. SHA-256 hash of request    │
              │  2. Look up in Upstash Redis   │
              │     → if hit, return cached    │
              │  3. Else: build prompt → call  │
              │     DeepSeek → store in Redis  │
              │     → return                   │
              └─────────┬──────────────────────┘
                        │ HTTPS
                        ▼
            ┌───────────────────────────────┐
            │   DeepSeek API                │
            │   POST /chat/completions      │
            │   model: deepseek-v4-flash    │
            │   (Pro reserved for later)    │
            └───────────────────────────────┘
```

There is **no traditional backend** in v1. The Next.js app is hosted on Vercel; the AI proxy is a single route handler running as a Vercel Function; data is a JSON file imported by both the client (for rendering) and the server (for prompt assembly). Upstash Redis (provisioned via Vercel Marketplace) holds the synthesis cache. Postgres, tRPC/GraphQL, and any database-backed API are deferred to Phase 1.5+.

**Why this shape:** the client runs almost everything (R3F is browser-only), the server's only job is to hold the `DEEPSEEK_API_KEY` and proxy DeepSeek calls. Server Components are technically available but unused — every component in v1 is `"use client"` because the canvas can't pre-render.

### 3.2 Frontend directory structure (Next.js App Router with `src/`)

```
historrent/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── layout.tsx                    # Root layout: <html>, fonts, providers, global CSS
│   │   ├── page.tsx                      # The Liu Bang timeline page (Phase 1's only page)
│   │   ├── loading.tsx                   # Next.js loading boundary
│   │   ├── error.tsx                     # Next.js error boundary
│   │   ├── globals.css                   # CSS reset + tokens import
│   │   └── api/
│   │       └── synthesise/
│   │           └── route.ts              # POST handler — DeepSeek proxy + Upstash Redis cache
│   │
│   ├── components/
│   │   ├── canvas/                       # R3F components — GPU layer (all 'use client')
│   │   │   ├── Timeline.tsx              # <Canvas> root
│   │   │   ├── TimelineString.tsx        # Curved-string mesh + shader
│   │   │   ├── TimelineItem.tsx          # One event dot + <Html> label
│   │   │   ├── camera/
│   │   │   │   ├── CameraRig.tsx
│   │   │   │   └── useTimelineCamera.ts
│   │   │   ├── shaders/
│   │   │   │   ├── curveVertex.glsl
│   │   │   │   └── curveFragment.glsl
│   │   │   └── geometry/
│   │   │       ├── yearToWorld.ts
│   │   │       └── curve.ts             # Curve y-displacement (mirrors shader)
│   │   │
│   │   └── ui/                           # React UI overlays — DOM layer
│   │       ├── LoadingScreen.tsx
│   │       ├── ErrorOverlay.tsx
│   │       ├── DetailPanel.tsx
│   │       ├── LanguageToggle.tsx
│   │       └── ZoomToggle.tsx
│   │
│   ├── state/                            # Zustand stores
│   │   ├── timelineStore.ts
│   │   └── uiStore.ts
│   │
│   ├── data/                             # Phase 1 seed data
│   │   ├── liu_bang.json
│   │   ├── liu_bang.schema.ts
│   │   └── liu_bang.test.ts
│   │
│   ├── ai/
│   │   ├── server/                       # Server-only — used by route handler
│   │   │   ├── handler.ts                # Pure function: composes cache+prompt+deepseek
│   │   │   ├── handler.test.ts           # Unit tests with stubbed deps
│   │   │   ├── deepseek.ts               # DeepSeek client (uses DEEPSEEK_API_KEY)
│   │   │   ├── prompt.ts                 # Prompt builder
│   │   │   ├── prompt.test.ts            # Snapshot tests
│   │   │   ├── cache.ts                  # Upstash Redis wrapper + in-memory fallback
│   │   │   └── cache.test.ts             # Verifies in-memory backend interface
│   │   └── client/                       # Client-only — fetches /api/synthesise
│   │       ├── client.ts
│   │       └── client.test.ts
│   │
│   ├── i18n/
│   │   ├── config.ts                     # next-intl config
│   │   ├── messages/
│   │   │   ├── zh-Hans.json
│   │   │   └── zh-Hant.json
│   │   └── Provider.tsx                  # next-intl provider mount
│   │
│   ├── shared/
│   │   ├── citation/
│   │   │   ├── format.ts
│   │   │   └── format.test.ts
│   │   ├── date/
│   │   │   ├── bce.ts
│   │   │   └── bce.test.ts
│   │   └── types.ts
│   │
│   ├── styles/
│   │   ├── tokens.css                    # Colour, type, spacing, motion tokens
│   │   └── reset.css
│   │
│   └── fonts/
│       └── index.ts                      # next/font/local setup for LXGW WenKai + SHS
│
├── public/
│   └── fonts/
│       ├── lxgw-wenkai-zh-Hans.woff2     # Subsetted via pyftsubset
│       ├── lxgw-wenkai-zh-Hant.woff2
│       └── source-han-sans-zh.woff2
│
├── tests/
│   ├── e2e/
│   │   ├── load.spec.ts
│   │   ├── interact.spec.ts
│   │   ├── ai.spec.ts                    # Mocks /api/synthesise via Playwright
│   │   └── i18n.spec.ts
│   └── fixtures/
│       └── liu_bang_subset.json
│
├── docs/                                 # (existing)
│   ├── vision.md
│   ├── product-context.md
│   ├── implementation-approach.md
│   ├── engineering-practices.md
│   ├── decisions/                        # ADRs
│   └── implementation_plan/
│       └── implementation_plan_2026-05-05_liu_bang_v1.md   ← this file
│
├── scripts/
│   ├── subset-fonts.ts                   # Drives pyftsubset against LXGW WenKai + SHS
│   └── validate-data.ts                  # Run Zod schemas against data files
│
├── .github/workflows/
│   └── ci.yml                            # Lint + test + typecheck + build on PR
│                                         # (Deploy is auto-handled by Vercel's GitHub integration)
│
├── CLAUDE.md
├── README.md
├── LICENSE                               # Apache 2.0
├── LICENSE-DATA                          # CC-BY-SA 4.0
├── .env.example                          # Documents DEEPSEEK_API_KEY + UPSTASH_REDIS_*
├── .gitignore                            # Includes .next/, .vercel/, etc.
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── next.config.ts                        # Next.js config (image, webpack, etc.)
├── eslint.config.mjs                     # Extends next/core-web-vitals
├── playwright.config.ts
├── vitest.config.ts                      # jsdom environment for component tests
└── prettier.config.js
```

**Layout notes:**

- We use `--src-dir` (Next.js's option). Everything app-related lives in `src/`. This keeps non-app code (`components/`, `state/`, `data/`, etc.) out of the App Router's special directory.
- Every R3F component starts with `"use client"` directive — the canvas cannot run as a Server Component.
- The `src/app/api/synthesise/route.ts` is the only server-side code in v1. We default it to **Node.js runtime** (`export const runtime = 'nodejs'`) for simpler debugging and broader npm compatibility. The Edge runtime is a viable upgrade path if cold starts become a concern (our use case — `fetch` to DeepSeek + KV operations — would work in Edge); revisit in Phase 1.5.
- `src/ai/server/` is imported only from `src/app/api/synthesise/route.ts`. ESLint `no-restricted-imports` prevents client components from importing it.
- The `route.ts` file is a thin wrapper. Its actual logic lives in `src/ai/server/handler.ts` as a pure function, so it can be unit-tested without spinning up Next.js.

### 3.3 Data model (Phase 1)

For ~40–60 curated events, no DB is needed. Data lives in `src/data/liu_bang.json`, validated at build time via Zod.

**Year-numbering convention.** We use **colloquial signed BCE** throughout, not strict ISO 8601 / proleptic Gregorian. `-256` means "256 BCE" plain — it is _not_ "year -256 in the proleptic Gregorian calendar where year 0 = 1 BCE." The EDTF strings in our data follow the same colloquial convention (`-0256` = 256 BCE). This is non-standard relative to strict ISO 8601 but is intuitive for users and consistent across the codebase. We revisit this if/when a stricter EDTF library is adopted in Phase 1.5+.

```ts
// src/data/liu_bang.schema.ts
import { z } from "zod";

// For v1 (single corpus, ctext.org-only), URI is required and must point to ctext.org.
// When we add a second corpus in Phase 1.5+, this constraint is loosened per-corpus.
const CtextUri = z.string().regex(/^https:\/\/ctext\.org\/[a-z-/]+\/zh#n\d+$/, {
  message: "v1 citations must link to a ctext.org passage",
});

export const Citation = z.object({
  work: z.literal("Shiji"),
  edition: z.string(), // e.g. "Zhonghua Shuju 1959 punctuated edition"
  chapter: z.number().int(), // e.g. 8 for 高祖本紀
  section: z.string().optional(), // section title (e.g. "高祖本紀")
  paragraph: z.number().int(), // ctext.org paragraph anchor number
  textAnchor: z.string(), // first ~10 characters of cited passage
  uri: CtextUri, // required in v1
  language: z.enum(["zh-Hant", "zh-Hans"]),
});

export const FuzzyDate = z.object({
  // EDTF-style canonical string. Phase 1 uses a small colloquial subset:
  //   "-0256"        — exact year (256 BCE, colloquial)
  //   "-0256?"       — uncertain year
  //   "-0256/-0247"  — date range (Liu Bang's birth is disputed: 256 or 247 BCE)
  //   "-0256~"       — approximate
  edtf: z.string(),
  precision: z.enum(["year", "month", "day"]),
  // Colloquial signed BCE (see "Year-numbering convention" above).
  // -256 = 256 BCE, 195 = 195 CE.
  startEarliest: z.number().int(),
  startLatest: z.number().int(),
  endEarliest: z.number().int(),
  endLatest: z.number().int(),
});

const NameVariants = z.object({
  zhHans: z.string(),
  zhHant: z.string(),
  pinyin: z.string().optional(),
  en: z.string().optional(),
});

export const LiuBangEvent = z.object({
  id: z.string(), // stable slug, e.g. "hongmen-banquet"
  name: NameVariants,
  date: FuzzyDate,
  description: NameVariants.partial({ pinyin: true, en: true }),
  citations: z.array(Citation).min(1), // ≥ 1, enforced by schema
  significance: z.enum(["major", "standard", "minor"]),
  tags: z.array(z.string()).default([]), // e.g. ["military","ascension"]
});

export const LiuBangCorpus = z.object({
  subject: z.object({
    id: z.literal("liu-bang"),
    name: NameVariants,
    born: FuzzyDate,
    died: FuzzyDate,
  }),
  events: z.array(LiuBangEvent),
});

export type TLiuBangCorpus = z.infer<typeof LiuBangCorpus>;
```

**Key constraints encoded structurally:**

- `citations: z.array(...).min(1)` — every event has at least one citation. Loading a JSON file with a citation-less event throws at build time, not runtime.
- `Citation.uri: CtextUri` — every v1 citation must point to a ctext.org passage. Non-ctext URIs are rejected by the schema.
- `Citation.paragraph` and `Citation.textAnchor` are required (not optional) — without them a citation isn't actually verifiable.
- `name: NameVariants` — every name has both Simplified and Traditional forms. Single-form names are rejected.
- `FuzzyDate` carries both an EDTF string and pre-computed bounds. The bounds drive timeline positioning; the EDTF string is what's rendered to the user.

`liu_bang.test.ts` imports the JSON via ES module syntax (`import liuBangData from './liu_bang.json'`) and calls `LiuBangCorpus.parse(liuBangData)`. Schema violations fail the test. Vite/Next.js + TypeScript handle JSON imports natively when `resolveJsonModule: true` is set in `tsconfig.json` (the create-next-app default already enables it).

### 3.4 Visual design system (placeholders to be finalised on a running canvas)

Locked into `src/styles/tokens.css` as CSS custom properties so they can be swapped without code changes:

```css
:root {
  /* Chinese-named palette — placeholders, finalised in Phase 11 */
  --canvas-bg: #fbfcfd; /* 月白 yuèbái — moon white */
  --surface: #f2f0ec; /* 銀白 yínbái — silver white */
  --ink: #3d3b4f; /* 玄青 xuánqīng — deep dark */
  --ink-muted: #75878a; /* 蒼色 cāngsè — ashen */
  --line: #5d513c; /* 黧 lí — darkened grey */
  --accent: #bf242a; /* 朱砂 zhūshā — cinnabar */
  --accent-alt: #4a4266; /* 黛 dài — kohl indigo */

  /* Type */
  --font-content: "LXGW WenKai", "Source Han Serif SC", serif;
  --font-chrome: "Source Han Sans SC", "PingFang SC", sans-serif;
  --font-quote: "Source Han Serif SC", "Source Han Serif TC", serif;

  /* Spacing rhythm — 8px base */
  --s-1: 4px;
  --s-2: 8px;
  --s-3: 16px;
  --s-4: 24px;
  --s-5: 40px;
  --s-6: 64px;

  /* Motion */
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
  --dur-fast: 160ms;
  --dur-base: 240ms;
  --dur-slow: 400ms;
}
```

These are placeholder values. Final palette is chosen in Phase 11 once a running canvas exists for visual reaction. Nothing in the code refers to hex values directly — only to tokens.

### 3.5 Curve geometry (placeholder, iterated visually)

The curved-string is a `Mesh` with a custom `ShaderMaterial`. The vertex shader displaces vertex positions based on world-space x:

```glsl
// curveVertex.glsl — placeholder formulation, Phase 7 iterates this
uniform float uCenterFlatHalfWidth;   // half-width of the central straight zone
uniform float uCurveAmount;           // how much the edges drop
uniform float uCurveSharpness;        // how abruptly the curl begins

varying vec2 vUv;

void main() {
  vUv = uv;
  vec3 displaced = position;

  float xAbs = abs(position.x);
  float beyondFlat = max(xAbs - uCenterFlatHalfWidth, 0.0);
  float t = smoothstep(0.0, uCurveSharpness, beyondFlat);
  displaced.y -= t * uCurveAmount;   // edges sag downward — "loose string"

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
```

The actual formulation (linear vs sinusoidal vs cubic, sag vs S-curve, depth-displacement vs y-displacement) is iterated live with Leva controls in Phase 7. The user is the visual judge; this code is a starting structure.

### 3.6 Performance discipline (locked from day one)

These patterns are non-negotiable in this codebase. They're enforced via code review and (where automatable) lint rules / CI checks.

1. **`frameloop="demand"` on `<Canvas>`.** The render loop only runs when state changes. Idle = 0 GPU/CPU.
2. **No always-on canvas animations.** All animation is interaction-driven (hover, click, language toggle, zoom transition). The curl does not "breathe."
3. **Zustand selectors with equality.** `useTimeline((s) => s.hoveredId === event.id)` — re-render when _that boolean_ flips, not on every store mutation.
4. **`useFrame` for hot paths.** Item position updates during pan/zoom are imperative (`mesh.current.position.x = ...`) inside `useFrame`, not React state. This is normal R3F practice.
5. **Label de-clustering.** At year-zoom showing 40+ events, all labels visible. At wider zoom (Phase 1.5), de-cluster — show only `significance: 'major'` labels.
6. **Bundle budget: ≤ 800KB gzipped first paint.** CI checks. If exceeded, code-split drei imports and font subsets first; only if both are exhausted, regroup.
7. **Initial paint budget: ≤ 1.5s on a 50 Mbps home connection** (measured via `performance.timing.loadEventEnd`). CI runs Lighthouse on PR; regression > 200ms blocks merge.

Patterns will be added to [docs/engineering-practices.md](../engineering-practices.md) §1 as task 0.7 of Phase 0.

### 3.7 AI plumbing for source synthesis

**Source provenance — non-negotiable.** The source passages fed to DeepSeek come from **史記 chapter 8 (高祖本紀) on ctext.org**, never from Wikipedia, secondary syntheses, or generated paraphrases. The chapter contains 68 numbered paragraphs accessible via stable URL anchors of the form `https://ctext.org/shiji/gao-zu-ben-ji/zh#n{anchor_id}` (e.g. `#n4897`). Both Traditional and Simplified Chinese versions are served by ctext.org. The ctext.org passage is the _canonical_ form; our `liu_bang.json` events reference it. The local PDF (`/Users/smartegg/Downloads/Shiji _ Annals _ Annals of Gaozu - Chinese Text Project.pdf`) is a working copy of the same content for offline curation and verification.

**Endpoint.** The frontend never talks to DeepSeek directly — this protects the `DEEPSEEK_API_KEY`. Instead:

```
Browser  ── POST /api/synthesise { eventId, language } ──>  Next.js route handler
                                                                  │
                                       1. SHA-256 hash of (eventId, language, model, promptVersion, passageHash)
                                                                  │
                                       2. Look up in Upstash Redis → if hit, return { synthesis, cached: true }
                                                                  │
                                       3. Else, build prompt → call DeepSeek → store in Redis → return
                                                                  │
                                                                  ▼
Route    ── POST https://api.deepseek.com/chat/completions ──> DeepSeek
handler
```

The route handler is `src/app/api/synthesise/route.ts`. It runs as a Vercel Function (Node.js runtime).

**Prompt template** (versioned, snapshot-tested):

```text
SYSTEM:
You are a careful, source-grounded historical assistant. You answer ONLY from
the source passages provided. You DO NOT invent dates, names, places, or causes.
Every claim in your answer must cite the source passage by its bracketed
reference. If the provided passages do not contain enough information to
answer, you say so explicitly. Your answers are in Modern Standard Chinese
(Simplified or Traditional, matching the user's preference).

USER:
事件：{event.name.zhHans}（约 {event.date.edtf}）

来源段落：
[Shiji-{chapter}-{paragraph}] {source_passage}

请用约 80–120 个汉字综合上述来源段落对该事件的记述。每个论断必须用方括号
引用对应的段落。如果段落信息不足以回答某个方面，请说明。
```

**Model:** `deepseek-v4-flash` (cache-miss $0.14/M input, $0.28/M output, 1M-token context). We start cheap; if quality is insufficient on classical-Chinese passages we evaluate `deepseek-v4-pro` (currently 75% off until 2026/05/31).

**Caching:** Upstash Redis (provisioned via the Vercel Marketplace), client `@upstash/redis`. Key prefix `synthesis-v1:`. Key = `synthesis-v1:${sha256(model + promptVersion + eventId + language + passageHash)}`. TTL = none (cache forever; bumping `promptVersion` invalidates). Upstash's free tier (10k commands/day, 256MB) covers v1 traffic comfortably.

**Local-dev fallback.** `src/ai/server/cache.ts` checks `process.env.UPSTASH_REDIS_REST_URL`. If absent (local dev without Upstash provisioned), it falls back to an **in-memory `Map`** scoped to the dev process. This means caching works locally for the lifetime of `pnpm dev`, but is wiped on restart. Production behaviour is identical when the Upstash env vars are present. This lets us run end-to-end locally before any Vercel project exists.

**Cost ceiling:** with ~50 events × ~1k tokens in/200 tokens out = ~50k input tokens, ~10k output tokens for a full corpus pass. Cache-miss cost ≈ $0.014 per full new visitor cohort. Negligible at v1 scale.

**Refusal handling:** if the model returns "passages do not contain enough information," the UI surfaces this _as the answer_ — that's the honest answer, not a failure. We don't retry with a more permissive prompt.

### 3.8 i18n strategy

- **Library:** **next-intl** — purpose-built for Next.js App Router. We use the in-app provider mode (not URL-based locale routing) since v1 has only one page and we toggle via a UI control, not the URL.
- **Languages:** `zh-Hans` (default) and `zh-Hant`.
- **Storage:** `src/i18n/messages/zh-Hans.json` and `src/i18n/messages/zh-Hant.json` — two flat key-value catalogs (next-intl supports nested keys; we keep them flat for v1 to minimise indirection).
- **Provider:** `<NextIntlClientProvider locale={locale} messages={messages}>` mounted in the root layout, wrapping the canvas + UI.
- **Event names:** stored in both forms in `liu_bang.json` (per the schema). At display time, the active language picks the correct form. We do **not** use OpenCC at runtime — too much risk of character-conversion bugs on classical text.
- **UI strings:** all externalised via `t('key')`. ESLint rule `no-bare-strings-in-jsx` enforces.
- **Toggle persistence:** `sessionStorage` (resets on tab close — matches the "no user state" Phase 1 spec). The selected locale is read on mount and feeds the next-intl provider.
- **No URL-based locale routing in v1.** We deliberately don't use next-intl's middleware-based `/zh-Hans/...` path scheme. If we add English in Phase 1.5+, we'll reconsider.

### 3.9 Hosting

- **Platform:** **Vercel** (Next.js native; zero-config deploy from GitHub).
- **Static + serverless:** static assets from Vercel's CDN; the route handler runs as a Vercel Function (Node.js runtime).
- **Cache backend:** **Upstash Redis**, provisioned via the Vercel Marketplace ("Marketplace → Storage → Redis → Upstash"). Bindings are exposed as env vars: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Client: `@upstash/redis`. _We do not use the deprecated `@vercel/kv` package._
- **Domain:** v1 lives at the auto-assigned `historrent.vercel.app`. Custom domain deferred to Phase 1.5.
- **Secrets:** `DEEPSEEK_API_KEY` set via `vercel env add` (or the dashboard). Never committed. Local dev uses `.env.local` (gitignored).
- **GitHub integration:** Vercel auto-deploys on push to `main` (production) and creates preview deployments for PRs. CI workflow (`.github/workflows/ci.yml`) runs lint/test/build _before_ the merge; Vercel deployment runs _after_.

### 3.10 Testing strategy

- **Unit (Vitest):** date math (BCE arithmetic), Zod schema validation, citation formatter, AI prompt builder (snapshot tests against fixtures), curve math.
- **Integration (Vitest):** `src/data/liu_bang.test.ts` parses the real corpus through the Zod schema. The synthesis handler has its own test (`src/ai/server/handler.test.ts`) that mocks DeepSeek (`vi.mock('./deepseek')`) and stubs the cache, and verifies cache hit/miss behaviour, refusal handling, and prompt-version invalidation.
- **E2E (Playwright):**
  - `load.spec.ts` — page loads, canvas appears, ≥ 40 dots visible, no console errors.
  - `interact.spec.ts` — hover an item, dot grows + lights cinnabar; click, panel slides in; close panel.
  - `ai.spec.ts` — click "show synthesis," loading state, synthesis renders with citations (Playwright route interception mocks `/api/synthesise`).
  - `i18n.spec.ts` — toggle language, all UI text + event names switch.
- **Visual regression:** out of scope for v1. Add in Phase 1.5 if drift becomes a problem.
- **Accessibility:** Phase 1 ships canvas with the known a11y debt. Add a hidden DOM mirror and Axe checks in Phase 1.5.

---

## 4. Implementation phases

Tasks are listed in execution order within each phase. Phases are roughly sequential, but parallelism is called out where safe.

### Phase 0 — Repo setup and tooling

Establishes the working environment and CI.

**System prerequisites** (one-time, on the maintainer's machine — not committed):

- Node.js 22+ (LTS as of 2026)
- pnpm 9+
- Python 3.11+ with `fonttools` (`pip install fonttools brotli`) — required by `scripts/subset-fonts.ts` (Phase 6.7)
- `gh` CLI authenticated for `NochrisCheung` (Phase 0.2)
- `gitleaks` (`brew install gitleaks`) — required by Phase 0.21 pre-commit hook

| #    | Status  | Task                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1  | 🟢 DONE | **Switch git identity.** Set global `git config user.name "Chris Cheung"` and `user.email "chris.chiuwing.cheung@gmail.com"`. Confirmed by user 2026-05-04.                                                                                                                                                                                                                                                                                       |
| 0.2  | 🟢 DONE | **Authenticate `gh` to NochrisCheung.** User runs `gh auth login -h github.com -p https -w` and selects NochrisCheung; then `gh auth switch -u NochrisCheung`. Verify via `gh auth status`.                                                                                                                                                                                                                                                       |
| 0.3  | 🟢 DONE | **`git init`** in the project directory.                                                                                                                                                                                                                                                                                                                                                                                                          |
| 0.4  | 🟢 DONE | **Create `.gitignore`.** `create-next-app` generates a baseline; extend with `coverage/`, `playwright-report/`, `test-results/`, `.env.local`, `.env*.local`. (Default Next.js .gitignore already covers `node_modules`, `.next/`, `.vercel/`, `.DS_Store`, `out/`, `*.tsbuildinfo`.)                                                                                                                                                             |
| 0.5  | 🟢 DONE | **Add `LICENSE` (Apache 2.0)** and **`LICENSE-DATA` (CC-BY-SA 4.0)** at repo root.                                                                                                                                                                                                                                                                                                                                                                |
| 0.6  | 🟢 DONE | **Update `README.md`** to point to: (a) `docs/vision.md`, `docs/product-context.md`, `docs/implementation-approach.md`, `docs/engineering-practices.md`; (b) the active implementation plan; (c) `LICENSE` and `LICENSE-DATA`. Keep README short — pointers, not prose.                                                                                                                                                                           |
| 0.7  | 🟢 DONE | **Append performance-discipline section to `docs/engineering-practices.md` §1**, codifying the patterns in §3.6 of this plan.                                                                                                                                                                                                                                                                                                                     |
| 0.8  | 🟢 DONE | **Bootstrap Next.js app.** Run `pnpm create next-app@latest . --typescript --eslint --app --src-dir --import-alias "@/*" --no-tailwind` (no Tailwind — we use CSS modules + tokens). Reconcile with existing docs/ folder (the bootstrapper preserves it).                                                                                                                                                                                        |
| 0.9  | 🟢 DONE | **Install canvas stack:** `pnpm add three @react-three/fiber @react-three/drei @react-spring/three leva zustand`. Dev: `pnpm add -D @types/three`.                                                                                                                                                                                                                                                                                                |
| 0.10 | 🟢 DONE | **Install i18n:** `pnpm add next-intl`.                                                                                                                                                                                                                                                                                                                                                                                                           |
| 0.11 | 🟢 DONE | **Install UI motion:** `pnpm add framer-motion`.                                                                                                                                                                                                                                                                                                                                                                                                  |
| 0.12 | 🟢 DONE | **Install validation:** `pnpm add zod`.                                                                                                                                                                                                                                                                                                                                                                                                           |
| 0.13 | 🟢 DONE | **Install Upstash Redis client:** `pnpm add @upstash/redis`. (We do not use `@vercel/kv` — it was deprecated in 2025 in favour of provisioning Upstash directly via the Vercel Marketplace.)                                                                                                                                                                                                                                                      |
| 0.14 | 🟢 DONE | **Install dev tooling:** `pnpm add -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @playwright/test prettier husky lint-staged`. (ESLint comes from `create-next-app`.)                                                                                                                                                                                                                                               |
| 0.15 | 🟢 DONE | **Install gitleaks** as a pre-commit hook (`brew install gitleaks` or download binary; wired into Husky).                                                                                                                                                                                                                                                                                                                                         |
| 0.16 | 🟢 DONE | **Configure `tsconfig.json`** — Next.js generates a working version; tighten with `"strict": true` (already), `"noUncheckedIndexedAccess": true`, ensure `paths: { "@/*": ["./src/*"] }` and `resolveJsonModule: true` (default true in Next.js but verify).                                                                                                                                                                                      |
| 0.17 | 🟢 DONE | **Configure `next.config.ts`** — `reactStrictMode: true`, empty `turbopack: {}` placeholder (Turbopack is default in Next.js 16+; shader loaders for `.glsl`/`.vert`/`.frag` are added here in Phase 7 once shader files exist), `transpilePackages: []` (extend if a Three.js dependency needs it).                                                                                                                                              |
| 0.18 | 🟢 DONE | **Configure ESLint** (`eslint.config.mjs` extending `next/core-web-vitals` and `next/typescript`; the bootstrapper uses `.mjs`, not `.ts`) — add `no-restricted-imports` rule banning `@/ai/server/*` from any non-test file outside `src/app/api/**`. (Custom `no-bare-strings-in-jsx` rule deferred — adding it without false positives requires a small custom rule plugin; tracked as Phase 6.10 instead, where it gates the i18n migration.) |
| 0.19 | 🟢 DONE | **Configure `prettier.config.js`** + `.editorconfig`.                                                                                                                                                                                                                                                                                                                                                                                             |
| 0.20 | 🟢 DONE | **Configure Vitest** (`vitest.config.ts`) — jsdom environment, `@testing-library/jest-dom` setup, alias `@` to `./src`.                                                                                                                                                                                                                                                                                                                           |
| 0.21 | 🟢 DONE | **Configure Playwright** (`playwright.config.ts`) — Chromium only for v1, `webServer` boots `pnpm dev` against port 3000.                                                                                                                                                                                                                                                                                                                         |
| 0.22 | 🟢 DONE | **Husky + lint-staged**: pre-commit runs ESLint, Prettier, gitleaks.                                                                                                                                                                                                                                                                                                                                                                              |
| 0.23 | 🟢 DONE | **`.env.example`** documenting required env vars: `DEEPSEEK_API_KEY`, `UPSTASH_REDIS_REST_URL` (optional in dev), `UPSTASH_REDIS_REST_TOKEN` (optional in dev). Note: Upstash vars are populated automatically when the Upstash store is provisioned via the Vercel Marketplace (Phase 13.2).                                                                                                                                                     |
| 0.24 | 🟢 DONE | **Top-level scripts in `package.json`:** `dev`, `build`, `start`, `test`, `test:ui`, `test:e2e`, `lint`, `typecheck`, `format`, `subset-fonts`.                                                                                                                                                                                                                                                                                                   |
| 0.25 | 🟢 DONE | **`.github/workflows/ci.yml`:** on PR, runs `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. (Deploy is automatic via Vercel's GitHub integration; no separate deploy workflow needed.)                                                                                                                                                                                                                                                  |
| 0.26 | 🔴 TODO | **First commit** with all the above. Not yet pushed.                                                                                                                                                                                                                                                                                                                                                                                              |
| 0.27 | 🔴 TODO | **`gh repo create NochrisCheung/historrent --public --source=. --push`** — confirm it lands under NochrisCheung.                                                                                                                                                                                                                                                                                                                                  |

**Acceptance:** `pnpm dev` runs the (empty) Next.js dev server on port 3000. `pnpm test` runs the (empty) Vitest. `pnpm typecheck` is clean. `pnpm build` produces a successful production build. Repo on GitHub under `NochrisCheung/historrent`.

### Phase 1 — Static skeleton: canvas, camera, background

The empty stage. No content yet.

| #   | Status  | Task                                                                                                                                                                                                                                                |
| --- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | 🔴 TODO | **`src/components/canvas/Timeline.tsx`** with `'use client'` — `<Canvas frameloop="demand" gl={{ antialias: true }}>`.                                                                                                                              |
| 1.2 | 🔴 TODO | **`src/components/canvas/camera/CameraRig.tsx`** — `<OrthographicCamera makeDefault position={[0,0,10]} zoom={...}>`. Zoom calibrated so Liu Bang's lifespan (61 years) fits with margin.                                                           |
| 1.3 | 🔴 TODO | **Background colour** via `<color attach="background" args={[...]}>` reading the resolved value of `--canvas-bg` (read CSS var on mount, pass as RGB).                                                                                              |
| 1.4 | 🔴 TODO | **`src/styles/tokens.css`** with §3.4 placeholder palette. Imported once in `src/app/globals.css`.                                                                                                                                                  |
| 1.5 | 🔴 TODO | **`src/fonts/index.ts`** uses `next/font/local` to register LXGW WenKai + Source Han Sans, exposing CSS variables `--font-content`, `--font-chrome`. Fonts referenced from Phase 6 once subsetted; Phase 1 uses fallback stack.                     |
| 1.6 | 🔴 TODO | **`src/app/layout.tsx`** — root layout: `<html lang="zh-Hans">`, font CSS variables wired, `globals.css` imported, providers (next-intl, etc.) mounted around children.                                                                             |
| 1.7 | 🔴 TODO | **`src/app/page.tsx`** — mounts `<Timeline />` filling the viewport. (The page itself can stay a Server Component; `<Timeline />` carries the `'use client'` boundary. This way the static shell still SSRs while the canvas hydrates client-side.) |
| 1.8 | 🔴 TODO | **E2E `tests/e2e/load.spec.ts`** — page loads at `http://localhost:3000`, `<canvas>` element present, no console errors.                                                                                                                            |

**Acceptance:** `pnpm dev` opens to a pale blank canvas at the chosen background colour. No errors. `pnpm test:e2e` passes the load spec.

### Phase 2 — Data layer

| #   | Status  | Task                                                                                                                                                                                                                                                                                                                                                             |
| --- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | 🔴 TODO | **`src/data/liu_bang.schema.ts`** with the Zod schema in §3.3.                                                                                                                                                                                                                                                                                                   |
| 2.2 | 🔴 TODO | **`src/data/liu_bang.json`** — initial seed of **5 well-cited events** (suggested: birth ~256 BCE, 起兵 at 沛 209 BCE, 入咸阳 207 BCE, 鴻門宴 206 BCE, 即皇帝位 202 BCE). Each with both Hans/Hant name forms and ≥ 1 real ctext.org citation pointing into 高祖本紀 (chapter 8). Used to validate the schema and pipeline before the full curation in Phase 12. |
| 2.3 | 🔴 TODO | **`src/data/liu_bang.test.ts`** — `LiuBangCorpus.parse(...)` against the JSON. Failing schema = failing test.                                                                                                                                                                                                                                                    |
| 2.4 | 🔴 TODO | **`src/shared/date/bce.ts`** — BCE-aware year/month/day arithmetic, signed-year math, EDTF parsing for the small subset we use.                                                                                                                                                                                                                                  |
| 2.5 | 🔴 TODO | **`src/shared/date/bce.test.ts`** — unit tests for the math, including the year-0-doesn't-exist case (we use astronomical year numbering, where 1 BCE = year 0).                                                                                                                                                                                                 |
| 2.6 | 🔴 TODO | **`src/shared/citation/format.ts`** — render a `Citation` to a human-readable string in both languages.                                                                                                                                                                                                                                                          |
| 2.7 | 🔴 TODO | **`src/shared/citation/format.test.ts`** — snapshot tests.                                                                                                                                                                                                                                                                                                       |
| 2.8 | 🔴 TODO | **`src/components/canvas/geometry/yearToWorld.ts`** — `(year: number) => x: number`, mapping the lifespan to `[-5, +5]` with margin. Pure function, fully tested.                                                                                                                                                                                                |

**Acceptance:** `pnpm test` is green. The 5-event seed parses through Zod without errors. Year-to-world mapping is verified by tests.

### Phase 3 — Timeline string (flat first, curve later)

| #   | Status  | Task                                                                                                                                               |
| --- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1 | 🔴 TODO | **`src/components/canvas/TimelineString.tsx`** — flat plane mesh from world-x `-5` to `+5`, height ~1.5% of the lifespan span, in `--line` colour. |
| 3.2 | 🔴 TODO | Mesh persists across re-renders (no remount on item changes). Verify with React DevTools.                                                          |

**Acceptance:** A subtle horizontal line visible across the centre of the canvas. Curve is added in Phase 7.

### Phase 4 — Items, hover, selection

| #   | Status  | Task                                                                                                                                                       |
| --- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1 | 🔴 TODO | **`src/state/timelineStore.ts`** — Zustand store with `hoveredId`, `selectedId`, `zoom`, and setters. Use selector pattern.                                |
| 4.2 | 🔴 TODO | **`src/components/canvas/TimelineItem.tsx`** — circle mesh at year position; `onPointerOver`/`onPointerOut`/`onClick` mutate store.                        |
| 4.3 | 🔴 TODO | Hover state: scale `0.04 → 0.06`, colour `--ink → --accent` via react-spring/three.                                                                        |
| 4.4 | 🔴 TODO | **`<Html>` overlay** for event name + date below each item. Uses `--font-content` and `--ink`. Pointer-events disabled (clicks reach the mesh underneath). |
| 4.5 | 🔴 TODO | Z-order: hovered item rendered last so its label sits above neighbours.                                                                                    |
| 4.6 | 🔴 TODO | **`tests/e2e/interact.spec.ts`** — hover triggers visual change, click sets `selectedId`.                                                                  |

**Acceptance:** All 5 seed events render at correct years. Hover lights cinnabar. Click stages selection (panel comes in Phase 5).

### Phase 5 — Detail panel

| #   | Status  | Task                                                                                                                                                                                                                                                   |
| --- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 5.1 | 🔴 TODO | **`src/components/ui/DetailPanel.tsx`** — fixed-position panel, slides in from right when `selectedId !== null`. Framer Motion handles the slide.                                                                                                      |
| 5.2 | 🔴 TODO | Panel content: event name (large, LXGW WenKai), date (EDTF rendered humanly, `--ink-muted`), description, citation card.                                                                                                                               |
| 5.3 | 🔴 TODO | **Citation card** uses `formatCitation()` from `src/shared/citation/format.ts`. Includes a link to the ctext.org URI (required by schema, so always present in v1). External-link affordance: `target="_blank" rel="noopener noreferrer"`, small icon. |
| 5.4 | 🔴 TODO | Close affordance: ESC key + click on canvas outside panel. Both clear `selectedId`.                                                                                                                                                                    |
| 5.5 | 🔴 TODO | Empty state placeholder for the "show synthesis" button (functional in Phase 9).                                                                                                                                                                       |
| 5.6 | 🔴 TODO | **E2E:** click item → panel appears → ESC → panel disappears.                                                                                                                                                                                          |

**Acceptance:** Click any of the 5 events; panel slides in with name, date, citation. ESC closes.

### Phase 6 — i18n, language toggle, and font subsetting

| #    | Status  | Task                                                                                                                                                                                                                                                                                                   |
| ---- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 6.1  | 🔴 TODO | **`src/i18n/config.ts`** — next-intl config: list of locales `['zh-Hans', 'zh-Hant']`, default `zh-Hans`.                                                                                                                                                                                              |
| 6.2  | 🔴 TODO | **`src/i18n/messages/zh-Hans.json`** and **`zh-Hant.json`** — UI strings (loading status text, error retry, "show synthesis", "close", language-toggle labels, zoom toggle labels).                                                                                                                    |
| 6.3  | 🔴 TODO | **`src/i18n/Provider.tsx`** — client-side `<NextIntlClientProvider>` wrapper that reads the locale from `uiStore` and the corresponding messages catalog. Mounted in `app/layout.tsx`.                                                                                                                 |
| 6.4  | 🔴 TODO | **`src/state/uiStore.ts`** — Zustand store with `language: 'zh-Hans' \| 'zh-Hant'`, persisted to `sessionStorage`, default `zh-Hans`.                                                                                                                                                                  |
| 6.5  | 🔴 TODO | **`src/components/ui/LanguageToggle.tsx`** — small top-right control. Two-state segmented toggle: 簡 / 繁. Click updates `uiStore`.                                                                                                                                                                    |
| 6.6  | 🔴 TODO | Event display reads `event.name[language === 'zh-Hans' ? 'zhHans' : 'zhHant']`.                                                                                                                                                                                                                        |
| 6.7  | 🔴 TODO | **`scripts/subset-fonts.ts`** — Node script that calls `pyftsubset` (Python `fonttools`) to subset LXGW WenKai (Hans + Hant) and Source Han Sans to the union of (characters used in `liu_bang.json` + characters used in `messages/*.json` + ~3000 most-common Hanzi as a safety set). Outputs WOFF2. |
| 6.8  | 🔴 TODO | **`src/fonts/index.ts`** — `next/font/local` registrations pointing at the subsetted WOFF2 files in `public/fonts/`. Exposes `--font-content` (LXGW WenKai) and `--font-chrome` (Source Han Sans) CSS variables. `display: 'swap'`, preload primary face.                                              |
| 6.9  | 🔴 TODO | **Wire `next/font/local` into `app/layout.tsx`** — add the font CSS-variable className to the `<html>` element so tokens.css can reference them.                                                                                                                                                       |
| 6.10 | 🔴 TODO | ESLint custom rule `no-bare-strings-in-jsx` — flags hardcoded text in JSX, points to `useTranslations('key')`.                                                                                                                                                                                         |
| 6.11 | 🔴 TODO | **E2E `tests/e2e/i18n.spec.ts`** — toggle language; all visible text changes; reload-then-reopen-tab loses selection (sessionStorage); reload-same-tab preserves it.                                                                                                                                   |

**Acceptance:** Toggle between 簡/繁 works for both UI strings and event names. Subsetted fonts load < 200ms after first paint. No bare strings in JSX (lint clean). `pnpm subset-fonts` regenerates WOFF2 files when corpus changes.

### Phase 7 — Curve shader (visual iteration with the user)

| #    | Status    | Task                                                                                                                                                                                                                                              |
| ---- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7.1  | 🔴 TODO   | **`src/components/canvas/shaders/curveVertex.glsl`** — placeholder formulation from §3.5.                                                                                                                                                         |
| 7.2  | 🔴 TODO   | **`src/components/canvas/shaders/curveFragment.glsl`** — colour by `--line`, slight alpha falloff toward edges (`vUv.x` distance from centre).                                                                                                    |
| 7.2a | 🔴 TODO   | **Configure Turbopack to import `.glsl`/`.vert`/`.frag` as raw strings.** In `next.config.ts`, populate the `turbopack.rules` block with a raw-text rule for these extensions. Verify with a build that the imported string is the file contents. |
| 7.3  | 🔴 TODO   | **Replace flat plane** in `TimelineString.tsx` with `<shaderMaterial>` using these shaders. Subdivide the plane geometry (~64 segments) so the vertex shader has vertices to bend.                                                                |
| 7.4  | 🔴 TODO   | **Leva panel (dev only)** with sliders for `uCenterFlatHalfWidth`, `uCurveAmount`, `uCurveSharpness`, alpha-falloff start/end.                                                                                                                    |
| 7.5  | 🔁 REVIEW | **Visual iteration with user.** Several rounds. Lock values into `tokens.css` once user signs off. ⏸️ Blocks acceptance until user signs off.                                                                                                     |
| 7.6  | 🔴 TODO   | **`src/components/canvas/geometry/curve.ts`** — pure function `curveYAt(x, uniforms)` that mirrors the vertex shader's displacement math. Items use this to "ride" the curve (their y position is curved alongside the string).                   |
| 7.7  | 🔴 TODO   | **`src/components/canvas/geometry/curve.test.ts`** — given world-x and uniform values, returns expected y-displacement. Tests at the central flat zone, the curl-onset boundary, and the deep-curl extremes.                                      |

**Acceptance:** User has signed off on the curve shape. Items ride the curve correctly. The whole canvas reads as "loose string."

### Phase 8 — Pan and zoom

| #   | Status  | Task                                                                                                                                                                                                 |
| --- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8.1 | 🔴 TODO | **`src/components/canvas/camera/useTimelineCamera.ts`** — listens to wheel + drag.                                                                                                                   |
| 8.2 | 🔴 TODO | Wheel = zoom (around cursor). Drag (left mouse held) = pan. Trackpad two-finger pan = pan.                                                                                                           |
| 8.3 | 🔴 TODO | Zoom levels are _snapped_ to year/month/day discrete granularities, but the _visual transition_ between them is continuous (camera zoom value eases between snapped target values via react-spring). |
| 8.4 | 🔴 TODO | At year zoom: the whole life fits, all 40+ events visible. At month zoom: ~5 years fit; events outside viewport are culled. At day zoom: ~3 months fit.                                              |
| 8.5 | 🔴 TODO | **`src/components/ui/ZoomToggle.tsx`** — three-segment selector (年/月/日). Clicking eases the camera to that level.                                                                                 |
| 8.6 | 🔴 TODO | Scrollwheel zooming snaps to nearest level when wheel stops (small delay, eases there).                                                                                                              |
| 8.7 | 🔴 TODO | **E2E** — pan via drag, zoom via wheel and via toggle; all behave smoothly.                                                                                                                          |

**Acceptance:** Pan and zoom feel native and never drop below 60fps on the maintainer's laptop. Year/month/day transitions are visibly continuous, not jumpy.

### Phase 9 — AI source synthesis (route handler + UI)

| #    | Status  | Task                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 9.1  | 🔴 TODO | **`src/ai/server/handler.ts`** — pure function `handleSynthesise({ eventId, language, deps }) → Promise<SynthesisResponse>`. Validates inputs with Zod, loads event + passages from `src/data/liu_bang.json`, composes: cache lookup → prompt build → DeepSeek call → cache write → response. Returns `{ synthesis, citations, cached, promptVersion }`. Dependencies (`cache`, `deepseek`) are injected so tests can stub them. |
| 9.2  | 🔴 TODO | **`src/app/api/synthesise/route.ts`** — thin route file: parses request, calls `handleSynthesise()`, maps result to `Response`. `export const runtime = 'nodejs'`. ~30 lines.                                                                                                                                                                                                                                                    |
| 9.3  | 🔴 TODO | **`src/ai/server/prompt.ts`** — pure function `buildSynthesisPrompt(event, language) → { system, user, version }` per §3.7.                                                                                                                                                                                                                                                                                                      |
| 9.4  | 🔴 TODO | **`src/ai/server/prompt.test.ts`** — snapshot tests against fixture event payloads (5 events, both languages).                                                                                                                                                                                                                                                                                                                   |
| 9.5  | 🔴 TODO | **`src/ai/server/cache.ts`** — exports `getCachedSynthesis(key)` and `setCachedSynthesis(key, value)`. **Backend selection:** if `process.env.UPSTASH_REDIS_REST_URL` is set, uses `@upstash/redis`; else uses an in-process `Map`. Key = SHA-256 of `(promptVersion + model + eventId + language + passageHash)`.                                                                                                               |
| 9.6  | 🔴 TODO | **`src/ai/server/cache.test.ts`** — verifies the in-memory backend behaves identically to the KV interface: get-after-set returns value; get on missing returns undefined; same key idempotent.                                                                                                                                                                                                                                  |
| 9.7  | 🔴 TODO | **`src/ai/server/deepseek.ts`** — fetch-based client. Reads `DEEPSEEK_API_KEY` from `process.env`. POSTs to `https://api.deepseek.com/chat/completions` with `model: "deepseek-v4-flash"`. Throws typed errors on rate limit / network / non-200.                                                                                                                                                                                |
| 9.8  | 🔴 TODO | **`src/ai/server/handler.test.ts`** — unit-tests the pure handler function with stubbed `cache` and `deepseek`. Verifies: cache hit returns immediately without calling DeepSeek; cache miss calls DeepSeek then writes cache; refusal-as-answer flows through unchanged; prompt-version bump invalidates a cache hit.                                                                                                           |
| 9.9  | 🔴 TODO | **`src/ai/client/client.ts`** — frontend caller. POSTs to `/api/synthesise` with `fetch`, handles loading + error states. Returns the synthesis or throws.                                                                                                                                                                                                                                                                       |
| 9.10 | 🔴 TODO | **DetailPanel "show synthesis" button** — calls `client.synthesise(eventId, language)`. Loading dot animation while pending. Error: inline retry button.                                                                                                                                                                                                                                                                         |
| 9.11 | 🔴 TODO | Synthesis renders below citations, with `[Shiji-N-M]` references rendered as small clickable chips that scroll the citation card into view.                                                                                                                                                                                                                                                                                      |
| 9.12 | 🔴 TODO | **Refusal-as-answer:** if the model returns "passages do not contain enough information," show that text as the synthesis. Don't retry.                                                                                                                                                                                                                                                                                          |
| 9.13 | 🔴 TODO | **ESLint guard** — `no-restricted-imports` rule preventing client-side files (anything outside `src/app/api/**` or `**/*.test.ts`) from importing `@/ai/server/*`. Already configured in Phase 0.18.                                                                                                                                                                                                                             |
| 9.14 | 🔴 TODO | **E2E `tests/e2e/ai.spec.ts`** with `/api/synthesise` mocked via Playwright route interception. Tests: cache miss → loading → result; cache hit → instant result; 500 error → retry button → success.                                                                                                                                                                                                                            |

**Acceptance:** Click an event → "show synthesis" → loading → ~1s later, a cited synthesis appears. Reload + click same event → synthesis appears instantly (cache hit). Network failure → centred retry message. Costs are negligible (≤ $0.01 per full corpus exploration).

### Phase 10 — Loading screen and error overlay

| #    | Status  | Task                                                                                                                                                                                                                                                                                                                   |
| ---- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10.1 | 🔴 TODO | **`src/components/ui/LoadingScreen.tsx`** — full-viewport overlay until `READY`. Centred elegant progress bar (thin, animated, `--accent` filling on `--surface` track). Status text below, internationalised: "加载历史…", "加载字体…", "加载数据…".                                                                  |
| 10.2 | 🔴 TODO | **Asset preloading orchestrator** in `src/app/page.tsx` — sequence: load fonts (next/font handles bulk; we wait via `document.fonts.ready`), parse data through Zod, warm up canvas (one render pass). Each step updates loading-status state in `uiStore`.                                                            |
| 10.3 | 🔴 TODO | **`src/components/ui/ErrorOverlay.tsx`** — centred message on white-overlay layer (full viewport, `--canvas-bg` at 95% opacity). Retry button. Used for: data parse failure, font load failure, AI failure (when persistent). Wired via `src/app/error.tsx` for unhandled errors and via local state for handled ones. |
| 10.4 | 🔴 TODO | **E2E** — simulate a font load failure (route block) → error overlay appears with retry; retry route allow → loads cleanly.                                                                                                                                                                                            |

**Acceptance:** First paint shows loading screen with progressing status; canvas reveals when ready. Errors produce the centred white-overlay treatment. Loading sequence < 1.5s on a 50 Mbps connection.

### Phase 11 — Visual finalisation

This phase is design iteration with the user. The framework for the iteration is set up in earlier phases; this phase locks values in.

| #    | Status    | Task                                                                                                                                                              |
| ---- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 11.1 | 🔁 REVIEW | **Curve geometry** — user signs off on values (locked into tokens).                                                                                               |
| 11.2 | 🔁 REVIEW | **Anchor palette colours** — user picks 2–3 colours from [colors.ichuantong.cn](https://colors.ichuantong.cn/); we adapt the placeholder palette in `tokens.css`. |
| 11.3 | 🔁 REVIEW | **Type weight tuning** — once real content renders, choose specific weights for LXGW WenKai (Light/Regular/Medium) and Source Han Sans for chrome.                |
| 11.4 | 🔁 REVIEW | **Motion easing tuning** — tweak `--dur-base`, `--dur-slow`, easing curves on hover/select/zoom.                                                                  |
| 11.5 | 🔁 REVIEW | **Hover affordance final form** — the user reacts to the size/colour/underline/shadow combination. Lock in.                                                       |
| 11.6 | 🔁 REVIEW | **Loading bar aesthetic** — lock in.                                                                                                                              |
| 11.7 | 🔁 REVIEW | **Detail panel final composition** — citation card layout, paragraph rhythm, line-height.                                                                         |
| 11.8 | ⏸️ BLOCK  | **Sign-off from user.** Blocks Phase 13 (deploy).                                                                                                                 |

**Acceptance:** The user has explicitly said "this feels right." All placeholder hex values in `tokens.css` are replaced by signed-off values.

### Phase 12 — Liu Bang content curation

This phase is content work, and it can run in parallel with engineering Phases 7–11.

**Canonical source — locked, non-negotiable:**

- **Primary:** 史記 chapter 8 (高祖本紀) at <https://ctext.org/shiji/gao-zu-ben-ji>. 68 numbered paragraphs, stable anchors `#n{id}`, both Traditional and Simplified versions served by ctext.org. This is the form our citations point to.
- **Working copy:** `/Users/smartegg/Downloads/Shiji _ Annals _ Annals of Gaozu - Chinese Text Project.pdf` — same content, for offline reading and curation.
- **Cross-reference chapters** (also via ctext.org) when a 高祖本紀 paragraph is sparse and a parallel passage adds context: 史記 7 (項羽本紀), 53–55 (蕭相國世家, 曹相國世家, 留侯世家). Cross-references are _additional_ citations on the same event, never substitutes for 高祖本紀.
- **Wikipedia, secondary biographies, AI-generated summaries are NOT sources** for this corpus. They are not cited. They may be used as research convenience to _find_ a passage in 高祖本紀, but the citation always resolves to ctext.org.

| #    | Status    | Task                                                                                                                                                                                                                                                                                                                                   |
| ---- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 12.1 | 🔴 TODO   | **Read 高祖本紀 in full** from the PDF / ctext.org. Identify all events worth surfacing in v1. Target ~40–60 events; the chapter has ~68 paragraphs, so granularity is roughly one event per major paragraph cluster.                                                                                                                  |
| 12.2 | 🔴 TODO   | **For each candidate event, record the ctext.org paragraph anchor(s)** that attest it. Multiple anchors per event are allowed and encouraged.                                                                                                                                                                                          |
| 12.3 | 🔴 TODO   | **Add cross-reference citations from chapters 7, 53–55** where they meaningfully expand on a 高祖本紀 passage (e.g. Hongmen Banquet — 高祖本紀 has it, 項羽本紀 has more detail).                                                                                                                                                      |
| 12.4 | 🔴 TODO   | **For each event populate:** stable id (slug), name (Hans + Hant), date (EDTF + bounds — derive from reign-year and sexagenary-cycle dates in the text), description (Hans + Hant — paraphrase, not direct quote, kept brief), ≥ 1 ctext.org citation (chapter, paragraph, anchor, textAnchor, full URI), significance, optional tags. |
| 12.5 | 🔴 TODO   | **Date conversion for reign-year and sexagenary-cycle dates.** 高祖本紀 dates events by reign year of the Qin/Han calendar. Convert to absolute (BCE) dates. When an event date is genuinely uncertain (Liu Bang's birth year — 256 vs 247 BCE), encode as a range, not a forced single value.                                         |
| 12.6 | 🔴 TODO   | **Spot-check Traditional/Simplified pairs.** Names like 劉邦 / 刘邦 differ; classical phrases sometimes don't. Hand-verify a sample, do not blindly OpenCC-convert.                                                                                                                                                                    |
| 12.7 | 🔴 TODO   | **Validate** by running `pnpm test` — Zod schema test must pass; URI format check (matches `^https://ctext\.org/shiji/[a-z-]+/zh#n\d+$`) passes.                                                                                                                                                                                       |
| 12.8 | 🔁 REVIEW | **User reviews** the corpus list and at least 5 sample citations end-to-end (read the linked ctext.org paragraph, confirm it attests the recorded event) before deploy.                                                                                                                                                                |

**Acceptance:** ≥ 40 events, every one with at least one ctext.org citation pointing into 高祖本紀 (chapter 8), every citation manually verifiable by clicking the URI, both Hans and Hant present, schema test passes. User signs off after spot-checking 5 events.

### Phase 13 — Deploy

| #    | Status  | Task                                                                                                                                                                                                                                                                                                           |
| ---- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 13.1 | 🔴 TODO | **Vercel project** — user creates a Vercel project linked to `NochrisCheung/historrent`. Production branch = `main`. Build command auto-detected (`pnpm build`); output `.next`.                                                                                                                               |
| 13.2 | 🔴 TODO | **Upstash Redis** — provision a Redis store via Vercel Marketplace (Storage → Redis → Upstash) named `historrent-synthesis-v1`. Vercel automatically populates env vars (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) into the project across production + preview.                                   |
| 13.3 | 🔴 TODO | **DeepSeek secret** — set `DEEPSEEK_API_KEY` via the Vercel dashboard for production + preview environments. Verify it's not exposed to the client (Vercel sets it as a Server-Side env var by default; double-check).                                                                                         |
| 13.4 | 🔴 TODO | **CI workflow `.github/workflows/ci.yml`** — runs `pnpm lint && pnpm typecheck && pnpm test && pnpm build` on every PR. **No separate deploy workflow needed** — Vercel's GitHub integration handles deploys automatically (preview per PR, production on push to `main`).                                     |
| 13.5 | 🔴 TODO | **Custom domain** — defer to Phase 1.5 unless user has a strong preference now. v1 lives at `historrent.vercel.app` (or whatever name Vercel auto-assigns; rename via dashboard).                                                                                                                              |
| 13.6 | 🔴 TODO | **Smoke test on deployed URL** — load, interact, synthesise, language toggle. Use browser DevTools Network throttle to 3G to verify loading screen behaviour. Hit `/api/synthesise` directly with a mock body to verify cache write/read in Upstash Redis (verify via the Upstash dashboard's "Data Browser"). |
| 13.7 | 🔴 TODO | **Set function region to `hkg1`** (Hong Kong) — best latency to both the user (Hong Kong) and DeepSeek (mainland China). Configure via `export const preferredRegion = 'hkg1'` in `src/app/api/synthesise/route.ts`. Verify in the Vercel deployment logs that the function actually runs in `hkg1`.           |

**Acceptance:** A public URL works end-to-end. AI synthesis works (cache hit/miss verified). PRs produce preview deployments. CI green on main triggers production deploy. Smoke test passes.

### Phase 14 — Friendly testing round

| #    | Status    | Task                                                                                                                                                                                                                 |
| ---- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 14.1 | 🔴 TODO   | **Self-test golden path** — user walks through every interaction, notes any "this feels off" moment.                                                                                                                 |
| 14.2 | 🔴 TODO   | **Recruit 3–5 friendly testers** — preferably across the three audience segments (casual reader, student, researcher). Send them the URL with a 2-line ask: "explore this for 10 minutes, then tell me how it felt." |
| 14.3 | 🔴 TODO   | **Collect feedback** in a structured form: "what surprised you? what felt unclear? what did you wish you could do?"                                                                                                  |
| 14.4 | 🔴 TODO   | **Triage** into three buckets: must-fix-before-talking-publicly, fix-for-Phase-1.5, drop.                                                                                                                            |
| 14.5 | 🔴 TODO   | **Patch** the must-fix items.                                                                                                                                                                                        |
| 14.6 | 🔁 REVIEW | **Phase 1 retrospective** — write a short doc in `docs/decisions/` capturing what we'd do differently if starting Phase 1 over. Feeds Phase 1.5 planning.                                                            |

**Acceptance:** All must-fix items resolved. Retrospective doc committed.

---

## 5. Deferred decisions and Phase 1.5+ work

These are explicit deferrals — _not_ dropped, _not_ forgotten. They reappear as scoped work in later implementation plans.

### 5.1 Architecture deferrals

| Deferral                                                 | Phase target    | Reason                                                                                                                                                                       |
| -------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Postgres + pgvector + Drizzle**                        | Phase 1.5       | Phase 1 has ~40 curated events. JSON file is sufficient. Real DB needed when corpus grows past a few hundred events.                                                         |
| **EDTF temporal model** (full bounds + interval algebra) | Phase 1.5       | Phase 1 only needs simple year/month/day for Liu Bang. The minimal subset in §3.3 is enough.                                                                                 |
| **API style** (tRPC vs GraphQL vs REST)                  | Phase 1.5       | Phase 1 has only `/api/synthesise` — a single Next.js route handler, not an "API." Real API surface arrives with Phase 1.5's multiple-timeline reads.                        |
| **Embedding model** (BGE-M3 vs Qwen-embedding)           | Phase 2         | Semantic search is a Phase 1.5 / 2 feature, not Phase 1.                                                                                                                     |
| **Job queue** (Inngest / BullMQ / Trigger)               | Phase 2         | First needed when AI extraction lands (Phase 2 assisted curation).                                                                                                           |
| **Animation library — GSAP vs bespoke**                  | Phase 1 settled | Using react-spring/three for canvas + Framer Motion for UI. Don't need GSAP.                                                                                                 |
| **Mobile responsive**                                    | Phase 1.5 or 2  | Explicit user choice.                                                                                                                                                        |
| **English UI**                                           | Phase 1.5       | Explicit user choice.                                                                                                                                                        |
| **Accounts and persistence**                             | Phase 2         | Explicit user choice.                                                                                                                                                        |
| **A11y hidden DOM mirror** for canvas                    | Phase 1.5       | Phase 1 ships with the known canvas a11y debt. Mitigated by HTML overlays for text already, but full keyboard navigation and screen-reader support need a parallel DOM tree. |
| **Visual regression testing**                            | Phase 1.5       | Stubbed manually for v1.                                                                                                                                                     |

### 5.2 Product deferrals

| Deferral                                                | Phase     |
| ------------------------------------------------------- | --------- |
| Multiple parallel timelines                             | Phase 1.5 |
| Causality view                                          | Phase 2   |
| Knowledge graph at a moment                             | Phase 3   |
| Other focus types (Entity, Geography)                   | Phase 1.5 |
| Other people/places/entities visible alongside Liu Bang | Phase 1.5 |
| AI extraction of events from source text                | Phase 2   |
| Review queue UI                                         | Phase 2   |
| Auto-approval of low-risk AI additions                  | Phase 3   |
| Custom timeline generation                              | Phase 3   |
| GraphRAG question answering                             | Phase 3   |
| Immersive cells (period imagery, ambient audio)         | Phase 3   |
| Public API for researchers                              | Phase 3   |
| Second corpus loaded                                    | Phase 3   |

---

## 6. Architecture decisions — ratified 2026-05-05

All architecture-level decisions are settled. Phase 0 is unblocked.

| #    | Decision                          | Choice                                                                                                                  | Confirmed  | Notes                                                                                                                                                                                                                                |
| ---- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 6.1  | **Frontend framework**            | 🟢 **Next.js 15+ (App Router) + React 19 + TypeScript**                                                                 | 2026-05-05 | Vercel-native; file-based routing for the few content pages we'll grow into; route handlers host the AI proxy. Tradeoff vs Vite (simpler dev loop) accepted in exchange for long-term ergonomics.                                    |
| 6.2  | **i18n library**                  | 🟢 **next-intl**                                                                                                        | 2026-05-05 | Purpose-built for Next.js App Router. We use the in-app provider (no URL-based locale routing) since v1 has one page and toggles via UI.                                                                                             |
| 6.3  | **Phase 1 data shape**            | 🟢 **JSON file with Zod validation**                                                                                    | 2026-05-05 | ~40 events, no user writes. Build-time validation catches bad data before deploy.                                                                                                                                                    |
| 6.4  | **Hosting**                       | 🟢 **Vercel + Upstash Redis + Vercel Functions**                                                                        | 2026-05-05 | Vercel-native deploy; Upstash Redis (provisioned via Vercel Marketplace, client `@upstash/redis`) for synthesis cache; Functions for the AI route handler. The legacy `@vercel/kv` package is deprecated as of 2025 and is not used. |
| 6.5  | **DeepSeek model**                | 🟢 **`deepseek-v4-flash`** initially                                                                                    | 2026-05-05 | $0.14/M input, $0.28/M output, 1M-token context — plenty for source synthesis. Reevaluate `deepseek-v4-pro` (75% off through 2026/05/31) only if classical-Chinese quality is insufficient.                                          |
| 6.6  | **Font loading**                  | 🟢 **`next/font/local` + manual `pyftsubset`**                                                                          | 2026-05-05 | LXGW WenKai full font is ~10MB; we subset to actually-used characters via `pyftsubset` and serve via `next/font/local` for automatic preload + CSS-variable wiring.                                                                  |
| 6.7  | **Cache layer**                   | 🟢 **Upstash Redis** via `@upstash/redis`                                                                               | 2026-05-05 | Free tier (10k commands/day, 256MB) covers v1 traffic comfortably. Provisioned via Vercel Marketplace.                                                                                                                               |
| 6.8  | **Package manager**               | 🟢 **pnpm**                                                                                                             | 2026-05-05 | Faster, content-addressable store, well-behaved lockfile.                                                                                                                                                                            |
| 6.9  | **Test runner**                   | 🟢 **Vitest + Playwright**                                                                                              | 2026-05-05 | Vitest for unit + integration; Playwright (Chromium only in v1) for E2E.                                                                                                                                                             |
| 6.10 | **Lint + format**                 | 🟢 **ESLint** (next/core-web-vitals + custom rules) **+ Prettier**                                                      | 2026-05-05 | Add `no-bare-strings-in-jsx` for i18n discipline; `no-restricted-imports` to prevent client → server import.                                                                                                                         |
| 6.11 | **TypeScript strictness**         | 🟢 **`strict: true` + `noUncheckedIndexedAccess: true`**                                                                | 2026-05-05 |                                                                                                                                                                                                                                      |
| 6.12 | **`gh` auth + global git switch** | 🟢 Switch global git to `Chris Cheung / chris.chiuwing.cheung@gmail.com`; user runs `gh auth login` for `NochrisCheung` | 2026-05-04 |                                                                                                                                                                                                                                      |
| 6.13 | **Repo visibility**               | 🟢 **Public** from initial push                                                                                         | 2026-05-04 | Aligns with "open by construction."                                                                                                                                                                                                  |
| 6.14 | **Curve function**                | ⏸️ **Defer to Phase 7 visual iteration**                                                                                | 2026-05-04 | Locked when canvas runs.                                                                                                                                                                                                             |
| 6.15 | **Final palette colours**         | ⏸️ **Defer to Phase 11 visual iteration**                                                                               | 2026-05-04 | Placeholders from Chinese painting tradition in `tokens.css`.                                                                                                                                                                        |

---

## 7. Risks and mitigations

| Risk                                                                     | Likelihood | Impact                   | Mitigation                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------ | ---------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Curve doesn't feel right after iterations                                | Medium     | High (signature element) | Disproportionate time on Phase 7. Leva for live tuning. Multiple visual rounds with the user. Don't ship until user signs off.                                                                                                                                                                                                   |
| `DEEPSEEK_API_KEY` leaks into the bundle                                 | Low        | Critical                 | All AI calls go through the route handler. Frontend never sees the key. ESLint `no-restricted-imports` prevents client code from importing `src/ai/server/*`. gitleaks pre-commit hook. CI scans built bundles for the key prefix.                                                                                               |
| DeepSeek synthesis quality on classical Chinese is uneven                | Medium     | Medium                   | Surface refusals as the answer, not as failures. Snapshot-test a fixture of representative events. Upgrade to `deepseek-v4-pro` if v4-flash is insufficient.                                                                                                                                                                     |
| Bundle exceeds 800KB budget                                              | Medium     | Medium                   | Code-split `drei` imports; subset fonts to actually-used characters; defer Framer Motion to detail-panel chunk.                                                                                                                                                                                                                  |
| LXGW WenKai subsetting is finicky                                        | Medium     | Low                      | Pre-built `chawyehsu/lxgw-wenkai-webfont` as fallback; fonttools / pyftsubset for first-pass subsetting.                                                                                                                                                                                                                         |
| Friendly testers respond lukewarmly                                      | Medium     | High                     | Phase 14 budget for triage and rework. The retrospective informs Phase 1.5. Resist Phase-1-keeps-growing impulse.                                                                                                                                                                                                                |
| The "single screen fits Liu Bang's life" view feels static / boring      | Medium     | High                     | This is a real design risk. Mitigate via curve atmosphere, the very-light hover affordances, the moment of revelation when a side panel opens. If it still feels boring after Phase 11, consider whether a subtle camera drift on first paint (one-time, not always-on) helps without violating the no-always-on-animation rule. |
| Postgres and full schema work bleeds back into Phase 1                   | Medium     | Medium                   | This plan explicitly defers it. Resist.                                                                                                                                                                                                                                                                                          |
| Vercel Function or Upstash Redis free tier exhausted by friendly testers | Very low   | Low                      | Upstash free tier = 10k commands/day; Vercel Functions free tier = 100k invocations/month. Both well above v1 traffic. Cache hits don't count against the AI cost.                                                                                                                                                               |
| Next.js bundle bloat (more than expected with `app/` + R3F)              | Medium     | Medium                   | Use `next build --analyze`; code-split drei imports; ensure Three.js isn't pulled in by SSR (it's client-only). The 800KB budget in §3.6 must hold.                                                                                                                                                                              |

---

## 8. Working norms during implementation

These re-emphasise CLAUDE.md and engineering-practices.md as they apply to executing this plan.

- **Update task statuses in this file** as work progresses. The plan is the working contract.
- **ADRs in `docs/decisions/`** for any non-trivial choice made during implementation that wasn't pre-decided here.
- **Stop and consult** when reality diverges from the plan. Update §6 or §5 rather than going rogue.
- **One atomic change per PR**, with passing CI. No "hot-fix" pushes to main.
- **Citations are first-class.** A PR that adds events without citations is rejected, regardless of how complete the rest looks.
- **Source provenance is non-negotiable.** Citations point to primary sources only — 史記 via ctext.org for v1. Wikipedia, secondary biographies, AI summaries are never the source of a citation. They may be used to _locate_ a passage but never replace one.
- **No backward compatibility.** When schemas change, change them; we don't carry old shapes for the sake of it.
- **Surgical changes only** (CLAUDE.md §3). Don't refactor adjacent code.
- **Performance discipline is enforced in code review,** not just by CI. Reviewer checks: `frameloop="demand"`, no always-on animations, Zustand selector with equality check.

---

## 9. Things to flag back to the human (active list)

These are the open items that block or gate forward progress. They sit here visibly until resolved.

**Blocking now:**

- 🟢 **§6 architecture confirmations.** Ratified 2026-05-05.
- 🔴 **§6.12 git identity switch and `gh auth` for NochrisCheung.** Awaiting user to run `gh auth login -h github.com -p https -w` and select NochrisCheung. After that I execute Phase 0.1 onwards automatically.

**Not blocking yet — surfaces when Phase 13 begins:**

- 🔴 **Vercel project + KV setup** (Phase 13.1–13.3). Per the user's direction, we test locally first (the cache layer falls back to in-memory when KV env vars are absent — see §3.7). Vercel work happens once Phases 0–12 are green and we're ready to deploy. User creates the Vercel project, KV store, and sets `DEEPSEEK_API_KEY` via the dashboard at that time.

**Visual / content reviews — at the relevant phase:**

- 🔁 **Phase 7 curve sign-off.** Visual iteration with user.
- 🔁 **Phase 11 palette and typography sign-off.** Visual iteration with user.
- 🔁 **Phase 12 corpus review.** User reviews the curated event list (≥ 5 sample citations end-to-end against ctext.org).
- 🔁 **Phase 14 retrospective.** User co-writes the retrospective doc.

---

## 10. Glossary (Phase-1 specific)

- **Subject:** the person, place, or entity the timeline is about. In v1, the only subject is Liu Bang.
- **Event:** a temporally-positioned record of a thing that happened. The atomic unit of the timeline.
- **Citation:** a structured reference to a specific passage in a specific edition of a source.
- **Curve:** the "loose string" geometry of the timeline string — straight in the centre of the viewport, curling away at the edges.
- **Synthesis:** an AI-generated, source-grounded summary of an event, returned by the `/api/synthesise` route handler.
- **Granularity:** the discrete time scale (year / month / day) shown by the canvas. Transitions between granularities are continuously animated, not jump-cut.
