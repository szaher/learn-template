import { spawn } from "child_process";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_FORMATS = ["both", "markdown", "notebook"] as const;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { module: moduleId, format = "both" } = body as Record<string, unknown>;

  if (typeof format !== "string" || !VALID_FORMATS.includes(format as typeof VALID_FORMATS[number])) {
    return new Response(JSON.stringify({ error: `Invalid format. Must be one of: ${VALID_FORMATS.join(", ")}` }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (moduleId !== undefined && (typeof moduleId !== "number" || !Number.isInteger(moduleId) || moduleId < 1)) {
    return new Response(JSON.stringify({ error: "Module must be a positive integer" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const args = ["scripts/export.py"];

  if (moduleId) {
    args.push("--module", String(moduleId));
  }
  args.push("--format", format);

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const proc = spawn("python3", args, {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  });

  request.signal.addEventListener("abort", () => {
    proc.kill();
  });

  (async () => {
    let stderrOutput = "";

    if (proc.stderr) {
      proc.stderr.on("data", (chunk: Buffer) => {
        stderrOutput += chunk.toString();
      });
    }

    try {
      if (proc.stdout) {
        for await (const chunk of proc.stdout) {
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ message: chunk.toString() })}\n\n`)
          );
        }
      }

      const exitCode = await new Promise<number | null>((resolve) => {
        proc.on("close", resolve);
      });

      if (exitCode !== 0) {
        const errorMsg = stderrOutput.trim() || `Export process exited with code ${exitCode}`;
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`)
        );
      } else {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ status: "done" })}\n\n`));
      }
    } catch (err) {
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`)
      );
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
