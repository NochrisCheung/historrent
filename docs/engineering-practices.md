# Engineering Practices

**Project:** Historrent / 滔滔
**Last Updated:** 2026-05-05

> Adapted from `expert_mapper/docs/engineering-practices.md`. Keeps that project's general engineering doctrine; replaces matching-specific principles with historiographical principles; updates tooling section to a TypeScript / React stack.

---

## 1. Engineering Philosophy

These principles guide all code decisions. When in doubt, refer back to them.

| Principle                                                      | What it means in practice                                                                                                                                                                                                                                |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **DRY — flag aggressively**                                    | Every duplicated block is a bug waiting to diverge. EDTF parsing, citation handling, date math, focus-query templates, AI prompt construction all live in shared modules. Never duplicate in a feature file.                                             |
| **Well-tested, non-negotiable**                                | Date math, EDTF parsing, citation logic, AI prompt construction, and any rendering math (curve geometry, layout) need tests before merging. Untested core logic is a liability.                                                                          |
| **Engineered enough**                                          | Not under-engineered (fragile one-offs, hardcoded magic) and not over-engineered (premature abstraction, unnecessary indirection). A 200-line clear React component beats a 50-line abstract hook nobody can read.                                       |
| **Thoughtfulness > speed**                                     | Handle more edge cases, not fewer. A canvas that silently flickers or omits an event is worse than one that delays a frame. Validate before scaling features.                                                                                            |
| **Explicit over clever**                                       | Code reads like prose. Avoid one-line tricks that require decoding (chained ternaries, magic destructuring, generator gymnastics). Name intermediate variables.                                                                                          |
| **Citation-first** _(Historrent-specific)_                     | Every claim shown to the user is traceable to a source. The schema enforces it (FK constraint). The API rejects uncited writes. AI rejects outputs without citations. If a feature makes citation hard, the feature design is wrong, not the discipline. |
| **Read-mostly canvas** _(Historrent-specific)_                 | The canvas never mutates the graph. Editing is a separate, moderated path with its own UI. Don't blur the line.                                                                                                                                          |
| **Performance is a design constraint** _(Historrent-specific)_ | 60fps panning and zooming is a feature spec, not a tuning step. If a feature can't ship at 60fps, redesign the feature, don't ship slow.                                                                                                                 |
| **Show what we don't know** _(Historrent-specific)_            | Fuzzy is a first-class data type. The UI renders fuzziness; it never rounds it away. Conflicting sources render side-by-side, not collapsed into one.                                                                                                    |
| **AI is bounded** _(Historrent-specific)_                      | AI never invents historical facts. Outputs without citations are rejected. AI never writes to the production graph without human review. Mark machine-origin content distinctly until reviewed.                                                          |
| **Internationalisation is content** _(Historrent-specific)_    | Language is a property of every name, source, date, and UI string — not a deployment toggle. No hardcoded user-facing strings. Translation lives next to data, not in a global config.                                                                   |

### 1.1 Canvas performance discipline

These patterns are non-negotiable in any code that touches the canvas. They derive from the implementation plan §3.6 and are enforced via code review.

1. **`frameloop="demand"` on every `<Canvas>`.** The R3F render loop only runs when state changes. Idle = 0 GPU/CPU. Setting `frameloop="always"` is a code-review-blocking change and requires a one-line justification in the PR description.

2. **No always-on canvas animations.** Animation is interaction-driven only — hover, click, language toggle, zoom transition. The "loose string" curl does not breathe; items do not pulse. A laptop fan that spins up while looking at a static timeline is a bug.

3. **Zustand selectors with equality.** Subscribe to the _exact_ value you depend on, not the whole store: `useTimeline((s) => s.hoveredId === event.id)` rather than `useTimeline()`. Re-renders fire when _that boolean_ flips, not on every store mutation. This is what keeps hover at 60fps with hundreds of items.

4. **`useFrame` for hot paths, React state for cold paths.** Per-frame mutations during pan/zoom are imperative (`mesh.current.position.x = ...`) inside `useFrame`. Don't drive 60Hz updates through `useState` / `setState`; the reconciler is not built for it.

5. **Label de-clustering at scale.** When the visible item count exceeds the readable label budget (Phase 1 ships `significance: 'major'` filtering at year-zoom; Phase 1.5 generalises this), drop labels rather than letting them overlap.

6. **Bundle budget: ≤ 800KB gzipped first paint.** CI checks this. If exceeded, the order of remediation is: (a) code-split `drei` imports, (b) tighten font subsets, (c) defer non-canvas chunks (Framer Motion, side-panel code) — _only_ if all three are exhausted, regroup with the team.

7. **Initial paint budget: ≤ 1.5s on a 50 Mbps home connection.** Measured via `performance.timing.loadEventEnd`. CI runs Lighthouse on PR; a regression > 200ms blocks merge.

