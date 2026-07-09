import { NextRequest } from "next/server";
import { streamClaude } from "@/lib/claude";
import type { ChatMessage } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 10_000;

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

  const { message, context } = body as {
    message?: unknown;
    context?: {
      moduleTitle?: string;
      lessonTitle?: string;
      history?: ChatMessage[];
    };
  };

  if (!message || typeof message !== "string") {
    return new Response(JSON.stringify({ error: "Message required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return new Response(JSON.stringify({ error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { stream, kill } = streamClaude(message, context);

  const encoder = new TextEncoder();
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  request.signal.addEventListener("abort", () => {
    kill();
  });

  (async () => {
    try {
      for await (const chunk of stream) {
        await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      }
      await writer.write(encoder.encode("data: [DONE]\n\n"));
    } catch {
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ error: "An error occurred while processing your request" })}\n\n`)
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
      "X-Accel-Buffering": "no",
    },
  });
}
