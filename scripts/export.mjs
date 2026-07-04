#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkFrontmatter from "remark-frontmatter";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const contentDir = path.join(root, "content");
const exportsDir = path.join(root, "exports");

function log(msg) {
  console.log(msg);
}

async function loadMeta(moduleId) {
  const metaPath = path.join(contentDir, `module-${moduleId}`, "meta.json");
  return JSON.parse(await fs.readFile(metaPath, "utf8"));
}

async function readMdx(moduleId, slug) {
  const mdxPath = path.join(contentDir, `module-${moduleId}`, `${slug}.mdx`);
  try {
    return await fs.readFile(mdxPath, "utf8");
  } catch {
    return null;
  }
}

function stripFrontmatter(content) {
  if (!content.startsWith("---")) return content;
  const end = content.indexOf("---", 3);
  if (end === -1) return content;
  return content.slice(end + 3).trimStart();
}

function getAttr(node, name) {
  if (!node.attributes) return undefined;
  for (const attr of node.attributes) {
    if (attr.name === name) {
      if (attr.type === "mdxJsxAttribute") {
        if (typeof attr.value === "string") return attr.value;
        if (attr.value?.type === "mdxJsxAttributeValueExpression") {
          return extractExpressionValue(attr.value.value);
        }
      }
    }
  }
  return undefined;
}

function extractExpressionValue(raw) {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (trimmed.startsWith("`") && trimmed.endsWith("`")) {
    return trimmed.slice(1, -1);
  }
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1);
  }
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const jsonified = trimmed
        .replace(/(\w+)\s*:/g, '"$1":')
        .replace(/'/g, '"');
      return JSON.parse(jsonified);
    } catch {
      try {
        return new Function(`return (${trimmed})`)();
      } catch {
        return trimmed;
      }
    }
  }
  return trimmed;
}

function extractChildText(node) {
  if (!node.children) return "";
  return node.children
    .map((c) => {
      if (c.type === "text") return c.value;
      if (c.children) return extractChildText(c);
      return "";
    })
    .join("");
}

