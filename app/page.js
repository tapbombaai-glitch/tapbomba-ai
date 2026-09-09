Here is the complete, working source code for the BOMBA AI Universal App Builder.
Copy every file into your GitHub repository using the exact paths shown.
Complete folder structure
bomba-ai/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts
│   ├── layout.tsx
│   └── page.js
├── .env.example
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
1. package.json
{
  "name": "bomba-ai",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.5",
    "openai": "^4.52.7",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.14.10",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.5.3"
  }
}
2. next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
3. tsconfig.json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", "**/*.js", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
4. .gitignore
# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env
.env*.local
.env.local
.env.development.local
.env.test.local
.env.production.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
5. .env.example
# Copy this file to .env.local and fill in your key.
# NEVER commit .env.local or real keys to GitHub.

OPENAI_API_KEY=sk-your-openai-api-key-here
6. app/layout.tsx
export const metadata = {
  title: "BOMBA AI — Automate. Grow. Earn.",
  description:
    "Universal AI App Builder and Content Creator. Describe any app in plain language and get a live interactive preview you can modify and export.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#000", color: "#fff" }}>
        {children}
      </body>
    </html>
  );
}
7. app/api/chat/route.ts
// app/api/chat/route.ts
// Server-side only. OPENAI_API_KEY never reaches the browser.

import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not set on the server" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const system =
      typeof body.system === "string" && body.system.trim()
        ? body.system.trim()
        : "You are BOMBA AI, an expert business and app-building assistant. Help users design, build, and improve apps, content, and business ideas. Be creative, practical, helpful, and clear.";

    let messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [{ role: "system", content: system }];

    if (Array.isArray(body.history) && body.history.length > 0) {
      const history = body.history
        .slice(-16)
        .map((m: any) => ({
          role: (m.role === "assistant" ? "assistant" : "user") as
            | "user"
            | "assistant",
          content:
            typeof m.content === "string" ? m.content : String(m.content ?? ""),
        }))
        .filter((m: any) => m.content.trim());

      messages = messages.concat(history);
    } else if (typeof body.message === "string" && body.message.trim()) {
      messages.push({ role: "user", content: body.message.trim() });
    } else if (Array.isArray(body.messages) && body.messages.length > 0) {
      const mapped = body.messages.map((m: any) => ({
        role: (m.role === "assistant" ? "assistant" : "user") as
          | "user"
          | "assistant",
        content:
          typeof m.content === "string" ? m.content : String(m.content ?? ""),
      }));
      messages = messages.concat(mapped);
    } else {
      return NextResponse.json(
        {
          error:
            "Please send { message: string } or { history: array } or { messages: array }",
        },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    });

    const reply =
      response.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a response.";

    return NextResponse.json({
      reply,
      message: reply,
      content: reply,
      output: reply,
    });
  } catch (error: any) {
    console.error("OpenAI error:", error);

    return NextResponse.json(
      {
        error: error?.message || "Failed to generate response",
      },
      { status: 500 }
    );
  }
}
8. app/page.js (main App Builder UI)
"use client";

import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  BOMBA AI — Universal App Builder                                   */
/*  Automate. Grow. Earn.                                              */
/* ------------------------------------------------------------------ */

const BRAND = {
  name: "BOMBA AI",
  tagline: "Automate. Grow. Earn.",
  accent: "#FFD43B",
  accent2: "#FFA500",
};

