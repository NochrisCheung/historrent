# Historrent / 滔滔 — Product Context, Requirements, and Considerations

This document is the brief for the coding agent building Historrent. It captures the product surface, the requirements that emerged from upstream design conversations, the decisions that have been made, the options that were considered but left open, and the cross-cutting concerns that constrain implementation.

The agent is expected to do its own technical research and propose specific implementations. Where this document mentions specific technologies, they are starting points to evaluate, not mandates.

## The product surface

### The canvas

Historrent is a canvas-based application. The user experience is a single, mostly-empty surface — typically white or near-white — across which a timeline is rendered. The canvas is panned and zoomed by the user; the underlying geometry is conceptually a long horizontal scene.

The canvas is _read-mostly_. Users do not drag items, do not edit them in place, do not create freeform content. The canvas is closer in spirit to Google Earth than to Figma. The user explores; the system reveals.

### The timeline as a curved string

The hero element is a horizontal timeline rendered as a curved string. In the centre of the viewport, the string is straight; toward the left and right edges, it curves away as if a slack rope or stretched ribbon were receding into space. This curvature is design-critical — it tells the user that the visible region is a portion of a larger continuum, and it makes the act of panning feel like uncovering more of a longer object.

When the user pans left or right, time advances or retreats. When the user zooms, the time scale compresses or expands. The curve persists through all transformations.

The curve effect should be implemented as a vertex shader (a small piece of GPU code that bends geometry mathematically), not as a raster effect. This keeps it sharp at all zoom levels and trivial to animate. The exact curvature function (sine, quadratic, custom) is a design parameter that will need iteration to feel right; the agent should expect to spend real time tuning it.

### Items on the timeline

The string is populated with items at their temporal positions. An item is typically an event, but can also be a person's lifespan, an entity's existence (a dynasty, an institution), a place's significance, or a work's creation. Items are clickable, hoverable, and selectable.

Items have visual distinction by type (events look different from lifespans), by magnitude (more important items are more prominent), and by source confidence (well-attested items are sharper, fuzzy ones are fuzzier).

Items with fuzzy dates render as fuzzy shapes — soft horizontal bars with feathered edges instead of sharp dots. Open-ended events (a revolution still being defined, a person whose death date is contested) render with one edge fading into uncertainty. This is a critical visualisation choice, not optional.

### Time granularity and zoom

Time on the X axis works at three discrete granularities: **year, month, day**. The user toggles between them. The transitions between granularities are _animated continuously_ — when zooming from year-view to month-view, the year ticks expand smoothly into months rather than jump-cutting. This gives a felt sense of scale without forcing fully continuous zoom complexity.

### Focus

A timeline is always _about_ something. The thing it is about is its _focus_. The current focus types are:

