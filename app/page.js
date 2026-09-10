"use client";

import { useEffect, useRef, useState } from "react";

const BRAND = {
  name: "BOMBA AI",
  tagline: "Automate. Grow. Earn.",
  accent: "#FFD43B",
};

const CONTENT_SYSTEM = [
  "You are BOMBA AI, a practical business and content assistant.",
  "Create useful, professional content for businesses and entrepreneurs.",
  "Use Nigerian context and ₦ when money is mentioned.",
].join(" ");

const APP_PLAN_SYSTEM = [
  "You are BOMBA AI App Builder.",
  "Create a clear plan for the NEW app request.",
  "Do not write HTML or code during the planning step.",
  "Use these sections: App Name, Purpose, Main Features, Screens, Navigation, User Flow, Data Needed, Design/UI, Functional Behavior.",
  "Keep the plan practical and easy to understand.",
  "End with: Ready to build? Click Build This App 🚀 below.",
].join(" ");

const APP_BUILD_SYSTEM = [
  "You are BOMBA AI App Builder.",
  "Build the current app from the user's request and app plan.",
  "Return ONLY one complete standalone HTML document.",
  "Start with <!DOCTYPE html> and finish with </html>.",
  "Include responsive CSS and working JavaScript.",
  "The result must work directly when opened in a browser.",
  "Do not use markdown fences.",
  "Do not explain the code.",
  "Keep the HTML compact so the complete document is returned.",
].join(" ");

const INPUT_STYLE = {
  width: "100%",
  boxSizing: "border-box",
  padding: "13px 14px",
  borderRadius: "10px",
  border: "1px solid #333",
  background: "#111",
  color: "white",
  fontSize: "15px",
  outline: "none",
};

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return map[char];
  });
}

function isPlan(text) {
  if (!text) return false;

  const lower = text.toLowerCase();

  if (
    lower.includes("<!doctype") ||
    lower.includes("<html") ||
    lower.includes("```html")
  ) {
    return false;
  }

  const sections = [
    "app name",
    "purpose",
    "main features",
    "screens",
    "navigation",
    "user flow",
    "data needed",
    "design",
    "functional behavior",
  ];

  const matches = sections.filter((section) => lower.includes(section));

  return matches.length >= 4;
}