const MODES = {
  content: {
    name: "Content Creator",
    icon: "✨",
    description: "Posts • Ads • Captions",
    placeholder: "Tell BOMBA AI what content you need...",
    welcome:
      "✨ Content Creator Mode ON\n\nTell me what you want to create. I can help with social media posts, captions, adverts, product descriptions, promotional messages, and business content.",
    system: `You are BOMBA AI Content Creator, a practical AI assistant for Nigerian and African business owners.

Help users create:
- Social media posts
- Captions
- Advertisements
- Product descriptions
- Promotional messages
- Marketing ideas
- Business content

Be practical, clear, persuasive and results-focused.
Use simple English and Nigerian/African context when appropriate.
When useful, give ready-to-copy content rather than long explanations.`,
  },

  app: {
    name: "App Builder",
    icon: "🚀",
    description: "Plan • Build • Preview • Deploy",
    placeholder: "Describe any app you want to build...",
    welcome: `🚀 BOMBA AI App Builder ON

Describe ANY app you want in normal language.

Examples:
• "Build me a food delivery app"
• "Build me a school management system"
• "Build me a hospital appointment app"
• "Build me a real estate listing app"
• "Build me an online store"
• "Build me a booking app"
• "Build me a farming business app"
• "Build me a social media app"

I will:
1. Understand your idea
2. Create a clear App Plan
3. Let you click “Build This App 🚀”
4. Generate a real interactive preview
5. Let you modify it with chat
6. Export / Deploy when ready

What would you like to build?`,
    system: `You are BOMBA AI — Universal App Builder.

Your ONLY job is to help users turn natural-language ideas into real, working applications of ANY type (business, e-commerce, education, healthcare, agriculture, finance, fitness, real estate, booking, delivery, inventory, social, community, events, productivity, dashboards, admin systems, AI-powered apps, personal tools, websites, or completely novel ideas).

CRITICAL RULES:
- NEVER assume the user wants a shoe store or any specific industry unless they say so.
- The user's description is the only source of requirements.
- If information is missing, make sensible assumptions and clearly list them. Do not refuse or ask endless questions.
- Prefer one clarifying question only when absolutely necessary.

=== RESPONSE MODES ===

MODE A — PLAN (default when user describes a new app)
Respond with a clean plan in this exact structure (use markdown):

### App Plan: [App Name]

**Purpose**
[1-2 sentences]

**Target Users**
[who]

**Main Features**
- feature 1
- feature 2
...

**Screens / Pages**
- Home
- ...

**Navigation**
[how screens connect]

**Data Needed**
[entities / localStorage / demo data]

**User Accounts**
[yes/no + details]

**Payments**
[yes/no + method if relevant]

**Admin Features**
[yes/no + list]

**Assumptions**
- assumption 1
- ...

Then end exactly with:
---
Ready to build? Click **Build This App 🚀** below.

MODE B — BUILD CODE (only when the user message or context clearly asks to generate the actual app / "build this app" / generate HTML)
Generate a COMPLETE, self-contained, single-file HTML application that implements the plan as faithfully as possible.

Requirements for the HTML:
- One single .html file (no external frameworks that need build tools).
- Modern, mobile-first, premium UI (CSS variables, flex/grid, nice typography).
- Working navigation between screens (tabs, bottom nav, or side menu).
- Realistic demo data so the user can click around.
- LocalStorage for persistence where useful (cart, orders, profile, etc.).
- Buttons and forms that actually do something (even if simulated).
- Responsive (works in mobile and desktop preview).
- No API keys, no real payment processing, no external secrets.
- Beautiful empty states and simple loading feedback where needed.
- Include a small header with the app name.

Return the full HTML inside a single markdown code block:
\`\`\`html
<!DOCTYPE html>
...
\`\`\`

Do not wrap it in explanations after the code block if possible. You may add a short note before the code block.

MODE C — MODIFY
When the user asks to change something on an existing app (color, add feature, rename, add login, add WhatsApp, etc.):
- You will receive the current HTML in context.
- Return the FULL updated HTML in a \`\`\`html code block.
- Apply only the requested changes while keeping the rest working.

Always be practical, clear, and optimistic. You are building real tools that help people Automate. Grow. Earn.`,
  },
};

