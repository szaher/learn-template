"use client";

import React, { useEffect, useId, useState } from "react";

interface MermaidModule {
  default: {
    initialize: (config: Record<string, unknown>) => void;
    render: (id: string, chart: string) => Promise<{ svg: string }>;
  };
}

let mermaidMod: MermaidModule | null = null;
let mermaidReady: Promise<void> | null = null;

function loadMermaid() {
  if (!mermaidReady) {
    mermaidReady = import("mermaid").then((mod) => {
      mermaidMod = mod;
      mod.default.initialize({
        startOnLoad: false,
        theme: "dark",
        themeVariables: {
          primaryColor: "#242734",
          primaryTextColor: "#e0e0e0",
          primaryBorderColor: "#63b3ed",
          lineColor: "#a0aec0",
          secondaryColor: "#1a1d27",
          tertiaryColor: "#0f1117",
        },
      });
    });
  }
  return mermaidReady;
}

interface MermaidDiagramProps {
  chart?: string;
  fallback?: string;
  children?: React.ReactNode;
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return extractText(node.props.children);
  }
  return "";
}

export default function MermaidDiagram({ chart, fallback, children }: MermaidDiagramProps) {
  const chartText = chart || extractText(children) || "";
  const id = useId().replace(/:/g, "-");
  const [svgHtml, setSvgHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!chartText) return;
    let cancelled = false;

    const renderDiagram = async () => {
      try {
        await loadMermaid();
        const { svg } = await mermaidMod?.default.render(`mermaid-${id}`, chartText) ?? { svg: "" };
        if (!cancelled) setSvgHtml(svg);
      } catch {
        if (!cancelled) setFailed(true);
      }
    };

    renderDiagram();
    return () => { cancelled = true; };
  }, [chartText, id]);

  return (
    <div className="my-6 p-4 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border)] overflow-x-auto">
      {svgHtml ? (
        <div className="mermaid flex justify-center" dangerouslySetInnerHTML={{ __html: svgHtml }} />
      ) : failed ? (
        <pre className="mermaid whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
          {fallback || chartText}
        </pre>
      ) : (
        <div className="mermaid flex justify-center">
          <pre className="whitespace-pre-wrap text-sm text-[var(--text-secondary)]">
            {fallback || chartText || "Loading diagram..."}
          </pre>
        </div>
      )}
    </div>
  );
}