const COMPONENT_HANDLERS = {
  MermaidDiagram(node) {
    const chart = getAttr(node, "chart");
    if (chart) return `\`\`\`mermaid\n${chart}\n\`\`\``;
    const childText = extractChildText(node);
    if (childText.trim()) return `\`\`\`mermaid\n${childText.trim()}\n\`\`\``;
    return "";
  },

  Diagram(node) {
    const chart = getAttr(node, "chart");
    const fallback = getAttr(node, "fallback");
    const caption = getAttr(node, "caption");
    const parts = [];
    if (chart) parts.push(`\`\`\`mermaid\n${chart}\n\`\`\``);
    if (fallback) parts.push(`> ${fallback}`);
    if (caption) parts.push(`*${caption}*`);
    return parts.join("\n\n") || "";
  },

  CodeBlock(node) {
    const code = getAttr(node, "code");
    const language = getAttr(node, "language") || "python";
    const filename = getAttr(node, "filename");
    const header = filename ? `**${filename}**\n\n` : "";
    if (code) return `${header}\`\`\`${language}\n${code}\n\`\`\``;
    const childText = extractChildText(node);
    if (childText.trim()) return `${header}\`\`\`${language}\n${childText.trim()}\n\`\`\``;
    return "";
  },

  LearningObjectives(node) {
    const items = getAttr(node, "items");
    if (Array.isArray(items)) {
      return `**Learning Objectives**\n\n${items.map((i) => `- ${i}`).join("\n")}`;
    }
    return "";
  },

  Prerequisites(node) {
    const items = getAttr(node, "items");
    if (Array.isArray(items)) {
      return `**Prerequisites**\n\n${items.map((i) => `- ${i}`).join("\n")}`;
    }
    return "";
  },

  KeyTerms(node) {
    const terms = getAttr(node, "terms");
    if (Array.isArray(terms)) {
      return `**Key Terms**\n\n${terms.map((t) => `- **${t.term}**: ${t.definition}`).join("\n")}`;
    }
    return "";
  },

  Callout(node, processChildren) {
    const title = getAttr(node, "title");
    const text = processChildren(node);
    const header = title ? `> **${title}**\n` : "";
    return `${header}> ${text.trim().replace(/\n/g, "\n> ")}`;
  },

  Warning(node, processChildren) {
    const text = processChildren(node);
    return `> **Warning:** ${text.trim().replace(/\n/g, "\n> ")}`;
  },

  VerifyClaim(node, processChildren) {
    const status = getAttr(node, "status") || "verify";
    const text = processChildren(node);
    return `> **[${status.toUpperCase()}]** ${text.trim().replace(/\n/g, "\n> ")}`;
  },

  Citation(node, processChildren) {
    const href = getAttr(node, "href");
    const text = processChildren(node);
    if (href) return `[${text.trim()}](${href})`;
    return text.trim();
  },

  Flashcards(node) {
    const cards = getAttr(node, "cards");
    if (Array.isArray(cards)) {
      return `**Flashcards**\n\n${cards.map((c) => `- **Q:** ${c.front}\n  **A:** ${c.back}`).join("\n")}`;
    }
    return "";
  },

  WorkedExample(node) {
    const title = getAttr(node, "title");
    const steps = getAttr(node, "steps");
    const text = extractChildText(node);
    const parts = [`**Worked Example: ${title || "Example"}**`];
    if (Array.isArray(steps)) {
      parts.push(steps.map((s, i) => `${i + 1}. ${s}`).join("\n"));
    }
    if (text.trim()) parts.push(text.trim());
    return parts.join("\n\n");
  },

  Exercise(node) {
    const title = getAttr(node, "title");
    const answer = getAttr(node, "answer");
    const text = extractChildText(node);
    const parts = [`**Exercise: ${title || "Practice"}**`, text.trim()];
    if (answer) parts.push(`<details><summary>Answer</summary>\n\n${answer}\n\n</details>`);
    return parts.join("\n\n");
  },

  QuizBlock(node) {
    const questions = getAttr(node, "questions");
    if (Array.isArray(questions)) {
      return questions
        .map((q, i) => {
          const lines = [`**Quiz Question ${i + 1}:** ${q.prompt}`];
          if (Array.isArray(q.choices)) {
            lines.push(q.choices.map((c) => `- [ ] ${c}`).join("\n"));
          }
          if (q.answer) lines.push(`<details><summary>Answer</summary>\n\n${q.answer}\n\n</details>`);
          return lines.join("\n\n");
        })
        .join("\n\n");
    }
    return "";
  },

  DataTable(node) {
    return extractChildText(node);
  },

  NarrationHook() {
    return "";
  },

  MindMap(node) {
    return extractChildText(node) || "";
  },

  Infographic(node) {
    return extractChildText(node) || "";
  },

  SlideEmbed(node) {
    const title = getAttr(node, "title");
    const src = getAttr(node, "src");
    if (src) return `[${title || "Slides"}](${src})`;
    return "";
  },

  SourceQualityLabel(node) {
    return extractChildText(node);
  },
};