export default function Home() {
  const [mode, setMode] = useState("content");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! 👋 I'm BOMBA AI.\n\nChoose Content Creator or App Builder above, then tell me what you want to create.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  // App Builder state
  const [appPlan, setAppPlan] = useState(null);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [previewMode, setPreviewMode] = useState("mobile");
  const [showPreview, setShowPreview] = useState(false);
  const [building, setBuilding] = useState(false);
  const [appName, setAppName] = useState("My App");

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, showPreview]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [message]);

  function switchMode(newMode) {
    if (newMode === mode) return;
    setMode(newMode);
    setMessages([
      {
        role: "assistant",
        content: MODES[newMode].welcome,
      },
    ]);
    setMessage("");
    if (newMode !== "app") {
      setShowPreview(false);
    }
  }

  function extractHtmlFromReply(text) {
    if (!text) return null;
    const match = text.match(/```html\s*([\s\S]*?)```/i);
    if (match && match[1]) return match[1].trim();
    if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
      return text.trim();
    }
    return null;
  }

  function extractAppName(planText) {
    if (!planText) return "My App";
    const m = planText.match(/###\s*App Plan:\s*(.+)/i);
    if (m) return m[1].trim().slice(0, 60);
    const m2 = planText.match(/App:\s*(.+)/i);
    if (m2) return m2[1].trim().slice(0, 60);
    return "My App";
  }

  function isPlanReply(text) {
    if (!text) return false;
    return (
      /###\s*App Plan:/i.test(text) ||
      (/Main Features/i.test(text) &&
        /Screens/i.test(text) &&
        /Build This App/i.test(text))
    );
  }

  async function callAI({ userContent, system, history }) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userContent,
        system,
        history: history || [],
      }),
    });

    const contentType = response.headers.get("content-type") || "";
    if (!response.ok) {
      let errorMessage = `Server returned ${response.status}.`;
      if (contentType.includes("application/json")) {
        const errorData = await response.json().catch(() => null);
        if (errorData?.error) errorMessage = errorData.error;
      }
      throw new Error(errorMessage);
    }
    if (!contentType.includes("application/json")) {
      throw new Error("Unexpected response from /api/chat");
    }
    const data = await response.json();
    if (!data?.reply) throw new Error("Empty AI response");
    return data.reply;
  }

  async function handleSubmit(event) {
    event?.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || loading || building) return;

    const userMessage = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setMessage("");
    setLoading(true);

    try {
      let historyForAI = updatedMessages.slice(-12);
      if (mode === "app" && generatedHtml && showPreview) {
        historyForAI = [
          ...historyForAI.slice(0, -1),
          {
            role: "assistant",
            content:
              "Current working app HTML (for modification):\n```html\n" +
              generatedHtml.slice(0, 12000) +
              "\n```",
          },
          userMessage,
        ];
      }

      const reply = await callAI({
        userContent: trimmed,
        system: MODES[mode].system,
        history: historyForAI,
      });

      if (mode === "app" && isPlanReply(reply)) {
        setAppPlan(reply);
        setAppName(extractAppName(reply));
      }

      const html = extractHtmlFromReply(reply);
      if (html && mode === "app") {
        setGeneratedHtml(html);
        setShowPreview(true);
        setAppName(extractAppName(reply) || appName);
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply },
      ]);
    } catch (error) {
      console.error("BOMBA AI error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ I couldn't connect to the AI server right now.\n\nPlease check your API configuration and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleBuildApp() {
    if (!appPlan || building || loading) return;
    setBuilding(true);
    setLoading(true);

    const buildPrompt = `Build This App 🚀

Using the App Plan below, generate a complete, self-contained, single-file HTML application that implements the plan as faithfully as possible.

Return ONLY the full HTML inside one markdown code block (\`\`\`html ... \`\`\`).

PLAN:
${appPlan}`;

    const userMessage = { role: "user", content: "Build This App 🚀" };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const reply = await callAI({
        userContent: buildPrompt,
        system: MODES.app.system,
        history: [
          { role: "assistant", content: appPlan },
          { role: "user", content: buildPrompt },
        ],
      });

      const html = extractHtmlFromReply(reply);
      if (html) {
        setGeneratedHtml(html);
        setShowPreview(true);
        setAppName(extractAppName(appPlan));
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: html
            ? `✅ App built successfully!\n\nYour live preview is ready below. You can switch between Mobile and Desktop, interact with the app, then ask me to modify anything.\n\nExamples of modifications:\n• "Change the background to black"\n• "Add a login screen"\n• "Add WhatsApp ordering"\n• "Add an admin dashboard"\n• "Change the app name to …"`
            : reply,
        },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Build failed. Please try again or rephrase the plan.",
        },
      ]);
    } finally {
      setBuilding(false);
      setLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  }

  function refreshPreview() {
    if (iframeRef.current && generatedHtml) {
      iframeRef.current.srcdoc = generatedHtml;
    }
  }

  function exportApp() {
    if (!generatedHtml) return;
    const blob = new Blob([generatedHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(appName || "bomba-app")
      .replace(/\s+/g, "-")
      .toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function renderContent(text) {
    if (!text) return null;
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith("```")) {
        const match = part.match(/^```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```$/);
        if (match) {
          const language = match[1] || "code";
          const code = match[2];
          if (language === "html" && code.length > 800 && showPreview) {
            return (
              <div
                key={index}
                style={{
                  margin: "10px 0",
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(255,212,59,0.08)",
                  border: "1px solid rgba(255,212,59,0.25)",
                  fontSize: 13,
                  color: BRAND.accent,
                }}
              >
                ✅ Full app HTML generated — see live preview below
              </div>
            );
          }
          return (
            <div
              key={index}
              style={{
                margin: "14px 0",
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid rgba(255, 212, 59, 0.2)",
                background: "#050505",
              }}
            >
              <div
                style={{
                  padding: "7px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: BRAND.accent,
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  textTransform: "uppercase",
                }}
              >
                {language}
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: 14,
                  overflowX: "auto",
                  fontSize: 13,
                  lineHeight: 1.55,
                  color: "#f5f5f5",
                }}
              >
                <code>{code}</code>
              </pre>
            </div>
          );
        }
      }
      return (
        <span
          key={index}
          style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
        >
          {part}
        </span>
      );
    });
  }

  const lastAssistantIsPlan =
    mode === "app" &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant" &&
    isPlanReply(messages[messages.length - 1].content) &&
    !generatedHtml;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #17120a 0%, #000 42%)",
        color: "#fff",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          padding: "14px 16px",
          background: "rgba(0,0,0,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,212,59,0.18)",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: `linear-gradient(135deg, ${BRAND.accent} 0%, ${BRAND.accent2} 100%)`,
              color: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 950,
              fontSize: 16,
              boxShadow: "0 0 25px rgba(255,212,59,0.15)",
            }}
          >
            BA
          </div>
          <div>
            <div
              style={{
                fontSize: 19,
                fontWeight: 900,
                letterSpacing: "-0.3px",
              }}
            >
              {BRAND.name}
            </div>
            <div
              style={{
                fontSize: 12,
                color: BRAND.accent,
                fontWeight: 600,
              }}
            >
              {BRAND.tagline}
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 900,
          margin: "0 auto",
          padding: "20px 14px 160px",
          boxSizing: "border-box",
        }}
      >
        {/* MODE BUTTONS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 22,
          }}
        >
          {Object.entries(MODES).map(([key, item]) => {
            const active = mode === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => switchMode(key)}
                style={{
                  textAlign: "left",
                  padding: "15px 14px",
                  borderRadius: 16,
                  border: active
                    ? "1px solid rgba(255,212,59,0.8)"
                    : "1px solid rgba(255,212,59,0.18)",
                  background: active
                    ? `linear-gradient(135deg, ${BRAND.accent}, ${BRAND.accent2})`
                    : "rgba(12,12,12,0.9)",
                  color: active ? "#000" : "#fff",
                  cursor: "pointer",
                  transition: "0.2s ease",
                  boxShadow: active
                    ? "0 8px 30px rgba(255,170,0,0.12)"
                    : "none",
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 900,
                    marginBottom: 4,
                  }}
                >
                  {item.icon} {item.name}
                </div>
                <div style={{ fontSize: 11, opacity: 0.75 }}>
                  {item.description}
                </div>
              </button>
            );
          })}
        </div>

        {/* CHAT */}
        <section>
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={`\( {msg.role}- \){index}`}
                style={{
                  display: "flex",
                  justifyContent: isUser ? "flex-end" : "flex-start",
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: "fit-content",
                    maxWidth: "92%",
                    padding: "13px 15px",
                    borderRadius: isUser
                      ? "18px 18px 4px 18px"
                      : "18px 18px 18px 4px",
                    background: isUser
                      ? "linear-gradient(135deg, #171717, #101010)"
                      : "rgba(10,10,10,0.95)",
                    border: "1px solid rgba(255,212,59,0.16)",
                    lineHeight: 1.55,
                    fontSize: 14,
                    overflow: "hidden",
                  }}
                >
                  {!isUser && (
                    <div
                      style={{
                        color: BRAND.accent,
                        fontSize: 11,
                        fontWeight: 800,
                        marginBottom: 7,
                      }}
                    >
                      BOMBA AI
                    </div>
                  )}
                  {isUser ? msg.content : renderContent(msg.content)}
                </div>
              </div>
            );
          })}

          {/* BUILD BUTTON */}
          {lastAssistantIsPlan && (
            <div style={{ margin: "18px 0", textAlign: "center" }}>
              <button
                type="button"
                onClick={handleBuildApp}
                disabled={building || loading}
                style={{
                  padding: "16px 28px",
                  borderRadius: 16,
                  border: "none",
                  background: `linear-gradient(135deg, ${BRAND.accent}, ${BRAND.accent2})`,
                  color: "#000",
                  fontWeight: 900,
                  fontSize: 16,
                  cursor: building ? "not-allowed" : "pointer",
                  boxShadow: "0 10px 40px rgba(255,170,0,0.25)",
                  opacity: building ? 0.7 : 1,
                }}
              >
                {building ? "Building your app…" : "Build This App 🚀"}
              </button>
            </div>
          )}

          {loading && !building && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                margin: "10px 0",
                color: BRAND.accent,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <span>BOMBA AI is thinking</span>
              <span>•••</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </section>

        {/* LIVE APP PREVIEW */}
        {mode === "app" && showPreview && generatedHtml && (
          <section
            style={{
              marginTop: 28,
              borderRadius: 20,
              border: "1px solid rgba(255,212,59,0.25)",
              background: "rgba(8,8,8,0.95)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 14px",
                borderBottom: "1px solid rgba(255,212,59,0.15)",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 14 }}>
                📱 BOMBA AI App Preview — {appName}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {[
                  {
                    label: "📱 Mobile",
                    action: () => setPreviewMode("mobile"),
                    active: previewMode === "mobile",
                  },
                  {
                    label: "🖥️ Desktop",
                    action: () => setPreviewMode("desktop"),
                    active: previewMode === "desktop",
                  },
                  { label: "🔄 Refresh", action: refreshPreview },
                  {
                    label: "✏️ Edit",
                    action: () => {
                      setMessage("Please modify the app: ");
                      textareaRef.current?.focus();
                    },
                  },
                  { label: "▶ Run", action: refreshPreview },
                  { label: "💾 Export", action: exportApp },
                  {
                    label: "🚀 Deploy",
                    action: () => {
                      setMessages((prev) => [
                        ...prev,
                        {
                          role: "assistant",
                          content: `🚀 Deploy your app\n\n1. Click 💾 Export to download the HTML file.\n2. Host it free on:\n   • Netlify Drop (drag & drop)\n   • GitHub Pages\n   • Vercel (static)\n   • Any web hosting\n\nOr ask me to convert it into a full Next.js project for production deployment.`,
                        },
                      ]);
                    },
                  },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    type="button"
                    onClick={btn.action}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 10,
                      border: btn.active
                        ? "1px solid rgba(255,212,59,0.8)"
                        : "1px solid rgba(255,255,255,0.12)",
                      background: btn.active
                        ? "rgba(255,212,59,0.15)"
                        : "rgba(255,255,255,0.04)",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: previewMode === "mobile" ? "20px 12px" : "12px",
                background: "#0a0a0a",
              }}
            >
              <div
                style={{
                  width: previewMode === "mobile" ? 375 : "100%",
                  maxWidth: previewMode === "mobile" ? 375 : 900,
                  height: previewMode === "mobile" ? 700 : 620,
                  borderRadius: previewMode === "mobile" ? 28 : 12,
                  overflow: "hidden",
                  border:
                    previewMode === "mobile"
                      ? "10px solid #1a1a1a"
                      : "1px solid rgba(255,255,255,0.1)",
                  boxShadow:
                    previewMode === "mobile"
                      ? "0 20px 60px rgba(0,0,0,0.6)"
                      : "none",
                  background: "#fff",
                }}
              >
                <iframe
                  ref={iframeRef}
                  title="BOMBA AI App Preview"
                  srcDoc={generatedHtml}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    background: "#fff",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                padding: "10px 14px",
                fontSize: 12,
                color: "#888",
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              Tip: Type a change in the chat below (e.g. “Add a shopping cart” or
              “Make the primary color green”) and BOMBA AI will update this
              preview.
            </div>
          </section>
        )}
      </main>

      {/* INPUT BAR */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          padding: "10px 12px 14px",
          background: "rgba(0,0,0,0.94)",
          backdropFilter: "blur(14px)",
          borderTop: "1px solid rgba(255,212,59,0.18)",
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            maxWidth: 900,
            margin: "0 auto",
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
          }}
        >
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={MODES[mode].placeholder}
            rows={1}
            disabled={loading || building}
            aria-label="Message BOMBA AI"
            style={{
              flex: 1,
              minWidth: 0,
              maxHeight: 180,
              padding: "13px 14px",
              borderRadius: 15,
              border: "1px solid rgba(255,212,59,0.25)",
              background: "#0D0D0D",
              color: "#fff",
              outline: "none",
              resize: "none",
              fontSize: 14,
              lineHeight: 1.4,
              boxSizing: "border-box",
            }}
          />
          <button
            type="submit"
            disabled={loading || building || !message.trim()}
            style={{
              flexShrink: 0,
              minWidth: 72,
              height: 48,
              padding: "0 16px",
              borderRadius: 15,
              border: "none",
              background:
                loading || building || !message.trim()
                  ? "#292929"
                  : `linear-gradient(135deg, ${BRAND.accent}, ${BRAND.accent2})`,
              color:
                loading || building || !message.trim() ? "#777" : "#000",
              fontWeight: 900,
              cursor:
                loading || building || !message.trim()
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {loading || building ? "..." : "Send"}
          </button>
        </form>
        <div
          style={{
            maxWidth: 900,
            margin: "7px auto 0",
            textAlign: "center",
            fontSize: 10,
            color: "#666",
          }}
        >
          Enter to send • Shift + Enter for a new line
        </div>
      </div>
    </div>
  );
}
9. README.md
# BOMBA AI — Universal App Builder

