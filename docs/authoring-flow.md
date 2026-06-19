# Authoring Flow

## 1. Define the Tutorial

Start with `prompts/01-curriculum-design.md` and produce a `TutorialSpec` JSON file in `content/tutorials/`.

The spec must include audience, prerequisites, learning objectives, scope, non-goals, lesson sequence, references, concepts, misconceptions, examples, exercises, answers, assessment, mastery criteria, recap, next steps, accessibility metadata, and localization metadata.

## 2. Plan Sources

Use primary, official, or peer-reviewed sources where possible. Label every source with a quality value and mark unstable or unsupported claims for verification.

## 3. Generate Lesson Artifacts

Use the staged prompts:

- `prompts/02-lesson-writing.md` for lesson MDX and claim mapping.
- `prompts/03-quiz-creation.md` for formative assessments.
- `prompts/04-presentation-creation.md` for slides, narration, diagrams, mind maps, and infographics.

Generated outputs should be JSON first. MDX content is a string field inside the JSON output until it passes validation and review.

## 4. Validate Locally

Run:

```bash
pnpm validate
pnpm test
pnpm lint
pnpm build
```

Use `prompts/07-repair-invalid-output.md` when a generated artifact fails schema or MDX validation.

## 5. Review

Before publication, complete human review for:

- Factual accuracy and source quality.
- Objective coverage and prerequisite sequencing.
- Exercise fairness and answer quality.
- Accessibility and localization readiness.
- Any claim marked `verify` or `unsupported`.

## 6. Preview

Run:

```bash
pnpm preview
```

Open the local Next.js URL and inspect each lesson, quiz, diagram fallback, narration hook, and source label.