function extractHtml(text) {
  if (!text) return "";

  let html = String(text).trim();

  html = html
    .replace(/^```html\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const doctypeIndex = html.search(/<!doctype\s+html/i);
  const htmlIndex = html.search(/<html[\s>]/i);

  let start = -1;

  if (doctypeIndex >= 0) {
    start = doctypeIndex;
  } else if (htmlIndex >= 0) {
    start = htmlIndex;
  }

  if (start < 0) return "";

  html = html.slice(start).trim();

  const endIndex = html.search(/<\/html>/i);

  if (endIndex >= 0) {
    return html.slice(0, endIndex + 7).trim();
  }

  if (/<body[\s>]/i.test(html)) {
    if (!/<\/body>/i.test(html)) {
      html += "</body>";
    }

    if (!/<\/html>/i.test(html)) {
      html += "</html>";
    }

    return html;
  }

  return "";
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("app");

  const [contentMessages, setContentMessages] = useState([
    {
      role: "assistant",
      content:
        "👋 Welcome to BOMBA AI Content Creator.\n\nTell me what content you want to create.",
    },
  ]);

  const [appMessages, setAppMessages] = useState([
    {
      role: "assistant",
      content:
        "👋 Welcome to BOMBA AI App Builder.\n\nDescribe the app you want to build and I will create an App Plan first.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [building, setBuilding] = useState(false);

  const [appRequest, setAppRequest] = useState("");
  const [appPlan, setAppPlan] = useState("");
  const [generatedHtml, setGeneratedHtml] = useState("");

  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef(null);

  // Flyer state
  const [businessName, setBusinessName] = useState("Kingsley Shoes");
  const [headline, setHeadline] = useState("STEP UP YOUR GAME");
  const [description, setDescription] = useState(
    "Premium stylish sneakers designed to elevate your everyday look."
  );
  const [price, setPrice] = useState("₦25,000");
  const [phone, setPhone] = useState("08000000000");

  const messages = activeTab === "app" ? appMessages : contentMessages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  function switchTab(tab) {
    setActiveTab(tab);
    setInput("");
  }

  async function callAI(message, system) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        system,
      }),
    });

    const raw = await response.text();

    let data = {};

    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error("The AI server returned an invalid response.");
    }

    if (!response.ok) {
      throw new Error(data.error || "AI request failed.");
    }

    if (!data.reply) {
      throw new Error("The AI did not return a response.");
    }

    return data.reply;
  }

  async function sendMessage(event) {
    event?.preventDefault();

    if (!input.trim() || loading || building) return;

    const request = input.trim();

    setInput("");
    setLoading(true);

    if (activeTab === "content") {
      setContentMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: request,
        },
      ]);

      try {
        const reply = await callAI(request, CONTENT_SYSTEM);

        setContentMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: reply,
          },
        ]);
      } catch (error) {
        setContentMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "⚠️ " + error.message,
          },
        ]);
      } finally {
        setLoading(false);
      }

      return;
    }

    // APP BUILDER
    setAppRequest(request);
    setAppPlan("");
    setGeneratedHtml("");

    setAppMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: request,
      },
      {
        role: "assistant",
        content: "🧠 Creating your App Plan...",
      },
    ]);

    try {
      const planPrompt = [
        "Create an App Plan ONLY.",
        "",
        "NEW APP REQUEST:",
        request,
        "",
        "This is a new request. Do not carry over requirements from older requests.",
      ].join("\n");

      const reply = await callAI(planPrompt, APP_PLAN_SYSTEM);

      if (!isPlan(reply)) {
        setAppMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "⚠️ I received an incomplete App Plan. Please send the app request again.",
          },
        ]);
        return;
      }

      setAppPlan(reply);

      setAppMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply,
        },
      ]);
    } catch (error) {
      setAppMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ " + error.message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function buildApp() {
    if (!appRequest || !appPlan || building) return;

    setBuilding(true);

    setAppMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "🔨 Building your app...\n\nPlease wait a moment.",
      },
    ]);

    const buildPrompt = [
      "BUILD THIS CURRENT APP.",
      "",
      "USER'S CURRENT APP REQUEST:",
      appRequest,
      "",
      "CURRENT APP PLAN:",
      appPlan,
      "",
      "Return only the complete standalone HTML document.",
      "Keep it compact but make the main features functional.",
      "Do not include markdown.",
    ].join("\n");

    try {
      let reply = await callAI(buildPrompt, APP_BUILD_SYSTEM);
      let html = extractHtml(reply);

      // Automatic second attempt if the first response was incomplete.
      if (!html) {
        setAppMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "🔄 The first build was incomplete. Trying a smaller version...",
          },
        ]);

        const retryPrompt = [
          "REBUILD THIS APP IN A SMALLER FORMAT.",
          "",
          "APP REQUEST:",
          appRequest,
          "",
          "APP PLAN:",
          appPlan,
          "",
          "Return ONLY complete HTML.",
          "Start with <!DOCTYPE html>.",
          "End with </html>.",
          "Use compact CSS and JavaScript.",
          "Prioritize the main working features.",
        ].join("\n");

        reply = await callAI(retryPrompt, APP_BUILD_SYSTEM);
        html = extractHtml(reply);
      }

      if (!html) {
        throw new Error(
          "The AI returned incomplete HTML. Please press Build This App again."
        );
      }

      setGeneratedHtml(html);

      setAppMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "✅ Your app has been built successfully!\n\nScroll down to see the Live Preview.",
        },
      ]);
    } catch (error) {
      setAppMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Build failed: " + error.message,
        },
      ]);
    } finally {
      setBuilding(false);
    }
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      alert("Copy failed. Please select and copy the text manually.");
    }
  }

  function downloadApp() {
    if (!generatedHtml) return;

    const blob = new Blob([generatedHtml], {
      type: "text/html",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "bomba-ai-app.html";
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function startNewApp() {
    setAppRequest("");
    setAppPlan("");
    setGeneratedHtml("");

    setAppMessages([
      {
        role: "assistant",
        content:
          "👋 New App Builder session started.\n\nDescribe the app you want to build.",
      },
    ]);

    setInput("");
  }

  function downloadFlyer() {
    const popup = window.open("", "_blank");

    if (!popup) {
      alert("Please allow pop-ups to save your flyer.");
      return;
    }

    const business = escapeHtml(businessName).toUpperCase();
    const title = escapeHtml(headline).toUpperCase();
    const text = escapeHtml(description);
    const amount = escapeHtml(price);
    const contact = escapeHtml(phone);

    const flyerHtml = [
      "<!DOCTYPE html>",
      "<html>",
      "<head>",
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      "<title>BOMBA AI Flyer</title>",
      "<style>",
      "*{box-sizing:border-box}",
      "body{margin:0;background:#111;display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:Arial,sans-serif}",
      ".flyer{width:1080px;height:1080px;padding:76px;position:relative;overflow:hidden;background:radial-gradient(circle at 85% 12%,rgba(255,212,59,.35),transparent 28%),linear-gradient(135deg,#050505,#171717 50%,#000);color:#fff}",
      ".brand{color:#ffd43b;font-size:42px;font-weight:900;letter-spacing:2px}",
      ".badge{display:inline-block;margin-top:55px;padding:10px 20px;border-radius:30px;background:#ffd43b;color:#000;font-size:18px;font-weight:900}",
      "h1{max-width:800px;margin:40px 0 0;font-size:88px;line-height:.92;font-weight:900}",
      ".description{max-width:650px;margin-top:35px;font-size:27px;line-height:1.3;color:#eee}",
      ".price-label{margin-top:45px;color:#ddd;font-size:20px;font-weight:bold}",
      ".price{color:#ffd43b;font-size:76px;font-weight:900}",
      ".shoe{position:absolute;right:70px;top:430px;font-size:180px;transform:rotate(-10deg)}",
      ".bottom{position:absolute;left:76px;right:76px;bottom:76px;padding-top:35px;border-top:2px solid rgba(255,255,255,.2);display:flex;justify-content:space-between;align-items:center;font-size:21px}",
      ".order{color:#ffd43b;font-weight:bold}",
      ".shop{background:#ffd43b;color:#000;padding:14px 25px;border-radius:30px;font-weight:900}",
      "@media print{body{background:#fff}.flyer{margin:0}}",
      "</style>",
      "</head>",
      "<body>",
      '<div class="flyer">',
      '<div class="brand">' + business + "</div>",
      '<div class="badge">NEW COLLECTION</div>',
      "<h1>" + title + "</h1>",
      '<div class="description">' + text + "</div>",
      '<div class="price-label">STARTING FROM</div>',
      '<div class="price">' + amount + "</div>",
      '<div class="shoe">👟</div>',
      '<div class="bottom">',
      "<div><span class=\"order\">ORDER NOW</span><br>WhatsApp: " +
        contact +
        "</div>",
      '<div class="shop">SHOP NOW</div>',
      "</div>",
      "</div>",
      '<script>window.onload=function(){setTimeout(function(){window.print();},400)};<\/script>',
      "</body>",
      "</html>",
    ].join("");

    popup.document.open();
    popup.document.write(flyerHtml);
    popup.document.close();
  }

  const tabButton = (active) => ({
    flex: 1,
    minWidth: 0,
    minHeight: "52px",
    padding: "10px 5px",
    border: "none",
    background: active ? "#111" : "transparent",
    color: active ? BRAND.accent : "#888",
    fontWeight: 800,
    fontSize: "12px",
    cursor: "pointer",
    touchAction: "manipulation",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "#fff",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          background: BRAND.accent,
          color: "#000",
          padding: "15px 12px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "22px",
            fontWeight: 950,
          }}
        >
          🤖 BOMBA AI
        </div>

        <div
          style={{
            marginTop: "3px",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          {BRAND.tagline}
        </div>
      </header>

      {/* TABS */}
      <nav
        style={{
          display: "flex",
          borderBottom: "1px solid #222",
          background: "#090909",
        }}
      >
        <button
          type="button"
          onClick={() => switchTab("content")}
          style={tabButton(activeTab === "content")}
        >
          💬 Content Creator
        </button>

        <button
          type="button"
          onClick={() => switchTab("app")}
          style={tabButton(activeTab === "app")}
        >
          🚀 App Builder
        </button>

        <button
          type="button"
          onClick={() => switchTab("flyer")}
          style={tabButton(activeTab === "flyer")}
        >
          🎨 Flyer
        </button>
      </nav>

      {/* CONTENT CREATOR / APP BUILDER */}
      {activeTab !== "flyer" && (
        <>
          <main
            style={{
              maxWidth: "850px",
              margin: "0 auto",
              padding: "18px 14px 170px",
            }}
          >
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent:
                    message.role === "user"
                      ? "flex-end"
                      : "flex-start",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    maxWidth: "92%",
                    background:
                      message.role === "user" ? BRAND.accent : "#171717",
                    color:
                      message.role === "user" ? "#000" : "#fff",
                    padding: "13px 15px",
                    borderRadius: "16px",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.5,
                    fontSize: "15px",
                  }}
                >
                  {message.content}

                  {message.role === "assistant" &&
                    message.content.length > 100 && (
                      <button
                        type="button"
                        onClick={() => copyText(message.content)}
                        style={{
                          display: "block",
                          marginTop: "10px",
                          padding: "6px 10px",
                          borderRadius: "8px",
                          border: "1px solid #444",
                          background: "#222",
                          color: "#fff",
                          fontSize: "11px",
                          cursor: "pointer",
                        }}
                      >
                        Copy
                      </button>
                    )}
                </div>
              </div>
            ))}

            {loading && (
              <div
                style={{
                  display: "inline-block",
                  background: "#171717",
                  color: "#aaa",
                  padding: "12px 15px",
                  borderRadius: "16px",
                }}
              >
                🧠 Thinking...
              </div>
            )}

            <div ref={messagesEndRef} />

            {/* BUILD BUTTON */}
            {activeTab === "app" &&
              appPlan &&
              !generatedHtml &&
              !building &&
              !loading && (
                <div
                  style={{
                    marginTop: "18px",
                    padding: "16px",
                    background: "#101010",
                    border: "1px solid #292929",
                    borderRadius: "14px",
                  }}
                >
                  <div
                    style={{
                      color: BRAND.accent,
                      fontWeight: 800,
                      marginBottom: "10px",
                    }}
                  >
                    🚀 Your App Plan is ready
                  </div>

                  <button
                    type="button"
                    onClick={buildApp}
                    style={{
                      width: "100%",
                      padding: "14px",
                      border: "none",
                      borderRadius: "11px",
                      background: BRAND.accent,
                      color: "#000",
                      fontWeight: 900,
                      fontSize: "15px",
                      cursor: "pointer",
                    }}
                  >
                    🔨 Build This App 🚀
                  </button>
                </div>
              )}

            {/* LIVE PREVIEW */}
            {generatedHtml && (
              <section
                style={{
                  marginTop: "22px",
                  padding: "14px",
                  background: "#101010",
                  border: "1px solid #292929",
                  borderRadius: "14px",
                }}
              >
                <h2
                  style={{
                    margin: "0 0 12px",
                    color: BRAND.accent,
                    fontSize: "20px",
                  }}
                >
                  🖥️ Live Preview
                </h2>

                <iframe
                  title="BOMBA AI Generated App"
                  srcDoc={generatedHtml}
                  sandbox="allow-scripts allow-forms"
                  style={{
                    width: "100%",
                    height: "600px",
                    border: "1px solid #333",
                    borderRadius: "10px",
                    background: "#fff",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "12px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => copyText(generatedHtml)}
                    style={{
                      flex: 1,
                      padding: "12px 8px",
                      border: "none",
                      borderRadius: "10px",
                      background: "#fff",
                      color: "#000",
                      fontWeight: 800,
                    }}
                  >
                    {copied ? "✅ Copied" : "📋 Copy HTML"}
                  </button>

                  <button
                    type="button"
                    onClick={downloadApp}
                    style={{
                      flex: 1,
                      padding: "12px 8px",
                      border: "none",
                      borderRadius: "10px",
                      background: BRAND.accent,
                      color: "#000",
                      fontWeight: 800,
                    }}
                  >
                    📥 Download
                  </button>
                </div>

                <button
                  type="button"
                  onClick={startNewApp}
                  style={{
                    width: "100%",
                    marginTop: "9px",
                    padding: "11px",
                    border: "1px solid #444",
                    borderRadius: "10px",
                    background: "#181818",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  ➕ Build Another App
                </button>
              </section>
            )}
          </main>

          {/* CHAT INPUT */}
          <form
            onSubmit={sendMessage}
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              background: "#090909",
              borderTop: "1px solid #252525",
              padding: "10px 12px",
              zIndex: 20,
            }}
          >
            <div
              style={{
                maxWidth: "850px",
                margin: "0 auto",
                display: "flex",
                gap: "8px",
                alignItems: "stretch",
              }}
            >
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder={
                  activeTab === "app"
                    ? "Describe the app you want to build..."
                    : "Tell BOMBA AI what content you need..."
                }
                disabled={loading || building}
                rows={2}
                style={{
                  ...INPUT_STYLE,
                  resize: "none",
                  minHeight: "50px",
                }}
              />

              <button
                type="submit"
                disabled={
                  loading ||
                  building ||
                  !input.trim()
                }
                style={{
                  width: "80px",
                  border: "none",
                  borderRadius: "10px",
                  background: BRAND.accent,
                  color: "#000",
                  fontWeight: 900,
                  fontSize: "14px",
                  opacity:
                    loading ||
                    building ||
                    !input.trim()
                      ? 0.5
                      : 1,
                }}
              >
                Send
              </button>
            </div>
          </form>
        </>
      )}

      {/* FLYER GENERATOR */}
      {activeTab === "flyer" && (
        <main
          style={{
            maxWidth: "700px",
            margin: "0 auto",
            padding: "20px 14px 40px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              color: BRAND.accent,
            }}
          >
            🎨 Flyer Generator
          </h2>

          <p
            style={{
              color: "#aaa",
              fontSize: "14px",
            }}
          >
            Create a square promotional flyer for your business.
          </p>

          <label>Business Name</label>
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            style={INPUT_STYLE}
          />

          <label
            style={{
              display: "block",
              marginTop: "14px",
            }}
          >
            Main Headline
          </label>
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            style={INPUT_STYLE}
          />

          <label
            style={{
              display: "block",
              marginTop: "14px",
            }}
          >
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{
              ...INPUT_STYLE,
              resize: "vertical",
            }}
          />

          <label
            style={{
              display: "block",
              marginTop: "14px",
            }}
          >
            Price
          </label>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={INPUT_STYLE}
          />

          <label
            style={{
              display: "block",
              marginTop: "14px",
            }}
          >
            WhatsApp / Phone
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={INPUT_STYLE}
          />

          <h3
            style={{
              color: BRAND.accent,
              textAlign: "center",
              marginTop: "25px",
            }}
          >
            Live Preview
          </h3>

          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              aspectRatio: "1 / 1",
              margin: "0 auto",
              padding: "7%",
              boxSizing: "border-box",
              position: "relative",
              overflow: "hidden",
              borderRadius: "8px",
              background:
                "radial-gradient(circle at 85% 12%, rgba(255,212,59,.35), transparent 28%), linear-gradient(135deg,#050505,#171717 50%,#000)",
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  color: BRAND.accent,
                  fontSize: "clamp(18px,4vw,28px)",
                  fontWeight: 900,
                  letterSpacing: "1.5px",
                }}
              >
                {businessName.toUpperCase() ||
                  "YOUR BUSINESS"}
              </div>

              <div
                style={{
                  display: "inline-block",
                  marginTop: "12px",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  background: BRAND.accent,
                  color: "#000",
                  fontSize: "12px",
                  fontWeight: 900,
                }}
              >
                NEW COLLECTION
              </div>

              <h2
                style={{
                  margin: "14px 0 0",
                  fontSize: "clamp(28px,6vw,42px)",
                  lineHeight: 0.95,
                  fontWeight: 900,
                  textTransform: "uppercase",
                }}
              >
                {headline || "YOUR HEADLINE"}
              </h2>

              <p
                style={{
                  marginTop: "12px",
                  fontSize: "14px",
                  lineHeight: 1.4,
                  color: "#eee",
                  maxWidth: "75%",
                }}
              >
                {description}
              </p>

              <div style={{ marginTop: "18px" }}>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#ccc",
                    fontWeight: 600,
                  }}
                >
                  STARTING FROM
                </div>

                <div
                  style={{
                    color: BRAND.accent,
                    fontSize: "clamp(26px,5vw,36px)",
                    fontWeight: 900,
                  }}
                >
                  {price}
                </div>
              </div>
            </div>

            <div
              style={{
                borderTop:
                  "2px solid rgba(255,255,255,.2)",
                paddingTop: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "13px",
              }}
            >
              <div>
                <strong
                  style={{
                    color: BRAND.accent,
                  }}
                >
                  ORDER NOW
                </strong>
                <br />
                WhatsApp: {phone}
              </div>

              <div
                style={{
                  background: BRAND.accent,
                  color: "#000",
                  padding: "8px 14px",
                  borderRadius: "20px",
                  fontWeight: 900,
                  fontSize: "12px",
                }}
              >
                SHOP NOW
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={downloadFlyer}
            style={{
              display: "block",
              width: "100%",
              maxWidth: "420px",
              margin: "20px auto 0",
              padding: "14px",
              border: "none",
              borderRadius: "12px",
              background: "#fff",
              color: "#000",
              fontWeight: 900,
              fontSize: "16px",
            }}
          >
            📥 Save / Print Flyer
          </button>
        </main>
      )}
    </div>
  );
}