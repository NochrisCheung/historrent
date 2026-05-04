# Historrent / 滔滔 — Vision and Goals

## What Historrent is

Historrent (滔滔) is an open-source, AI-augmented, canvas-based tool for exploring history. The name comes from the Chinese 滔滔不绝 — "flowing without end" — applied to history as a continuous, interconnected current rather than a sequence of isolated facts.

The product is not a textbook, not a Wikipedia clone, not a database UI, not a timeline maker. It is a navigable space in which historical events, people, places, and entities can be explored across time, related through causality, and grounded in primary sources. Its design commitment is that history should _feel_ — that scale, simultaneity, causation, and uncertainty should be visible and felt, not merely listed.

The default language is Chinese. The seed corpus is 史記 (Records of the Grand Historian). Other languages and corpora follow.

## Why Historrent exists

History as currently consumed has well-known problems that no mainstream tool addresses. Five of these were the explicit anchor for Historrent's design.

**Synchronicity blindness.** Most people cannot easily answer "what was happening elsewhere at the same time?" The standard tools — books, Wikipedia, timelines — present history one civilisation, one period, or one topic at a time. The fact that the Han dynasty, the Roman Republic, and the Mauryan Empire overlapped is technically retrievable but rarely felt.

**Lack of scale and context.** Most people cannot intuitively distinguish "two hundred years ago" from "two thousand years ago" from "two hundred thousand years ago." They flatten into "olden times." Without a felt sense of scale, deep time becomes meaningless.

**Opaque causality.** Tools spatialise _when_ events happened; almost none spatialise _why_. The chains of cause and effect between events — how Roman law influenced Napoleonic France, how Han bureaucracy shaped later Chinese governance — are invisible in standard tools.

**Conflicting accounts surfaced poorly.** History is contested. Multiple sources often disagree about dates, causes, and even what happened. Most tools either pick one account silently or present them as a flat bibliography with no way to compare claims side by side.

**No sensory intuition.** Reading about a place or moment is one thing; getting any sensory or atmospheric feel for it is another. Books describe the fall of Constantinople in 1453; nothing communicates what those walls sounded or felt like.

The hypothesis behind Historrent is that a well-designed canvas, with a graph-shaped data foundation and AI as a reasoning layer, can address all five — and that doing so creates a meaningfully better way to engage with history than anything that exists today.

## Who Historrent is for

Three audiences in concentric circles:

- **Casual history lovers.** People who fall into Wikipedia rabbit holes, read popular history books, watch documentaries. Currently underserved by everything serious and overserved by everything shallow. The largest group.
- **Students and intermediate learners.** People studying history formally and looking for tools that show connections, parallels, and causation rather than chronological lists.
- **Researchers and serious enthusiasts.** People working on specific historical questions who need source citation, fuzzy date handling, and the ability to query relationships across the corpus.

The product is designed as a generalist tool — the three audiences should be able to use the same product, with progressively deeper engagement, without the casual user being overwhelmed or the researcher being patronised.

## What Historrent is not

Stating non-goals explicitly is part of the brief. Historrent is not:

- **A textbook or curriculum tool.** It does not impose a learning path, test comprehension, or replace teachers. It is a tool for exploration, not instruction.
- **A general-purpose research database.** It is a tool for _engaging with_ history, not a backend for academic publication. Researchers may use it as a starting point, but it does not replace specialist databases like CBDB.
- **A wiki.** Editing is gated, curated, and source-grounded. Wikipedia exists; Historrent is doing something different.
- **A social product.** There is no feed, no follow graph, no comments at launch. Possibly later, but never as the centre.
- **A commercial product (initially).** Historrent is open source. A hosted version may eventually carry costs (compute for AI features), but the project itself is freely usable, modifiable, and forkable.
- **A games platform.** It borrows craft from game design — animation, feedback, exploration — but the user is reading and thinking, not playing.

## Design commitments

These are the principles that should guide every decision. When in doubt, the agent should re-read this section.

**Evidence-grounded.** Every assertion the system displays must be traceable to a source. Every event has at least one citation; every citation points to a specific passage; every claim is verifiable. Hallucination is the killer risk for an AI-augmented historical tool; the design must structurally prevent it.

**Show what we don't know.** Most history tools lie about precision — displaying exact dates that are actually disputed, ignoring conflicting accounts, papering over uncertainty. Historrent does the opposite. Fuzzy dates are rendered as fuzzy. Conflicting sources are shown side by side. Confidence is visible.

**Continuous flow over discrete pages.** The product is a canvas, not a sequence of pages. Navigation is camera movement, not page navigation. The user never feels like they've "left" — they pan, zoom, and flow.

**Multilingual from day one.** The seed corpus is in classical Chinese; the default UI is in modern Chinese; English is a first-class secondary. The data model must treat language as a property of content, not a deployment configuration.

**Open source.** The code is open. The data is open. The schema is documented. The project should be forkable, extensible, and contributable to. Walls and proprietary lock-in are anti-goals.

**AI as augmentation, not replacement.** AI extracts, synthesises, surfaces, and translates — but never invents historical facts and never operates without citation. Human curation is the ground truth; AI scales human curation, doesn't replace it.

**Beautiful by default.** This is a tool people choose to use, not one they have to use. The aesthetic — the curved-string timeline, the animation, the typography, the silence — is part of the product, not a surface treatment. Design shortcuts that compromise the feel are not acceptable.

## Long-term ambition

If Historrent succeeds, the product becomes:

- The default place to explore Chinese history online for non-academic users, in Chinese.
- A serious tool that historians use for teaching, public engagement, and source comparison.
- A platform extensible to other historical traditions — the same engine hosting 史記 should be able to host the Old Testament, Herodotus, the Mahabharata, or the Codex Mendoza, with their respective communities contributing curation.
- A demonstration that AI can responsibly augment humanities scholarship when grounded in rigorous citation and human review.

The project does not need to achieve all of this to be worth building. Even a single well-curated corpus, beautifully presented, with the five pain points genuinely addressed, would be a meaningful contribution.

## Success criteria

For an open-source side project, "success" is fuzzy. Useful checkpoints:

- **Phase 1 success:** the canvas works, 史記 seed data renders correctly, the source-citation discipline is enforced, the product is publicly deployed, a small group of users (history enthusiasts, perhaps from a Hacker News or Chinese tech community post) try it and report it feeling materially different from existing tools.
- **Phase 2 success:** the AI source-synthesis and review-queue features are working, contributors are extending the dataset, the corpus has grown meaningfully beyond the initial seed.
- **Phase 3 success:** custom timeline generation works for arbitrary user requests against the corpus, and produces results that surprise even people who know the source material well.
- **Long-term success:** at least one other corpus has been added by someone other than the original author, validating that the schema and tooling are genuinely portable.
