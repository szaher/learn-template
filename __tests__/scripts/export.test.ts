import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const fixtureDir = path.join(__dirname, "fixtures");
const fixtureMdx = fs.readFileSync(path.join(fixtureDir, "export-sample.mdx"), "utf8");
const expectedMarkdown = fs.readFileSync(path.join(fixtureDir, "export-expected.md"), "utf8");

async function loadExport() {
  return import("../../scripts/export.mjs") as Promise<{
    convertMdxToMarkdown: (mdx: string) => Promise<{ markdown: string; unknownComponents: string[] }>;
    convertMdxToNotebook: (
      mdx: string,
      meta: { title?: string; description?: string },
    ) => Promise<{
      notebook: { nbformat: number; cells: Array<{ cell_type: string; source: string[] }> };
      unknownComponents: string[];
    }>;
  }>;
}

describe("MDX export pipeline", () => {
  describe("convertMdxToMarkdown", () => {
    it("converts MermaidDiagram with template-literal chart prop", async () => {
      const { convertMdxToMarkdown } = await loadExport();
      const { markdown } = await convertMdxToMarkdown(fixtureMdx);
      expect(markdown).toContain("```mermaid\ngraph TD");
      expect(markdown).toContain("A[Start] --> B[End]");
      expect(markdown).toContain("C -->|yes| D[Accept]");
    });

    it("converts CodeBlock with special characters", async () => {
      const { convertMdxToMarkdown } = await loadExport();
      const { markdown } = await convertMdxToMarkdown(fixtureMdx);
      expect(markdown).toContain("```python\ndef compare(a, b):");
      expect(markdown).toContain("if a > b:");
      expect(markdown).toContain("**compare.py**");
    });

    it("handles nested components (Citation inside Callout)", async () => {
      const { convertMdxToMarkdown } = await loadExport();
      const { markdown } = await convertMdxToMarkdown(fixtureMdx);
      expect(markdown).toContain("**Important note**");
      expect(markdown).toContain("[cited source](https://example.com)");
    });

    it("converts LearningObjectives to bulleted list", async () => {
      const { convertMdxToMarkdown } = await loadExport();
      const { markdown } = await convertMdxToMarkdown(fixtureMdx);
      expect(markdown).toContain("**Learning Objectives**");
      expect(markdown).toContain("- Understand export pipeline.");
    });

    it("converts Prerequisites to bulleted list", async () => {
      const { convertMdxToMarkdown } = await loadExport();
      const { markdown } = await convertMdxToMarkdown(fixtureMdx);
      expect(markdown).toContain("**Prerequisites**");
      expect(markdown).toContain("- Node.js installed");
    });

    it("converts KeyTerms to definition list", async () => {
      const { convertMdxToMarkdown } = await loadExport();
      const { markdown } = await convertMdxToMarkdown(fixtureMdx);
      expect(markdown).toContain("**AST**: Abstract Syntax Tree");
    });

    it("converts VerifyClaim with status label", async () => {
      const { convertMdxToMarkdown } = await loadExport();
      const { markdown } = await convertMdxToMarkdown(fixtureMdx);
      expect(markdown).toContain("[VERIFY]");
      expect(markdown).toContain("This claim needs source review.");
    });

    it("converts Warning to blockquote", async () => {
      const { convertMdxToMarkdown } = await loadExport();
      const { markdown } = await convertMdxToMarkdown(fixtureMdx);
      expect(markdown).toContain("**Warning:**");
      expect(markdown).toContain("Do not skip validation.");
    });

    it("converts Flashcards", async () => {
      const { convertMdxToMarkdown } = await loadExport();
      const { markdown } = await convertMdxToMarkdown(fixtureMdx);
      expect(markdown).toContain("**Q:** What is MDX?");
      expect(markdown).toContain("**A:** Markdown with JSX components.");
    });

    it("converts WorkedExample with numbered steps", async () => {
      const { convertMdxToMarkdown } = await loadExport();
      const { markdown } = await convertMdxToMarkdown(fixtureMdx);
      expect(markdown).toContain("**Worked Example: Parse MDX**");
      expect(markdown).toContain("1. Read the file.");
      expect(markdown).toContain("2. Parse with remark-mdx.");
    });

    it("converts Exercise with collapsible answer", async () => {
      const { convertMdxToMarkdown } = await loadExport();
      const { markdown } = await convertMdxToMarkdown(fixtureMdx);
      expect(markdown).toContain("**Exercise: Write a transformer**");
      expect(markdown).toContain("<details><summary>Answer</summary>");
      expect(markdown).toContain("Use the visitor pattern");
    });

    it("converts QuizBlock with choices", async () => {
      const { convertMdxToMarkdown } = await loadExport();
      const { markdown } = await convertMdxToMarkdown(fixtureMdx);
      expect(markdown).toContain("Which parser handles MDX?");
      expect(markdown).toContain("- [ ] remark-mdx");
    });

    it("preserves standard markdown elements", async () => {
      const { convertMdxToMarkdown } = await loadExport();
      const { markdown } = await convertMdxToMarkdown(fixtureMdx);
      expect(markdown).toContain("**bold**");
      expect(markdown).toContain("*italic*");
      expect(markdown).toContain("`inline code`");
      expect(markdown).toContain("> A blockquote with");
      expect(markdown).toContain("| Column A");
    });

    it("reports unknown components instead of silently dropping them", async () => {
      const { convertMdxToMarkdown } = await loadExport();
      const { markdown, unknownComponents } = await convertMdxToMarkdown(fixtureMdx);
      expect(unknownComponents).toContain("CustomWidget");
      expect(markdown).toContain("<!-- EXPORT: unsupported component <CustomWidget> -->");
    });

    it("strips frontmatter", async () => {
      const { convertMdxToMarkdown } = await loadExport();
      const { markdown } = await convertMdxToMarkdown(fixtureMdx);
      expect(markdown).not.toContain("correctIndex");
      expect(markdown).not.toContain("quiz:");
    });

    it("converts Diagram with fallback and caption", async () => {
      const { convertMdxToMarkdown } = await loadExport();
      const { markdown } = await convertMdxToMarkdown(fixtureMdx);
      expect(markdown).toContain("X connects to Y.");
      expect(markdown).toContain("*Simple flow.*");
    });
  });

  describe("convertMdxToNotebook", () => {
    it("produces a valid notebook structure", async () => {
      const { convertMdxToNotebook } = await loadExport();
      const { notebook } = await convertMdxToNotebook(fixtureMdx, {
        title: "Test",
        description: "A test notebook",
      });
      expect(notebook.nbformat).toBe(4);
      expect(notebook.metadata.kernelspec.name).toBe("python3");
      expect(notebook.cells.length).toBeGreaterThan(0);
    });

    it("creates code cells for Python blocks", async () => {
      const { convertMdxToNotebook } = await loadExport();
      const { notebook } = await convertMdxToNotebook(fixtureMdx, { title: "Test" });
      const codeCells = notebook.cells.filter((c) => c.cell_type === "code");
      expect(codeCells.length).toBeGreaterThan(0);
      expect(codeCells[0].source.join("")).toContain("def compare");
    });

    it("creates markdown cells for Mermaid blocks", async () => {
      const { convertMdxToNotebook } = await loadExport();
      const { notebook } = await convertMdxToNotebook(fixtureMdx, { title: "Test" });
      const mermaidCells = notebook.cells.filter(
        (c) => c.cell_type === "markdown" && c.source.join("").includes("```mermaid"),
      );
      expect(mermaidCells.length).toBeGreaterThan(0);
    });

    it("includes title cell", async () => {
      const { convertMdxToNotebook } = await loadExport();
      const { notebook } = await convertMdxToNotebook(fixtureMdx, {
        title: "Golden File Test",
        description: "Testing the pipeline",
      });
      const firstCell = notebook.cells[0];
      expect(firstCell.cell_type).toBe("markdown");
      expect(firstCell.source.join("")).toContain("# Golden File Test");
    });

    it("reports unknown components", async () => {
      const { convertMdxToNotebook } = await loadExport();
      const { unknownComponents } = await convertMdxToNotebook(fixtureMdx, { title: "Test" });
      expect(unknownComponents).toContain("CustomWidget");
    });
  });

  describe("golden-file comparison", () => {
    it("matches expected markdown output", async () => {
      const { convertMdxToMarkdown } = await loadExport();
      const { markdown } = await convertMdxToMarkdown(fixtureMdx);
      expect(markdown.trim()).toBe(expectedMarkdown.trim());
    });
  });

  describe("expression parser rejects unsafe inputs", () => {
    it("rejects function calls in attribute expressions", async () => {
      const { convertMdxToMarkdown } = await loadExport();
      const malicious = `<LearningObjectives items={alert("xss")} />`;
      const { markdown } = await convertMdxToMarkdown(malicious);
      expect(markdown).not.toContain("xss");
    });

    it("does not execute require/import calls", async () => {
      const { convertMdxToMarkdown } = await loadExport();
      const malicious = `<LearningObjectives items={[require("child_process").execSync("id")]} />`;
      const { markdown } = await convertMdxToMarkdown(malicious);
      expect(markdown).toBe("");
    });

    it("rejects template interpolation in structured data", async () => {
      const { convertMdxToMarkdown } = await loadExport();
      const mdx = '<LearningObjectives items={[`hello ${process.env.SECRET}`]} />';
      const { markdown } = await convertMdxToMarkdown(mdx);
      expect(markdown).toBe("");
    });

    it("rejects member access expressions", async () => {
      const { convertMdxToMarkdown } = await loadExport();
      const mdx = `<LearningObjectives items={globalThis.constructor("return this")()} />`;
      const { markdown } = await convertMdxToMarkdown(mdx);
      expect(markdown).toBe("");
    });

    it("rejects spread operator", async () => {
      const { convertMdxToMarkdown } = await loadExport();
      const mdx = `<LearningObjectives items={[...dangerousArray]} />`;
      const { markdown } = await convertMdxToMarkdown(mdx);
      expect(markdown).toBe("");
    });

    it("handles safe literal arrays correctly", async () => {
      const { convertMdxToMarkdown } = await loadExport();
      const mdx = `<LearningObjectives items={["item one", "item two"]} />`;
      const { markdown } = await convertMdxToMarkdown(mdx);
      expect(markdown).toContain("- item one");
      expect(markdown).toContain("- item two");
    });

    it("handles safe literal objects correctly", async () => {
      const { convertMdxToMarkdown } = await loadExport();
      const mdx = `<KeyTerms terms={[{ term: "AST", definition: "Abstract Syntax Tree" }]} />`;
      const { markdown } = await convertMdxToMarkdown(mdx);
      expect(markdown).toContain("**AST**: Abstract Syntax Tree");
    });
  });
});
