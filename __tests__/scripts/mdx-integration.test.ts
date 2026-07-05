import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { compile } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";

const contentDir = path.join(__dirname, "..", "..", "content");

function listMdxFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listMdxFiles(full));
    else if (entry.name.endsWith(".mdx")) files.push(full);
  }
  return files;
}

function stripFrontmatter(raw: string): string {
  if (!raw.startsWith("---")) return raw;
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return raw;
  return raw.slice(end + 4).trimStart();
}

const mdxFiles = listMdxFiles(contentDir);

describe("MDX integration — sample lessons compile", () => {
  it.each(mdxFiles.map((f) => [path.relative(contentDir, f), f]))(
    "%s compiles without errors",
    async (_label, filePath) => {
      const raw = fs.readFileSync(filePath as string, "utf8");
      const body = stripFrontmatter(raw);

      await expect(
        compile(body, {
          jsx: true,
          remarkPlugins: [remarkGfm],
          development: false,
        }),
      ).resolves.toBeDefined();
    },
  );

  it("sample lesson contains expression props that survive compilation", async () => {
    const samplePath = path.join(contentDir, "module-1", "01-sample-lesson.mdx");
    if (!fs.existsSync(samplePath)) return;

    const raw = fs.readFileSync(samplePath, "utf8");
    const body = stripFrontmatter(raw);

    const result = await compile(body, {
      jsx: true,
      remarkPlugins: [remarkGfm],
      development: false,
    });

    const code = String(result);
    expect(code).toContain("LearningObjectives");
    expect(code).toContain("KeyTerms");
    expect(code).toContain("MermaidDiagram");
    expect(code).toContain("Flashcards");
    expect(code).toContain("QuizBlock");
  });
});