If a feature can't be implemented within these constraints, the feature design is wrong — not the discipline.

---

## 2. Code Review Process

Before any non-trivial change (implementation plans, architectural changes, significant new components), we do a structured review.

### Starting a review

Choose one of two modes:

**BIG CHANGE** — Work through all four sections interactively, one section at a time (Architecture → Code Quality → Tests → Performance). At most 4 top issues per section. Pause and ask for feedback after each section.

**SMALL CHANGE** — Work through interactively with ONE question per review section.

### Review sections

1. **Architecture review** — overall design, component boundaries, dependency graph, data flow, rendering paradigm fit, single points of failure
2. **Code quality review** — DRY violations (flag aggressively), error handling gaps, edge cases, technical debt, over/under-engineering
3. **Test review** — coverage gaps, assertion strength, missing edge cases, untested failure modes, untested rendering math
4. **Performance review** — frame budget on the canvas, render-loop cost, query patterns, memory growth on long sessions, caching opportunities

### For each issue found

For every specific issue (bug, smell, design concern, risk):

1. **Describe the problem concretely** — include file path and line number reference
2. **Present 2–3 options** — always include "do nothing" when it's a reasonable choice
3. **For each option:** implementation effort, risk, impact on other code, maintenance burden
4. **Give a recommended option** — and explain why, mapped to the principles above
5. **Ask explicitly** whether the user agrees or wants a different direction before proceeding

> After each review section, pause and ask for feedback before moving on. Do not assume priority or scale.

---

## 3. Historiographical Principles

These govern correctness decisions in how Historrent represents and presents history. They derive from professional historian practice — Western source-criticism (Ranke, Bloch, Annales), Chinese 考據 evidential scholarship, and Sima Qian's own method.

### Source and citation

- **Cite specifically.** Every assertion in the system traces to a specific passage in a specific edition of a specific source. Not "according to Shiji" but "Shiji 130, 太史公自序, paragraph 12, Zhonghua Shuju 1959 edition." Down to the locator.
- **Primary vs secondary sources are distinguished.** A commentary on Shiji is not Shiji. The data model marks which is which; the UI surfaces it.
- **External and internal source criticism.** External: is the source authentic, when was it really produced, what's its chain of transmission? Internal: what biases does the author carry, what's omitted, what's the agenda? Both are encoded as metadata where known.
- **Provenance tracking** — every fact records where it came from, when it was extracted, and (if AI-extracted) which model + prompt version. Match rationale must be reconstructable.

### Uncertainty and conflict

- **Show what we don't know.** Fuzzy dates render as fuzzy. Open-ended events render with one edge fading. Confidence is visible, not hidden.
- **Show conflicting accounts.** Don't silently pick one and silence the others. Multiple source attestations with their variants are stored; the UI presents the disagreement.
- **Acknowledge silence in the record.** Pre-modern history is silent on whole classes of people. The silence is data; we don't infer to fill it.
- **Distinguish evidence from interpretation.** "The text says X" and "this implies Y" are separable in both data model and UI.

### Causality and context

- **Multiple causation, not monocausal explanation.** Historical events have several intersecting causes. The data model lets us record several without forcing a "primary" one.
- **Contingency, not teleology.** Events were not inevitable. We do not present history as progress toward an outcome.
- **Context over presentism.** Judge events by their own era's frame, not ours. UI copy and AI prompts must respect the original frame.

### From Chinese historiography

- **直筆 (zhí bǐ — "straight brush").** Record without distortion, even when uncomfortable. Sima Qian's own credo.
- **正史 / 野史 / 雜史 distinction.** Official vs. unofficial vs. miscellaneous histories carry different epistemic weight. The data model can mark this.
- **考據 (evidential research).** Every assertion grounded in textual evidence; sources cross-checked.
- **Awareness of 春秋筆法.** Word choice carries judgment. Even neutral-sounding UI copy is taking a position; we do so consciously.

---

## 4. Code Quality Tooling

> _Stack to be confirmed once Architecture decisions #1–#7 are made. Placeholder reflects current leaning: TypeScript + React, Vitest, Playwright._

### Linting and formatting

- **TypeScript strict mode** project-wide. No `any` without an inline justification comment.
- **ESLint** with `@typescript-eslint`, `react-hooks`, `import/order`, `no-restricted-imports`. Configuration in `eslint.config.ts`.
- **Prettier** for formatting; integrated into the lint step.
- **No hardcoded user-facing strings** — lint rule enforces routing all text through the i18n layer.

```bash
pnpm lint             # check
pnpm lint --fix       # auto-fix safe issues
pnpm typecheck        # TypeScript validation only
```

### Testing

