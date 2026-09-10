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
      "✨ CONTENT CREATOR\n\nTell me what you want to create. I can help with social media posts, captions, adverts, product descriptions, promotional messages and business content.",
    system:
      "You are BOMBA AI Content Creator, a practical AI assistant for Nigerian and African business owners. Create useful social media posts, captions, adverts, product descriptions, promotional messages and business content. Be clear, practical and professional.",
  },

  flyer: {
    name: "Flyer Generator",
    icon: "🎨",
    description: "Create • Design • Square",
    placeholder: "Describe the flyer you want...",
    welcome:
      "🎨 FLYER GENERATOR\n\nCreate a professional square flyer using the dedicated Flyer Generator below. Your flyer will be 1:1 square and will not be confused with the App Builder.",
    system:
      "You are BOMBA AI Flyer Assistant. Help the user prepare concise professional content for a business flyer. Do not generate an application. Do not generate a website. Do not create an App Builder response. Keep flyer content clear and promotional.",
  },

  app: {
    name: "App Builder",
    icon: "🚀",
    description: "Plan • Build • Preview",
    placeholder: "Describe the app you want to build...",
    welcome:
      "🚀 APP BUILDER\n\nDescribe the app you want to build. I will first create a detailed App Blueprint. After you press “Build This App 🚀”, I will build the requested application and prepare a live preview.",
    system:
      "You are BOMBA AI Universal App Builder.\n\n" +
      "YOUR JOB:\n" +
      "Build applications from the user's CURRENT request.\n\n" +
      "IMPORTANT RULES:\n" +
      "1. Treat the user's latest app request as the current specification.\n" +
      "2. Never bring unrelated features from an older request into a new application.\n" +
      "3. First create a detailed APP BLUEPRINT. Do not generate application code during the planning stage.\n" +
      "4. The blueprint must contain:\n" +
      "   - App name\n" +
      "   - App purpose\n" +
      "   - Target users\n" +
      "   - Main features\n" +
      "   - Screens/pages\n" +
      "   - Navigation structure\n" +
      "   - User flow\n" +
      "   - Data/entities required\n" +
      "   - Database/data relationships when applicable\n" +
      "   - Roles and permissions when applicable\n" +
      "   - UI/design system\n" +
      "   - Functional behavior\n" +
      "   - Validation and error handling\n" +
      "   - Money/payment structure when the requested app involves money\n" +
      "   - Admin structure when an admin is required\n" +
      "5. For money-related apps, think in terms of balances, transactions, deposits, withdrawals, payment status, pricing, subscriptions, approvals and transaction history where relevant. Do not add money features if the user did not request them.\n" +
      "6. End the blueprint with exactly:\n" +
      "Ready to build? Click Build This App 🚀 below.\n" +
      "7. Only generate application code after the user activates the Build This App button.\n" +
      "8. When building, create a complete functional mobile-first application based ONLY on the blueprint.\n" +
      "9. Build real screens, navigation, forms, buttons and interactions requested by the blueprint.\n" +
      "10. Do not return a fake description of an app and call it a finished app.\n" +
      "11. Return the complete application inside ONE HTML code block.\n" +
      "12. Put all CSS and JavaScript inside that HTML file.\n" +
      "13. Do not include BOMBA AI's chat interface inside the generated application.\n" +
      "14. Do not include BOMBA AI's logo, header or controls inside the generated application.\n" +
      "15. Make the generated application responsive and mobile-friendly.\n" +
      "16. Use professional spacing, typography, cards, navigation and clear visual hierarchy.\n" +
      "17. Make important buttons actually perform their intended frontend action.\n" +
      "18. Use realistic sample data when a backend is not available, and clearly structure the code so real backend integration can be added later.\n" +
      "19. Do not claim that a real database, payment gateway, authentication system or external API is connected unless it actually is.\n" +
      "20. Return ONLY the complete HTML code when building.\n" +
      "21. Start with <!DOCTYPE html> and end with </html>.",
  },

  logo: {
    name: "Logo Generator",
    icon: "🪪",
    description: "Brand • Logo • Identity",
    placeholder: "Describe the logo you want...",
    welcome:
      "🪪 LOGO GENERATOR\n\nTell me the business name, style and colors you want. I will create a professional logo as a standalone SVG design.",
    system:
      "You are BOMBA AI Professional Logo Generator.\n\n" +
      "Create a clean professional logo as SVG.\n" +
      "The logo must be suitable for a real business brand.\n" +
      "Use the user's business name and requested style.\n" +
      "Prefer strong typography, clean shapes and balanced spacing.\n" +
      "Do not create a website.\n" +
      "Do not create an application.\n" +
      "Do not create a flyer.\n" +
      "Return the complete SVG inside one svg code block when asked to create the logo.\n" +
      "The SVG must be self-contained and should not require external images.",
  },
};

