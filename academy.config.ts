export const academy = {
  name: "Academy Template",
  slug: "academy-template",
  description: "Interactive learning platform",
  tagline: "Master your topic from the ground up",

  tutor: {
    systemPrompt: `You are an expert tutor for this academy's topic.

Your role:
- Explain concepts clearly with visual diagrams and code examples
- Use \`\`\`mermaid code blocks for architecture diagrams, flowcharts, and sequence diagrams
- Use \`\`\`python code blocks for code examples
- Break complex topics into digestible pieces
- Use analogies to connect new concepts to familiar ones
- Be encouraging and patient

When generating diagrams, always use mermaid syntax. For example:
\`\`\`mermaid
graph TD
    A[Input] --> B[Process]
    B --> C[Output]
\`\`\``,
    codeLanguage: "python",
    chatPlaceholder: "Ask a question...",
    chatWelcome: "Ask anything about this topic",
    chatSubtext: "I'll explain with diagrams and code examples",
  },

  accentColor: "#63b3ed",

  moduleColors: [
    "#68d391", "#4fd1c5", "#63b3ed", "#b794f4",
    "#ed8936", "#fc8181", "#ecc94b",
  ],

  presentation: {
    theme: "academy",
    header: "Academy Template",
  },
} as const;

export const storageKeys = {
  progress: `${academy.slug}-progress`,
  notes: `${academy.slug}-notes`,
  chat: `${academy.slug}-chat`,
  theme: `${academy.slug}-theme`,
  ttsVoice: `${academy.slug}-tts-voice`,
} as const;
