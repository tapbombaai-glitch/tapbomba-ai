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
"The user's latest app request is the current specification.\n" +
"Do not unnecessarily reuse unrelated older requests.\n\n" +
"FIRST create a clear App Plan containing:\n" +
"- App name\n" +
"- Purpose\n" +
"- Main features\n" +
"- Screens/pages\n" +
"- Navigation\n" +
"- User flow\n" +
"- Data needed\n" +
"- Database structure\n" +
"- Money/payment structure if requested\n" +
"- Admin structure if requested\n" +
"- Design/UI\n" +
"- Functional behavior\n\n" +
'End every plan with: Ready to build? Click Build This App 🚀 below.\n\n' +
"Only generate the application when the user explicitly requests the build.\n" +
"When building, return the complete standalone HTML application in one HTML code block.\n" +
"Do not claim functionality that was not actually implemented.",
},
};

export default function Home() {
const [mode, setMode] = useState("content");
const [message, setMessage] = useState("");
const [messages, setMessages] = useState([
{
role: "assistant",
content:
"Hello! 👋 I'm BOMBA AI.\n\nChoose a tool above and tell me what you want to create.",
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
document.body.style.margin = "0";
document.body.style.background = "#030303";
document.body.style.color = "#fff";

return () => {
  document.body.style.margin = "";
  document.body.style.background = "";
  document.body.style.color = "";
};

}, []);

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
if (!text) return null;

const fenced = text.match(/```html\s*([\s\S]*?)```/i);

if (fenced?.[1]) return fenced[1].trim();

const generic = text.match(/```\s*([\s\S]*?)```/);

if (
  generic?.[1] &&
  /<(!doctype|html|head|body)/i.test(generic[1])
) {
  return generic[1].trim();
}

const start = text.search(/<!doctype html|<html[\s>]/i);

if (start >= 0) {
  const html = text.slice(start).trim();
  const end = html.search(/<\/html>\s*$/i);

  if (end >= 0) {
    return html.slice(0, end + 7).trim();
  }
}

return null;

}

function isPlanReply(text) {
if (!text) return false;

const containsHtml =
  /<!doctype html|<html[\s>]|```html/i.test(text);

const hasPlan =
  /app name|purpose|features|screens|navigation|user flow|data needed|database|design|ui/i.test(
    text
  );

return !containsHtml && hasPlan;

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

if (!trimmed || loading || building) return;

setMessages((prev) => [
  ...prev,
  {
    role: "user",
    content: trimmed,
  },
]);

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
    } else if (isPlanReply(reply)) {
      setAppPlan(reply);
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
  console.error(error);

  setMessages((prev) => [
    ...prev,
    {
      role: "assistant",
      content:
        "⚠️ Something went wrong. Please check your connection and try again.",
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

setMessages((prev) => [
  ...prev,
  {
    role: "user",
    content: "Build This App 🚀",
  },
  {
    role: "assistant",
    content:
      "🔨 Building your application...\n\n" +
      "1️⃣ Understanding the requirements\n" +
      "2️⃣ Creating the application structure\n" +
      "3️⃣ Designing the data and money structure\n" +
      "4️⃣ Building screens and navigation\n" +
      "5️⃣ Adding functionality\n" +
      "6️⃣ Preparing the live preview\n\n" +
      "Please wait...",
  },
]);

const buildPrompt =
  "BUILD THE APPLICATION NOW.\n\n" +
  "Use ONLY this App Plan as the specification:\n\n" +
  appPlan +
  "\n\n" +
  "BUILD REQUIREMENTS:\n" +
  "- Create a complete functional mobile-friendly application.\n" +
  "- Include the requested screens, navigation and features.\n" +
  "- Include requested data, money and admin structures.\n" +
  "- Make important buttons and interactions functional.\n" +
  "- Make the interface professional.\n" +
  "- Keep the generated app self-contained.\n" +
  "- CSS must be inside the HTML.\n" +
  "- JavaScript must be inside the HTML.\n" +
  "- Do not include the BOMBA AI chat interface.\n" +
  "- Do not include the BOMBA AI header or logo.\n" +
  "- Build ONLY the requested application.\n" +
  "- Return ONLY one complete HTML code block.\n" +
  "- Start with <!DOCTYPE html>.\n" +
  "- End with </html>.";

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
          "✅ Your application has been generated.\n\nThe live preview is ready below.",
      },
    ]);
  } else {
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "⚠️ The AI responded, but I could not find the complete application HTML. Please try the build again.",
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
        "⚠️ App build failed. Please check your connection and try again.",
    },
  ]);
} finally {
  setBuilding(false);
  setLoading(false);
}

}

async function copyToClipboard(text, messageIndex = null) {
if (!text) return;

try {
  await navigator.clipboard.writeText(text);

  if (messageIndex !== null) {
    setCopiedMessageIndex(messageIndex);

    setTimeout(() => {
      setCopiedMessageIndex(null);
    }, 2500);
  } else {
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 3000);
  }
} catch {
  try {
    const textarea = document.createElement("textarea");

    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";

    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();

    document.execCommand("copy");

    document.body.removeChild(textarea);

    if (messageIndex !== null) {
      setCopiedMessageIndex(messageIndex);

      setTimeout(() => {
        setCopiedMessageIndex(null);
      }, 2500);
    } else {
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 3000);
    }
  } catch {
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "⚠️ Automatic copying failed. Please copy the text manually.",
      },
    ]);
  }
}

}

function handleDownloadApp() {
if (!generatedHtml) return;

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
background:
"radial-gradient(circle at top, #161616 0%, #070707 35%, #000 75%)",
color: "#fff",
fontFamily:
"system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
paddingBottom: "110px",
}}
>
{/* PROFESSIONAL BOMBA AI HEADER */}
<header
style={{
padding: "24px 18px 20px",
textAlign: "center",
borderBottom: "1px solid #242424",
background: "rgba(3,3,3,0.96)",
position: "sticky",
top: 0,
zIndex: 50,
backdropFilter: "blur(12px)",
}}
>
<div
style={{
width: "70px",
height: "70px",
margin: "0 auto 12px",
borderRadius: "22px",
background:
"linear-gradient(145deg, #FFD43B 0%, #F5B800 100%)",
display: "flex",
alignItems: "center",
justifyContent: "center",
boxShadow:
"0 0 0 1px rgba(255,212,59,.35), 0 10px 35px rgba(255,212,59,.18)",
position: "relative",
}}
>
<div
style={{
position: "absolute",
inset: "5px",
borderRadius: "18px",
border: "1px solid rgba(0,0,0,.18)",
}}
/>

      <div
        style={{
          fontSize: "25px",
          fontWeight: 1000,
          letterSpacing: "-2px",
          color: "#050505",
          position: "relative",
          lineHeight: 1,
        }}
      >
        TB
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "8px",
          right: "9px",
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: "#050505",
        }}
      />
    </div>

    <h1
      style={{
        margin: 0,
        fontSize: "31px",
        fontWeight: 950,
        letterSpacing: "-1px",
      }}
    >
      BOMBA <span style={{ color: BRAND.accent }}>AI</span>
    </h1>

    <p
      style={{
        margin: "7px 0 0",
        color: "#999",
        fontSize: "14px",
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
        marginBottom: "22px",
      }}
    >
      {Object.entries(MODES).map(([key, item]) => (
        <button
          key={key}
          onClick={() => switchMode(key)}
          type="button"
          style={{
            padding: "15px 10px",
            borderRadius: "15px",
            border:
              mode === key
                ? "2px solid #FFD43B"
                : "1px solid #292929",
            background:
              mode === key
                ? "linear-gradient(145deg,#FFD43B,#F5B800)"
                : "#101010",
            color: mode === key ? "#000" : "#fff",
            fontWeight: 850,
            cursor: "pointer",
            boxShadow:
              mode === key
                ? "0 8px 25px rgba(255,212,59,.10)"
                : "none",
          }}
        >
          <div>
            {item.icon} {item.name}
          </div>

          <small
            style={{
              display: "block",
              marginTop: "5px",
              opacity: 0.65,
              fontWeight: 500,
            }}
          >
            {item.description}
          </small>
        </button>
      ))}
    </div>

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
            padding: "14px 16px",
            borderRadius: "16px",
            background:
              msg.role === "user"
                ? "linear-gradient(145deg,#202020,#151515)"
                : "#0d0d0d",
            border: "1px solid #252525",
            boxShadow: "0 8px 30px rgba(0,0,0,.22)",
            whiteSpace: "pre-wrap",
            lineHeight: 1.55,
            textAlign: "left",
          }}
        >
          {msg.content}

          {msg.role === "assistant" && (
            <div style={{ marginTop: "10px" }}>
              <button
                type="button"
                onClick={() => copyToClipboard(msg.content, index)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "9px",
                  border: "1px solid #303030",
                  background: "#171717",
                  color: "#ddd",
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

    {loading && !building && (
      <div
        style={{
          color: BRAND.accent,
          padding: "10px 0",
          fontWeight: 750,
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
          background:
            "linear-gradient(145deg,#FFD43B,#F5B800)",
          color: "#000",
          fontSize: "17px",
          fontWeight: 900,
          cursor: "pointer",
          boxShadow: "0 10px 30px rgba(255,212,59,.15)",
        }}
      >
        🚀 Build This App
      </button>
    )}

    {showPreview && generatedHtml && (
      <section
        style={{
          marginTop: "20px",
          background: "#0c0c0c",
          border: "1px solid #FFD43B",
          borderRadius: "17px",
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
            onClick={() => copyToClipboard(generatedHtml)}
            type="button"
            style={{
              flex: 1,
              padding: "15px 8px",
              borderRadius: "13px",
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
            onClick={handleDownloadApp}
            type="button"
            style={{
              flex: 1,
              padding: "15px 8px",
              borderRadius: "13px",
              border: "2px solid #FFD43B",
              background: "#171717",
              color: BRAND.accent,
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
      background: "rgba(5,5,5,.97)",
      borderTop: "1px solid #222",
      display: "flex",
      gap: "8px",
      backdropFilter: "blur(12px)",
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
        background: "#101010",
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
            ? "#444"
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