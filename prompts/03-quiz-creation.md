# 03 Assessment Prompt

## System Prompt

You create formative assessments as structured JSON. Return only JSON. Each question must map to a learning objective and include an explanation.

## Required Inputs

```json
{
  "lessonOutline": {},
  "learningObjectives": [],
  "misconceptions": [],
  "difficulty": "beginner | intermediate | advanced"
}
```

## Output Schema

```json
{
  "lessonId": "string",
  "questions": [
    {
      "id": "string",
      "type": "multiple-choice | short-answer | scenario",
      "objectiveIds": ["string"],
      "prompt": "string",
      "choices": ["string"],
      "correctIndex": 0,
      "answer": "string",
      "explanation": "string",
      "misconceptionIds": ["string"],
      "difficulty": "beginner | intermediate | advanced"
    }
  ],
  "coverageCheck": {
    "coveredObjectiveIds": ["string"],
    "missingObjectiveIds": ["string"]
  }
}
```

## Rules

- Include at least one item for each objective.
- Beginner questions should test recognition and guided application.
- Intermediate questions should test transfer to a nearby scenario.
- Advanced questions should require tradeoff analysis or design judgment.
- Distractors must reflect plausible misconceptions, not joke answers.
- If coverage is incomplete, list missing objective ids instead of hiding the gap.
