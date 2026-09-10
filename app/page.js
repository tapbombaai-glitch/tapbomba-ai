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
"You are BOMBA AI Content Creator. Help Nigerian and African businesses create practical social media posts, captions, adverts, product descriptions, promotional messages and business content.",
},

flyer: {
name: "Flyer Generator",
icon: "🎨",
description: "Create • Square • Download",
placeholder: "Describe the flyer you want...",
welcome:
"🎨 Flyer Generator ON\n\nCreate a professional square 1:1 flyer for your business, product, event, promotion or service.",
system:
"You are BOMBA AI Flyer Generator. Help users plan professional square 1:1 promotional flyers. Focus only on flyer content, layout, headline, description, price, contact information and visual direction.",
},

app: {
name: "App Builder",
icon: "🚀",
description: "Plan • Build • Preview",
placeholder: "Describe any app you want to build...",
welcome:
'🚀 App Builder ON\n\nDescribe the app you want to build. I will create a clear App Plan first. Then you can click "Build This App 🚀".',
system:
"You are BOMBA AI Universal App Builder.\n\n" +
"Use the user's latest app request as the current specification.\n" +
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
'End the plan with: Ready to build? Click Build This App 🚀 below.\n\n' +
"When building, return one complete standalone HTML application.",
},

logo: {
name: "Logo Generator",
icon: "🪪",
description: "Brand • Logo • Identity",
placeholder: "Describe the logo you want...",
welcome:
"🪪 Logo Generator ON\n\nTell me your business name and the style you want. I can create a professional logo concept for your brand.",
system:
"You are BOMBA AI Logo Generator. Create professional logo concepts for businesses and brands. Focus only on brand name, symbol, typography, style, layout and colors. When requested to generate a logo, return a complete SVG logo.",
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
const [buildProgress, setBuildProgress] = useState(0);
const [buildStage, setBuildStage] = useState("");

const [logoSvg, setLogoSvg] = useState("");
const [showLogo, setShowLogo] = useState(false);

const [copied, setCopied] = useState(false);
const [copiedMessageIndex, setCopiedMessageIndex] = useState(null);

const messagesEndRef = useRef(null);

useEffect(() => {
document.body.style.margin = "0";
document.body.style.background = "#000";
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
}, [messages, loading, showPreview, showLogo]);

function switchMode(newMode) {
setMode(newMode);
setMessage("");

setMessages([
  {
    role: "assistant",
    content: MODES[newMode].welcome,
  },
]);

setAppPlan("");
setGeneratedHtml("");
setShowPreview(false);

setLogoSvg("");
setShowLogo(false);

setCopied(false);
setCopiedMessageIndex(null);

setBuilding(false);
setBuildProgress(0);
setBuildStage("");
setLoading(false);

}

function extractHtmlFromReply(text) {
if (!text) return null;

const fenced = text.match(/```html\s*([\s\S]*?)```/i);

if (fenced?.[1]) {
  return fenced[1].trim();
}

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

function extractSvgFromReply(text) {
if (!text) return null;

const fenced = text.match(/```svg\s*([\s\S]*?)```/i);

if (fenced?.[1] && /<svg[\s>]/i.test(fenced[1])) {
  return fenced[1].trim();
}

const start = text.search(/<svg[\s>]/i);

if (start >= 0) {
  const svg = text.slice(start).trim();
  const end = svg.search(/<\/svg>\s*$/i);

  if (end >= 0) {
    return svg.slice(0, end + 6).trim();
  }
}

return null;

}

function isPlanReply(text) {
if (!text) return false;

const hasPlan =
  /app name|purpose|features|screens|navigation|user flow|data needed|database|design|ui/i.test(
    text
  );

const containsHtml =
  /<!doctype html|<html[\s>]|```html/i.test(text);

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
  throw new Error(
    data?.error || "The AI server returned an error."
  );
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
}

if (mode === "logo") {
  setLogoSvg("");
  setShowLogo(false);
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

  if (mode === "logo") {
    const svg = extractSvgFromReply(reply);

    if (svg) {
      setLogoSvg(svg);
      setShowLogo(true);
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
        "⚠️ Something went wrong. Please check your connection and try again.",
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
setShowPreview(false);
setBuildProgress(0);

const stages = [
  "Understanding the app requirements",
  "Creating the application structure",
  "Designing the data structure",
  "Designing money and payment structure",
  "Building screens and navigation",
  "Adding forms and interactions",
  "Connecting application logic",
  "Polishing the mobile interface",
  "Testing the application structure",
  "Preparing the live preview",
];

setMessages((prev) => [
  ...prev,
  {
    role: "user",
    content: "Build This App 🚀",
  },
  {
    role: "assistant",
    content:
      "🔨 BUILDING YOUR APP\n\n" +
      "BOMBA AI is turning the approved App Plan into an application.\n\n" +
      "The build process has started...",
  },
]);

let stageIndex = 0;

setBuildStage(stages[0]);

const progressTimer = setInterval(() => {
  stageIndex += 1;

  if (stageIndex < stages.length) {
    setBuildStage(stages[stageIndex]);
    setBuildProgress(
      Math.round((stageIndex / stages.length) * 90)
    );
  }
}, 700);

const buildPrompt =
  "BUILD THE APPLICATION NOW.\n\n" +
  "Use ONLY this App Plan as the specification:\n\n" +
  appPlan +
  "\n\n" +
  "BUILD REQUIREMENTS:\n" +
  "- Create a complete functional mobile-friendly application.\n" +
  "- Include all requested screens and navigation.\n" +
  "- Include requested database/data structures.\n" +
  "- Include requested money/payment structures.\n" +
  "- Include requested admin functionality.\n" +
  "- Make important buttons and interactions functional.\n" +
  "- Make the interface professional.\n" +
  "- Keep the generated application self-contained.\n" +
  "- CSS must be inside the HTML.\n" +
  "- JavaScript must be inside the HTML.\n" +
  "- Do not include BOMBA AI's chat interface.\n" +
  "- Do not include BOMBA AI's header or logo.\n" +
  "- Build ONLY the requested application.\n" +
  "- Return ONLY one complete HTML code block.\n" +
  "- Start with <!DOCTYPE html>.\n" +
  "- End with </html>.";

try {
  const reply = await callAI({
    userContent: buildPrompt,
    system: MODES.app.system,
  });

  clearInterval(progressTimer);

  const html = extractHtmlFromReply(reply);

  if (html) {
    setBuildProgress(100);
    setBuildStage("Build complete — preparing preview");
    setGeneratedHtml(html);
    setShowPreview(true);

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "✅ APP BUILD COMPLETE\n\nYour application has been generated and the live preview is ready below.",
      },
    ]);
  } else {
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "⚠️ The AI responded, but I could not find the complete application HTML. Please build again.",
      },
    ]);
  }
} catch (error) {
  clearInterval(progressTimer);

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

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 3000);
  } catch {
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "⚠️ Automatic copying failed. Please copy manually.",
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

function downloadLogo() {
if (!logoSvg) return;

const blob = new Blob([logoSvg], {
  type: "image/svg+xml;charset=utf-8",
});

const url = URL.createObjectURL(blob);
const link = document.createElement("a");

link.href = url;
link.download = "bomba-logo.svg";

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
"radial-gradient(circle at 50% -10%, #202020 0%, #090909 38%, #000 78%)",
color: "#fff",
fontFamily:
"system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
paddingBottom: "105px",
}}
>
{/* MAIN BOMBA AI BRAND */}
<header
style={{
padding: "24px 18px 20px",
textAlign: "center",
borderBottom: "1px solid #242424",
background: "rgba(0,0,0,.88)",
position: "sticky",
top: 0,
zIndex: 50,
backdropFilter: "blur(14px)",
}}
>
<div
style={{
width: "72px",
height: "72px",
margin: "0 auto 12px",
borderRadius: "22px",
background:
"linear-gradient(145deg,#FFE477 0%,#FFD43B 45%,#E5A900 100%)",
display: "flex",
alignItems: "center",
justifyContent: "center",
position: "relative",
boxShadow:
"0 12px 40px rgba(255,212,59,.18)",
}}
>
<div
style={{
position: "absolute",
inset: "5px",
borderRadius: "18px",
border: "1px solid rgba(0,0,0,.22)",
}}
/>

      <div
        style={{
          color: "#050505",
          fontSize: "26px",
          fontWeight: 1000,
          letterSpacing: "-2.5px",
          position: "relative",
        }}
      >
        TB
      </div>

      <div
        style={{
          position: "absolute",
          right: "9px",
          bottom: "9px",
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
        fontSize: "32px",
        fontWeight: 950,
        letterSpacing: "-1.2px",
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
    {/* FOUR TOOLS */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(2,minmax(0,1fr))",
        gap: "10px",
        marginBottom: "22px",
      }}
    >
      {Object.entries(MODES).map(([key, item]) => (
        <button
          key={key}
          type="button"
          onClick={() => switchMode(key)}
          style={{
            padding: "15px 9px",
            borderRadius: "15px",
            border:
              mode === key
                ? "2px solid #FFD43B"
                : "1px solid #292929",
            background:
              mode === key
                ? "linear-gradient(145deg,#FFD43B,#EBAF00)"
                : "#101010",
            color:
              mode === key ? "#000" : "#fff",
            fontWeight: 850,
            cursor: "pointer",
            boxShadow:
              mode === key
                ? "0 8px 28px rgba(255,212,59,.12)"
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

    {/* FLYER QUICK START */}
    {mode === "flyer" && (
      <div
        style={{
          marginBottom: "18px",
          padding: "15px",
          borderRadius: "16px",
          background: "#0d0d0d",
          border: "1px solid #292929",
        }}
      >
        <div
          style={{
            color: BRAND.accent,
            fontWeight: 900,
            marginBottom: "6px",
          }}
        >
          🎨 Square Flyer
        </div>

        <div
          style={{
            color: "#aaa",
            fontSize: "13px",
            lineHeight: 1.5,
          }}
        >
          Ask BOMBA AI for the flyer content and design.
          Your flyer direction is designed for a square
          1:1 format.
        </div>
      </div>
    )}

    {/* CHAT */}
    {messages.map((msg, index) => (
      <div
        key={index}
        style={{
          marginBottom: "16px",
          textAlign:
            msg.role === "user" ? "right" : "left",
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
                ? "#1b1b1b"
                : "#0d0d0d",
            border: "1px solid #252525",
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
                onClick={() =>
                  copyToClipboard(msg.content, index)
                }
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

    {/* APP BUILD PROGRESS */}
    {building && (
      <div
        style={{
          margin: "18px 0",
          padding: "18px",
          borderRadius: "17px",
          background: "#0c0c0c",
          border: "1px solid #FFD43B",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "10px",
            fontWeight: 850,
          }}
        >
          <span>🚀 Building App</span>
          <span style={{ color: BRAND.accent }}>
            {buildProgress}%
          </span>
        </div>

        <div
          style={{
            height: "9px",
            borderRadius: "99px",
            background: "#222",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${buildProgress}%`,
              height: "100%",
              background: BRAND.accent,
              transition: "width .4s ease",
            }}
          />
        </div>

        <div
          style={{
            marginTop: "12px",
            color: "#bbb",
            fontSize: "14px",
          }}
        >
          {buildStage}
        </div>
      </div>
    )}

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

    {/* BUILD BUTTON */}
    {showBuildButton && (
      <button
        type="button"
        onClick={handleBuildApp}
        style={{
          width: "100%",
          padding: "17px",
          marginTop: "8px",
          marginBottom: "20px",
          borderRadius: "14px",
          border: "none",
          background:
            "linear-gradient(145deg,#FFE477,#FFD43B,#EBAF00)",
          color: "#000",
          fontSize: "17px",
          fontWeight: 950,
          cursor: "pointer",
          boxShadow:
            "0 12px 35px rgba(255,212,59,.16)",
        }}
      >
        🚀 Build This App
      </button>
    )}

    {/* APP PREVIEW */}
    {showPreview && generatedHtml && (
      <section
        style={{
          marginTop: "20px",
          background: "#0b0b0b",
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
            type="button"
            onClick={() =>
              copyToClipboard(generatedHtml)
            }
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
            {copied
              ? "✅ Copied!"
              : "📋 Copy Full App"}
          </button>

          <button
            type="button"
            onClick={handleDownloadApp}
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

    {/* LOGO PREVIEW */}
    {showLogo && logoSvg && (
      <section
        style={{
          marginTop: "20px",
          padding: "16px",
          borderRadius: "18px",
          background:
            "linear-gradient(145deg,#111,#080808)",
          border: "1px solid #FFD43B",
        }}
      >
        <h2
          style={{
            margin: "0 0 12px",
            color: BRAND.accent,
          }}
        >
          🪪 Your Generated Logo
        </h2>

        <div
          style={{
            minHeight: "260px",
            borderRadius: "15px",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            overflow: "hidden",
          }}
          dangerouslySetInnerHTML={{
            __html: logoSvg,
          }}
        />

        <button
          type="button"
          onClick={downloadLogo}
          style={{
            width: "100%",
            marginTop: "12px",
            padding: "15px",
            borderRadius: "13px",
            border: "none",
            background: BRAND.accent,
            color: "#000",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          ⬇️ Download Logo
        </button>
      </section>
    )}

    <div ref={messagesEndRef} />
  </section>

  {/* INPUT */}
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
            ? "#444"
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