- **Vitest** for unit tests. Co-located with source: `src/foo/foo.ts` ↔ `src/foo/foo.test.ts`.
- **Playwright** for end-to-end smoke tests on the canvas (rendering, pan/zoom, focus switching).
- **Real Postgres in tests**, not mocks. A test container is started at the start of the suite.

Mandatory tests before merging:

- Date math and EDTF parsing
- Citation construction and validation
- AI prompt builders (snapshot tests against fixtures)
- Curve geometry math (the curvature function, given a viewport, returns expected vertex offsets)
- Any data extraction or migration script

```bash
pnpm test                      # run all
pnpm test -- foo.test.ts       # single file
pnpm test:e2e                  # Playwright
```

### Schema and migrations

- **Drizzle** (or equivalent) for migrations, checked into `db/migrations/`. No ad-hoc DB changes.
- Every migration has an `up` and `down` direction. New project → no backward-compat migrations from non-existent prior schemas.

### Performance budget

- Initial canvas paint: **≤ 1.5s** on a typical laptop (mid-tier 2023 MBP M2 baseline).
- Pan/zoom: **≥ 60fps** sustained on Liu Bang's full life with all v1 events visible.
- Initial JS bundle: **< 400KB gzipped** for first paint; rendering library loaded eagerly, AI/admin code split.
- These are CI-checked once we have a deployment target.

---

## 5. Key Architectural Decisions

> Empty until we settle the open architecture questions. Each decision goes here as a short ADR-style block (Title, Context, Decision, Consequences) with a date and link to the discussion that produced it. See also `docs/decisions/` for full ADRs once we adopt that pattern.

_Pending: Rendering technology, frontend framework, state management, database & schema tool, temporal model, API style, i18n library, animation library, AI model and embedding model, hosting._

---

## 6. Project Structure

> To be filled in once the rendering and framework decisions are made and the initial repo skeleton is committed.

Expected top-level shape:

```
historrent/
├── app/                          # Frontend application
│   ├── canvas/                   # Renderer-specific code (Pixi or R3F)
│   ├── components/               # React UI components (panels, controls)
│   ├── state/                    # Zustand stores
│   ├── i18n/                     # Translations and message catalogs
│   └── ...
├── server/                       # API and AI orchestration
│   ├── api/                      # tRPC / GraphQL / REST routers
│   ├── ai/                       # Prompt builders, retrieval, caching
│   └── ...
├── shared/                       # Code used by both app and server
│   ├── edtf/                     # EDTF parser + bounds derivation
│   ├── citations/                # Citation construction and rendering
│   ├── schema/                   # Shared types, Zod validators
│   └── ...
├── db/
│   ├── migrations/               # Drizzle migrations
│   └── seed/                     # Seed data ingest scripts
├── data-pipelines/               # Source ingestion (ctext.org, CBDB, etc.)
├── docs/
│   ├── vision.md
│   ├── product-context.md
│   ├── implementation-approach.md
│   ├── engineering-practices.md
│   ├── decisions/                # ADRs
│   └── implementation_plan/      # Phased plans (see CLAUDE.md §5)
└── tests/
    ├── e2e/                      # Playwright
    └── fixtures/                 # Test data
```

---

## 7. Operations

### Deployment

> Hosting decision pending. Working assumption: Vercel for frontend + a managed Postgres (Neon or Supabase) for v1.

### Observability from day one

- **Structured JSON logs** for the API. Include request ID, user (if any), latency, AI tokens used.
- **Sentry** (or equivalent) for error reporting.
- **AI usage metrics** — tokens per request, cache hit rate, model used, latency. Visible on a small admin page.

### Secrets

- All secrets in environment variables. Never committed.
- `.env.example` documents every required variable.
- Pre-commit hook scans for leaked keys (gitleaks or trufflehog).

### AI cost discipline

- LLM outputs cached by content hash (prompt + retrieved context + model version).
- Per-user quotas with graceful degradation.
- Most user interactions do NOT trigger an LLM call. AI is invoked deliberately, not on every click.

---

## 8. Glossary

- **Focus** — a query template against the graph plus a UI configuration. Phase 1 has People focus; Phase 1.5 adds Entity and Geography. New focus types are added without schema migration.
- **Item** — anything that appears on a timeline at a temporal position: event, lifespan, entity existence, place significance, work creation.
- **EDTF** — Extended Date/Time Format (ISO 8601-2). Canonical string representation for fuzzy/uncertain/range/open-ended dates.
- **Citation** — a structured reference to a specific passage in a specific edition of a specific source. Stored with every assertion.
- **Trust curve** — Phase 1: curated seed (AI read-only). Phase 2: assisted curation (AI proposes, human reviews). Phase 3: AI-assisted accretion (low-risk auto-applied, high-risk reviewed).
