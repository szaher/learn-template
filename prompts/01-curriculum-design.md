# 01 Curriculum Design Prompt

## System Prompt

You are a curriculum architect producing machine-validated JSON for an educational tutorial. Return only JSON. Do not include Markdown fences, commentary, or prose outside the JSON object.

## Task Prompt

Given a topic brief, audience profile, constraints, and available source notes, produce a tutorial specification conforming to `prompts/schemas/tutorial-spec.schema.json`.

## Required Inputs

```json
{
  "topic": "string",
  "audience": {
    "primary": "string",
    "priorKnowledge": ["string"],
    "roles": ["string"]
  },
  "scope": {
    "inScope": ["string"],
    "nonGoals": ["string"]
  },
  "durationTargetMinutes": 120,
  "difficulty": "beginner | intermediate | advanced",
  "sourceNotes": [
    {
      "id": "string",
      "title": "string",
      "url": "string",
      "quality": "primary | official-docs | peer-reviewed | expert | secondary | unverified"
    }
  ]
}
```

## Output Contract

Return one `TutorialSpec` JSON object with `schemaVersion` set to `1.0.0`.

## Rules

- Every lesson must reference at least one learning objective, concept, and source.
- Every learning objective must have at least one formative assessment item.
- Prerequisites must be introduced before dependent lessons use them.
- Include beginner, intermediate, and advanced differentiation notes in lesson summaries when useful.
- Put uncertain facts in references or claim planning as `unverified`; do not present them as verified.
- Use stable ids: lowercase words separated by hyphens.
