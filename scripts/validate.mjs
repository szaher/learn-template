import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compile } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const contentDir = path.join(root, "content");

const errors = [];
const warnings = [];

function add(kind, file, message) {
  const target = path.relative(root, file);
  const item = `${target}: ${message}`;
  if (kind === "error") errors.push(item);
  else warnings.push(item);
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(dir, predicate) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(fullPath, predicate)));
    else if (predicate(fullPath)) files.push(fullPath);
  }
  return files;
}

function stripFrontmatter(raw) {
  if (!raw.startsWith("---")) return { frontmatter: "", body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { frontmatter: "", body: raw };
  return {
    frontmatter: raw.slice(3, end).trim(),
    body: raw.slice(end + 4).trimStart(),
  };
}

function findAll(pattern, text) {
  return Array.from(text.matchAll(pattern));
}

function ids(items) {
  return new Set(Array.isArray(items) ? items.map((item) => item?.id).filter(Boolean) : []);
}

function validateRefs(file, refs, validIds, label) {
  if (!Array.isArray(refs)) {
    add("error", file, `Expected ${label} references to be an array.`);
    return;
  }
  for (const ref of refs) {
    if (!validIds.has(ref)) add("error", file, `Unknown ${label} id '${ref}'.`);
  }
}

function validateTutorialSpec(file, spec) {
  const required = [
    "schemaVersion",
    "id",
    "title",
    "audience",
    "learningObjectives",
    "scope",
    "lessons",
    "references",
    "concepts",
    "formativeAssessment",
    "masteryCriteria",
    "accessibility",
    "localization",
  ];
  for (const key of required) {
    if (!(key in spec)) add("error", file, `Missing required field '${key}'.`);
  }
  if (spec.schemaVersion !== "1.0.0") add("error", file, "schemaVersion must be 1.0.0.");

  const objectiveIds = ids(spec.learningObjectives);
  const assessmentIds = ids(spec.formativeAssessment);
  const conceptIds = ids(spec.concepts);
  const referenceIds = ids(spec.references);
  const answerIds = ids(spec.answers);
  const exerciseIds = ids(spec.exercises);

  for (const objective of spec.learningObjectives ?? []) {
    validateRefs(file, objective.assessmentIds, assessmentIds, "assessment");
  }
  for (const lesson of spec.lessons ?? []) {
    validateRefs(file, lesson.objectiveIds, objectiveIds, "objective");
    validateRefs(file, lesson.conceptIds, conceptIds, "concept");
    validateRefs(file, lesson.referenceIds, referenceIds, "reference");
    if (lesson.artifacts?.mdxPath && !lesson.artifacts.mdxPath.endsWith(".mdx")) {
      add("error", file, `Lesson '${lesson.id}' mdxPath must point to an .mdx file.`);
    }
  }
  for (const item of spec.misconceptions ?? []) validateRefs(file, item.conceptIds, conceptIds, "concept");
  for (const item of spec.workedExamples ?? []) {
    validateRefs(file, item.conceptIds, conceptIds, "concept");
    if (item.referenceIds) validateRefs(file, item.referenceIds, referenceIds, "reference");
  }
  for (const item of spec.exercises ?? []) {
    validateRefs(file, item.conceptIds, conceptIds, "concept");
    if (!answerIds.has(item.answerId)) add("error", file, `Exercise '${item.id}' references missing answer '${item.answerId}'.`);
  }
  for (const item of spec.answers ?? []) {
    if (!exerciseIds.has(item.exerciseId)) add("error", file, `Answer '${item.id}' references missing exercise '${item.exerciseId}'.`);
  }
}

async function validateMdx(file, knownCitationIds) {
  const raw = await fs.readFile(file, "utf8");
  const { body } = stripFrontmatter(raw);

  try {
    await compile(body, {
      jsx: true,
      remarkPlugins: [remarkGfm],
      development: false,
    });
  } catch (error) {
    add("error", file, `MDX compilation failed: ${error.message}`);
  }

  const links = [
    ...findAll(/\]\(([^)]+)\)/g, body).map((match) => match[1]),
    ...findAll(/href=["']([^"']+)["']/g, body).map((match) => match[1]),
    ...findAll(/src=["']([^"']+)["']/g, body).map((match) => match[1]),
  ];

  for (const link of links) {
    if (link.startsWith("http://") || link.startsWith("https://") || link.startsWith("#") || link.startsWith("data:")) {
      try {
        new URL(link, "https://example.com");
      } catch {
        add("error", file, `Invalid URL '${link}'.`);
      }
      continue;
    }
    const localTarget = path.join(root, link.replace(/^\//, ""));
    if (!(await exists(localTarget))) add("error", file, `Broken local link or asset '${link}'.`);
  }

  for (const match of findAll(/<Citation[^>]*\sid=["']([^"']+)["'][^>]*>/g, body)) {
    if (!knownCitationIds.has(match[1])) add("error", file, `Citation id '${match[1]}' is not declared in tutorial references.`);
  }

  for (const match of findAll(/<img\b[^>]*>/g, body)) {
    if (!/\salt=["'][^"']+["']/.test(match[0])) add("error", file, "Image is missing non-empty alt text.");
  }

  for (const match of findAll(/<iframe\b[^>]*>/g, body)) {
    if (!/\stitle=["'][^"']+["']/.test(match[0])) add("error", file, "Embedded frame is missing a title.");
  }

  for (const match of findAll(/<Diagram\b/g, body)) {
    const nextComponent = body.slice(match.index + 1).search(/\n\s*<[A-Z/]/);
    const end = nextComponent === -1 ? body.length : match.index + 1 + nextComponent;
    const componentSource = body.slice(match.index, end);
    if (!/\sfallback=/.test(componentSource)) add("error", file, "Diagram is missing fallback text.");
  }

  const riskyClaimPattern = /\b(best|most popular|guaranteed|always|never|latest)\b/i;
  const verifyBlocks = findAll(/<VerifyClaim[\s\S]*?<\/VerifyClaim>/g, body).map((match) => match[0]);
  const bodyWithoutVerifyBlocks = verifyBlocks.reduce((text, block) => text.replace(block, ""), body);
  if (riskyClaimPattern.test(bodyWithoutVerifyBlocks)) {
    add("warning", file, "Potential unsupported claim outside VerifyClaim.");
  }

  const paragraphs = body
    .split(/\n{2,}/)
    .map((item) => item.trim().replace(/\s+/g, " "))
    .filter((item) => item.length > 80 && !item.startsWith("```"));
  const seen = new Set();
  for (const paragraph of paragraphs) {
    if (seen.has(paragraph)) add("warning", file, "Duplicate paragraph content detected.");
    seen.add(paragraph);
  }
}

async function main() {
  const specFiles = await listFiles(path.join(contentDir, "tutorials"), (file) => file.endsWith(".json"));
  const citationIds = new Set();
  for (const file of specFiles) {
    const spec = JSON.parse(await fs.readFile(file, "utf8"));
    validateTutorialSpec(file, spec);
    for (const ref of spec.references ?? []) citationIds.add(ref.id);
  }

  const mdxFiles = await listFiles(contentDir, (file) => file.endsWith(".mdx"));
  for (const file of mdxFiles) await validateMdx(file, citationIds);

  for (const warning of warnings) console.warn(`warning ${warning}`);
  for (const error of errors) console.error(`error ${error}`);

  if (errors.length > 0) {
    console.error(`Validation failed with ${errors.length} error(s) and ${warnings.length} warning(s).`);
    process.exit(1);
  }

  console.log(`Validation passed for ${specFiles.length} tutorial spec(s) and ${mdxFiles.length} MDX file(s).`);
  if (warnings.length > 0) console.log(`${warnings.length} warning(s) reported.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
