# AI Tutorial Template

A starter Next.js template for authoring AI-assisted educational tutorials. It provides typed tutorial specifications, structured prompt contracts, reusable MDX learning components, and basic structural validation. Generated content requires subject-matter review, accessibility auditing, rights clearance, and security review before publication.

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
- Basic structural checks for schema shape, MDX compilation, local asset references, citation IDs, image alt text, duplicate paragraphs, and a limited risky-claim keyword scan. These checks do not verify source accuracy, external-link availability, rights clearance, screen-reader usability, or instructional effectiveness — those require human review.
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
| `pnpm update:template` | Sync template changes into another instance |
| `pnpm validate` | Run basic structural content checks |
| `pnpm test` | Run Vitest tests |
| `pnpm lint` | Run ESLint |
| `pnpm build` | Build the app |

## Updating From The Template

From an academy instance, call the script in your template checkout:

```bash
/path/to/learn-template/scripts/update-template.sh
```

Or run it from the template checkout and pass the instance path:

```bash
scripts/update-template.sh --target /path/to/my-academy
```

The script syncs template-owned files into the target while preserving
academy-owned files by default:

- `.env*`
- `academy.config.ts`
- `content/`
- `presentations/`
- `docker-compose.yml`
- build output and dependency directories

It also preserves the target `package.json` `name` field while still allowing
dependency and script updates from the template.

Preview changes without writing files:

```bash
scripts/update-template.sh --target /path/to/my-academy --dry-run
```

If you call the copied script from inside an instance, pass the template source:

```bash
pnpm update:template -- --source /path/to/learn-template
```

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

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for the full text.
