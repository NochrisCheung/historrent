# Historrent / 滔滔

An open-source, AI-augmented, canvas-based tool for exploring history.

The name comes from the Chinese 滔滔不绝 — "flowing without end" — applied to history as a continuous, interconnected current rather than a sequence of isolated facts.

## Status

Phase 1 in progress. Subject: Liu Bang (劉邦), 史記 高祖本紀.

## Documentation

Read in this order:

1. **[docs/vision.md](docs/vision.md)** — Why Historrent exists, who it is for, what it is trying to do.
2. **[docs/product-context.md](docs/product-context.md)** — Product surface, requirements, decisions made, cross-cutting concerns.
3. **[docs/implementation-approach.md](docs/implementation-approach.md)** — Phasing philosophy, gates, milestones, working norms.
4. **[docs/engineering-practices.md](docs/engineering-practices.md)** — Engineering doctrine: principles, code-review process, historiographical principles, tooling.
5. **[docs/implementation_plan/](docs/implementation_plan/)** — Active implementation plans. Current: [implementation_plan_2026-05-05_liu_bang_v1.md](docs/implementation_plan/implementation_plan_2026-05-05_liu_bang_v1.md).
6. **[CLAUDE.md](CLAUDE.md)** — Behavioural guidelines for the coding agent.

## Quick start

```sh
pnpm install
cp .env.example .env.local   # then fill in DEEPSEEK_API_KEY
pnpm dev
```

Open <http://localhost:3000>.

## Scripts

| Script              | What it does                       |
| ------------------- | ---------------------------------- |
| `pnpm dev`          | Next.js dev server.                |
| `pnpm build`        | Production build.                  |
| `pnpm start`        | Run the production build locally.  |
| `pnpm lint`         | ESLint.                            |
| `pnpm typecheck`    | TypeScript check (`tsc --noEmit`). |
| `pnpm test`         | Vitest unit tests.                 |
| `pnpm test:e2e`     | Playwright end-to-end tests.       |
| `pnpm format`       | Prettier write.                    |
| `pnpm format:check` | Prettier check (CI uses this).     |

## License

- **Code:** Apache 2.0 — see [LICENSE](LICENSE).
- **Curated data (events, citations, translations):** CC-BY-SA 4.0 — see [LICENSE-DATA](LICENSE-DATA).

Upstream sources retain their own licences. The Shiji text via [ctext.org](https://ctext.org/) is in the public domain.
