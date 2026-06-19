import type {
  Difficulty,
  TutorialSpec,
  ValidationIssue,
  ValidationResult,
} from "@/types/tutorial";

const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];
const SOURCE_QUALITIES = [
  "primary",
  "official-docs",
  "peer-reviewed",
  "expert",
  "secondary",
  "unverified",
];
const BLOOM_LEVELS = ["remember", "understand", "apply", "analyze", "evaluate", "create"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function issue(path: string, message: string, severity: "error" | "warning" = "error"): ValidationIssue {
  return { path, message, severity };
}

function requireString(
  value: Record<string, unknown>,
  key: string,
  path: string,
  issues: ValidationIssue[]
) {
  if (typeof value[key] !== "string" || String(value[key]).trim().length === 0) {
    issues.push(issue(`${path}.${key}`, "Expected a non-empty string."));
  }
}

function requireStringArray(
  value: Record<string, unknown>,
  key: string,
  path: string,
  issues: ValidationIssue[],
  minLength = 0
) {
  const arr = value[key];
  if (!Array.isArray(arr) || arr.some((item) => typeof item !== "string" || item.trim() === "")) {
    issues.push(issue(`${path}.${key}`, "Expected an array of non-empty strings."));
    return;
  }
  if (arr.length < minLength) {
    issues.push(issue(`${path}.${key}`, `Expected at least ${minLength} item(s).`));
  }
}

function collectIds(items: unknown, path: string, issues: ValidationIssue[]): Set<string> {
  const ids = new Set<string>();
  if (!Array.isArray(items)) {
    issues.push(issue(path, "Expected an array."));
    return ids;
  }

  items.forEach((item, index) => {
    if (!isRecord(item) || typeof item.id !== "string" || item.id.trim() === "") {
      issues.push(issue(`${path}[${index}].id`, "Expected a non-empty id."));
      return;
    }
    if (ids.has(item.id)) {
      issues.push(issue(`${path}[${index}].id`, `Duplicate id '${item.id}'.`));
    }
    ids.add(item.id);
  });

  return ids;
}

function requireRefs(
  refs: unknown,
  ids: Set<string>,
  path: string,
  label: string,
  issues: ValidationIssue[]
) {
  if (!Array.isArray(refs)) {
    issues.push(issue(path, "Expected an array of ids."));
    return;
  }
  refs.forEach((ref, index) => {
    if (typeof ref !== "string" || !ids.has(ref)) {
      issues.push(issue(`${path}[${index}]`, `Unknown ${label} id '${String(ref)}'.`));
    }
  });
}

export function validateTutorialSpec(input: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!isRecord(input)) {
    return { ok: false, issues: [issue("$", "Expected a tutorial specification object.")] };
  }

  if (input.schemaVersion !== "1.0.0") {
    issues.push(issue("$.schemaVersion", "Expected schemaVersion '1.0.0'."));
  }

  ["id", "title", "description"].forEach((key) => requireString(input, key, "$", issues));
  requireStringArray(input, "prerequisites", "$", issues);
  requireStringArray(input, "recap", "$", issues, 1);
  requireStringArray(input, "nextSteps", "$", issues, 1);

  if (!isRecord(input.audience)) {
    issues.push(issue("$.audience", "Expected audience metadata."));
  } else {
    requireString(input.audience, "primary", "$.audience", issues);
    requireStringArray(input.audience, "priorKnowledge", "$.audience", issues);
  }

  if (!isRecord(input.scope)) {
    issues.push(issue("$.scope", "Expected scope metadata."));
  } else {
    requireStringArray(input.scope, "inScope", "$.scope", issues, 1);
    requireStringArray(input.scope, "nonGoals", "$.scope", issues, 1);
  }

  const objectiveIds = collectIds(input.learningObjectives, "$.learningObjectives", issues);
  const lessonIds = collectIds(input.lessons, "$.lessons", issues);
  const referenceIds = collectIds(input.references, "$.references", issues);
  const conceptIds = collectIds(input.concepts, "$.concepts", issues);
  const answerIds = collectIds(input.answers, "$.answers", issues);
  collectIds(input.misconceptions, "$.misconceptions", issues);
  collectIds(input.workedExamples, "$.workedExamples", issues);
  const exerciseIds = collectIds(input.exercises, "$.exercises", issues);
  collectIds(input.formativeAssessment, "$.formativeAssessment", issues);
  collectIds(input.masteryCriteria, "$.masteryCriteria", issues);

  if (lessonIds.size === 0) {
    issues.push(issue("$.lessons", "Expected at least one lesson."));
  }

  if (Array.isArray(input.learningObjectives)) {
    input.learningObjectives.forEach((item, index) => {
      if (!isRecord(item)) return;
      requireString(item, "description", `$.learningObjectives[${index}]`, issues);
      if (typeof item.bloomLevel !== "string" || !BLOOM_LEVELS.includes(item.bloomLevel)) {
        issues.push(issue(`$.learningObjectives[${index}].bloomLevel`, "Expected a supported Bloom level."));
      }
      requireRefs(item.assessmentIds, collectIds(input.formativeAssessment, "$.formativeAssessment", []), `$.learningObjectives[${index}].assessmentIds`, "assessment", issues);
    });
  }

  if (Array.isArray(input.references)) {
    input.references.forEach((item, index) => {
      if (!isRecord(item)) return;
      requireString(item, "title", `$.references[${index}]`, issues);
      requireString(item, "url", `$.references[${index}]`, issues);
      requireString(item, "accessedAt", `$.references[${index}]`, issues);
      if (typeof item.quality !== "string" || !SOURCE_QUALITIES.includes(item.quality)) {
        issues.push(issue(`$.references[${index}].quality`, "Expected a supported source-quality label."));
      }
    });
  }

  if (Array.isArray(input.lessons)) {
    input.lessons.forEach((item, index) => {
      if (!isRecord(item)) return;
      const path = `$.lessons[${index}]`;
      ["slug", "title", "summary"].forEach((key) => requireString(item, key, path, issues));
      if (typeof item.estimatedMinutes !== "number" || item.estimatedMinutes < 1) {
        issues.push(issue(`${path}.estimatedMinutes`, "Expected a positive number."));
      }
      if (typeof item.difficulty !== "string" || !DIFFICULTIES.includes(item.difficulty as Difficulty)) {
        issues.push(issue(`${path}.difficulty`, "Expected beginner, intermediate, or advanced."));
      }
      requireStringArray(item, "prerequisites", path, issues);
      requireRefs(item.objectiveIds, objectiveIds, `${path}.objectiveIds`, "objective", issues);
      requireRefs(item.conceptIds, conceptIds, `${path}.conceptIds`, "concept", issues);
      requireRefs(item.referenceIds, referenceIds, `${path}.referenceIds`, "reference", issues);
      if (!isRecord(item.artifacts) || typeof item.artifacts.mdxPath !== "string") {
        issues.push(issue(`${path}.artifacts.mdxPath`, "Expected an MDX artifact path."));
      }
    });
  }

  if (Array.isArray(input.concepts)) {
    input.concepts.forEach((item, index) => {
      if (!isRecord(item)) return;
      requireString(item, "term", `$.concepts[${index}]`, issues);
      requireString(item, "definition", `$.concepts[${index}]`, issues);
      if (item.relatedConceptIds) {
        requireRefs(item.relatedConceptIds, conceptIds, `$.concepts[${index}].relatedConceptIds`, "concept", issues);
      }
    });
  }

  if (Array.isArray(input.misconceptions)) {
    input.misconceptions.forEach((item, index) => {
      if (!isRecord(item)) return;
      requireString(item, "misconception", `$.misconceptions[${index}]`, issues);
      requireString(item, "correction", `$.misconceptions[${index}]`, issues);
      requireRefs(item.conceptIds, conceptIds, `$.misconceptions[${index}].conceptIds`, "concept", issues);
    });
  }

  if (Array.isArray(input.workedExamples)) {
    input.workedExamples.forEach((item, index) => {
      if (!isRecord(item)) return;
      const path = `$.workedExamples[${index}]`;
      ["title", "prompt", "explanation"].forEach((key) => requireString(item, key, path, issues));
      requireStringArray(item, "steps", path, issues, 1);
      requireRefs(item.conceptIds, conceptIds, `${path}.conceptIds`, "concept", issues);
      if (item.referenceIds) {
        requireRefs(item.referenceIds, referenceIds, `${path}.referenceIds`, "reference", issues);
      }
    });
  }

  if (Array.isArray(input.exercises)) {
    input.exercises.forEach((item, index) => {
      if (!isRecord(item)) return;
      const path = `$.exercises[${index}]`;
      requireString(item, "prompt", path, issues);
      if (typeof item.difficulty !== "string" || !DIFFICULTIES.includes(item.difficulty as Difficulty)) {
        issues.push(issue(`${path}.difficulty`, "Expected beginner, intermediate, or advanced."));
      }
      requireRefs(item.conceptIds, conceptIds, `${path}.conceptIds`, "concept", issues);
      if (typeof item.answerId !== "string" || !answerIds.has(item.answerId)) {
        issues.push(issue(`${path}.answerId`, "Expected an answer id that exists in $.answers."));
      }
    });
  }

  if (Array.isArray(input.answers)) {
    input.answers.forEach((item, index) => {
      if (!isRecord(item)) return;
      requireString(item, "answer", `$.answers[${index}]`, issues);
      if (typeof item.exerciseId !== "string" || !exerciseIds.has(item.exerciseId)) {
        issues.push(issue(`$.answers[${index}].exerciseId`, "Expected an exercise id that exists in $.exercises."));
      }
    });
  }

  if (Array.isArray(input.formativeAssessment)) {
    input.formativeAssessment.forEach((item, index) => {
      if (!isRecord(item)) return;
      requireString(item, "prompt", `$.formativeAssessment[${index}]`, issues);
      requireRefs(item.objectiveIds, objectiveIds, `$.formativeAssessment[${index}].objectiveIds`, "objective", issues);
    });
  }

  if (Array.isArray(input.masteryCriteria)) {
    input.masteryCriteria.forEach((item, index) => {
      if (!isRecord(item)) return;
      requireString(item, "description", `$.masteryCriteria[${index}]`, issues);
      requireString(item, "threshold", `$.masteryCriteria[${index}]`, issues);
      requireRefs(item.objectiveIds, objectiveIds, `$.masteryCriteria[${index}].objectiveIds`, "objective", issues);
    });
  }

  ["accessibility", "localization"].forEach((key) => {
    if (!isRecord(input[key])) {
      issues.push(issue(`$.${key}`, `Expected ${key} metadata.`));
    }
  });

  return { ok: issues.every((item) => item.severity !== "error"), issues };
}

export function assertTutorialSpec(input: unknown): TutorialSpec {
  const result = validateTutorialSpec(input);
  if (!result.ok) {
    const message = result.issues.map((item) => `${item.path}: ${item.message}`).join("\n");
    throw new Error(`Invalid tutorial specification:\n${message}`);
  }
  return input as TutorialSpec;
}
