# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Implementation Plans

Every non-trivial implementation project (a phase, a feature, a meaningful change) starts with a written plan in `docs/implementation_plan/`, **before any code is written**.

Workflow:

1. **Gather full context.** Read all relevant scripts and design docs in detail, one by one. Don't skim. Don't assume.
2. **Write the plan doc.** Path: `docs/implementation_plan/implementation_plan_{YYYY-MM-DD}_{topic}.md`. Use today's date in the filename and as the `created_at:` field at the top of the doc.
3. **Required sections:**
   - **Context** — what we know, what's relevant, what was already decided upstream
   - **Goals** — what this implementation must achieve
   - **Implementation spec** — the design itself: modular, precise, testable
   - **Implementation plan** — broken into phases; each phase has a detailed task list, each task explained
   - **Status legend** — every task carries a status tag; a legend at the top explains the statuses
4. **Consult before deciding.** Surface important decisions and ambiguities to the human. Do not silently pick.
5. **No backward compatibility.** This is a new project; the latest schema and code are the only ones in production. Don't design for legacy that doesn't exist.

The plan doc is the contract. Implementation work updates the status tags as it progresses, and revises the plan when reality diverges from it.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