const BUILD_STAGES = [
  "Understanding the app requirements",
  "Creating the application structure",
  "Designing the data and money structure",
  "Building navigation and screens",
  "Adding forms and interactions",
  "Connecting the application logic",
  "Polishing the mobile interface",
  "Testing the application structure",
  "Preparing the live preview",
];

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

  // App Builder
  const [appPlan, setAppPlan] = useState("");
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [building, setBuilding] = useState(false);
  const [buildStage, setBuildStage] = useState(0);
  const [buildProgress, setBuildProgress] = useState(0);

  // Logo Generator
  const [logoSvg, setLogoSvg] = useState("");
  const [showLogoPreview, setShowLogoPreview] = useState(false);

  // Flyer Generator
  const [flyerBusiness, setFlyerBusiness] = useState("Kingsley Shoes");
  const [flyerHeadline, setFlyerHeadline] = useState("STEP UP YOUR GAME");
  const [flyerDescription, setFlyerDescription] = useState(
    "Premium stylish sneakers designed to elevate your everyday look."
  );
  const [flyerPrice, setFlyerPrice] = useState("₦25,000");
  const [flyerPhone, setFlyerPhone] = useState("08000000000");

  const [copied, setCopied] = useState(false);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState(null);

  const messagesEndRef = useRef(null);
  const buildTimerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading, showPreview, showLogoPreview]);

  useEffect(() => {
    return () => {
      if (buildTimerRef.current) {
        window.clearInterval(buildTimerRef.current);
      }
    };
  }, []);

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
    setLogoSvg("");
    setShowLogoPreview(false);
    setCopied(false);
    setCopiedMessageIndex(null);
    setBuilding(false);
    setLoading(false);
    setBuildStage(0);
    setBuildProgress(0);

    if (buildTimerRef.current) {
      window.clearInterval(buildTimerRef.current);
      buildTimerRef.current = null;
    }
  }

  function extractHtmlFromReply(text) {
    if (!text) return null;

    const fencedMatch = text.match(/```html\s*([\s\S]*?)```/i);

    if (fencedMatch?.[1]) {
      return fencedMatch[1].trim();
    }

    const genericFencedMatch = text.match(/```\s*([\s\S]*?)```/);

    if (
      genericFencedMatch?.[1] &&
      /<!doctype|<html[\s>]/i.test(genericFencedMatch[1])
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

  function extractSvgFromReply(text) {
    if (!text) return null;

    const fencedMatch = text.match(/```svg\s*([\s\S]*?)```/i);

    if (fencedMatch?.[1] && /<svg[\s>]/i.test(fencedMatch[1])) {
      return fencedMatch[1].trim();
    }

    const genericMatch = text.match(/```\s*([\s\S]*?)```/);

    if (genericMatch?.[1] && /<svg[\s>]/i.test(genericMatch[1])) {
      return genericMatch[1].trim();
    }

    const svgStart = text.search(/<svg[\s>]/i);

    if (svgStart >= 0) {
      const possibleSvg = text.slice(svgStart).trim();
      const svgEnd = possibleSvg.search(/<\/svg>\s*$/i);

      if (svgEnd >= 0) {
        return possibleSvg.slice(0, svgEnd + 6).trim();
      }
    }

    return null;
  }

  function isPlanReply(text) {
    if (!text) return false;

    const hasBuildInstruction =
      /Ready to build\?\s*Click Build This App/i.test(text);

    const hasBlueprintSections =
      /app name|purpose|target users|main features|screens|navigation|user flow|data|database|design|ui|functional behavior/i.test(
        text
      );

    const containsHtml =
      /<!doctype html|<html[\s>]|```html/i.test(text);

    return !containsHtml && (hasBuildInstruction || hasBlueprintSections);
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
    }

    if (mode === "logo") {
      setLogoSvg("");
      setShowLogoPreview(false);
    }

    try {
      let reply = "";

      if (mode === "flyer") {
        reply = await callAI({
          userContent: trimmed,
          system: MODES.flyer.system,
        });

        // Put the AI's useful flyer wording into the dedicated flyer fields.
        setFlyerHeadline(trimmed.slice(0, 80));
      } else {
        reply = await callAI({
          userContent: trimmed,
          system: MODES[mode].system,
        });
      }

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

      if (mode === "logo") {
        const svg = extractSvgFromReply(reply);

        if (svg) {
          setLogoSvg(svg);
          setShowLogoPreview(true);
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

  function startBuildProgress() {
    setBuildStage(0);
    setBuildProgress(5);

    if (buildTimerRef.current) {
      window.clearInterval(buildTimerRef.current);
    }

    buildTimerRef.current = window.setInterval(() => {
      setBuildStage((current) => {
        const next = Math.min(current + 1, BUILD_STAGES.length - 1);

        setBuildProgress(
          Math.min(
            90,
            Math.round(((next + 1) / BUILD_STAGES.length) * 90)
          )
        );

        return next;
      });
    }, 1400);
  }

  function stopBuildProgress(success = false) {
    if (buildTimerRef.current) {
      window.clearInterval(buildTimerRef.current);
      buildTimerRef.current = null;
    }

    if (success) {
      setBuildStage(BUILD_STAGES.length - 1);
      setBuildProgress(100);
    }
  }

  async function handleBuildApp() {
    if (!appPlan || building) return;

    setBuilding(true);
    setLoading(false);
    setCopied(false);
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
          "🏗️ BUILDING YOUR APPLICATION\n\n" +
          "BOMBA AI is now turning the blueprint into the requested application.\n\n" +
          "The build process will create the structure, screens, navigation, interactions and responsive interface before preparing the preview.",
      },
    ]);

    startBuildProgress();

    const buildPrompt =
      "BUILD THE APPLICATION NOW.\n\n" +
      "This is the ONLY specification you should use:\n\n" +
      "================ APP BLUEPRINT ================\n" +
      appPlan +
      "\n================ END BLUEPRINT ================\n\n" +
      "BUILD THE APPLICATION CAREFULLY.\n\n" +
      "Requirements:\n" +
      "- Follow the blueprint closely.\n" +
      "- Build a complete mobile-first application prototype.\n" +
      "- Create the requested screens.\n" +
      "- Create clear navigation between screens.\n" +
      "- Create the requested forms.\n" +
      "- Make buttons and important interactions functional.\n" +
      "- Add appropriate validation.\n" +
      "- Add useful empty states and feedback messages.\n" +
      "- If the blueprint requires money, create the requested wallet, balance, transaction, payment, pricing, deposit, withdrawal or approval interfaces as appropriate.\n" +
      "- If the blueprint requires an admin area, create the requested admin screens and controls.\n" +
      "- Use realistic sample data where a backend is unavailable.\n" +
      "- Do not pretend a real external payment provider or database is connected.\n" +
      "- Make the design professional and responsive.\n" +
      "- Make it feel like a real application rather than a simple information webpage.\n" +
      "- Use CSS for a polished mobile and desktop layout.\n" +
      "- Put ALL CSS inside the HTML.\n" +
      "- Put ALL JavaScript inside the HTML.\n" +
      "- Do not use external CSS or JavaScript files.\n" +
      "- Do not include BOMBA AI's interface.\n" +
      "- Do not include BOMBA AI's logo.\n" +
      "- Do not include the BOMBA AI chat interface.\n" +
      "- Do not add unrelated features.\n" +
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
        stopBuildProgress(true);

        setGeneratedHtml(html);
        setShowPreview(true);

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "✅ BUILD COMPLETE\n\nYour application has been generated and the live preview is ready below.\n\nYou can test it, copy the complete HTML, or download it.",
          },
        ]);
      } else {
        stopBuildProgress(false);

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "⚠️ BUILD NEEDS ANOTHER PASS\n\nThe AI responded, but I could not find a complete HTML application in the response. The application was not marked as successfully built.",
          },
        ]);
      }
    } catch (error) {
      console.error("App build error:", error);

      stopBuildProgress(false);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ APP BUILD FAILED\n\nThe builder could not complete the request. Please try Build This App 🚀 again.",
        },
      ]);
    } finally {
      setBuilding(false);
    }
  }

  function generateFlyer() {
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content:
          "✅ Square flyer updated below.\n\nYour flyer remains a dedicated 1:1 design and is not handled by the App Builder.",
      },
    ]);
  }

  function downloadFlyer() {
    const flyer = document.getElementById("square-flyer");

    if (!flyer) return;

    const popup = window.open("", "_blank");

    if (!popup) {
      alert("Please allow pop-ups to save the flyer.");
      return;
    }

    popup.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${escapeHTML(flyerBusiness)} Flyer</title>
        <style>
          * {
            box-sizing: border-box;
          }

          html, body {
            margin: 0;
            padding: 0;
            background: #000;
          }

          body {
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .flyer {
            width: 1080px;
            height: 1080px;
            position: relative;
            overflow: hidden;
            padding: 76px;
            color: #fff;
            font-family: Arial, Helvetica, sans-serif;
            background:
              radial-gradient(
                circle at 85% 12%,
                rgba(255,212,59,.35),
                transparent 28%
              ),
              linear-gradient(
                135deg,
                #050505 0%,
                #171717 50%,
                #000 100%
              );
          }

          .circle-one {
            position: absolute;
            width: 520px;
            height: 520px;
            right: -220px;
            top: -180px;
            border-radius: 50%;
            background: rgba(255,212,59,.10);
          }

          .circle-two {
            position: absolute;
            width: 430px;
            height: 430px;
            left: -230px;
            bottom: -210px;
            border-radius: 50%;
            background: rgba(255,255,255,.04);
          }

          .line {
            position: absolute;
            width: 850px;
            height: 4px;
            right: -210px;
            top: 410px;
            background: #ffd43b;
            transform: rotate(-12deg);
            opacity: .7;
          }

          .brand {
            position: relative;
            z-index: 5;
            color: #ffd43b;
            font-size: 43px;
            font-weight: 900;
            letter-spacing: 2px;
            text-transform: uppercase;
          }

          .badge {
            position: relative;
            z-index: 5;
            display: inline-block;
            margin-top: 52px;
            padding: 11px 22px;
            border-radius: 30px;
            background: #ffd43b;
            color: #000;
            font-size: 18px;
            font-weight: 900;
          }

          h1 {
            position: relative;
            z-index: 5;
            max-width: 820px;
            margin: 38px 0 0;
            font-size: 88px;
            line-height: .92;
            letter-spacing: -3px;
            text-transform: uppercase;
          }

          .description {
            position: relative;
            z-index: 5;
            max-width: 620px;
            margin-top: 34px;
            color: #eee;
            font-size: 27px;
            line-height: 1.3;
          }

          .price-label {
            position: relative;
            z-index: 5;
            margin-top: 45px;
            color: #ddd;
            font-size: 20px;
            font-weight: 700;
            text-transform: uppercase;
          }

          .price {
            position: relative;
            z-index: 5;
            color: #ffd43b;
            font-size: 76px;
            font-weight: 900;
            line-height: 1;
            margin-top: 5px;
          }

          .shoe {
            position: absolute;
            z-index: 4;
            right: 70px;
            top: 400px;
            font-size: 190px;
            transform: rotate(-10deg);
            filter: drop-shadow(0 20px 18px rgba(0,0,0,.75));
          }

          .bottom {
            position: absolute;
            z-index: 10;
            left: 76px;
            right: 76px;
            bottom: 76px;
            padding-top: 35px;
            border-top: 2px solid rgba(255,255,255,.2);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            font-size: 21px;
          }

          .order {
            color: #ffd43b;
            font-weight: 900;
          }

          .shop {
            background: #ffd43b;
            color: #000;
            padding: 14px 25px;
            border-radius: 30px;
            font-weight: 900;
            white-space: nowrap;
          }

          @media print {
            body {
              background: #fff;
            }

            .flyer {
              width: 1080px;
              height: 1080px;
            }
          }
        </style>
      </head>

      <body>
        <div class="flyer">
          <div class="circle-one"></div>
          <div class="circle-two"></div>
          <div class="line"></div>

          <div class="brand">
            ${escapeHTML(flyerBusiness).toUpperCase()}
          </div>

          <div class="badge">
            NEW COLLECTION
          </div>

          <h1>
            ${escapeHTML(flyerHeadline).toUpperCase()}
          </h1>

          <div class="description">
            ${escapeHTML(flyerDescription)}
          </div>

          <div class="price-label">
            STARTING FROM
          </div>

          <div class="price">
            ${escapeHTML(flyerPrice)}
          </div>

          <div class="shoe">
            👟
          </div>

          <div class="bottom">
            <div>
              <span class="order">ORDER NOW</span><br>
              WhatsApp: ${escapeHTML(flyerPhone)}
            </div>

            <div class="shop">
              SHOP NOW
            </div>
          </div>
        </div>

        <script>
          window.onload = function () {
            setTimeout(function () {
              window.print();
            }, 500);
          };
        <\/script>
      </body>
      </html>
    `);

    popup.document.close();
  }

  async function copyToClipboard(text, messageIndex = null) {
    if (!text) return;

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

      const successful = document.execCommand("copy");

      document.body.removeChild(textarea);

      if (!successful) {
        throw new Error("Copy failed.");
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
    }
  }

  function handleCopyFullApp() {
    copyToClipboard(generatedHtml);
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

  function handleCopyLogo() {
    if (logoSvg) {
      copyToClipboard(logoSvg);
    }
  }

  function handleDownloadLogo() {
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

  function escapeHTML(text) {
    return String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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
          "radial-gradient(circle at top, #151515 0%, #000 42%)",
        color: "#fff",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        paddingBottom: "105px",
      }}
    >
      <header
        style={{
          padding: "24px 18px 20px",
          textAlign: "center",
          borderBottom: "1px solid #222",
          background: "rgba(5,5,5,.96)",
        }}
      >
        <div
          style={{
            width: "62px",
            height: "62px",
            borderRadius: "18px",
            background: BRAND.accent,
            color: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px",
            fontWeight: 950,
            fontSize: "24px",
            boxShadow: "0 8px 30px rgba(255,212,59,.16)",
          }}
        >
          TB
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "34px",
            fontWeight: 950,
            letterSpacing: "-1px",
          }}
        >
          {BRAND.name}
        </h1>

        <p
          style={{
            margin: "7px 0 0",
            color: "#aaa",
            fontSize: "14px",
          }}
        >
          {BRAND.tagline}
        </p>
      </header>

      <section
        style={{
          maxWidth: "980px",
          margin: "0 auto",
          padding: "18px 14px",
        }}
      >
        {/* TOOL SWITCHER */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(2, minmax(0, 1fr))",
            gap: "9px",
            marginBottom: "20px",
          }}
        >
          {Object.entries(MODES).map(([key, item]) => (
            <button
              key={key}
              onClick={() => switchMode(key)}
              type="button"
              style={{
                minHeight: "72px",
                padding: "12px 8px",
                borderRadius: "15px",
                border:
                  mode === key
                    ? "2px solid #FFD43B"
                    : "1px solid #303030",
                background:
                  mode === key ? "#FFD43B" : "#111",
                color:
                  mode === key ? "#000" : "#fff",
                fontWeight: 900,
                cursor: "pointer",
                boxShadow:
                  mode === key
                    ? "0 8px 25px rgba(255,212,59,.10)"
                    : "none",
              }}
            >
              <div style={{ fontSize: "14px" }}>
                {item.icon} {item.name}
              </div>

              <small
                style={{
                  display: "block",
                  marginTop: "5px",
                  opacity: 0.65,
                  fontWeight: 500,
                  fontSize: "11px",
                }}
              >
                {item.description}
              </small>
            </button>
          ))}
        </div>

        {/* FLYER GENERATOR */}

        {mode === "flyer" && (
          <section
            style={{
              background: "#0d0d0d",
              border: "1px solid #252525",
              borderRadius: "18px",
              padding: "15px",
              marginBottom: "22px",
            }}
          >
            <h2
              style={{
                margin: "3px 0 5px",
                color: BRAND.accent,
                fontSize: "22px",
              }}
            >
              🎨 Square Flyer Generator
            </h2>

            <p
              style={{
                margin: "0 0 15px",
                color: "#999",
                fontSize: "13px",
              }}
            >
              Create a professional 1:1 square flyer.
            </p>

            <div style={{ display: "grid", gap: "11px" }}>
              <input
                value={flyerBusiness}
                onChange={(e) => setFlyerBusiness(e.target.value)}
                placeholder="Business name"
                style={inputStyle}
              />

              <input
                value={flyerHeadline}
                onChange={(e) => setFlyerHeadline(e.target.value)}
                placeholder="Main headline"
                style={inputStyle}
              />

              <textarea
                value={flyerDescription}
                onChange={(e) =>
                  setFlyerDescription(e.target.value)
                }
                placeholder="Description"
                rows={3}
                style={inputStyle}
              />

              <input
                value={flyerPrice}
                onChange={(e) => setFlyerPrice(e.target.value)}
                placeholder="Price"
                style={inputStyle}
              />

              <input
                value={flyerPhone}
                onChange={(e) => setFlyerPhone(e.target.value)}
                placeholder="WhatsApp / Phone"
                style={inputStyle}
              />

              <button
                type="button"
                onClick={generateFlyer}
                style={primaryButton}
              >
                ✨ CREATE SQUARE FLYER
              </button>
            </div>

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                id="square-flyer"
                style={{
                  width: "100%",
                  maxWidth: "650px",
                  aspectRatio: "1 / 1",
                  position: "relative",
                  overflow: "hidden",
                  padding: "7%",
                  background:
                    "radial-gradient(circle at 85% 12%, rgba(255,212,59,.35), transparent 28%), linear-gradient(135deg, #050505 0%, #171717 50%, #000 100%)",
                  color: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow:
                    "0 20px 60px rgba(0,0,0,.45)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    width: "48%",
                    aspectRatio: "1",
                    borderRadius: "50%",
                    right: "-20%",
                    top: "-15%",
                    background: "rgba(255,212,59,.12)",
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    width: "80%",
                    height: "3px",
                    background: "#FFD43B",
                    right: "-20%",
                    top: "37%",
                    transform: "rotate(-12deg)",
                    opacity: ".7",
                  }}
                />

                <div
                  style={{
                    position: "relative",
                    zIndex: 5,
                  }}
                >
                  <div
                    style={{
                      color: "#FFD43B",
                      fontSize:
                        "clamp(17px, 4vw, 34px)",
                      fontWeight: 950,
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                    }}
                  >
                    {flyerBusiness || "YOUR BUSINESS"}
                  </div>

                  <div
                    style={{
                      display: "inline-block",
                      marginTop: "5%",
                      padding: "7px 13px",
                      borderRadius: "30px",
                      background: "#FFD43B",
                      color: "#000",
                      fontSize:
                        "clamp(9px, 2vw, 14px)",
                      fontWeight: 900,
                    }}
                  >
                    NEW COLLECTION
                  </div>

                  <div
                    style={{
                      maxWidth: "78%",
                      marginTop: "5%",
                      fontSize:
                        "clamp(30px, 7vw, 68px)",
                      lineHeight: ".92",
                      fontWeight: 950,
                      letterSpacing: "-2px",
                      textTransform: "uppercase",
                    }}
                  >
                    {flyerHeadline ||
                      "YOUR HEADLINE"}
                  </div>

                  <div
                    style={{
                      maxWidth: "68%",
                      marginTop: "4%",
                      color: "#eee",
                      fontSize:
                        "clamp(11px, 2.4vw, 21px)",
                      lineHeight: 1.3,
                    }}
                  >
                    {flyerDescription ||
                      "Your product or service description."}
                  </div>

                  <div
                    style={{
                      marginTop: "5%",
                    }}
                  >
                    <div
                      style={{
                        color: "#ddd",
                        fontSize:
                          "clamp(9px, 2vw, 14px)",
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      STARTING FROM
                    </div>

                    <div
                      style={{
                        color: "#FFD43B",
                        fontSize:
                          "clamp(28px, 6vw, 58px)",
                        fontWeight: 950,
                        lineHeight: 1,
                        marginTop: "3px",
                      }}
                    >
                      {flyerPrice || "₦0"}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    zIndex: 4,
                    right: "7%",
                    top: "39%",
                    fontSize:
                      "clamp(70px, 16vw, 155px)",
                    transform: "rotate(-10deg)",
                    filter:
                      "drop-shadow(0 18px 14px rgba(0,0,0,.7))",
                  }}
                >
                  👟
                </div>

                <div
                  style={{
                    position: "relative",
                    zIndex: 10,
                    borderTop:
                      "2px solid rgba(255,255,255,.2)",
                    paddingTop: "4%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        "clamp(9px, 2vw, 15px)",
                      lineHeight: 1.4,
                    }}
                  >
                    <strong
                      style={{ color: "#FFD43B" }}
                    >
                      ORDER NOW
                    </strong>
                    <br />
                    WhatsApp: {flyerPhone}
                  </div>

                  <div
                    style={{
                      background: "#FFD43B",
                      color: "#000",
                      padding:
                        "clamp(7px, 2vw, 11px) clamp(10px, 3vw, 17px)",
                      borderRadius: "30px",
                      fontSize:
                        "clamp(9px, 2vw, 15px)",
                      fontWeight: 900,
                      whiteSpace: "nowrap",
                    }}
                  >
                    SHOP NOW
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={downloadFlyer}
              style={{
                ...primaryButton,
                background: "#fff",
                marginTop: "14px",
              }}
            >
              📥 SAVE SQUARE FLYER
            </button>
          </section>
        )}

        {/* LOGO GENERATOR */}

        {mode === "logo" && (
          <section
            style={{
              background: "#0d0d0d",
              border: "1px solid #252525",
              borderRadius: "18px",
              padding: "15px",
              marginBottom: "22px",
            }}
          >
            <h2
              style={{
                margin: "3px 0 5px",
                color: BRAND.accent,
              }}
            >
              🪪 Professional Logo Generator
            </h2>

            <p
              style={{
                color: "#999",
                fontSize: "13px",
              }}
            >
              Describe your brand and BOMBA AI will create a
              standalone SVG logo.
            </p>

            {showLogoPreview && logoSvg && (
              <div
                style={{
                  marginTop: "15px",
                  background: "#fff",
                  borderRadius: "15px",
                  minHeight: "280px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "25px",
                }}
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: logoSvg,
                  }}
                  style={{
                    width: "100%",
                    maxWidth: "420px",
                  }}
                />
              </div>
            )}

            {logoSvg && (
              <div
                style={{
                  display: "flex",
                  gap: "9px",
                  marginTop: "12px",
                }}
              >
                <button
                  type="button"
                  onClick={handleCopyLogo}
                  style={{
                    ...primaryButton,
                    flex: 1,
                  }}
                >
                  {copied
                    ? "✅ Copied!"
                    : "📋 Copy SVG"}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadLogo}
                  style={{
                    ...secondaryButton,
                    flex: 1,
                  }}
                >
                  ⬇️ Download
                </button>
              </div>
            )}
          </section>
        )}

        {/* CHAT */}

        <div>
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                marginBottom: "15px",
                textAlign:
                  msg.role === "user"
                    ? "right"
                    : "left",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  maxWidth: "94%",
                  padding: "13px 15px",
                  borderRadius: "15px",
                  background:
                    msg.role === "user"
                      ? "#202020"
                      : "#111",
                  border:
                    msg.role === "user"
                      ? "1px solid #333"
                      : "1px solid #242424",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.55,
                  textAlign: "left",
                  fontSize: "14px",
                }}
              >
                {msg.content}

                {msg.role === "assistant" &&
                  !msg.content.includes(
                    "BUILDING YOUR APPLICATION"
                  ) &&
                  !msg.content.includes(
                    "BUILD COMPLETE"
                  ) && (
                    <div style={{ marginTop: "9px" }}>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            msg.content,
                            index
                          )
                        }
                        style={{
                          padding: "7px 11px",
                          borderRadius: "9px",
                          border: "1px solid #333",
                          background: "#202020",
                          color: "#fff",
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                      >
                        {copiedMessageIndex ===
                        index
                          ? "✅ Copied!"
                          : "📋 Copy Answer"}
                      </button>
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>

        {/* BUILD PROGRESS */}

        {building && (
          <section
            style={{
              margin: "18px 0",
              padding: "18px",
              borderRadius: "17px",
              background:
                "linear-gradient(145deg,#111,#080808)",
              border: "1px solid #333",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <strong
                style={{
                  color: BRAND.accent,
                  fontSize: "18px",
                }}
              >
                🏗️ BUILDING YOUR APP
              </strong>

              <strong>
                {buildProgress}%
              </strong>
            </div>

            <div
              style={{
                height: "10px",
                borderRadius: "20px",
                background: "#292929",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${buildProgress}%`,
                  height: "100%",
                  background: BRAND.accent,
                  transition:
                    "width .8s ease",
                }}
              />
            </div>

            <div
              style={{
                marginTop: "15px",
                color: "#ddd",
                fontSize: "14px",
                lineHeight: 1.7,
              }}
            >
              {BUILD_STAGES.map(
                (stage, index) => (
                  <div key={stage}>
                    {index < buildStage
                      ? "✓"
                      : index === buildStage
                      ? "🔨"
                      : "○"}{" "}
                    {stage}
                  </div>
                )
              )}
            </div>

            <p
              style={{
                margin:
                  "15px 0 0",
                color: "#888",
                fontSize: "12px",
              }}
            >
              BOMBA AI is processing the
              application request. Please wait
              until the build is complete.
            </p>
          </section>
        )}

        {/* APP PLAN BUTTON */}

        {showBuildButton && (
          <button
            onClick={handleBuildApp}
            type="button"
            style={{
              ...primaryButton,
              marginBottom: "20px",
            }}
          >
            🚀 BUILD THIS APP
          </button>
        )}

        {/* APP PREVIEW */}

        {showPreview && generatedHtml && (
          <section
            style={{
              marginTop: "20px",
              background: "#0d0d0d",
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
                gap: "9px",
                marginBottom: "12px",
              }}
            >
              <button
                onClick={handleCopyFullApp}
                type="button"
                style={{
                  ...primaryButton,
                  flex: 1,
                }}
              >
                {copied
                  ? "✅ Copied!"
                  : "📋 Copy Full App"}
              </button>

              <button
                onClick={handleDownloadApp}
                type="button"
                style={{
                  ...secondaryButton,
                  flex: 1,
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

      {/* CHAT INPUT */}

      <form
        onSubmit={handleSubmit}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 100,
          padding: "9px",
          background:
            "rgba(5,5,5,.97)",
          borderTop: "1px solid #222",
          display: "flex",
          gap: "8px",
          backdropFilter: "blur(10px)",
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

              if (
                !loading &&
                !building
              ) {
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
            padding: "0 17px",
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

const inputStyle = {
  width: "100%",
  padding: "13px",
  borderRadius: "11px",
  border: "1px solid #333",
  background: "#111",
  color: "#fff",
  outline: "none",
  fontSize: "15px",
};

const primaryButton = {
  width: "100%",
  padding: "15px",
  border: "none",
  borderRadius: "12px",
  background: "#FFD43B",
  color: "#000",
  fontSize: "15px",
  fontWeight: 950,
  cursor: "pointer",
};

const secondaryButton = {
  width: "100%",
  padding: "15px",
  border: "1px solid #FFD43B",
  borderRadius: "12px",
  background: "#181818",
  color: "#FFD43B",
  fontSize: "15px",
  fontWeight: 900,
  cursor: "pointer",
};