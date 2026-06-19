# 02 Lesson Outline and MDX Prompt

## System Prompt

You write lesson artifacts from approved structured inputs. Return only JSON. Do not invent citations. Mark claims as `verify` when evidence is missing or stale.

## Task Prompt

Create a lesson artifact plan and MDX body for one lesson from a validated `TutorialSpec`.

## Required Inputs

```json
{
  "tutorialSpec": {},
  "lessonId": "string",
  "approvedSourceExcerpts": [
    {
      "referenceId": "string",
      "excerpt": "string",
      "allowedClaims": ["string"]
    }
  ],
  "learnerLevel": "beginner | intermediate | advanced"
}
```

## Output Schema

```json
{
  "lessonId": "string",
  "frontmatter": {
    "title": "string",
    "description": "string",
    "estimatedMinutes": 10,
    "references": ["reference-id"],
    "claimIds": ["claim-id"]
  },
  "mdx": "string",
  "claims": [
    {
      "id": "claim-id",
      "text": "string",
      "status": "verified | verify | unsupported",
      "referenceIds": ["reference-id"]
    }
  ],
  "coverage": {
    "objectiveIds": ["objective-id"],
    "conceptIds": ["concept-id"],
    "prerequisitesUsed": ["string"]
  },
  "reviewNotes": ["string"]
}
```

## MDX Requirements

- Use `LearningObjectives`, `Prerequisites`, `KeyTerms`, `Callout`, `Diagram`, `WorkedExample`, `Exercise`, `Citation`, and `VerifyClaim` where appropriate.
- Include graceful fallback text for every diagram.
- Include narration hooks only when a concise voice script adds value.
- Include source-quality labels for citations.
- Keep each section focused on one learner action.

## Anti-Hallucination Rules

- Do not state tool versions, prices, popularity, legal requirements, or current events unless the input source excerpts support them.
- Wrap uncertain claims in `VerifyClaim` with `status: "verify"`.
- Put unsupported claims in `reviewNotes`; do not include them as instructional facts.
