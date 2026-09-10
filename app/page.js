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

You build applications in TWO STEPS.

STEP 1 — APP PLAN

When the user describes a new application, create ONLY an App Plan.

Every application request is independent.

Never carry requirements from an older application into a new application unless the user explicitly asks you to.

The App Plan must contain:

1. App Name
2. App Purpose
3. Main Features
4. Screens / Pages
5. Navigation
6. User Flow
7. Data Needed
8. Design / UI
9. Functional Behavior

Do NOT generate HTML during Step 1.

End the plan with:

Ready to build? Click Build This App 🚀 below.


STEP 2 — BUILD THE APPLICATION

When the user asks to build the application, generate the actual application.

Return ONE complete standalone HTML document.

The HTML must:

- begin with <!DOCTYPE html>
- contain <html>
- contain <head>
- contain <body>
- contain <style>
- contain <script>
- end with </html>
- work on mobile phones
- look professional
- have working buttons
- have working navigation
- have working forms where needed
- use localStorage where useful
- include useful sample data where appropriate
- not contain BOMBA AI branding
- not require another website or file to function

Keep the application reasonably compact so the complete HTML can be returned without being cut off.

When building, return ONLY the HTML document.
Do not return explanations.
Do not use markdown code fences.
Do not add text before or after the HTML.`,
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
    if (!MODES[newMode]) return;

    setMode(newMode);
    setMessage("");
    setLoading(false);
    setBuilding(false);

    setCurrentAppRequest("");
    setAppPlan("");
    setGeneratedHtml("");
    setShowPreview(false);

    setCopied(false);
    setCopiedIndex(null);

    setMessages([
      {
        role: "assistant",
        content: MODES[newMode].welcome,
      },
    ]);
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

    let data = null;

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
      data?.output ||
      ""
    );
  }

  function extractHtml(text) {
    if (!text) return null;

    let cleaned = String(text).trim();

    /*
      Remove markdown fences if the AI accidentally adds them.
    */
    cleaned = cleaned.replace(/^```html\s*/i, "");
    cleaned = cleaned.replace(/^```\s*/i, "");
    cleaned = cleaned.replace(/\s*```\s*$/i, "");

    cleaned = cleaned.trim();

    /*
      Find the beginning of the HTML document.
    */
    const doctypeIndex = cleaned.search(/<!doctype\s+html/i);
    const htmlIndex = cleaned.search(/<html[\s>]/i);

    let start = -1;

    if (doctypeIndex !== -1 && htmlIndex !== -1) {
      start = Math.min(doctypeIndex, htmlIndex);
    } else if (doctypeIndex !== -1) {
      start = doctypeIndex;
    } else if (htmlIndex !== -1) {
      start = htmlIndex;
    }

    /*
      If the AI returned no HTML document, reject it.
    */
    if (start === -1) {
      return null;
    }

    cleaned = cleaned.slice(start).trim();

    /*
      Find </html> anywhere in the response.
      This is more tolerant than requiring it to be the final characters.
    */
    const end = cleaned.search(/<\/html>/i);

    if (end !== -1) {
      cleaned = cleaned
        .slice(0, end + "</html>".length)
        .trim();

      if (
        /<html[\s>]/i.test(cleaned) &&
        /<\/html>/i.test(cleaned)
      ) {
        return cleaned;
      }
    }

    /*
      If there is a proper body but the AI forgot the final
      closing tags, safely close the document.
    */
    if (/<body[\s>]/i.test(cleaned)) {
      if (!/<\/body>/i.test(cleaned)) {
        cleaned += "\n</body>";
      }

      if (!/<\/html>/i.test(cleaned)) {
        cleaned += "\n</html>";
      }

      if (/<html[\s>]/i.test(cleaned)) {
        return cleaned.trim();
      }
    }

    return null;
  }

  function isValidPlan(text) {
    if (!text) return false;

    if (
      /<!doctype\s+html/i.test(text) ||
      /<html[\s>]/i.test(text) ||
      /```html/i.test(text)
    ) {
      return false;
    }

    const lower = text.toLowerCase();

    const requiredSections = [
      "app name",
      "app purpose",
      "main features",
      "screens",
      "navigation",
      "user flow",
      "data needed",
      "design",
      "functional behavior",
    ];

    const found = requiredSections.filter((section) =>
      lower.includes(section)
    );

    return found.length >= 5;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmed = message.trim();

    if (!trimmed || loading || building) {
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
          Save the exact current application request.
        */
        setCurrentAppRequest(trimmed);
        setAppPlan("");
        setGeneratedHtml("");
        setShowPreview(false);

        const appPlanRequest = `
NEW APPLICATION REQUEST

This is a completely new application.

Do not use requirements from any older application.

CURRENT USER REQUEST:
${trimmed}

Create ONLY the App Plan.

Use exactly these sections:

1. App Name
2. App Purpose
3. Main Features
4. Screens / Pages
5. Navigation
6. User Flow
7. Data Needed
8. Design / UI
9. Functional Behavior

Do NOT generate HTML.

Finish with:

Ready to build? Click Build This App 🚀 below.
`;

        const reply = await callAI({
          userContent: appPlanRequest,
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
                "⚠️ I could not create a proper App Plan.\n\nPlease describe the app again.",
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
              reply || "No response received from BOMBA AI.",
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
      building ||
      loading
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
          "🔨 Building your app...\n\nPlease wait a moment.",
      },
    ]);

    try {
      /*
        Important:
        We send BOTH the original request and the plan.
        This prevents BOMBA AI from accidentally building
        an older application.
      */
      const buildRequest = `
BUILD THE CURRENT APPLICATION NOW.

CURRENT APPLICATION REQUEST:
${currentAppRequest}

CURRENT APPLICATION PLAN:
${appPlan}

Create the actual application described above.

IMPORTANT:
This is the current application.
Do not build an older application.

RETURN ONLY ONE COMPLETE HTML DOCUMENT.

The response must:

1. Start with:
<!DOCTYPE html>

2. Contain:
<html>
<head>
<body>

3. Put all CSS inside:
<style>

4. Put all JavaScript inside:
<script>

5. End with:
</html>

The application must:
- be mobile-first
- be professional
- be interactive
- have working buttons
- have working navigation
- have working forms where needed
- use localStorage where useful
- include useful sample data
- work without external files
- NOT include BOMBA AI branding

IMPORTANT:
Keep the HTML compact enough to return completely.
Do not make unnecessary sections extremely large.

RETURN ONLY THE HTML.
NO EXPLAN