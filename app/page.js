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
"🚀 App Builder Mode ON\n\nDescribe the app you want to build. I will first create an App Plan. After you review it, click Build This App 🚀.",
system: `You are BOMBA AI Universal App Builder.

IMPORTANT CONTEXT RULE:
Treat every new user request as a completely new application request.
Do NOT continue, reuse, or assume details from an older app request unless those details are explicitly included in the current request.

STEP 1 — APP PLAN

When the user describes an app, create ONLY a clear App Plan.

Include:

1. App Name
2. App Purpose
3. Main Features
4. Screens / Pages
5. Navigation
6. User Flow
7. Data Needed
8. Design / UI
9. Functional Behavior

Do not generate source code during STEP 1.

Finish the plan with:
Ready to build? Click Build This App 🚀 below.

STEP 2 — BUILD

When the user explicitly asks to build the app, generate ONE complete standalone HTML application based ONLY on the current App Plan.

Rules:

- Start with <!DOCTYPE html>
- End with </html>
- Include all CSS inside the HTML
- Include all JavaScript inside the HTML
- Make it mobile-friendly
- Make it professional
- Make buttons functional
- Make navigation functional
- Do not include BOMBA AI branding inside the generated application
- Do not explain the code outside the HTML
- Return only the complete HTML`,
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
const [building, setBuilding] = useState(false);

const [currentAppRequest, setCurrentAppRequest] = useState("");
const [appPlan, setAppPlan] = useState("");
const [generatedHtml, setGeneratedHtml] = useState("");

const [showPreview, setShowPreview] = useState(false);

const [copied, setCopied] = useState(false);
const [copiedIndex, setCopiedIndex] = useState(null);

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

setCurrentAppRequest("");
setAppPlan("");
setGeneratedHtml("");

setShowPreview(false);
setCopied(false);
setCopiedIndex(null);

setLoading(false);
setBuilding(false);

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
  throw new Error(data?.error || "AI server error");
}

return (
  data?.reply ||
  data?.message ||
  data?.content ||
  ""
);

}

function extractHtml(text) {
if (!text) return null;

const htmlBlock = text.match(
  /```html\s*([\s\S]*?)```/i
);

if (htmlBlock?.[1]) {
  return htmlBlock[1].trim();
}

const doctypeStart = text.search(
  /<!doctype html/i
);

const htmlStart = text.search(
  /<html[\s>]/i
);

let start = -1;

if (doctypeStart >= 0 && htmlStart >= 0) {
  start = Math.min(doctypeStart, htmlStart);
} else if (doctypeStart >= 0) {
  start = doctypeStart;
} else if (htmlStart >= 0) {
  start = htmlStart;
}

if (start >= 0) {
  const html = text.slice(start).trim();

  const endMatch = html.match(
    /<\/html>\s*$/i
  );

  if (endMatch) {
    return html.slice(
      0,
      endMatch.index + endMatch[0].length
    ).trim();
  }
}

return null;

}