function mdxAstToMarkdown(tree) {
  const unknownComponents = [];

  function processChildren(node) {
    if (!node.children) return "";
    return node.children.map(processNode).filter(Boolean).join("");
  }

  function processNode(node) {
    if (!node) return "";

    switch (node.type) {
      case "root":
        return node.children.map(processNode).filter(Boolean).join("\n\n");

      case "heading": {
        const prefix = "#".repeat(node.depth);
        const text = node.children.map(processNode).join("");
        return `${prefix} ${text}`;
      }

      case "paragraph":
        return node.children.map(processNode).join("");

      case "text":
        return node.value;

      case "strong":
        return `**${node.children.map(processNode).join("")}**`;

      case "emphasis":
        return `*${node.children.map(processNode).join("")}*`;

      case "inlineCode":
        return `\`${node.value}\``;

      case "code":
        return `\`\`\`${node.lang || ""}\n${node.value}\n\`\`\``;

      case "link":
        return `[${node.children.map(processNode).join("")}](${node.url})`;

      case "image":
        return `![${node.alt || ""}](${node.url})`;

      case "list": {
        return node.children
          .map((item, i) => {
            const prefix = node.ordered ? `${i + 1}. ` : "- ";
            const content = item.children
              .map(processNode)
              .join("\n")
              .replace(/\n/g, "\n  ");
            return `${prefix}${content}`;
          })
          .join("\n");
      }

      case "listItem":
        return node.children.map(processNode).join("\n");

      case "blockquote": {
        const content = node.children.map(processNode).join("\n\n");
        return content
          .split("\n")
          .map((l) => `> ${l}`)
          .join("\n");
      }

      case "table": {
        if (!node.children?.length) return "";
        const rows = node.children.map((row) =>
          row.children.map((cell) => cell.children.map(processNode).join(""))
        );
        const widths = rows[0].map((_, ci) =>
          Math.max(...rows.map((r) => (r[ci] || "").length), 3)
        );
        const header = `| ${rows[0].map((c, i) => c.padEnd(widths[i])).join(" | ")} |`;
        const sep = `| ${widths.map((w) => "-".repeat(w)).join(" | ")} |`;
        const body = rows
          .slice(1)
          .map((r) => `| ${r.map((c, i) => (c || "").padEnd(widths[i])).join(" | ")} |`)
          .join("\n");
        return `${header}\n${sep}\n${body}`;
      }

      case "thematicBreak":
        return "---";

      case "html":
        return node.value;

      case "break":
        return "\n";

      case "mdxJsxFlowElement":
      case "mdxJsxTextElement": {
        const name = node.name;
        if (!name) return node.children?.map(processNode).join("") || "";

        const handler = COMPONENT_HANDLERS[name];
        if (handler) return handler(node, processChildren);

        unknownComponents.push(name);
        return `<!-- EXPORT: unsupported component <${name}> -->`;
      }

      case "mdxFlowExpression":
      case "mdxTextExpression":
        return "";

      case "yaml":
        return "";

      default:
        if (node.children) return node.children.map(processNode).join("");
        if (node.value) return node.value;
        return "";
    }
  }

  const markdown = processNode(tree);
  return { markdown, unknownComponents };
}

function markdownToNotebookCells(markdown, meta) {
  const cells = [];
  cells.push({
    cell_type: "markdown",
    metadata: {},
    source: [`# ${meta.title || "Lesson"}\n`, `\n`, `${meta.description || ""}`],
  });

  const codeBlockPattern = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockPattern.exec(markdown)) !== null) {
    const before = markdown.slice(lastIndex, match.index).trim();
    if (before) {
      cells.push({
        cell_type: "markdown",
        metadata: {},
        source: before.split("\n").map((l, i, arr) => (i < arr.length - 1 ? l + "\n" : l)),
      });
    }

    const lang = match[1];
    const code = match[2].trim();

    if (lang === "python") {
      cells.push({
        cell_type: "code",
        metadata: {},
        source: code.split("\n").map((l, i, arr) => (i < arr.length - 1 ? l + "\n" : l)),
        outputs: [],
        execution_count: null,
      });
    } else {
      cells.push({
        cell_type: "markdown",
        metadata: {},
        source: [`\`\`\`${lang}\n`, ...code.split("\n").map((l) => l + "\n"), "```"],
      });
    }

    lastIndex = match.index + match[0].length;
  }

  const remaining = markdown.slice(lastIndex).trim();
  if (remaining) {
    cells.push({
      cell_type: "markdown",
      metadata: {},
      source: remaining.split("\n").map((l, i, arr) => (i < arr.length - 1 ? l + "\n" : l)),
    });
  }

  return {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: { display_name: "Python 3", language: "python", name: "python3" },
    },
    cells,
  };
}

