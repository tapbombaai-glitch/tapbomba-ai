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
      "You are BOMBA AI Content Creator. Help users create practical business content for Nigerian and African businesses. Answer clearly and directly. Give ready-to-copy content when useful. Use ₦ for prices.",
  },
  app: {
    name: "App Builder",
    icon: "🚀",
    description: "Plan • Build • Preview",
    placeholder: "Describe the app you want to build...",
    welcome:
      "🚀 App Builder Mode ON\n\nDescribe the app you want to build. I will first create a clear App Plan. Then you can click Build This App 🚀 and I will generate a complete working HTML app.",
    system: `You are BOMBA AI Universal App Builder.

STEP 1 — APP PLAN
When the user describes an app, DO NOT give source code.
Create a clean App Plan with:
1. App Name
2. App Purpose
3. Main Features
4. Screens / Pages
5. Navigation
6. User Flow
7. Data Needed
8. Design / UI
9. Functional Behavior

End exactly with:
Ready to build? Click Build This App 🚀 below.

STEP 2 — BUILD
Only when the user clicks Build, return ONE complete standalone HTML application.
- Start with <!DOCTYPE html>
- End with </html>
- Put all CSS and JavaScript inside the HTML
- Make it mobile-friendly and professional
- Make buttons work
- Do NOT include BOMBA AI branding inside the generated app`,
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
  const [copiedIndex, setCopiedIndex] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, showPreview]);

  function switchMode(newMode) {
    setMode(newMode);
    setMessages([{ role: "assistant", content: MODES[newMode].welcome }]);
    setMessage("");
    setAppPlan("");
    setGeneratedHtml("");
    setShowPreview(false);
    setCopied(false);
    setCopiedIndex(null);
    setBuilding(false);
  }

  async function callAI({ userContent, system }) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userContent, system }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "AI server error");
    return data?.reply || data?.message || data?.content || "";
  }

  function extractHtml(text) {
    if (!text) return null;
    const match = text.match(/```html\s*([\s\S]*?)```/i);
    if (match?.[1]) return match[1].trim();

    const start = text.search(/<!doctype html|<html[\s>]/i);
    if (start >= 0) {
      const html = text.slice(start).trim();
      const end = html.search(/<\/html>\s*$/i);
      if (end >= 0) return html.slice(0, end + 7).trim();
    }
    return null;
  }

  function isPlan(text) {
    if (!text) return false;
    if (/<!doctype html|<html|```html/i.test(text)) return false;
    return /app name|purpose|main features|screens|ready to build/i.test(text);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || loading || building) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setMessage("");
    setLoading(true);
    setCopiedIndex(null);

    if (mode === "app") {
      setAppPlan("");
      setGeneratedHtml("");
      setShowPreview(false);
    }

    try {
      const userContent =
        mode === "app"
          ? `The user wants to build this application:\n\n"${trimmed}"\n\nFollow STEP 1. Create ONLY the App Plan. End with: Ready to build? Click Build This App 🚀 below.`
          : trimmed;

      const reply = await callAI({
        userContent,
        system: MODES[mode].system,
      });

      if (mode === "app") {
        if (isPlan(reply)) {
          setAppPlan(reply);
          setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "I couldn't create a clear App Plan. Please describe the app again.",
            },
          ]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: reply || "No response received." },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleBuildApp() {
    if (!appPlan || building) return;

    setBuilding(true);
    setLoading(true);
    setShowPreview(false);
    setGeneratedHtml("");

    setMessages((prev) => [
      ...prev,
      { role: "user", content: "Build This App 🚀" },
      {
        role: "assistant",
        content: "🔨 Building your app...\nPlease wait a moment.",
      },
    ]);

    try {
      const reply = await callAI({
        userContent: `BUILD THE APPLICATION NOW using this App Plan:\n\n${appPlan}\n\nReturn ONLY one complete HTML application. Start with <!DOCTYPE html> and end with </html>.`,
        system: MODES.app.system,
      });

      const html = extractHtml(reply);
      if (html) {
        setGeneratedHtml(html);
        setShowPreview(true);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "✅ Your app is ready! Preview is shown below.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "⚠️ Could not generate the full app. Please try building again.",
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Build failed. Please try again." },
      ]);
    } finally {
      setBuilding(false);
      setLoading(false);
    }
  }

  async function copyText(text, index = null) {
    try {
      await navigator.clipboard.writeText(text);
      if (index !== null) {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      alert("Could not copy. Please select and copy manually.");
    }
  }

  function downloadApp() {
    if (!generatedHtml) return;
    const blob = new Blob([generatedHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bomba-app.html";
    a.click();
    URL.revokeObjectURL(url);
  }

  const showBuildButton =
    mode === "app" && appPlan && !generatedHtml && !building;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        paddingBottom: "120px",
      }}
    >
      {/* Header */}
      <header style={{ padding: "20px", textAlign: "center", borderBottom: "1px solid #222" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: BRAND.accent,
            color: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 10px",
            fontWeight: 900,
            fontSize: 22,
          }}
        >
          TB
        </div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900 }}>{BRAND.name}</h1>
        <p style={{ margin: "6px 0 0", color: "#aaa" }}>{BRAND.tagline}</p>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
        {/* Mode Switch */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {Object.entries(MODES).map(([key, item]) => (
            <button
              key={key}
              onClick={() => switchMode(key)}
              style={{
                padding: "14px 10px",
                borderRadius: 14,
                border: mode === key ? "2px solid #FFD43B" : "1px solid #333",
                background: mode === key ? BRAND.accent : "#111",
                color: mode === key ? "#000" : "#fff",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              <div>
                {item.icon} {item.name}
              </div>
              <small style={{ display: "block", marginTop: 4, opacity: 0.7 }}>{item.description}</small>
            </button>
          ))}
        </div>

        {/* Messages */}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: 14,
              textAlign: msg.role === "user" ? "right" : "left",
            }}
          >
            <div
              style={{
                display: "inline-block",
                maxWidth: "90%",
                padding: "12px 14px",
                borderRadius: 14,
                background: msg.role === "user" ? "#222" : "#111",
                border: "1px solid #333",
                whiteSpace: "pre-wrap",
                lineHeight: 1.5,
                textAlign: "left",
              }}
            >
              {msg.content}
              {msg.role === "assistant" && (
                <div style={{ marginTop: 10 }}>
                  <button
                    onClick={() => copyText(msg.content, i)}
                    style={{
                      padding: "7px 12px",
                      borderRadius: 8,
                      border: "1px solid #444",
                      background: "#222",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {copiedIndex === i ? "✅ Copied" : "📋 Copy"}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && !building && (
          <div style={{ color: BRAND.accent, fontWeight: 700, padding: "8px 0" }}>
            BOMBA AI is thinking...
          </div>
        )}

        {/* Build Button */}
        {showBuildButton && (
          <button
            onClick={handleBuildApp}
            disabled={building}
            style={{
              width: "100%",
              padding: 16,
              margin: "12px 0 20px",
              borderRadius: 14,
              border: "none",
              background: BRAND.accent,
              color: "#000",
              fontSize: 17,
              fontWeight: 900,
              cursor: building ? "not-allowed" : "pointer",
            }}
          >
            {building ? "Building..." : "Build This App 🚀"}
          </button>
        )}

        {/* App Preview */}
        {showPreview && generatedHtml && (
          <section
            style={{
              marginTop: 20,
              padding: 12,
              borderRadius: 16,
              border: "1px solid #FFD43B",
              background: "#111",
            }}
          >
            <h2 style={{ margin: "0 0 12px", color: BRAND.accent }}>📱 Live App Preview</h2>

            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <button
                onClick={() => copyText(generatedHtml)}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 12,
                  border: "none",
                  background: BRAND.accent,
                  color: "#000",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                {copied ? "✅ Copied!" : "📋 Copy Full App"}
              </button>
              <button
                onClick={downloadApp}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRadius: 12,
                  border: "2px solid #FFD43B",
                  background: "#222",
                  color: BRAND.accent,
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                ⬇️ Download
              </button>
            </div>

            <iframe
              title="App Preview"
              srcDoc={generatedHtml}
              style={{
                width: "100%",
                height: 600,
                border: "1px solid #333",
                borderRadius: 12,
                background: "#fff",
              }}
              sandbox="allow-scripts allow-forms"
            />
          </section>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          background: "#050505",
          borderTop: "1px solid #222",
          padding: 12,
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 8 }}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={MODES[mode].placeholder}
            rows={2}
            disabled={loading || building}
            style={{
              flex: 1,
              resize: "none",
              padding: 12,
              borderRadius: 12,
              border: "1px solid #333",
              background: "#111",
              color: "#fff",
              fontSize: 15,
            }}
          />
          <button
            type="submit"
            disabled={loading || building || !message.trim()}
            style={{
              minWidth: 70,
              padding: "12px 10px",
              borderRadius: 12,
              border: "none",
              background: loading || building || !message.trim() ? "#555" : BRAND.accent,
              color: loading || building || !message.trim() ? "#aaa" : "#000",
              fontWeight: 900,
              cursor: loading || building || !message.trim() ? "not-allowed" : "pointer",
            }}
          >
            {loading || building ? "..." : "Send"}
          </button>
        </div>
      </form>

      <div ref={messagesEndRef} />
    </main>
  );
}