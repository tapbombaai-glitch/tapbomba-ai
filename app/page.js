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
    const url = URL.createObjectURL(blob