"use client";

import { useEffect, useRef, useState } from "react";

const MODES = {
  content: {
    name: "Content Creator",
    icon: "✨",
    description: "Posts • Ads • Captions",
    placeholder: "Tell Top Bomba what content you need...",
    welcome:
      "✨ Content Creator Mode ON\n\nTell me what you want to create. I can help with social media posts, captions, adverts, product descriptions, promotional messages, and business content.",
    system: `You are Top Bomba AI Content Creator, a practical AI assistant for Nigerian and African business owners.

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
    description: "Build Apps • Code • Deploy",
    placeholder: "Describe the app you want to build...",
    welcome:
      "🚀 App Builder Mode ON\n\nDescribe the app you want to build.\n\nExample: Build a simple POS app for my provision store with products, sales tracking, customers and receipt printing.",
    system: `You are Top Bomba AI App Builder.

Your job is to help users plan and build real applications.

When the request is unclear, ask only the most important clarifying questions.

When enough information is available, provide a practical implementation.

Preferred stack:
- Next.js
- React
- JavaScript unless the user specifically requests TypeScript
- Tailwind CSS
- API routes where appropriate

For larger projects, structure the response clearly:

### Project Structure
Show the important files.

### package.json
Provide the package configuration.

### Files
Provide complete copy-paste-ready files.

### How to Run
npm install
npm run dev

### Deployment
Explain how to deploy to Vercel or Render.

Do not pretend that code has been deployed or tested if it has not.
Keep code clean, modern and practical.`,
  },
};

export default function Home() {
  const [mode, setMode] = useState("content");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! 👋 I'm Top Bomba AI.\n\nChoose Content Creator or App Builder above, then tell me what you want to create.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

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
  }

  async function handleSubmit(event) {
    event?.preventDefault();

    const trimmed = message.trim();

    if (!trimmed || loading) return;

    const userMessage = {
      role: "user",
      content: trimmed,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          system: MODES[mode].system,
          history: updatedMessages.slice(-12),
        }),
      });

      const contentType = response.headers.get("content-type") || "";

      if (!response.ok) {
        let errorMessage = `Server returned ${response.status}.`;

        if (contentType.includes("application/json")) {
          const errorData = await response.json().catch(() => null);

          if (errorData?.error) {
            errorMessage = errorData.error;
          }
        }

        throw new Error(errorMessage);
      }

      if (!contentType.includes("application/json")) {
        throw new Error(
          "The server returned an unexpected response. Please check the /api/chat route."
        );
      }

      const data = await response.json();

      if (!data?.reply) {
        throw new Error("The AI returned an empty response.");
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.reply,
        },
      ]);
    } catch (error) {
      console.error("Top Bomba AI error:", error);

      setMessages((previous) => [
        ...previous,
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

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
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
                  color: "#FFD43B",
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
          style={{
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
          }}
        >
          {part}
        </span>
      );
    });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #17120a 0%, #000 42%)",
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
            maxWidth: 850,
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
              background:
                "linear-gradient(135deg, #FFD43B 0%, #FFA500 100%)",
              color: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 950,
              fontSize: 18,
              boxShadow: "0 0 25px rgba(255,212,59,0.15)",
            }}
          >
            TB
          </div>

          <div>
            <div
              style={{
                fontSize: 19,
                fontWeight: 900,
                letterSpacing: "-0.3px",
              }}
            >
              Top Bomba AI
            </div>

            <div
              style={{
                fontSize: 12,
                color: "#FFD43B",
                fontWeight: 600,
              }}
            >
              Automate. Grow. Earn.
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 850,
          margin: "0 auto",
          padding: "20px 14px 130px",
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
                    ? "linear-gradient(135deg, #FFD43B, #FFA500)"
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

                <div
                  style={{
                    fontSize: 11,
                    opacity: 0.75,
                  }}
                >
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
                key={`${msg.role}-${index}`}
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
                        color: "#FFD43B",
                        fontSize: 11,
                        fontWeight: 800,
                        marginBottom: 7,
                      }}
                    >
                      TOP BOMBA AI
                    </div>
                  )}

                  {isUser ? msg.content : renderContent(msg.content)}
                </div>
              </div>
            );
          })}

          {loading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                margin: "10px 0",
                color: "#FFD43B",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <span>Top Bomba AI is thinking</span>
              <span>•••</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </section>
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
            maxWidth: 850,
            margin: "0 auto",
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
          }}
        >
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={MODES[mode].placeholder}
            rows={1}
            disabled={loading}
            aria-label="Message Top Bomba AI"
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
            disabled={loading || !message.trim()}
            style={{
              flexShrink: 0,
              minWidth: 72,
              height: 48,
              padding: "0 16px",
              borderRadius: 15,
              border: "none",
              background:
                loading || !message.trim()
                  ? "#292929"
                  : "linear-gradient(135deg, #FFD43B, #FFA500)",
              color: loading || !message.trim() ? "#777" : "#000",
              fontWeight: 900,
              cursor:
                loading || !message.trim() ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "..." : "Send"}
          </button>
        </form>

        <div
          style={{
            maxWidth: 850,
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