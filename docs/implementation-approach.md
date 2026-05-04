# Historrent / 滔滔 — Implementation Approach

This document describes the _philosophy_ of how Historrent should be built, the gates that separate phases, and the principles the agent should hold while planning the actual schedule. It deliberately does not specify a calendar. The agent will propose a concrete plan based on its evaluation of the technical choices and its capacity.

## Core principles

### Ship rough early

The single most important principle. A working version of Historrent deployed to a real domain, with curated data on a small slice of the Shiji, used by a handful of friendly testers, is worth more than a half-built version of the full vision sitting in a private repo.

The agent should bias toward shipping. Polish iterations come _after_ the product is in front of users, not before. This applies to visuals, to data coverage, and to features.

### Build the foundation before the cleverness

The clever AI features (custom timeline generation, GraphRAG, immersive cells) depend on a working foundation: a beautiful canvas, a clean data model, a small seed corpus, citation discipline, the review queue. These foundational pieces are not glamorous, but skipping them produces a clever demo that falls apart at the first real use.

The order is: foundation, then surface features, then AI features, then ambitious AI features. The agent should resist the temptation to skip ahead.

### The trust curve drives the data approach

Historrent grows through three levels of trust:

1. **Curated seed.** All data is human-reviewed. AI is read-only — summarises, retrieves, but never writes to the graph. Small corpus, high reliability.
2. **Assisted curation.** AI extracts candidate events from sources; humans review and approve before they enter the production graph. Corpus grows fast; reliability stays high because of the human gate.
3. **AI-assisted accretion.** Once AI extraction quality is measured and trusted, low-risk additions can be auto-applied. High-risk additions still go through review. Corpus grows organically.

The product should be useful at every level. The agent should not delay launching Phase 1 because Phase 3 is more interesting.

### Prefer fewer, better tools

The stack should be as small as it can be while doing the job well. Every additional dependency is a maintenance burden, a learning curve for contributors, and a possible point of failure. When in doubt, fewer tools.

This applies especially to databases. PostgreSQL alone for Phase 1. Add Neo4j only when graph queries actually justify it. Don't add Redis for caching until you've measured a real bottleneck. Don't add a separate vector database until pgvector hurts.

### Make the design iteration tight

The curved-string timeline is the signature element of the product. Its quality is what separates Historrent from a thousand other history tools. The agent should expect to iterate on it many times — the curvature function, the easing, the way items "settle" as they enter focus, the parallax depth, the colour, the typography. This is design work and should be treated as such, not engineered once and forgotten.

Build a fast iteration loop for the canvas. Hot-reloading. Live parameter tweaking (Leva or similar). Test on a real phone. Get the human in the loop on visual decisions.

## The three phases

### Phase 1 — Curated foundation

**Goal:** A working canvas with a beautiful single-timeline experience, backed by a small hand-curated dataset from the Shiji, deployed publicly, with the design language and citation discipline established.

**What ships:**

- The canvas with curved-string timeline
- Smooth pan and zoom, discrete year/month/day granularity (with continuous animation between them)
- A single focus type working end-to-end (probably People focus, centred on Sima Qian)
- ~200 curated events, ~50 people, ~20 places, all sourced and reviewed
- AI source synthesis on event click (the bounded, lowest-risk AI feature)
- Search by name and date
- Citation display and linking back to ctext.org
- Multilingual UI (Chinese default, English available)
- Public deployment

**What does not ship in Phase 1:**

- Multiple parallel timelines (this comes Phase 1.5 or 2)
- Causality view
- Knowledge graph at a moment
- Custom timeline generation
- AI extraction (read-only AI in Phase 1)
- Other focus types (Geography, additional people)
- Other corpora

**Gate to Phase 2:** users can use the product, the foundational visual identity is established, the data model has been stress-tested against real curated data, citation discipline is enforced, and the AI source synthesis works reliably with no hallucinations.

### Phase 1.5 — Multi-lane and additional focus types

This is the bridge phase. It's not "Phase 2" because it doesn't introduce the AI write-path; it just rounds out the read-only product.

**What ships:**

- Multiple parallel timelines, vertically stacked, sharing the time axis
- Adding a timeline by clicking an item or via search
- All three focus types (Entity, Geography, People) functional
- Expanded curated corpus — perhaps 1,000 events covering more of the Shiji
- Improved search (semantic via embeddings)

**Gate to Phase 2:** the multi-timeline experience works smoothly, the corpus is large enough to make synchronicity meaningful, and the embedding-based search demonstrates that the semantic layer works.

### Phase 2 — Assisted curation

**Goal:** AI starts proposing additions to the graph, humans review, the corpus grows from user demand.

**What ships:**

- The full Shiji text loaded into a vector store
- AI extraction pipeline that proposes events from passages
- Review queue UI for human approval of AI suggestions
- Approved suggestions flow into the production graph
- AI-suggested events visible in the UI as "draft" with clear marking
- Causality view (now meaningful with a richer corpus)
- Telemetry on AI extraction quality (precision, recall, common failure modes)