**Automate. Grow. Earn.**

A production-ready Next.js application that lets anyone describe **any** app in plain language and receive:

1. A structured App Plan  
2. A working interactive preview  
3. Chat-based modifications  
4. One-click HTML export  

This is **not** limited to shoe stores or any single industry.

---

## Folder structure
bomba-ai/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts
│   ├── layout.tsx
│   └── page.js
├── .env.example
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
---

## Setup (local)

```bash
npm install
cp .env.example .env.local
# put your real OPENAI_API_KEY inside .env.local
npm run dev
Environment variables
Variable
Required
Where it lives
Notes
OPENAI_API_KEY
Yes
Server only
Set in Vercel → Settings → Environment Variables. Never put it in frontend code.
Deploy to Vercel (GitHub)
Push this folder to a GitHub repository.
Import the repo in Vercel.
Add OPENAI_API_KEY under Project Settings → Environment Variables (Production + Preview).
Deploy.
How it works
Switch to App Builder.
Describe any app.
Review the App Plan → click Build This App 🚀.
Interact with the live Mobile/Desktop preview.
Ask for changes in chat (“add login”, “change colours”, “add admin dashboard”…).
Export the HTML or follow the Deploy instructions.
---

## Quick start after copying files

```bash
npm install
cp .env.example .env.local
# edit .env.local and paste your real OpenAI key
npm run dev
Then open http://localhost:3000, switch to App Builder, and type any idea (food delivery, school system, hospital appointments, real estate, online store, etc.).
All API keys stay on the server. The generated apps are real interactive HTML previews that can be modified through chat and exported.