function isValidPlan(text) {
if (!text) return false;

if (
  /<!doctype html|<html[\s>]|```html/i.test(text)
) {
  return false;
}

const planIndicators = [
  "app name",
  "app purpose",
  "main features",
  "screens",
  "navigation",
  "user flow",
  "data needed",
  "design",
  "functional behavior",
  "ready to build",
];

const lower = text.toLowerCase();

const matches = planIndicators.filter((item) =>
  lower.includes(item)
);

return matches.length >= 3;

}

async function handleSubmit(event) {
event.preventDefault();

const trimmed = message.trim();

if (
  !trimmed ||
  loading ||
  building
) {
  return;
}

setMessages((previous) => [
  ...previous,
  {
    role: "user",
    content: trimmed,
  },
]);

setMessage("");
setLoading(true);
setCopiedIndex(null);

try {
  if (mode === "app") {
    /*
     * NEW APP REQUEST
     *
     * We intentionally save only the current request.
     * This prevents an older app request from being reused.
     */

    setCurrentAppRequest(trimmed);
    setAppPlan("");
    setGeneratedHtml("");
    setShowPreview(false);

    const appRequest = `

NEW APPLICATION REQUEST

Ignore all previous application requests.

Build an App Plan ONLY for this new request:

${trimmed}

Do not use requirements from any previous app.
Do not generate HTML.
Follow STEP 1 exactly.
End with:

Ready to build? Click Build This App 🚀 below.
`;

    const reply = await callAI({
      userContent: appRequest,
      system: MODES.app.system,
    });

    if (isValidPlan(reply)) {
      setAppPlan(reply);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: reply,
        },
      ]);
    } else {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            "⚠️ I couldn't create a proper App Plan for that request.\n\nPlease describe the app again with its main purpose and features.",
        },
      ]);
    }
  } else {
    const reply = await callAI({
      userContent: trimmed,
      system: MODES.content.system,
    });

    setMessages((previous) => [
      ...previous,
      {
        role: "assistant",
        content:
          reply ||
          "No response received from BOMBA AI.",
      },
    ]);
  }
} catch (error) {
  console.error("AI request error:", error);

  setMessages((previous) => [
    ...previous,
    {
      role: "assistant",
      content:
        "⚠️ Something went wrong while connecting to BOMBA AI.\n\nPlease try again.",
    },
  ]);
} finally {
  setLoading(false);
}

}

async function handleBuildApp() {
if (
!appPlan ||
!currentAppRequest ||
building
) {
return;
}

setBuilding(true);
setLoading(true);
setShowPreview(false);
setGeneratedHtml("");

setMessages((previous) => [
  ...previous,
  {
    role: "user",
    content: "Build This App 🚀",
  },
  {
    role: "assistant",
    content:
      "🔨 Building your application...\n\nPlease wait while BOMBA AI creates the working app.",
  },
]);

try {
  const buildRequest = `

BUILD THIS APPLICATION.

IMPORTANT:
This is the current application request. Ignore all previous unrelated requests.

CURRENT APP REQUEST:
${currentAppRequest}

CURRENT APP PLAN:
${appPlan}

Create the application described above.

Return ONLY one complete standalone HTML document.

The response MUST:

- Begin with <!DOCTYPE html>

- End with </html>

- Contain all CSS inside the HTML

- Contain all JavaScript inside the HTML

- Be mobile-friendly

- Have working buttons

- Have working navigation where applicable

- Be a usable application, not a description

- Not contain BOMBA AI branding

- Not contain markdown fences

- Not contain explanations before or after the HTML
  `;
  
  const reply = await callAI({
  userContent: buildRequest,
  system: MODES.app.system,
});

const html = extractHtml(reply);

if (!html) {
  setMessages((previous) => [
    ...previous,
    {
      role: "assistant",
      content:
        "⚠️ BOMBA AI received a response, but it was not a complete HTML application.\n\nPlease click Build This App again.",
    },
  ]);

  return;
}

setGeneratedHtml(html);
setShowPreview(true);

setMessages((previous) => [
  ...previous,
  {
    role: "assistant",
    content:
      "✅ Your application has been built successfully!\n\nYou can preview it below, copy the complete HTML, or download it.",
  },
]);
  
  } catch (error) {
  console.error("Build error:", error);
  
  setMessages((previous) => [
  ...previous,
  {
    role: "assistant",
    content:
      "⚠️ The app build failed.\n\nPlease try clicking Build This App 🚀 again.",
  },
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

  setTimeout(() => {
    setCopiedIndex(null);
  }, 2000);
} else {
  setCopied(true);

  setTimeout(() => {
    setCopied(false);
  }, 2000);
}
  
  } catch {
  alert(
  "Could not copy automatically. Please select and copy the text manually."
  );
  }
  }
  
  function downloadApp() {
  if (!generatedHtml) {
  return;
  }
  
  const blob = new Blob(
  [generatedHtml],
  {
  type: "text/html;charset=utf-8",
  }
  );
  
  const url =
  URL.createObjectURL(blob);
  
  const link =
  document.createElement("a");
  
  link.href = url;
  link.download = "bomba-app.html";
  
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
  }
  
  function startNewApp() {
  setCurrentAppRequest("");
  setAppPlan("");
  setGeneratedHtml("");
  setShowPreview(false);
  setCopied(false);
  setCopiedIndex(null);
  
  setMessages([
  {
  role: "assistant",
  content:
  "🚀 New App Builder session started.\n\nDescribe the new app you want to build. I will create a fresh App Plan without carrying over the previous app.",
  },
  ]);
  }
  
  const showBuildButton =
  mode === "app" &&
  appPlan &&
  currentAppRequest &&
  !generatedHtml &&
  !building;
  
  return (
  
    <main
    style={{
      minHeight: "100vh",
      background: "#000",
      color: "#fff",
      fontFamily:
        "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      paddingBottom: "120px",
    }}
  >
    {/* HEADER */}<header
  style={{
    padding: "20px 16px",
    textAlign: "center",
    borderBottom:
      "1px solid #222",
  }}
>
  <div
    style={{
      width: 58,
      height: 58,
      borderRadius: 16,
      background:
        BRAND.accent,
      color: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin:
        "0 auto 10px",
      fontWeight: 900,
      fontSize: 23,
      boxShadow:
        "0 0 20px rgba(255,212,59,0.18)",
    }}
  >
    TB
  </div>

  <h1
    style={{
      margin: 0,
      fontSize: 32,
      fontWeight: 900,
      letterSpacing: -1,
    }}
  >
    {BRAND.name}
  </h1>

  <p
    style={{
      margin:
        "6px 0 0",
      color: "#aaa",
      fontSize: 14,
    }}
  >
    {BRAND.tagline}
  </p>
</header>

<div
  style={{
    maxWidth: 900,
    margin: "0 auto",
    padding: 16,
  }}
>
  {/* MODE SWITCH */}

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "1fr 1fr",
      gap: 10,
      marginBottom: 20,
    }}
  >
    {Object.entries(
      MODES
    ).map(
      ([key, item]) => (
        <button
          key={key}
          type="button"
          onClick={() =>
            switchMode(key)
          }
          style={{
            padding:
              "14px 10px",
            borderRadius: 14,
            border:
              mode === key
                ? `2px solid ${BRAND.accent}`
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
            {item.icon}{" "}
            {item.name}
          </div>

          <small
            style={{
              display: "block",
              marginTop: 4,
              opacity: 0.7,
            }}
          >
            {item.description}
          </small>
        </button>
      )
    )}
  </div>

  {/* NEW APP BUTTON */}

  {mode === "app" &&
    (appPlan ||
      generatedHtml) && (
      <button
        type="button"
        onClick={
          startNewApp
        }
        style={{
          width: "100%",
          marginBottom: 16,
          padding: 12,
          borderRadius: 12,
          border:
            "1px solid #333",
          background: "#111",
          color: "#fff",
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        ➕ Start New App
      </button>
    )}

  {/* MESSAGES */}

  {messages.map(
    (msg, index) => (
      <div
        key={index}
        style={{
          marginBottom: 14,
          textAlign:
            msg.role ===
            "user"
              ? "right"
              : "left",
        }}
      >
        <div
          style={{
            display:
              "inline-block",
            maxWidth: "92%",
            padding:
              "12px 14px",
            borderRadius: 14,
            background:
              msg.role ===
              "user"
                ? "#222"
                : "#111",
            border:
              "1px solid #333",
            whiteSpace:
              "pre-wrap",
            lineHeight: 1.5,
            textAlign:
              "left",
            overflowWrap:
              "anywhere",
          }}
        >
          {msg.content}

          {msg.role ===
            "assistant" && (
            <div
              style={{
                marginTop: 10,
              }}
            >
              <button
                type="button"
                onClick={() =>
                  copyText(
                    msg.content,
                    index
                  )
                }
                style={{
                  padding:
                    "7px 12px",
                  borderRadius: 8,
                  border:
                    "1px solid #444",
                  background:
                    "#222",
                  color:
                    "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor:
                    "pointer",
                }}
              >
                {copiedIndex ===
                index
                  ? "✅ Copied"
                  : "📋 Copy"}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  )}

  {/* THINKING */}

  {loading &&
    !building && (
      <div
        style={{
          color:
            BRAND.accent,
          fontWeight: 700,
          padding:
            "8px 0",
        }}
      >
        BOMBA AI is
        thinking...
      </div>
    )}

  {/* BUILD BUTTON */}

  {showBuildButton && (
    <button
      type="button"
      onClick={
        handleBuildApp
      }
      disabled={building}
      style={{
        width: "100%",
        padding: 16,
        margin:
          "12px 0 20px",
        borderRadius: 14,
        border: "none",
        background:
          BRAND.accent,
        color: "#000",
        fontSize: 17,
        fontWeight: 900,
        cursor:
          building
            ? "not-allowed"
            : "pointer",
        boxShadow:
          "0 8px 25px rgba(255,212,59,0.12)",
      }}
    >
      {building
        ? "🔨 Building..."
        : "Build This App 🚀"}
    </button>
  )}

  {/* PREVIEW */}

  {showPreview &&
    generatedHtml && (
      <section
        style={{
          marginTop: 20,
          padding: 12,
          borderRadius: 16,
          border:
            "1px solid #FFD43B",
          background: "#111",
        }}
      >
        <h2
          style={{
            margin:
              "0 0 12px",
            color:
              BRAND.accent,
            fontSize: 20,
          }}
        >
          📱 Live App Preview
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <button
            type="button"
            onClick={() =>
              copyText(
                generatedHtml
              )
            }
            style={{
              padding: 14,
              borderRadius: 12,
              border: "none",
              background:
                BRAND.accent,
              color: "#000",
              fontWeight: 900,
              cursor:
                "pointer",
            }}
          >
            {copied
              ? "✅ Copied!"
              : "📋 Copy Full App"}
          </button>

          <button
            type="button"
            onClick={
              downloadApp
            }
            style={{
              padding: 14,
              borderRadius: 12,
              border:
                "2px solid #FFD43B",
              background:
                "#222",
              color:
                BRAND.accent,
              fontWeight: 900,
              cursor:
                "pointer",
            }}
          >
            ⬇️ Download
          </button>
        </div>

        <iframe
          title="Generated App Preview"
          srcDoc={
            generatedHtml
          }
          style={{
            width: "100%",
            height: 600,
            border:
              "1px solid #333",
            borderRadius: 12,
            background:
              "#fff",
          }}
          sandbox="allow-scripts allow-forms"
        />
      </section>
    )}
</div>

{/* INPUT AREA */}

<form
  onSubmit={
    handleSubmit
  }
  style={{
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    background:
      "#050505",
    borderTop:
      "1px solid #222",
    padding: 12,
    zIndex: 50,
  }}
>
  <div
    style={{
      maxWidth: 900,
      margin: "0 auto",
      display: "flex",
      gap: 8,
    }}
  >
    <textarea
      value={message}
      onChange={(event) =>
        setMessage(
          event.target.value
        )
      }
      placeholder={
        MODES[mode]
          .placeholder
      }
      rows={2}
      disabled={
        loading ||
        building
      }
      onKeyDown={(event) => {
        if (
          event.key ===
            "Enter" &&
          !event.shiftKey
        ) {
          event.preventDefault();

          if (
            message.trim() &&
            !loading &&
            !building
          ) {
            event.currentTarget.form?.requestSubmit();
          }
        }
      }}
      style={{
        flex: 1,
        resize: "none",
        padding: 12,
        borderRadius: 12,
        border:
          "1px solid #333",
        background:
          "#111",
        color: "#fff",
        fontSize: 15,
        outline: "none",
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
        minWidth: 70,
        padding:
          "12px 10px",
        borderRadius: 12,
        border: "none",
        background:
          loading ||
          building ||
          !message.trim()
            ? "#555"
            : BRAND.accent,
        color:
          loading ||
          building ||
          !message.trim()
            ? "#aaa"
            : "#000",
        fontWeight: 900,
        cursor:
          loading ||
          building ||
          !message.trim()
            ? "not-allowed"
            : "pointer",
      }}
    >
      {loading ||
      building
        ? "..."
        : "Send"}
    </button>
  </div>

  <div
    style={{
      maxWidth: 900,
      margin:
        "6px auto 0",
      textAlign: "center",
      color: "#666",
      fontSize: 11,
    }}
  >
    Enter to send •
    Shift + Enter for
    new line
  </div>
</form>

<div
  ref={
    messagesEndRef
  }
/>
  
    </main>
);

}