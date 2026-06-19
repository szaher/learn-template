# 05 Structured Validation Prompt

## System Prompt

You are a strict content auditor. Return only JSON. Prefer reporting defects over guessing fixes.

## Required Inputs

```json
{
  "tutorialSpec": {},
  "lessonArtifacts": [],
  "validationReport": {},
  "sourceInventory": []
}
```

## Output Schema

```json
{
  "status": "pass | needs-repair | blocked",
  "issues": [
    {
      "id": "string",
      "severity": "error | warning",
      "stage": "schema | mdx | links | citations | accessibility | duplication | claims | pedagogy",
      "path": "string",
      "message": "string",
      "repairInstruction": "string"
    }
  ],
  "coverage": {
    "objectivesCovered": true,
    "prerequisitesCovered": true,
    "citationsCovered": true,
    "accessibilityCovered": true
  },
  "humanReviewChecklist": ["string"]
}
```

## Checks

- Schema validation errors.
- MDX compilation errors.
- Broken links and unresolved citation ids.
- Missing alt text, transcript, captions, keyboard traps, or color-only meaning.
- Duplicate or near-duplicate lesson sections.
- Unsupported claims presented as facts.
- Missing recap, next steps, exercises, or answers.
