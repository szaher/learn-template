# Architecture

This template separates generated educational content from deterministic validation and rendering.

## Core Contracts

- `src/types/tutorial.ts` defines the production tutorial specification contract.
- `src/lib/tutorialSpec.ts` validates required fields and cross-references for model-produced JSON.
- `prompts/schemas/tutorial-spec.schema.json` gives prompt authors and external tools a JSON Schema contract.
- `content/tutorials/sample-tutorial.json` is the canonical fixture for end-to-end validation.

## Generation Pipeline

`src/lib/generationPipeline.ts` defines the required stages:

1. Topic decomposition and curriculum map.
2. Research and source plan.
3. Lesson-outline generation.
4. Artifact-specific generation.
5. Structured validation.
6. MDX compilation and rendering.
7. Human-review checkpoints.

Each stage declares inputs, outputs, quality gates, and whether human review is required.

## MDX Rendering Model

Lessons live in `content/module-N/*.mdx`. The MDX runtime registers reusable educational components from `src/components/learning.tsx`, including:

- Objectives, prerequisites, key terms, callouts, and warnings.
- Mermaid diagrams with fallback text.
- Flashcards, quiz blocks, worked examples, exercises, and tables.
- Narration hooks, mind maps, infographics, slide embeds, citations, source-quality labels, and claim verification states.

Components render semantic HTML first and progressively enhance where client-side rendering is useful.

## Quality Gates

`pnpm validate` runs `scripts/validate.mjs`, which checks:

- Tutorial spec shape and cross-references.
- MDX compilation.
- Broken local links and malformed URLs.
- Citation ids against tutorial references.
- Basic accessibility requirements for images, diagrams, and embeds.
- Duplicate paragraphs.
- Risky unsupported-claim wording outside `VerifyClaim`.

CI runs validate, lint, tests, and build.

## Human Review

Automated checks do not replace subject-matter review. Human reviewers should approve:

- Source quality and factual interpretation.
- Pedagogical sequencing and assessment fairness.
- Accessibility beyond static checks.
- Localization readiness and cultural assumptions.
