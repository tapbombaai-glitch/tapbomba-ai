"use client";

import { useEffect, useRef, useState } from "react";

const BRAND = {
  name: "BOMBA AI",
  tagline: "Automate. Grow. Earn.",
  accent: "#FFD43B",
};

const MODES = {
  content: {
    name: "Content Creator",
    icon: "✨",
    description: "Posts • Ads • Captions",
    placeholder: "Tell BOMBA AI what content you need...",
    welcome:
      "✨ Content Creator Mode ON\n\nTell me what you want to create. I can help with social media posts, captions, adverts, product descriptions, promotional messages, and business content.",
    system:
      "You are BOMBA AI Content Creator, a practical AI assistant for Nigerian and African business owners. Help users create social media posts, captions, adverts, product descriptions, promotional messages, and business content. Be practical, clear and useful.",
  },

  app: {
    name: "App Builder",
    icon: "🚀",
    description: "Plan • Build • Preview • Deploy",
    placeholder: "Describe any app you want to build...",
    welcome:
      '🚀 BOMBA AI App Builder ON\n\nDescribe ANY app you want in normal language. I will create an App Plan first. Then you can click "Build This App 🚀" to generate the app.',
    system:
      'You are BOMBA AI Universal App Builder. Help users turn natural-language ideas into real applications. When the user describes an app idea, create a clear App Plan with the app name, purpose, features, screens, user flow, data needed and design. End the plan with exactly: "Ready to build? Click Build This App 🚀 below." When the user asks to build the app, generate a complete single-file HTML application.',
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
  const [appPlan, setAppPlan] = useState("");
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [building, setBuilding] = useState(false);
  const [copied, setCopied] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading, showPreview]);

  function switchMode(newMode) {
    setMode(newMode);

    setMessages([
      {
        role: "assistant",
        content: MODES[newMode].welcome,
      },
    ]);

    setMessage("");
    setAppPlan("");
    setGeneratedHtml("");
    setShowPreview(false);
    setCopied(false);
  }

  function extractHtmlFromReply(text) {
    if (!text) {
      return null;
    }

    const match = text.match(
      /```html\s*([\s\S]*?)```/i
    );

    if (match && match[1]) {
      return match[1].trim();
    }

    return null;
  }

  // Detects an App Plan using its structure,
  // not one exact phrase.
  function isPlanReply(text) {
    if (!text) {
      return false;
    }

    const hasStructure =
      /features?/i.test(text) &&
      /design|ui|ux/i.test(text) &&
      /next steps?|development|build/i.test(text);

    const hasAppSections =
      /product|catalog|cart|checkout|profile|user|screen|navigation/i.test(
        text
      );

    return hasStructure || hasAppSections;
  }

  async function callAI({
    userContent,
    system,
    history,
  }) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: userContent,
        system,
        history,
      }),
    });

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "The AI server returned an invalid response."
      );
    }

    if (!response.ok) {
      throw new Error(
        data?.error ||
          "The AI server returned an error."
      );
    }

    return data?.reply || data?.message || "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmed = message.trim();

    if (!trimmed || loading || building) {
      return;
    }

    const userMessage = {
      role: "user",
      content: trimmed,
    };

    const updatedMessages = [
      ...messages,
      userMessage,
    ];

    setMessages(updatedMessages);
    setMessage("");
    setLoading(true);

    try {
      const reply = await callAI({
        userContent: trimmed,
        system: MODES[mode].system,
        history: updatedMessages.slice(-12),
      });

      if (
        mode === "app" &&
        isPlanReply(reply)
      ) {
        setAppPlan(reply);
        setGeneratedHtml("");
        setShowPreview(false);
        setCopied(false);
      }

      const html = extractHtmlFromReply(reply);

      if (mode === "app" && html) {
        setGeneratedHtml(html);
        setShowPreview(true);
        setCopied(false);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            reply || "No response received.",
        },
      ]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ I couldn't connect to the AI server. Please check the API route and OpenAI API key.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleBuildApp() {
    if (!appPlan || building) {
      return;
    }

    setBuilding(true);
    setLoading(true);
    setCopied(false);

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: "Build This App 🚀",
      },
    ]);

    const buildPrompt = `Build This App 🚀

Use the following App Plan to generate the complete application.

Return the entire application as a single HTML file.

The application should be mobile-friendly and functional.

APP PLAN:

${appPlan}`;

    try {
      const reply = await callAI({
        userContent: buildPrompt,
        system: MODES.app.system,
        history: [
          {
            role: "assistant",
            content: appPlan,
          },
        ],
      });

      const html = extractHtmlFromReply(reply);

      if (html) {
        setGeneratedHtml(html);
        setShowPreview(true);

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "✅ App built successfully! Your live preview is below.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "⚠️ The AI responded, but I could not find the generated HTML code. Please try building again.",
          },
        ]);
      }
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ App build failed. Please try again.",
        },
      ]);
    } finally {
      setBuilding(false);
      setLoading(false);
    }
  }

  async function handleCopyFullApp() {
    if (!generatedHtml) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        generatedHtml
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ I couldn't copy the app automatically. Please try again.",
        },
      ]);
    }
  }

  const lastMessage =
    messages[messages.length - 1];

  const showBuildButton =
    mode === "app" &&
    appPlan &&
    lastMessage?.role === "assistant" &&
    !generatedHtml;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        paddingBottom: "110px",
      }}
    >
      <header
        style={{
          padding: "20px",
          textAlign: "center",
          borderBottom: "1px solid #222",
          background: "#050505",
        }}
      >
        <div
          style={{
            width: "58px",
            height: "58px",
            borderRadius: "16px",
            background: BRAND.accent,
            color: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px",
            fontWeight: 900,
            fontSize: "23px",
          }}
        >
          TB
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "34px",
            fontWeight: 900,
          }}
        >
          {BRAND.name}
        </h1>

        <p
          style={{
            margin: "7px 0 0",
            color: "#bbb",
          }}
        >
          {BRAND.tagline}
        </p>
      </header>

      <section
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "18px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          {Object.entries(MODES).map(
            ([key, item]) => (
              <button
                key={key}
                onClick={() => switchMode(key)}
                style={{
                  padding: "15px 10px",
                  borderRadius: "14px",
                  border:
                    mode === key
                      ? "2px solid #FFD43B"
                      : "1px solid #333",
                  background:
                    mode === key
                      ? BRAND.accent
                      : "#111",
                  color:
                    mode === key
                      ? "#000"
                      : "#fff",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                <div>
                  {item.icon} {item.name}
                </div>

                <small
                  style={{
                    display: "block",
                    marginTop: "5px",
                    opacity: 0.7,
                    fontWeight: 500,
                  }}
                >
                  {item.description}
                </small>
              </button>
            )
          )}
        </div>

        <div>
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                marginBottom: "14px",
                textAlign:
                  msg.role === "user"
                    ? "right"
                    : "left",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  maxWidth: "92%",
                  padding: "13px 15px",
                  borderRadius: "15px",
                  background:
                    msg.role === "user"
                      ? "#222"
                      : "#111",
                  border:
                    msg.role === "user"
                      ? "1px solid #333"
                      : "1px solid #252525",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.55,
                  textAlign: "left",
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div
            style={{
              color: "#FFD43B",
              padding: "10px 0",
              fontWeight: 700,
            }}
          >
            BOMBA AI is thinking...
          </div>
        )}

        {showBuildButton && (
          <button
            onClick={handleBuildApp}
            disabled={building}
            style={{
              width: "100%",
              padding: "17px",
              marginTop: "10px",
              marginBottom: "20px",
              borderRadius: "14px",
              border: "none",
              background: BRAND.accent,
              color: "#000",
              fontSize: "17px",
              fontWeight: 900,
              cursor: building
                ? "not-allowed"
                : "pointer",
            }}
          >
            {building
              ? "BUILDING YOUR APP..."
              : "Build This App 🚀"}
          </button>
        )}

        {showPreview && generatedHtml && (
          <section
            style={{
              marginTop: "20px",
              background: "#111",
              border: "1px solid #FFD43B",
              borderRadius: "16px",
              padding: "12px",
            }}
          >
            <h2
              style={{
                margin: "5px 0 12px",
                color: BRAND.accent,
              }}
            >
              📱 Live App Preview
            </h2>

            <button
              onClick={handleCopyFullApp}
              style={{
                width: "100%",
                padding: "16px",
                marginBottom: "12px",
                borderRadius: "13px",
                border: "none",
                background: BRAND.accent,
                color: "#000",
                fontSize: "16px",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              {copied
                ? "✅ Full App Copied!"
                : "📋 Copy Full App"}
            </button>

            <iframe
              title="BOMBA AI App Preview"
              srcDoc={generatedHtml}
              style={{
                width: "100%",
                height: "700px",
                border: "1px solid #333",
                borderRadius: "12px",
                background: "#fff",
              }}
            />
          </section>
        )}

        <div ref={messagesEndRef} />
      </section>

      <form
        onSubmit={handleSubmit}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 100,
          padding: "10px",
          background: "#050505",
          borderTop: "1px solid #222",
          display: "flex",
          gap: "8px",
        }}
      >
        <textarea
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey
            ) {
              event.preventDefault();

              if (!loading && !building) {
                event.currentTarget.form?.requestSubmit();
              }
            }
          }}
          placeholder={
            MODES[mode].placeholder
          }
          rows={1}
          style={{
            flex: 1,
            minWidth: 0,
            padding: "13px",
            borderRadius: "13px",
            background: "#111",
            color: "#fff",
            border: "1px solid #333",
            outline: "none",
            resize: "none",
            fontSize: "15px",
          }}
        />

        <button
          type="submit"
          disabled={
            loading ||
            building ||
            !message.trim()
          }
          style={{
            padding: "0 18px",
            borderRadius: "13px",
            background:
              loading ||
              building ||
              !message.trim()
                ? "#555"
                : BRAND.accent,
            color: "#000",
            fontWeight: 900,
            border: "none",
            cursor:
              loading ||
              building ||
              !message.trim()
                ? "not-allowed"
                : "pointer",
          }}
        >
          Send
        </button>
      </form>
    </main>
  );
}