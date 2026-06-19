import { describe, expect, it } from "vitest";
import { getCurriculum, getModuleMeta, getLessonPath } from "@/lib/curriculum";

describe("getCurriculum", () => {
  it("returns the sample module", async () => {
    const curriculum = await getCurriculum();
    expect(curriculum.modules).toHaveLength(1);
  });

  it("module 1 has 2 lessons", async () => {
    const curriculum = await getCurriculum();
    expect(curriculum.modules[0].lessons).toHaveLength(2);
  });

  it("module IDs are sequential starting at 1", async () => {
    const curriculum = await getCurriculum();
    const ids = curriculum.modules.map((m) => m.id);
    expect(ids).toEqual([1]);
  });
});

describe("getModuleMeta", () => {
  it("returns module by ID", async () => {
    const mod = await getModuleMeta(1);
    expect(mod?.title).toBe("Getting Started");
  });

  it("returns undefined for invalid ID", async () => {
    const mod = await getModuleMeta(99);
    expect(mod).toBeUndefined();
  });
});

describe("getLessonPath", () => {
  it("returns correct MDX path", () => {
    const p = getLessonPath(1, "01-sample-lesson");
    expect(p).toContain("content/module-1/01-sample-lesson.mdx");
  });
});
