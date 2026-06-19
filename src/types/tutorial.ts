export type Difficulty = "beginner" | "intermediate" | "advanced";

export type SourceQuality =
  | "primary"
  | "official-docs"
  | "peer-reviewed"
  | "expert"
  | "secondary"
  | "unverified";

export type ClaimStatus = "verified" | "verify" | "unsupported";

export interface TutorialReference {
  id: string;
  title: string;
  url: string;
  publisher?: string;
  accessedAt: string;
  quality: SourceQuality;
  notes?: string;
}

export interface LearningObjective {
  id: string;
  description: string;
  bloomLevel: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
  assessmentIds: string[];
}

export interface TutorialAudience {
  primary: string;
  priorKnowledge: string[];
  roles?: string[];
  readingLevel?: string;
}

export interface TutorialScope {
  inScope: string[];
  nonGoals: string[];
}

export interface TutorialConcept {
  id: string;
  term: string;
  definition: string;
  relatedConceptIds?: string[];
}

export interface TutorialMisconception {
  id: string;
  misconception: string;
  correction: string;
  conceptIds: string[];
}

export interface WorkedExample {
  id: string;
  title: string;
  prompt: string;
  steps: string[];
  explanation: string;
  conceptIds: string[];
  referenceIds?: string[];
}

export interface Exercise {
  id: string;
  prompt: string;
  type: "short-answer" | "multiple-choice" | "coding" | "reflection" | "scenario";
  difficulty: Difficulty;
  conceptIds: string[];
  answerId: string;
}

export interface ExerciseAnswer {
  id: string;
  exerciseId: string;
  answer: string;
  rubric?: string[];
}

export interface AssessmentItem {
  id: string;
  type: "quiz" | "free-response" | "performance-task" | "self-check";
  prompt: string;
  expectedAnswer?: string;
  objectiveIds: string[];
}

export interface MasteryCriterion {
  id: string;
  description: string;
  objectiveIds: string[];
  threshold: string;
}

export interface AccessibilityMetadata {
  altTextRequired: boolean;
  captionsRequired: boolean;
  transcriptRequired: boolean;
  colorIndependent: boolean;
  keyboardNavigable: boolean;
  readingOrderChecked: boolean;
}

export interface LocalizationMetadata {
  sourceLocale: string;
  targetLocales: string[];
  glossaryTerms: string[];
  culturalAssumptions: string[];
}

export interface LessonSpec {
  id: string;
  slug: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
  difficulty: Difficulty;
  prerequisites: string[];
  objectiveIds: string[];
  conceptIds: string[];
  referenceIds: string[];
  artifacts: {
    mdxPath: string;
    slidesPath?: string;
    narrationScriptPath?: string;
    infographicPath?: string;
  };
}

export interface TutorialSpec {
  schemaVersion: "1.0.0";
  id: string;
  title: string;
  description: string;
  audience: TutorialAudience;
  prerequisites: string[];
  learningObjectives: LearningObjective[];
  scope: TutorialScope;
  lessons: LessonSpec[];
  references: TutorialReference[];
  concepts: TutorialConcept[];
  misconceptions: TutorialMisconception[];
  workedExamples: WorkedExample[];
  exercises: Exercise[];
  answers: ExerciseAnswer[];
  formativeAssessment: AssessmentItem[];
  masteryCriteria: MasteryCriterion[];
  recap: string[];
  nextSteps: string[];
  accessibility: AccessibilityMetadata;
  localization: LocalizationMetadata;
}

export interface ValidationIssue {
  path: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}