- **Entity** — a dynasty, a government, an institution, an army, a school of thought (e.g., the Han Imperial Court, the Confucian tradition).
- **Geography** — a place, from a region down to a specific site (e.g., Chang'an, the Qin capital).
- **People** — an individual person (e.g., Sima Qian, Han Wudi).

Additional focus types are expected. Future ones include **book** (the events surrounding the creation of a text), **religion** or **ideology**, **concept** (e.g., the development of "filial piety"), and possibly others not yet envisioned. The data model must accommodate new focus types without requiring schema migration.

A focus is not a special node type. It is a _query template_ against the underlying graph plus a UI configuration. Adding a new focus type is adding a new query and a new UI affordance, not adding new infrastructure.

When a focus is active, the timeline shows items related to that focus. A _context layer_ — dimmed, in the background — shows other major contemporaneous events that aren't part of the focus, preserving synchronicity without losing focus.

### Multiple parallel timelines

The user can add timelines. When two or more are active, they stack vertically, sharing a single horizontal time axis. Panning and zooming move all of them in lockstep. The user can compare Sima Qian's life against Han Wudi's reign against the development of Chang'an, all on the same time scale, simultaneously visible.

Adding a timeline typically happens by clicking an item — clicking Han Wudi when looking at Sima Qian's timeline pushes Han Wudi as a new parallel lane. The user can also explicitly add a timeline via search.

This is the feature that makes Historrent distinctive. It deserves disproportionate care.

### The three views

The same underlying data supports three views:

1. **Timeline view (primary).** Described above. Default and dominant.
2. **Causality view.** A graph layout showing cause-and-effect chains between events. Used for "why" questions. Different geometry from the timeline; some shared interaction conventions.
3. **Knowledge graph at a moment.** A snapshot view: pause time at 100 BCE, show the major entities, people, and places active at that moment, with their relationships. Used for "what was the world like" questions. Where sensory immersion (period imagery, ambient audio) layers in.

All three views project from the same data model. The agent should design the data layer with all three in mind, even if Phase 1 only ships the timeline.

### AI-driven exploration

The user can ask natural-language questions and request custom timelines. Examples:

- "What conversations did Sima Qian have with Han Wudi?"
- "What did Sima Qian say about the Qin?"
- "Create a timeline of the creation of Shiji."
- "Who else was in Chang'an during the same years as Sima Qian?"

These queries are answered by an AI orchestration layer that combines graph traversal, semantic search over source passages, and LLM synthesis. Critically: the AI never invents historical facts. It selects, ranks, and summarises from the curated graph and source corpus. Every answer is grounded in citations.

Custom timelines are timelines generated on demand by the AI identifying which events from the corpus are relevant to a user's request, and rendering them on the canvas as a new lane. The lane may be marked as AI-generated and ephemeral until the user saves or shares it.

## Data and corpus

### The seed: 史記 (Shiji / Records of the Grand Historian)

The first corpus is 史記, the foundational text of Chinese historiography, written by Sima Qian in approximately 91 BCE. It covers roughly 2,500 years from the legendary Yellow Emperor through the early Han dynasty.

The Shiji is structurally rich. It is divided into five sections that themselves encode multiple lenses on history:

- 本紀 (Annals) — focused on rulers, organised by reign
- 表 (Tables) — chronological tables across dynasties
- 書 (Treatises) — thematic essays (rituals, music, calendar, economy)
- 世家 (Hereditary Houses) — noble family lineages
- 列傳 (Biographies) — individuals

These sections should be preserved as a metadata dimension on every event extracted from the Shiji. They map naturally onto Historrent's multi-focus design.

### Data sources to evaluate as starting points

The agent should investigate these as candidate sources for seed data, verify licensing terms, and propose which to use:

- **ctext.org** — Chinese Text Project. Hosts the full Shiji text in classical Chinese, structured by chapter, with cross-references and named-entity tagging. Has an API. Licensing for an open-source project needs verification.
- **CBDB (China Biographical Database)** — Harvard / Academia Sinica / Peking University. ~650,000 individuals from premodern China, with rich relational data on kinship, offices, places, social associations. Coverage is strongest from the 7th century onwards but is being extended backwards. Freely downloadable. Likely strongest source for structured biographical data.
- **Wikidata** — for stable cross-references. Most major historical figures have Wikidata QIDs. Use these as universal external identifiers wherever they exist.
- **EventKG / OEKG** — multilingual event-centric knowledge graphs. May or may not have useful Shiji-era coverage; worth investigating.
- **Academia Sinica calendar databases** — for converting reign-year and sexagenary-cycle dates to absolute dates.

The agent should not assume any single source is sufficient. The expected pattern is a multi-source ingestion pipeline that pulls structural metadata from ctext.org, biographical data from CBDB, and identifiers from Wikidata, with AI-assisted extraction filling in what the structured sources don't cover.

### Multilingual support

The default UI language is **Chinese (Simplified, with Traditional as a near-peer)**. English is the first non-Chinese language and a first-class citizen.

Every named entity in the data model needs:

- Primary name in Chinese (Traditional and Simplified, often differing)
- Pinyin romanisation
- English translation or transliteration
- Alternative names: courtesy names (字), posthumous names (謚號), era names (年號), historical variants
- Other-language names where they exist

Source texts are stored in their original language (classical Chinese for the Shiji), with translations as separate linked entities. The UI displays the user's preferred language with one-click access to the original.

The data model treats language as a property of content, not a deployment configuration. The agent should not be tempted to model Chinese and English versions as separate datasets.

### Temporal model

Dates in historical data are messy in three distinct ways:

1. **Imprecision.** A historical record may give only a year, only a reign period, only a sexagenary cycle, only "in his old age."
2. **Open-endedness.** Some events have known starts but contested ends (a revolution, a movement, a person's posthumous influence).
3. **Conflicting records.** Different sources give different dates for the same event.

The data model must natively handle all three. Recommended starting points to research:

- **EDTF (Extended Date/Time Format)** — Library of Congress standard, ratified as ISO 8601-2. Handles approximate (`1644?`), uncertain (`1644~`), intervals (`1640/1650`), open-ended (`1644/..`), and alternatives (`[1644, 1645, 1646]`).
- **PostgreSQL `tstzrange`** for indexed range queries.
- **Allen's Interval Algebra** for the 13 fundamental relations between intervals (before, overlaps, during, etc.) — useful for reasoning about temporal relationships.

Each date field in the data model should encode start and end intervals (`start_earliest`, `start_latest`, `end_earliest`, `end_latest`) plus a precision tag and the canonical EDTF string. Conflicting source dates should be stored as multiple dating candidates, each linked to its source, with a consensus value computed or selected.

In the visualisation, fuzzy dates render as fuzzy shapes — this is a genuine differentiator from existing tools and a key part of the "show what we don't know" design commitment.

### Source citations

Every assertion in the system carries citations. Every citation points to a specific source — ideally down to the chapter and passage of the referenced text. For 史記, that means citations of the form:

```
{
  work: "Shiji",
  edition: "Zhonghua Shuju 1959 punctuated edition",
  chapter: 130,
  section: "太史公自序",
  paragraph: 12,
  text_anchor: "余甚惧焉…",
  uri: "https://ctext.org/shiji/tai-shi-gong-zi-xu/zhs#n8847",
  language: "zh-Hant"
}
```

The schema for citations should be general enough to cover other corpora later (the Bible, the Quran, Tacitus, the Mahabharata) without modification. Each historical text has its own native locator system — chapter and verse, juan and section, book and line — and the citation schema should accommodate all of them through a flexible `locator` structure.

W3C PROV is worth investigating as a model for representing provenance. IIIF is worth investigating for image-based source references (scans of manuscripts).

### Conflicting accounts

The same event may be described differently by different sources. Historrent's commitment to "show what we don't know" requires that conflicting accounts be visible, not hidden. The data model and UI must support:

- Multiple source attestations per event
- Per-source variant fields (different dates, different participants, different causal claims)
- A way for the user to compare sources side by side
- Optionally, an editorial consensus value computed or chosen

This is the kind of feature that's easy to design poorly. The agent should research how academic prosopographical databases (CBDB, Beyond Notability, the Enslaved project) handle this and adapt patterns accordingly.

## Three-view architecture

### Timeline view (primary)

The curved-string canvas described above. Most user time is spent here. Default focus is some opening "tour" view chosen by the project — likely the life of Sima Qian, given Shiji is the seed corpus.

### Causality view

A graph view that follows cause-and-effect edges between events. The user enters from the timeline by selecting an event and asking "what caused this" or "what did this lead to." Layout is force-directed or hierarchical depending on the depth of the chain. Same nodes as the timeline; different visual metaphor.

### Knowledge graph at a moment

A snapshot view. The user pauses time at a specific moment (e.g., 100 BCE). The view shows: who was alive, what entities existed, what places were active, and the relationships among them at that moment. From this view, the user can step into "immersive cells" — AI-generated period imagery, ambient soundscape, brief contextual narration — that address the "be there" pain point.

The three views share data; their UI and interaction conventions differ. The agent should design with all three in mind but ship them in order.

## AI integration

### The five capabilities

AI shows up in five places, each with its own pattern:

1. **Source synthesis.** When an event has multiple sources, an LLM produces a brief "Source A says X; Source B says Y; the evidence suggests Z" summary, with citations. Generated on demand, cached permanently.
2. **Semantic search.** Users search by meaning, not just name match. Implemented via embeddings of source passages and entity descriptions; cosine similarity for retrieval.
3. **Graph-augmented question answering (GraphRAG).** Natural-language questions answered by combining graph traversal results with retrieved passages, synthesised by an LLM with citation discipline.
4. **Custom timeline generation.** User asks for a timeline of a topic; AI plans which graph nodes to retrieve, ranks them, and the canvas renders them as a new lane. AI selects from real data; never invents.
5. **Assisted curation.** AI extracts candidate events, relationships, and citations from source texts, surfacing them in a review queue for human approval before entering the production graph.

### Hallucination resistance

This is the killer risk. The discipline:

- The LLM is never asked to produce historical claims from its training data alone. Every prompt provides retrieved context (graph subgraph, source passages) and instructs the model to answer only from that context.
- If the retrieved context doesn't contain the answer, the model is instructed to say so rather than guess.
- Every answer includes citations to specific graph nodes or source passages. Answers without citations are rejected.
- The system prompt is schema-aware — the LLM understands the structure of the graph it's reasoning about.
- AI-extracted content (Phase 2 onwards) is marked as machine-origin with a confidence score, and the UI surfaces this to users until the content has been human-reviewed.

The agent should design for these constraints from day one, not as an afterthought. They affect how prompts are structured, how the data layer exposes context, and how the UI presents AI-generated content.

### Cost and rate management

LLM calls have real costs. The system needs:

- Aggressive caching of LLM outputs (most questions repeat)
- Per-user quotas, with graceful degradation
- A clear policy on which interactions are AI-powered (worth the cost) versus rule-based (cheap)

For the agent's planning: most user interactions should NOT trigger LLM calls. AI is invoked for source synthesis, semantic search, and custom queries — not for every click.

## Cross-cutting concerns

### Internationalisation

Discussed above under data. To re-emphasise: Chinese-default, English-secondary, others later. The data model treats language as a content property. UI strings should be externalised from day one.

### Accessibility

The canvas-heavy design has accessibility risks. Screen-reader users, keyboard-only users, and users with motion sensitivity must be able to use the product. The agent should plan for:

- Keyboard navigation of the canvas (arrows for pan, +/- for zoom, tab for items)
- Screen-reader-friendly text alternatives for canvas content
- A "reduce motion" preference that disables the curve animation and uses simpler transitions
- Sufficient colour contrast for all text

Canvas-based apps notoriously fail accessibility audits. The agent should research current best practices for accessible WebGL/Canvas applications and propose an approach.

### Performance

Performance targets to design toward:

- 60fps panning and zooming on a mid-range laptop and recent phone
- Initial canvas render in under 1.5 seconds
- Timeline content (events, labels) loads progressively as the user pans, not all at once
- AI-augmented features can take seconds; non-AI interactions should feel instant

These are starting points. The agent should propose more specific targets based on its evaluation of the rendering choices.

### Citation discipline (re-emphasised)

The single most important non-functional requirement. Every claim shown to the user is traceable to a source. Every AI-generated synthesis cites the underlying passages. Every entity has provenance for its dates, relationships, and properties. This is enforced in the data model, in the API, in the UI, and in every prompt to the AI layer.

If the agent finds itself implementing a feature where this discipline is hard to maintain, that's a signal that the feature design needs revision — not that the discipline should be relaxed.

### Open-source and licensing

The default code license is **Apache 2.0** (permissive, patent-grant, widely-compatible). The default data license is **CC-BY-SA 4.0** (attribution and share-alike for the curated dataset). Both should be finalised before public release; the agent should default to these unless instructed otherwise.

The agent should respect the licenses of upstream data sources. CBDB, Wikidata, ctext.org, and others have specific terms. The agent should verify and document the license of every source used.

## Decisions made

The following decisions are settled and should not be revisited without explicit instruction:

- **Name:** 滔滔 (Tāotāo) / Historrent
- **Default language:** Chinese, with English as first secondary
- **Seed corpus:** 史記 (Shiji)
- **Open source:** Yes
- **Three-view architecture:** Timeline, Causality, Knowledge graph at a moment
- **Focus-based navigation:** Entity, Geography, People at launch; extensible to others (Book, Religion, etc.) later
- **Curved-string timeline as the hero element**
- **Multiple parallel timelines** sharing a time axis
- **Read-mostly canvas** (no Figma-style editing)
- **AI for source synthesis, semantic search, custom timelines, and assisted curation** — but never for inventing historical facts
- **Curated seed first, then assisted curation, then AI-assisted accretion** — the trust-curve approach
- **Show what we don't know** — fuzzy dates render as fuzzy, conflicting sources are visible
- **Every claim cited to a specific passage**
- **Discrete time granularity** (year, month, day) with continuous animation between them

## Decisions left open for the agent

The following are technical decisions where we have leanings but the agent should research current options and propose the actual choice:

- **Rendering technology.** PixiJS (lean, 2D-focused) and React Three Fiber (more flexible, has a 3D path) are the leading candidates we considered. The agent should evaluate both, plus alternatives, and propose. The product is fundamentally 2D with depth-as-atmosphere; a 3D engine is overkill for the timeline view but may matter later for the knowledge-graph-at-a-moment view.
- **Frontend framework.** React (with Next.js) was our default. The agent may evaluate alternatives (Vue, Svelte, SolidJS) and propose. React is a safe choice with the largest ecosystem; the agent should have a strong reason to deviate.
- **State management.** Zustand was suggested for the React/canvas bridge. The agent should propose specifically, considering how state is shared between the React UI and the canvas renderer.
- **Animation library.** GSAP was suggested. Framer Motion is a React-native alternative. The agent should evaluate both for the specific animation needs (camera transitions, easing, sequencing).
- **Database strategy.** PostgreSQL is recommended as the foundation for Phase 1 (everything: relational, JSONB for flexibility, pgvector for embeddings, AGE extension if light graph queries are needed). Neo4j or another graph database is recommended as a Phase 2 addition if and when graph traversal becomes a workload bottleneck. The agent should validate this staged approach against the actual query patterns and propose adjustments.
- **AI model selection.** Claude was the default working assumption for all LLM tasks. The agent should evaluate Claude, GPT-class models, and open-weight alternatives (DeepSeek, Qwen for Chinese-heavy work) on the specific tasks (classical Chinese understanding, source synthesis, query planning) and propose. Cost and quality trade-offs matter; the project may use different models for different tasks.
- **Embedding model.** Multilingual embeddings are required (classical Chinese, modern Chinese, English). Models like BGE-M3 or Qwen-embedding are worth evaluating.
- **Hosting and deployment.** Vercel + managed Postgres (Neon or Supabase) was the casual recommendation. The agent should evaluate based on cost, control, and the AI-worker requirements.
- **API style.** GraphQL was considered for its natural fit with graph-shaped data. tRPC and REST are alternatives. The agent should propose based on what makes the React-canvas integration cleanest.
- **Job queue.** Background AI generation jobs need a queue. BullMQ, Inngest, Trigger.dev, or others. The agent should propose.

## Things the agent should research independently

The following are areas where my own research was thin and the agent should expect to do real work:

- Best practices for accessible WebGL canvas applications in 2026
- Current state of multilingual embedding models for classical Chinese
- Licensing terms for ctext.org, CBDB, and EventKG in detail
- How modern GraphRAG implementations handle citation discipline and hallucination resistance
- How existing prosopographical projects (CBDB, Beyond Notability) handle source variants and conflicting accounts
- Current state of the EDTF ecosystem — libraries, parsers, validators
- Performance characteristics of pgvector at the scale of one to ten million embeddings
- Whether AGE (the Cypher-on-Postgres extension) is mature enough to defer Neo4j adoption indefinitely

## Things to flag back to the human

The agent should come back with proposals (not silent decisions) on:

- Final license choices (default Apache 2.0 / CC-BY-SA 4.0; confirm before launch)
- Specific corpus scope for Phase 1 (which Shiji chapters, which CBDB slice, how many events as the seed target)
- The exact curve function for the timeline (this is design-iterative and should involve the human)
- The mapping of UI strings — should the agent attempt the Chinese copy itself or flag for human translation
- Anything that materially deviates from the leanings in this document

When the agent encounters genuine ambiguity, it should produce options with reasoning rather than silently picking. The trust model is: agent does the research, proposes the answer, human ratifies.
