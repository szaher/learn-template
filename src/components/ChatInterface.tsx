"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ChatMessage as ChatMessageType } from "@/types";
import ChatMessage from "./ChatMessage";
import { academy, storageKeys } from "../../academy.config";

interface ChatInterfaceProps {
  initialContext?: {
    moduleTitle?: string;
    lessonTitle?: string;
  };
}

const MAX_PERSISTED_MESSAGES = 200;

function loadHistory(): ChatMessageType[] {
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(storageKeys.chat);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveHistory(messages: ChatMessageType[]) {
  const trimmed = messages.slice(-MAX_PERSISTED_MESSAGES);
  try {
    localStorage.setItem(storageKeys.chat, JSON.stringify(trimmed));
  } catch {
    // QuotaExceededError — silently drop
  }
}

export default function ChatInterface({ initialContext }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const messagesRef = useRef(messages);
  const abortRef = useRef<AbortController | null>(null);
  messagesRef.current = messages;

  useEffect(() => {
    setMessages(loadHistory());
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottom.current = distanceFromBottom < 80;
  }, []);

  useLayoutEffect(() => {
    if (stickToBottom.current) {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (msgText: string) => {
      if (!msgText.trim() || streaming) return;

      const userMsg: ChatMessageType = {
        id: crypto.randomUUID(),
        role: "user",
        content: msgText.trim(),
        timestamp: new Date().toISOString(),
      };

      const assistantMsg: ChatMessageType = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };

      const history = messagesRef.current.slice(-10);
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: msgText.trim(),
            context: {
              ...initialContext,
              history,
            },
          }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error("Chat request failed");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const chunk = JSON.parse(data);
                if (typeof chunk === "string") {
                  fullContent += chunk;
                } else if (chunk && typeof chunk === "object" && "error" in chunk) {
                  fullContent += `\n\nError: ${chunk.error}`;
                }
                setMessages((prev) => {
                  const copy = [...prev];
                  copy[copy.length - 1] = {
                    ...copy[copy.length - 1],
                    content: fullContent,
                  };
                  return copy;
                });
              } catch {
                // skip malformed chunks
              }
            }
          }
        }

        setMessages((prev) => {
          saveHistory(prev);
          return prev;
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            ...copy[copy.length - 1],
            content: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
          };
          return copy;
        });
      } finally {
        abortRef.current = null;
        setStreaming(false);
      }
    },
    [streaming, initialContext]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
            <div className="text-center">
              <p className="text-lg mb-2">{academy.tutor.chatWelcome}</p>
              <p className="text-sm">{academy.tutor.chatSubtext}</p>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
        ))}
      </div>

      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex items-center gap-2 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] px-4 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={academy.tutor.chatPlaceholder}
            className="flex-1 bg-transparent outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
            disabled={streaming}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            aria-busy={streaming}
            aria-label={streaming ? "Waiting for response" : "Send message"}
            className="px-3 py-1.5 text-sm rounded-lg bg-[var(--accent-blue)] text-white disabled:opacity-40 hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-secondary)]"
          >
            {streaming ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
