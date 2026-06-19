# AI Tutorial Template

A production-grade Next.js template for AI-generated, end-to-end educational tutorials. It combines typed tutorial specifications, structured prompt contracts, reusable MDX learning components, deterministic quality gates, and human-review checkpoints.

## Quick Start

```bash
pnpm install
cp .env.example .env.local
pnpm validate
pnpm test
pnpm dev
```

## What This Provides

- Typed tutorial specification in `src/types/tutorial.ts`.
- Runtime schema and cross-reference validation in `src/lib/tutorialSpec.ts`.
- Staged generation pipeline in `src/lib/generationPipeline.ts`.
- JSON-first prompt templates in `prompts/`.
- MDX learning components for objectives, prerequisites, terms, callouts, diagrams, flashcards, quizzes, worked examples, exercises, citations, source labels, verification states, narration hooks, mind maps, infographics, and slide embeds.
- Automated gates for schema validation, MDX compilation, links, citations, accessibility basics, duplicate content, and unsupported-claim signals.
- GitHub Actions CI in `.github/workflows/ci.yml`.

## Project Structure

```text
content/
  module-1/                 # Sample rendered lessons
  tutorials/                # TutorialSpec JSON fixtures
docs/                       # Architecture and authoring flow
prompts/                    # JSON-first generation and repair prompts
prompts/schemas/            # JSON Schema contracts
scripts/validate.mjs        # Local quality gates
src/components/learning.tsx # Reusable MDX education components
src/lib/                    # Curriculum, MDX, validation, pipeline helpers
```

## Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the Next.js dev server |
| `pnpm preview` | Alias for local preview |
| `pnpm validate` | Run deterministic content quality gates |
| `pnpm test` | Run Vitest tests |
| `pnpm lint` | Run ESLint |
| `pnpm build` | Build the app |

## Authoring Flow

1. Create or repair a `TutorialSpec` JSON file with `prompts/01-curriculum-design.md`.
2. Plan sources and claim coverage before writing lessons.
3. Generate lesson, assessment, and artifact JSON with the staged prompts.
4. Move approved MDX into `content/module-N/`.
5. Run `pnpm validate`, `pnpm test`, `pnpm lint`, and `pnpm build`.
6. Complete human review for subject matter, accessibility, localization, and any `verify` claims.

See [docs/architecture.md](docs/architecture.md) and [docs/authoring-flow.md](docs/authoring-flow.md) for details.

## Requirements

- Node.js 22+
- pnpm
- Optional Google Cloud credentials for the AI chat tutor