const parser = unified().use(remarkParse).use(remarkMdx).use(remarkFrontmatter, ["yaml"]);

export async function convertMdxToMarkdown(mdxContent) {
  const body = stripFrontmatter(mdxContent);
  const tree = parser.parse(body);
  return mdxAstToMarkdown(tree);
}

export async function convertMdxToNotebook(mdxContent, meta) {
  const { markdown, unknownComponents } = await convertMdxToMarkdown(mdxContent);
  const notebook = markdownToNotebookCells(markdown, meta);
  return { notebook, unknownComponents };
}

async function exportLesson(moduleId, lessonMeta, fmt) {
  const slug = lessonMeta.slug;
  const raw = await readMdx(moduleId, slug);
  if (raw === null) {
    log(`  Skipping ${slug} (no MDX file)`);
    return [];
  }

  const files = [];
  const mdDir = path.join(exportsDir, "markdown", `module-${moduleId}`);
  const nbDir = path.join(exportsDir, "notebooks", `module-${moduleId}`);

  const { markdown, unknownComponents } = await convertMdxToMarkdown(raw);

  if (unknownComponents.length > 0) {
    console.warn(`  Warning: unsupported components in ${slug}: ${unknownComponents.join(", ")}`);
  }

  if (fmt === "markdown" || fmt === "both") {
    await fs.mkdir(mdDir, { recursive: true });
    const mdPath = path.join(mdDir, `${slug}.md`);
    await fs.writeFile(mdPath, `# ${lessonMeta.title}\n\n${markdown}\n`);
    files.push(mdPath);
    log(`  Wrote ${path.relative(root, mdPath)}`);
  }

  if (fmt === "notebook" || fmt === "both") {
    await fs.mkdir(nbDir, { recursive: true });
    const { notebook } = await convertMdxToNotebook(raw, lessonMeta);
    const nbPath = path.join(nbDir, `${slug}.ipynb`);
    await fs.writeFile(nbPath, JSON.stringify(notebook, null, 2) + "\n");
    files.push(nbPath);
    log(`  Wrote ${path.relative(root, nbPath)}`);
  }

  return files;
}

async function exportModule(moduleId, fmt) {
  const meta = await loadMeta(moduleId);
  log(`Exporting Module ${moduleId}: ${meta.title}`);
  const allFiles = [];
  for (const lesson of meta.lessons) {
    allFiles.push(...(await exportLesson(moduleId, lesson, fmt)));
  }
  return allFiles;
}

async function main() {
  const args = process.argv.slice(2);
  let moduleId = null;
  let fmt = "both";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--module" && args[i + 1]) {
      moduleId = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--format" && args[i + 1]) {
      fmt = args[i + 1];
      i++;
    }
  }

  if (fmt !== "markdown" && fmt !== "notebook" && fmt !== "both") {
    console.error("--format must be one of: markdown, notebook, both");
    process.exit(1);
  }

  const allFiles = [];

  if (moduleId) {
    allFiles.push(...(await exportModule(moduleId, fmt)));
  } else {
    const entries = await fs.readdir(contentDir, { withFileTypes: true });
    const moduleDirs = entries
      .filter((e) => e.isDirectory() && e.name.startsWith("module-"))
      .sort((a, b) => {
        const aNum = parseInt(a.name.split("-")[1], 10);
        const bNum = parseInt(b.name.split("-")[1], 10);
        return aNum - bNum;
      });

    for (const dir of moduleDirs) {
      const id = parseInt(dir.name.split("-")[1], 10);
      allFiles.push(...(await exportModule(id, fmt)));
    }
  }

  log(`\nDone: ${allFiles.length} files written`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
