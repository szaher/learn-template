import fs from "fs/promises";
import path from "path";
import type { CurriculumData, ModuleMeta } from "@/types";

const CONTENT_DIR = path.join(process.cwd(), "content");

let cachedCurriculum: CurriculumData | null = null;

export async function getCurriculum(): Promise<CurriculumData> {
  if (cachedCurriculum) return cachedCurriculum;

  const entries = await fs.readdir(CONTENT_DIR);
  const moduleDirs = entries
    .filter((e) => e.startsWith("module-"))
    .sort((a, b) => {
      const numA = parseInt(a.split("-")[1]);
      const numB = parseInt(b.split("-")[1]);
      return numA - numB;
    });

  const modules: ModuleMeta[] = [];
  for (const dir of moduleDirs) {
    const metaPath = path.join(CONTENT_DIR, dir, "meta.json");
    try {
      const raw = await fs.readFile(metaPath, "utf-8");
      modules.push(JSON.parse(raw) as ModuleMeta);
    } catch {
      // Skip modules with missing or invalid meta.json
    }
  }

  cachedCurriculum = { modules };
  return cachedCurriculum;
}

export async function getModuleMeta(moduleId: number): Promise<ModuleMeta | undefined> {
  const curriculum = await getCurriculum();
  return curriculum.modules.find((m) => m.id === moduleId);
}

export function getLessonPath(moduleId: number, lessonSlug: string): string {
  return path.join(CONTENT_DIR, `module-${moduleId}`, `${lessonSlug}.mdx`);
}

export async function getLessonContent(moduleId: number, lessonSlug: string): Promise<string | null> {
  const filePath = getLessonPath(moduleId, lessonSlug);
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch (err: unknown) {
    if (err instanceof Error && "code" in err && (err as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw err;
  }
}