**Gate to Phase 3:** AI extraction has measured quality, the review queue has produced a meaningful labeled dataset, and a human reviewer (or small group) can sustain the throughput.

### Phase 3 — AI-assisted accretion

**Goal:** The system grows autonomously for low-risk additions, and the headline AI features become possible because the corpus is rich enough.

**What ships:**

- Auto-approval of low-risk AI additions (place tags, links between existing entities)
- Custom timeline generation against natural-language queries
- GraphRAG question answering with citation discipline
- Knowledge-graph-at-a-moment view with optional immersive cells
- Public API for researchers
- A second corpus loaded (validates the schema's portability)

**Gate to long-term:** the system is genuinely valuable to the three target audiences, has a community of contributors, and the technical foundation supports continued growth.

## What the agent should plan, not the human

The agent owns:

- The actual schedule (dates, weeks, milestones) based on its capacity assessment
- The order of work within each phase
- Specific technology choices (within the leanings expressed in the product context document)
- The granular task breakdown
- Test strategy and quality gates
- Deployment specifics

The agent should produce a planning document early in its work, share it with the human, and update it as work progresses.

## What stays with the human

The human owns:

- Final approval of major technology choices that deviate from the document
- Final license decisions before public release
- Visual design iteration on the canvas (the curve, the typography, the motion)
- Curation of the seed corpus content (which events to include, reviewing AI extraction output)
- Translation of UI strings (or contracting that work)
- Public communication, naming, branding decisions

## Working norms

A few conventions the agent should adopt:

**Document decisions as you go.** When the agent makes a non-trivial choice, it should write it down (even briefly) in a decision log inside the repo. Future contributors and future-the-agent will need this context.

**Cite the agent's own research.** When the agent recommends a specific library, version, or approach, it should link to the sources that informed the recommendation. This is the same citation discipline the product itself demands.

**Surface ambiguity, don't resolve it silently.** When the agent encounters genuine ambiguity (something this document didn't anticipate, or something where the leanings here seem wrong), it should come back to the human with options, not pick.

**Test against real users early.** Even a small group of friendly testers — three to five people — produces signal that no amount of self-review can match. The agent should plan for user testing as soon as Phase 1 is rough enough to demo, not when it's "done."

**Build for contributors.** This is open source. The code, the schema, the design conventions, the data import pipelines — all should be readable, documented, and welcoming to outside contributors. A solo project that nobody else can contribute to is a worse project than one with messy but understandable foundations.

## Risks and mitigations

A non-exhaustive list of things that can derail the project, and how to avoid them.

**Risk: the canvas feels mediocre.**
Mitigation: spend disproportionate time on the curve effect. Iterate with the human in the loop. Don't ship Phase 1 until it feels right. This is the signature element; if it's mediocre, nothing else matters.

**Risk: AI hallucinations damage trust.**
Mitigation: enforce citation discipline at every layer. Reject LLM outputs without citations. Mark AI-extracted content clearly. Have a "report a hallucination" affordance from day one.

**Risk: data import is harder than expected.**
Mitigation: start the import pipeline in parallel with the canvas work. Don't assume any single source is sufficient. Plan for classical Chinese being legitimately hard to extract events from.

**Risk: scope creep into "the entire Shiji."**
Mitigation: Phase 1 has a small, well-defined corpus. The temptation will be to expand before launching. Resist.

**Risk: the multi-language commitment is underestimated.**
Mitigation: build i18n in from day one, even when only Chinese and English exist. Retrofitting i18n is expensive and bug-prone.

**Risk: the open-source community doesn't show up.**
Mitigation: a working, beautiful product attracts contributors; a half-built project does not. Ship Phase 1 quickly and well.

**Risk: cost of LLM and image generation runs away.**
Mitigation: aggressive caching, per-user quotas, clear policy on which interactions are AI-powered. Most clicks should not call an LLM.

**Risk: the agent over-engineers the architecture.**
Mitigation: PostgreSQL alone in Phase 1. No microservices. No exotic choices without strong justification. The agent should re-read the "prefer fewer, better tools" principle whenever it considers adding infrastructure.

## Definition of done for each phase

- **Phase 1 done** when a non-technical history enthusiast can use the deployed site to explore Sima Qian's life on the canvas, see citations for everything they're shown, and find the experience meaningfully different from existing tools.
- **Phase 1.5 done** when that same user can add Han Wudi as a parallel timeline, see the synchronicity visually, and use semantic search to find events.
- **Phase 2 done** when AI is extracting events from the Shiji, human reviewers are approving them, and the corpus has grown measurably from the Phase 1 baseline.
- **Phase 3 done** when a user can ask "create a timeline of the creation of Shiji" and the system produces a meaningful result grounded in real corpus data with citations.

The agent should propose more granular acceptance criteria as part of its planning.
