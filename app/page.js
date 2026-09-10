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
      "You are BOMBA AI Universal App Builder.\n\n" +
      "IMPORTANT APP BUILDER RULES:\n\n" +
      "1. The user's latest request is the current app request.\n" +
      "2. Do not unnecessarily reuse unrelated older app requests.\n" +
      "3. First create an APP PLAN. Do not generate the actual application code yet.\n" +
      "4. The App Plan must clearly include:\n" +
      "   - App name\n" +
      "   - Purpose\n" +
      "   - Main features\n" +
      "   - Screens/pages\n" +
      "   - Navigation\n" +
      "   - User flow\n" +
      "   - Data needed\n" +
      "   - Design/UI\n" +
      "   - Functional behavior\n" +
      "5. End every new App Plan with exactly:\n" +
      "Ready to build? Click Build This App 🚀 below.\n" +
      "6. Only generate application code when the user clicks Build This App 🚀.\n" +
      "7. When building, create a complete functional mobile-friendly application.\n" +
      "8. Return the complete application inside one HTML code block.\n" +
      "9. The HTML must contain its CSS and JavaScript so it can work as a standalone HTML file.\n" +
      "10. Do not say the app is built if you did not provide the complete HTML.\n" +
      "11. Make buttons and important interactions functional.\n" +
      "12. Keep the generated application focused on the user's latest app request.\n" +
      "13. Do not add unrelated features from previous requests.",
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
  const [copiedMessageIndex, setCopiedMessageIndex] = useState(null);

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
    setCopiedMessageIndex(null);
    setBuilding(false);
    setLoading(false);
  }

  function extractHtmlFromReply(text) {
    if (!text) {
      return null;
    }

    const fencedMatch = text.match(/```html\s*([\s\S]*?)```/i);

    if (fencedMatch && fencedMatch[1]) {
      return fencedMatch[1].trim();
    }

    const genericFencedMatch = text.match(/```\s*([\s\S]*?)```/);

    if (
      genericFencedMatch &&
      genericFencedMatch[1] &&
      /<(!doctype|html|head|body)/i.test(genericFencedMatch[1])
    ) {
      return genericFencedMatch[1].trim();
    }

    const htmlStart = text.search(/<!doctype html|<html[\s>]/i);

    if (htmlStart >= 0) {
      const possibleHtml = text.slice(htmlStart).trim();

      const htmlEnd = possibleHtml.search(/<\/html>\s*$/i);

      if (htmlEnd >= 0) {
        return possibleHtml.slice(0, htmlEnd + 7).trim();
      }
    }

    return null;
  }

  function isPlanReply(text) {
    if (!text) {
      return false;
    }

    const hasBuildInstruction =
      /Ready to build\?\s*Click Build This App/i.test(text);

    const hasPlanSections =
      /app name|purpose|features|screens|navigation|user flow|design|ui|data needed/i.test(
        text
      );

    const containsHtml =
      /<!doctype html|<html[\s>]|```html/i.test(text);

    return !containsHtml && (hasBuildInstruction || hasPlanSections);
  }

  async function callAI({ userContent, system }) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: userContent,
        system,
      }),
    });

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error("The AI server returned an invalid response.");
    }

    if (!response.ok) {
      throw new Error(data?.error || "The AI server returned an error.");
    }

    return (
      data?.reply ||
      data?.message ||
      data?.content ||
      data?.output ||
      ""
    );
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

    setMessages((prev) => [...prev, userMessage]);

    setMessage("");
    setLoading(true);
    setCopiedMessageIndex(null);

    if (mode === "app") {
      setAppPlan("");
      setGeneratedHtml("");
      setShowPreview(false);
      setCopied(false);
    }

    try {
      const reply = await callAI({
        userContent: trimmed,
        system: MODES[mode].system,
      });

      if (mode === "app") {
        const html = extractHtmlFromReply(reply);

        if (html) {
          setGeneratedHtml(html);
          setShowPreview(true);
          setAppPlan("");
        } else if (isPlanReply(reply)) {
          setAppPlan(reply);
          setGeneratedHtml("");
          setShowPreview(false);
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply || "No response received.",
        },
      ]);
    } catch (error) {
      console.error("BOMBA AI error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ Something went wrong. Please check your internet connection and try again.",
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
      {
        role: "assistant",
        content:
          "🔨 Building your app step by step...\n\n" +
          "1️⃣ Reading the App Plan\n" +
          "2️⃣ Creating the interface\n" +
          "3️⃣ Adding the app functionality\n" +
          "4️⃣ Preparing the live preview\n\n" +
          "Please wait...",
      },
    ]);

    setShowPreview(false);

    const buildPrompt =
      "BUILD THE APPLICATION NOW.\n\n" +
      "Use ONLY this App Plan as the specification for the application.\n\n" +
      "APP PLAN:\n" +
      appPlan +
      "\n\n" +
      "BUILD REQUIREMENTS:\n\n" +
      "- Create a complete functional application.\n" +
      "- Make it mobile-friendly.\n" +
      "- Make the UI professional.\n" +
      "- Include the requested screens and features.\n" +
      "- Make buttons and interactions functional where possible.\n" +
      "- Keep everything self-contained.\n" +
      "- Put CSS inside the HTML.\n" +
      "- Put JavaScript inside the HTML.\n" +
      "- Do not use a separate CSS or JS file.\n" +
      "- Do not include the BOMBA AI interface in the generated app.\n" +
      "- Do not include BOMBA AI's logo, chat screen, header, or controls.\n" +
      "- Build ONLY the application described by the App Plan.\n" +
      "- Return ONLY the complete application inside one HTML code block.\n" +
      "- Start with <!DOCTYPE html>.\n" +
      "- End with </html>.\n" +
      "- Do not return an explanation outside the code block.";

    try {
      const reply = await callAI({
        userContent: buildPrompt,
        system: MODES.app.system,
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
              "✅ App built successfully!\n\nYour live app preview is ready below. You can copy or download the complete app.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "⚠️ The AI responded, but I could not find the complete HTML application. Please tap Build This App 🚀 again.",
          },
        ]);
      }
    } catch (error) {
      console.error("App build error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ App build failed. Please check your connection and try again.",
        },
      ]);
    } finally {
      setBuilding(false);
      setLoading(false);
    }
  }

  async function copyToClipboard(text, messageIndex = null) {
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);

      if (messageIndex !== null) {
        setCopiedMessageIndex(messageIndex);

        window.setTimeout(() => {
          setCopiedMessageIndex(null);
        }, 2500);
      } else {
        setCopied(true);

        window.setTimeout(() => {
          setCopied(false);
        }, 3000);
      }

      return;
    } catch (error) {
      console.warn("Modern clipboard failed:", error);
    }

    try {
      const textarea = document.createElement("textarea");

      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";
      textarea.style.opacity = "0";

      document.body.appendChild(textarea);

      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);

      const successful = document.execCommand("copy");

      document.body.removeChild(textarea);

      if (!successful) {
        throw new Error("Fallback copy failed.");
      }

      if (messageIndex !== null) {
        setCopiedMessageIndex(messageIndex);

        window.setTimeout(() => {
          setCopiedMessageIndex(null);
        }, 2500);
      } else {
        setCopied(true);

        window.setTimeout(() => {
          setCopied(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Copy failed:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ Automatic copying failed. Please select and copy the text manually.",
        },
      ]);
    }
  }

  function handleCopyFullApp() {
    copyToClipboard(generatedHtml);
  }

  function handleDownloadApp() {
    if (!generatedHtml) {
      return;
    }

    const blob = new Blob([generatedHtml], {
      type: "text/html;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "bomba-app.html";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  const lastMessage = messages[messages.length - 1];

  const showBuildButton =
    mode === "app" &&
    Boolean(appPlan) &&
    !generatedHtml &&
    !building &&
    lastMessage?.role === "assistant";

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
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          {Object.entries(MODES).map(([key, item]) => (
            <button
              key={key}
              onClick={() => switchMode(key)}
              type="button"
              style={{
                padding: "15px 10px",
                borderRadius: "14px",
                border:
                  mode === key ? "2px solid #FFD43B" : "1px solid #333",
                background: mode === key ? BRAND.accent : "#111",
                color: mode === key ? "#000" : "#fff",
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
          ))}
        </div>

        <div>
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                marginBottom: "16px",
                textAlign: msg.role === "user" ? "right" : "left",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  maxWidth: "92%",
                  padding: "13px 15px",
                  borderRadius: "15px",
                  background: msg.role === "user" ? "#222" : "#111",
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

                {msg.role === "assistant" &&
                  !(
                    mode === "app" &&
                    (msg.content.includes("Building your app step by step") ||
                      msg.content.includes("App built successfully"))
                  ) && (
                    <div style={{ marginTop: "10px" }}>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(msg.content, index)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "9px",
                          border: "1px solid #333",
                          background: "#222",
                          color: "#fff",
                          fontSize: "13px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {copiedMessageIndex === index
                          ? "✅ Copied!"
                          : "📋 Copy Answer"}
                      </button>
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>

        {loading && !building && (
          <div
            style={{
              color: BRAND.accent,
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
            type="button"
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
              cursor: building ? "not-allowed" : "pointer",
            }}
          >
            {building ? "BUILDING YOUR APP..." : "Build This App 🚀"}
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

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "12px",
              }}
            >
              <button
                onClick={handleCopyFullApp}
                type="button"
                style={{
                  flex: 1,
                  padding: "16px 8px",
                  borderRadius: "13px",
                  border: "none",
                  background: BRAND.accent,
                  color: "#000",
                  fontSize: "15px",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                {copied ? "✅ Copied!" : "📋 Copy Full App"}
              </button>

              <button
                onClick={handleDownloadApp}
                type="button"
                style={{
                  flex: 1,
                  padding: "16px 8px",
                  borderRadius: "13px",
                  border: "2px solid #FFD43B",
                  background: "#222",
                  color: BRAND.accent,
                  fontSize: "15px",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                ⬇️ Download HTML
              </button>
            </div>

            <iframe
              title="Generated App Preview"
              srcDoc={generatedHtml}
              sandbox="allow-scripts allow-forms allow-modals"
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
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();

              if (!loading && !building) {
                event.currentTarget.form?.requestSubmit();
              }
            }
          }}
          placeholder={MODES[mode].placeholder}
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
          disabled={loading || building || !message.trim()}
          style={{
            padding: "0 18px",
            borderRadius: "13px",
            background:
              loading || building || !message.trim()
                ? "#555"
                : BRAND.accent,
            color: "#000",
            fontWeight: 900,
            border: "none",
            cursor:
              loading || building || !message.trim()
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