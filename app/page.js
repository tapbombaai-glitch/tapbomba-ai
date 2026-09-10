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
      "You are BOMBA AI Content Creator. Help users create practical business content. Answer the latest request clearly and directly.",
  },

  app: {
    name: "App Builder",
    icon: "🚀",
    description: "Plan • Build • Preview",
    placeholder: "Describe the app you want to build...",
    welcome:
      "🚀 BOMBA AI App Builder ON\n\nDescribe the app you want to build. I will create a clear App Plan first. Then you can tap Build This App 🚀 and BOMBA AI will generate the app automatically.",
    system: `
You are BOMBA AI Universal App Builder.

Your job is to help the user create applications automatically.

STEP 1 — APP PLAN

When the user describes an app, DO NOT provide source code.

Create a clean and professional APP PLAN containing:

1. App Name
2. App Purpose
3. Main Features
4. Screens / Pages
5. Navigation
6. User Flow
7. Data Needed
8. Design / UI
9. Functional Behavior

At the end write exactly:

Ready to build? Click Build This App 🚀 below.

STEP 2 — BUILD

Only build the application when the user requests the actual build through the Build This App button.

When building:

- Use the App Plan as the specification.
- Build the complete application automatically.
- Create a standalone HTML application.
- Put CSS inside the HTML.
- Put JavaScript inside the HTML.
- Make the application mobile-friendly.
- Make the design professional.
- Make buttons and interactions functional.
- Do not require the user to install anything.
- Do not tell the user to create files.
- Do not tell the user to run commands.
- Do not tell the user to complete the application themselves.
- Return ONLY one complete HTML code block.
- Start with <!DOCTYPE html>.
- End with </html>.

The generated application must be the user's requested application.

Do NOT put BOMBA AI inside the generated application unless the user specifically requested it.
`,
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

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);

  const [generatedFlyer, setGeneratedFlyer] = useState("");
  const [flyerLoading, setFlyerLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading, showPreview, generatedFlyer]);

  function switchMode(newMode) {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

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
    setGeneratedFlyer("");
    setSelectedImage(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleImageSelect(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Please choose an image smaller than 10MB.");
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setGeneratedFlyer("");
  }

  function removeSelectedImage() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(null);
    setImagePreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);

      reader.onerror = () =>
        reject(new Error("Could not read the selected image."));

      reader.readAsDataURL(file);
    });
  }

  async function generateFlyer() {
    if (!selectedImage || !message.trim() || flyerLoading) {
      return;
    }

    setFlyerLoading(true);
    setGeneratedFlyer("");

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: `🎨 Generate Flyer\n\n${message.trim()}`,
      },
      {
        role: "assistant",
        content:
          "🎨 Designing your professional square flyer...\n\nPlease wait while BOMBA AI creates the visual design.",
      },
    ]);

    try {
      const imageData = await fileToDataUrl(selectedImage);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim(),
          imageData,
          generateFlyer: true,
        }),
      });

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error("The flyer server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(
          data?.error || "Flyer generation failed."
        );
      }

      if (!data?.image) {
        throw new Error("No flyer image was returned.");
      }

      setGeneratedFlyer(data.image);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "✅ Your flyer is ready!\n\nThe real square promotional design is shown below.",
        },
      ]);

      setMessage("");
    } catch (error) {
      console.error("Flyer generation error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            `⚠️ Flyer generation failed.\n\n${
              error?.message || "Please try again."
            }`,
        },
      ]);
    } finally {
      setFlyerLoading(false);
    }
  }

  function downloadFlyer() {
    if (!generatedFlyer) return;

    const link = document.createElement("a");

    link.href = generatedFlyer;
    link.download = "bomba-ai-flyer.png";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  function extractHtmlFromReply(text) {
    if (!text) return null;

    const fencedMatch = text.match(
      /```html\s*([\s\S]*?)```/i
    );

    if (fencedMatch?.[1]) {
      return fencedMatch[1].trim();
    }

    const genericFencedMatch = text.match(
      /```\s*([\s\S]*?)```/
    );

    if (
      genericFencedMatch?.[1] &&
      /<(!doctype|html|head|body)/i.test(
        genericFencedMatch[1]
      )
    ) {
      return genericFencedMatch[1].trim();
    }

    const htmlStart = text.search(
      /<!doctype html|<html[\s>]/i
    );

    if (htmlStart >= 0) {
      const possibleHtml = text.slice(htmlStart).trim();

      const htmlEnd = possibleHtml.search(
        /<\/html>\s*$/i
      );

      if (htmlEnd >= 0) {
        return possibleHtml
          .slice(0, htmlEnd + 7)
          .trim();
      }
    }

    return null;
  }

  function isPlanReply(text) {
    if (!text) return false;

    const containsHtml =
      /<!doctype html|<html[\s>]|```html/i.test(text);

    if (containsHtml) return false;

    return /app name|purpose|main features|screens|navigation|user flow|data needed|design|ui|functional behavior|Ready to build\?/i.test(
      text
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmed = message.trim();

    if (!trimmed || loading || building || flyerLoading) {
      return;
    }

    if (mode === "content" && selectedImage) {
      await generateFlyer();
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
      setCopied(false);
    }

    try {
      const reply = await callAI({
        userContent:
          mode === "app"
            ? `The user wants to build this application:

"${trimmed}"

Follow STEP 1 of the App Builder workflow.
Create ONLY the App Plan.
DO NOT provide source code or manual setup instructions.

End exactly with:
Ready to build? Click Build This App 🚀 below.`
            : trimmed,
        system: MODES[mode].system,
      });

      if (mode === "app") {
        const html = extractHtmlFromReply(reply);

        if (html) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                "⚠️ I received application code before the Build button was used. Please try the request again.",
            },
          ]);
        } else if (isPlanReply(reply)) {
          setAppPlan(reply);

          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: reply,
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                "I couldn't create the App Plan correctly. Please describe the app again.",
            },
          ]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: reply || "No response received.",
          },
        ]);
      }
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
    if (!appPlan || building) return;

    setBuilding(true);
    setLoading(true);
    setShowPreview(false);
    setGeneratedHtml("");
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
          "🔨 Building your app automatically...\n\n" +
          "1️⃣ Reading your App Plan\n" +
          "2️⃣ Creating the interface\n" +
          "3️⃣ Adding the requested functionality\n" +
          "4️⃣ Preparing your live app preview\n\n" +
          "Please wait...",
      },
    ]);

    const buildPrompt = `
BUILD THE APPLICATION NOW.

Use ONLY the following App Plan:

${appPlan}

BUILD RULES:

- Create the complete application automatically.
- Do not ask the user to install anything.
- Do not give React Native instructions.
- Do not give npm commands.
- Do not give terminal commands.
- Do not tell the user to create files.
- Do not tell the user to finish the application manually.
- Do not provide an explanation.
- Return ONLY the complete standalone HTML application.
- Include CSS inside the HTML.
- Include JavaScript inside the HTML.
- Make the application mobile-friendly.
- Make the application professional.
- Make buttons and interactions functional.
- The application must implement the features described in the App Plan.

IMPORTANT:

The generated application must NOT contain the BOMBA AI interface.

Do NOT include:
- BOMBA AI logo
- BOMBA AI header
- BOMBA AI chat
- BOMBA AI messages
- App Builder controls
- BOMBA AI branding

Return exactly one HTML code block.

Start with:
<!DOCTYPE html>

End with:
</html>
`;

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
              "✅ Your app has been built automatically!\n\nYour live app is now shown below.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "⚠️ The app builder did not return a complete application. Tap Build This App 🚀 again.",
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
            "⚠️ App build failed. Please try again.",
        },
      ]);
    } finally {
      setBuilding(false);
      setLoading(false);
    }
  }

  async function copyToClipboard(
    text,
    messageIndex = null
  ) {
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
      const textarea =
        document.createElement("textarea");

      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";
      textarea.style.opacity = "0";

      document.body.appendChild(textarea);

      textarea.focus();
      textarea.select();

      const successful =
        document.execCommand("copy");

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
    }
  }

  function handleCopyFullApp() {
    copyToClipboard(generatedHtml);
  }

  function handleDownloadApp() {
    if (!generatedHtml) return;

    const blob = new Blob(
      [generatedHtml],
      {
        type: "text/html;charset=utf-8",
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "bomba-app.html";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  const lastMessage =
    messages[messages.length - 1];

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
        paddingBottom: "120px",
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
                onClick={() =>
                  switchMode(key)
                }
                type="button"
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

        {mode === "content" && (
          <section
            style={{
              marginBottom: "18px",
              padding: "14px",
              borderRadius: "16px",
              border: "1px solid #292929",
              background: "#0b0b0b",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                marginBottom: "10px",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 900,
                    fontSize: "16px",
                  }}
                >
                  🖼️ Add a Picture
                </div>

                <div
                  style={{
                    color: "#999",
                    fontSize: "13px",
                    marginTop: "3px",
                  }}
                >
                  Add a product picture to create a real promotional flyer.
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{
                  display: "none",
                }}
              />

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                disabled={
                  loading ||
                  building ||
                  flyerLoading
                }
                style={{
                  padding: "11px 14px",
                  borderRadius: "11px",
                  border: "1px solid #FFD43B",
                  background: "#181818",
                  color: BRAND.accent,
                  fontWeight: 900,
                  cursor:
                    loading ||
                    building ||
                    flyerLoading
                      ? "not-allowed"
                      : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                ＋ Choose
              </button>
            </div>

            {imagePreview && (
              <div
                style={{
                  position: "relative",
                  marginTop: "12px",
                  borderRadius: "14px",
                  overflow: "hidden",
                  border: "1px solid #333",
                  background: "#000",
                }}
              >
                <img
                  src={imagePreview}
                  alt="Selected product"
                  style={{
                    width: "100%",
                    maxHeight: "360px",
                    objectFit: "contain",
                    display: "block",
                    background: "#000",
                  }}
                />

                <button
                  type="button"
                  onClick={removeSelectedImage}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    padding: "8px 11px",
                    borderRadius: "10px",
                    border: "1px solid #555",
                    background: "#000",
                    color: "#fff",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  ✕ Remove
                </button>
              </div>
            )}

            {selectedImage && (
              <div
                style={{
                  marginTop: "9px",
                  color: "#bbb",
                  fontSize: "12px",
                }}
              >
                📎 {selectedImage.name}
              </div>
            )}

            {selectedImage && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "11px",
                  borderRadius: "12px",
                  background: "#141414",
                  border: "1px solid #292929",
                  color: "#aaa",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                💡 <strong>How to use it:</strong>
                <br />
                Type what you want on the flyer below, for example:
                <br />
                <span
                  style={{
                    color: "#fff",
                  }}
                >
                  "Create a professional shoe sale flyer. Price ₦25,000. Add WhatsApp ordering."
                </span>
              </div>
            )}
          </section>
        )}

        <div>
          {messages.map(
            (msg, index) => (
              <div
                key={index}
                style={{
                  marginBottom: "16px",
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

                  {msg.role === "assistant" &&
                    !msg.content.includes(
                      "Building your app automatically"
                    ) &&
                    !msg.content.includes(
                      "Your app has been built automatically"
                    ) &&
                    !msg.content.includes(
                      "Designing your professional square flyer"
                    ) && (
                      <div
                        style={{
                          marginTop: "10px",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              msg.content,
                              index
                            )
                          }
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
            )
          )}
        </div>

        {loading &&
          !building &&
          !flyerLoading && (
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

        {flyerLoading && (
          <div
            style={{
              color: BRAND.accent,
              padding: "12px 0",
              fontWeight: 800,
            }}
          >
            🎨 Creating your real 1024×1024 flyer...
          </div>
        )}

        {generatedFlyer && (
          <section
            style={{
              marginTop: "22px",
              padding: "12px",
              borderRadius: "16px",
              border: "1px solid #FFD43B",
              background: "#111",
            }}
          >
            <h2
              style={{
                margin: "5px 0 12px",
                color: BRAND.accent,
                fontSize: "20px",
              }}
            >
              🎨 Your Flyer
            </h2>

            <img
              src={generatedFlyer}
              alt="Generated BOMBA AI flyer"
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                objectFit: "cover",
                display: "block",
                borderRadius: "12px",
                background: "#fff",
              }}
            />

            <button
              type="button"
              onClick={downloadFlyer}
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "16px",
                borderRadius: "13px",
                border: "none",
                background: BRAND.accent,
                color: "#000",
                fontWeight: 900,
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              ⬇️ Save Flyer
            </button>
          </section>
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
              cursor:
                building
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {building
              ? "BUILDING YOUR APP..."
              : "Build This App 🚀"}
          </button>
        )}

        {showPreview &&
          generatedHtml && (
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
                  {copied
                    ? "✅ Copied!"
                    : "📋 Copy Full App"}
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
                  ⬇️ Download App
                </button>
              </div>

              <iframe
                title="Generated App Preview"
                srcDoc={generatedHtml}
                style={{
                  width: "100%",
                  height: "650px",
                  border: "1px solid #333",
                  borderRadius: "14px",
                  background: "#fff",
                }}
                sandbox="allow-scripts allow-forms allow-modals"
              />
            </section>
          )}
      </section>

      <form
        onSubmit={handleSubmit}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          background: "#050505",
          borderTop: "1px solid #222",
          padding: "12px",
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            display: "flex",
            gap: "9px",
            alignItems: "flex-end",
          }}
        >
          <textarea
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            placeholder={
              MODES[mode].placeholder
            }
            rows={2}
            disabled={
              loading ||
              building ||
              flyerLoading
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();

                event.currentTarget.form?.requestSubmit();
              }
            }}
            style={{
              flex: 1,
              resize: "none",
              padding: "13px",
              borderRadius: "13px",
              border: "1px solid #333",
              background: "#111",
              color: "#fff",
              outline: "none",
              fontSize: "15px",
              lineHeight: 1.4,
            }}
          />

          <button
            type="submit"
            disabled={
              loading ||
              building ||
              flyerLoading ||
              !message.trim()
            }
            style={{
              minWidth: "72px",
              padding: "14px 12px",
              borderRadius: "13px",
              border: "none",
              background:
                loading ||
                building ||
                flyerLoading ||
                !message.trim()
                  ? "#555"
                  : BRAND.accent,
              color:
                loading ||
                building ||
                flyerLoading ||
                !message.trim()
                  ? "#aaa"
                  : "#000",
              fontWeight: 900,
              fontSize: "15px",
              cursor:
                loading ||
                building ||
                flyerLoading ||
                !message.trim()
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {flyerLoading
              ? "..."
              : building
              ? "..."
              : loading
              ? "..."
              : "Send"}
          </button>
        </div>
      </form>

      <div ref={messagesEndRef} />
    </main>
  );
}