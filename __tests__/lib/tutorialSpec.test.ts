import { describe, expect, it } from "vitest";
import { validateTutorialSpec } from "@/lib/tutorialSpec";
import type { TutorialSpec } from "@/types";

const validSpec: TutorialSpec = {
  schemaVersion: "1.0.0",
  id: "tutorial-test",
  title: "Tutorial Test",
  description: "A valid tutorial spec for tests.",
  audience: {
    primary: "Developers",
    priorKnowledge: ["Markdown"],
  },
  prerequisites: ["Can use a terminal"],
  learningObjectives: [
    {
      id: "obj-one",
      description: "Explain validation.",
      bloomLevel: "understand",
      assessmentIds: ["assess-one"],
    },
  ],
  scope: {
    inScope: ["Validation"],
    nonGoals: ["Deployment"],
  },
  lessons: [
    {
      id: "lesson-one",
      slug: "lesson-one",
      title: "Lesson One",
      summary: "A lesson.",
      estimatedMinutes: 5,
      difficulty: "beginner",
      prerequisites: [],
      objectiveIds: ["obj-one"],
      conceptIds: ["concept-one"],
      referenceIds: ["ref-one"],
      artifacts: {
        mdxPath: "content/module-1/lesson-one.mdx",
      },
    },
  ],
  references: [
    {
      id: "ref-one",
      title: "Reference",
      url: "https://example.com",
      accessedAt: "2026-06-19",
      quality: "primary",
    },
  ],
  concepts: [
    {
      id: "concept-one",
      term: "Validation",
      definition: "A deterministic check.",
    },
  ],
  misconceptions: [
    {
      id: "mis-one",
      misconception: "Validation replaces review.",
      correction: "Validation supports review.",
      conceptIds: ["concept-one"],
    },
  ],
  workedExamples: [
    {
      id: "example-one",
      title: "Example",
      prompt: "Check a spec.",
      steps: ["Read it", "Validate it"],
      explanation: "The validator catches structure defects.",
      conceptIds: ["concept-one"],
      referenceIds: ["ref-one"],
    },
  ],
  exercises: [
    {
      id: "exercise-one",
      prompt: "Name one gate.",
      type: "short-answer",
      difficulty: "beginner",
      conceptIds: ["concept-one"],
      answerId: "answer-one",
    },
  ],
  answers: [
    {
      id: "answer-one",
      exerciseId: "exercise-one",
      answer: "Schema validation.",
    },
  ],
  formativeAssessment: [
    {
      id: "assess-one",
      type: "quiz",
      prompt: "What does validation do?",
      objectiveIds: ["obj-one"],
    },
  ],
  masteryCriteria: [
    {
      id: "mastery-one",
      description: "Explains validation.",
      objectiveIds: ["obj-one"],
      threshold: "One accurate explanation.",
    },
  ],
  recap: ["Validation is deterministic."],
  nextSteps: ["Run the validator."],
  accessibility: {
    altTextRequired: true,
    captionsRequired: true,
    transcriptRequired: true,
    colorIndependent: true,
    keyboardNavigable: true,
    readingOrderChecked: true,
  },
  localization: {
    sourceLocale: "en-US",
    targetLocales: ["en-GB"],
    glossaryTerms: ["validation"],
    culturalAssumptions: [],
  },
};

describe("validateTutorialSpec", () => {
  it("accepts a valid tutorial spec", () => {
    const result = validateTutorialSpec(validSpec);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("rejects invalid cross references", () => {
    const spec = structuredClone(validSpec);
    spec.lessons[0].objectiveIds = ["missing-objective"];

    const result = validateTutorialSpec(spec);

    expect(result.ok).toBe(false);
    expect(result.issues.some((item) => item.path.includes("objectiveIds"))).toBe(true);
  });

  it("rejects adversarial prose instead of JSON", () => {
    const result = validateTutorialSpec("Here is the tutorial you requested.");

    expect(result.ok).toBe(false);
    expect(result.issues[0].path).toBe("$");
  });

  it("rejects partial model responses", () => {
    const result = validateTutorialSpec({
      schemaVersion: "1.0.0",
      title: "Partial",
      lessons: [],
    });

    expect(result.ok).toBe(false);
    expect(result.issues.some((item) => item.path === "$.id")).toBe(true);
    expect(result.issues.some((item) => item.path === "$.lessons")).toBe(true);
  });
});
