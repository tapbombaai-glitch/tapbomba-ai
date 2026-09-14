"use client";

import { useRef, useState } from "react";

const BRAND = {
  name: "BOMBA AI",
  short: "TB",
  tagline: "Automate. Grow. Earn.",
  slogan: "Describe it. BOMBA builds it.",
  accent: "#FFD43B",
};

const FEATURES = [
  { icon: "🌐", name: "Website" },
  { icon: "🎨", name: "Flyer" },
  { icon: "✦", name: "Logo" },
  { icon: "🖼️", name: "Image" },
  { icon: "🛠️", name: "Universal Builder" },
  { icon: "💬", name: "ASK BOMBA AI" },
];

export default function Home() {
  const [activeFeature, setActiveFeature] = useState("Flyer");
  const [menuOpen, setMenuOpen] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState("");
  const [uploadedImage, setUploadedImage] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
const [photoSize, setPhotoSize] = useState("medium");
const [photoPositions, setPhotoPositions] = useState([
  "left",
  "center",
  "right",
]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [builderPrompt, setBuilderPrompt] = useState("");
  const [builderProject, setBuilderProject] = useState(null);
  const [builderPlan, setBuilderPlan] = useState(null);
  const [builderView, setBuilderView] = useState("start");

  const [builderBuildLoading, setBuilderBuildLoading] =
    useState(false);
  const [builderBuildLogs, setBuilderBuildLogs] = useState([]);
  const [builderBuildError, setBuilderBuildError] = useState("");

  const [askPrompt, setAskPrompt] = useState("");
  const [askAnswer, setAskAnswer] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState("");
  const [voiceListening, setVoiceListening] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");

  const fileInputRef = useRef(null);

  function handleImageUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("Please choose an image smaller than 8MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setUploadedImage(reader.result);
      setUploadedName(file.name);
      setError("");
    };

    reader.onerror = () => {
      setError("BOMBA AI could not read that image.");
    };

    reader.readAsDataURL(file);
  }

  function removeUploadedImage() {
    setUploadedImage("");
    setUploadedName("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function generateFlyer() {
    const text = prompt.trim();

    if (!text) {
      setError("Describe the flyer you want BOMBA AI to create.");
      return;
    }

    setLoading(true);
    setError("");
    setImage("");

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: text,
          type: "flyer",
          referenceImage: uploadedImage || null,
          photoSize: uploadedImage ? photoSize : null,
          photoPosition: uploadedImage ? photoPosition : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "BOMBA AI could not generate the flyer."
        );
      }

      if (!data?.image) {
        throw new Error("The AI did not return an image.");
      }

      setImage(data.image);
    } catch (err) {
      setError(
        err?.message ||
          "Something went wrong while generating your flyer."
      );
    } finally {
      setLoading(false);
    }
  }

  async function getBuilderPlan(project, session) {
    const planResponse = await fetch(
      "/api/builder/plan",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          originalRequest: project.original_request,
        }),
      }
    );

    const planData = await planResponse.json();

    if (!planResponse.ok) {
      throw new Error(
        planData?.error ||
          "BOMBA AI could not create the project plan."
      );
    }

    const plan = planData?.plan || planData;

    if (!plan?.buildStages?.length) {
      throw new Error(
        "BOMBA AI did not return valid build stages."
      );
    }

    return plan;
  }

  async function startBuilder() {
    const text = builderPrompt.trim();

    if (!text) {
      setError("Describe what you want BOMBA AI to build.");
      return;
    }

    setLoading(true);
    setError("");
    setBuilderBuildError("");
    setBuilderBuildLogs([]);
    setBuilderPlan(null);
    setBuilderView("start");

    try {
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL;

      const supabaseAnonKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase is not configured.");
      }

      const { createClient } = await import(
        "@supabase/supabase-js"
      );

      const supabase = createClient(
        supabaseUrl,
        supabaseAnonKey
      );

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error(
          "Please log in before starting a project."
        );
      }

      const response = await fetch(
        "/api/builder/projects",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            originalRequest: text,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "BOMBA AI could not save your project."
        );
      }

      if (!data?.project) {
        throw new Error(
          "BOMBA AI did not return the created project."
        );
      }

      const project = data.project;

      setBuilderBuildLogs([
        "🧠 BOMBA AI is understanding your request...",
        "📋 Creating your real project plan...",
      ]);

      const plan = await getBuilderPlan(
        project,
        session
      );

      setBuilderProject(project);
      setBuilderPlan(plan);

      setBuilderBuildLogs((current) => [
        ...current,
        `✅ Plan ready: ${plan.buildStages.length} real build stages.`,
      ]);

      setBuilderView("plan");
    } catch (error) {
      console.error("Builder start error:", error);

      setError(
        error?.message ||
          "Something went wrong while starting your project."
      );
    } finally {
      setLoading(false);
    }
  }

  async function buildBuilderProject() {
    if (!builderProject?.id) {
      setBuilderBuildError(
        "No builder project is available."
      );
      setBuilderView("build");
      return;
    }

    if (buildCompleted) {
      setBuilderBuildError(
        "This project has already completed all planned build stages."
      );
      setBuilderView("build");
      return;
    }

    setBuilderBuildLoading(true);
    setBuilderBuildError("");
    setBuilderView("build");

    setBuilderBuildLogs((current) => [
      ...current,
      "🧠 BOMBA AI is understanding your project...",
    ]);

    try {
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL;

      const supabaseAnonKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase is not configured.");
      }

      const { createClient } = await import(
        "@supabase/supabase-js"
      );

      const supabase = createClient(
        supabaseUrl,
        supabaseAnonKey
      );

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error(
          "Please log in before building."
        );
      }

      let plan = builderPlan;

      if (!plan) {
        setBuilderBuildLogs((current) => [
          ...current,
          "📋 Creating the real project plan...",
        ]);

        plan = await getBuilderPlan(
          builderProject,
          session
        );

        setBuilderPlan(plan);

        setBuilderBuildLogs((current) => [
          ...current,
          `📋 Plan ready: ${plan.buildStages.length} real build stages.`,
        ]);
      }

      const requestedNextStage =
        Number(builderProject.current_stage || 0) + 1;

      setBuilderBuildLogs((current) => [
        ...current,
        `🏗️ Starting real build stage ${requestedNextStage}...`,
      ]);

      const buildResponse = await fetch(
        "/api/builder/build",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            projectId: builderProject.id,
            originalRequest:
              builderProject.original_request,
            plan,
          }),
        }
      );

      const buildData = await buildResponse.json();

      if (!buildResponse.ok) {
        throw new Error(
          buildData?.error ||
            "BOMBA AI could not build the project."
        );
      }

      if (!buildData?.project) {
        throw new Error(
          "BOMBA AI did not return the updated project."
        );
      }

      const returnedFiles =
        Array.isArray(
          buildData?.project?.project_files
        )
          ? buildData.project.project_files
          : Array.isArray(
              builderProject?.project_files
            )
          ? builderProject.project_files
          : [];

      const safeProject = {
        ...builderProject,
        ...buildData.project,
        original_request:
          builderProject.original_request,
        project_files: returnedFiles,
      };

      setBuilderProject(safeProject);

      const stageName =
        buildData?.stage?.stageName ||
        `Stage ${
          buildData?.project?.current_stage ||
          requestedNextStage
        }`;

      const stageSummary =
        buildData?.stage?.summary ||
        "BOMBA AI completed and saved this build stage.";

      setBuilderBuildLogs((current) => [
        ...current,
        `✅ ${stageName} completed.`,
        `📝 ${stageSummary}`,
      ]);
    } catch (err) {
      console.error("Builder build error:", err);

      const message =
        err?.message ||
        "Something went wrong while building your project.";

      setBuilderBuildError(message);

      setBuilderBuildLogs((current) => [
        ...current,
        `❌ ${message}`,
      ]);
    } finally {
      setBuilderBuildLoading(false);
    }
  }

  async function revealAskAnswerGradually(text) {
    setAskAnswer("");

    const words = text.split(/(\s+)/);
    let current = "";

    for (const part of words) {
      current += part;
      setAskAnswer(current);

      if (part.trim()) {
        await new Promise((resolve) =>
          setTimeout(resolve, 28)
        );
      }
    }
  }

  async function askBombaAI() {
    const question = askPrompt.trim();

    if (!question) {
      setAskError(
        "Type or speak a question for BOMBA AI."
      );
      return;
    }

    setAskLoading(true);
    setAskError("");
    setAskAnswer("");
    setCopyStatus("");

    try {
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL;

      const supabaseAnonKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
          "Supabase is not configured."
        );
      }

      const { createClient } = await import(
        "@supabase/supabase-js"
      );

      const supabase = createClient(
        supabaseUrl,
        supabaseAnonKey
      );

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error(
          "Please log in before using Ask BOMBA AI."
        );
      }

      const response = await fetch(
        "/api/builder/ask",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            question,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "BOMBA AI could not answer your question."
        );
      }

      if (!data?.answer) {
        throw new Error(
          "BOMBA AI did not return an answer."
        );
      }

      await revealAskAnswerGradually(data.answer);
    } catch (err) {
      console.error(
        "Ask BOMBA AI error:",
        err
      );

      setAskError(
        err?.message ||
          "Something went wrong while asking BOMBA AI."
      );
    } finally {
      setAskLoading(false);
    }
  }

  async function copyAskAnswer() {
    if (!askAnswer) return;

    try {
      await navigator.clipboard.writeText(
        askAnswer
      );

      setCopyStatus("ANSWER COPIED ✓");

      setTimeout(() => {
        setCopyStatus("");
      }, 2000);
    } catch (error) {
      console.error("Copy answer error:", error);

      setCopyStatus(
        "Copy failed. Please select and copy the answer manually."
      );

      setTimeout(() => {
        setCopyStatus("");
      }, 2500);
    }
  }

  async function copyCodeFromAnswer() {
    if (!askAnswer) return;

    const codeBlocks = [];
    const regex =
      /```(?:[a-zA-Z0-9_+-]+)?\s*([\s\S]*?)```/g;

    let match;

    while ((match = regex.exec(askAnswer)) !== null) {
      if (match[1]?.trim()) {
        codeBlocks.push(match[1].trim());
      }
    }

    if (!codeBlocks.length) {
      setCopyStatus(
        "No code block found in this answer."
      );

      setTimeout(() => {
        setCopyStatus("");
      }, 2200);

      return;
    }

    try {
      await navigator.clipboard.writeText(
        codeBlocks.join("\n\n")
      );

      setCopyStatus("CODE COPIED ✓");

      setTimeout(() => {
        setCopyStatus("");
      }, 2000);
    } catch (error) {
      console.error("Copy code error:", error);

      setCopyStatus(
        "Copy failed. Please select and copy the code manually."
      );

      setTimeout(() => {
        setCopyStatus("");
      }, 2500);
    }
  }

  function startVoiceInput() {
    setAskError("");

    if (voiceListening) {
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setAskError(
        "Voice input is not supported in this browser. Please use Google Chrome on Android."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setVoiceListening(true);
      setAskError("");
    };

    recognition.onresult = (event) => {
      const transcript =
        event.results?.[0]?.[0]?.transcript || "";

      if (transcript.trim()) {
        setAskPrompt(transcript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error(
        "Voice recognition error:",
        event
      );

      setVoiceListening(false);

      if (event?.error === "not-allowed") {
        setAskError(
          "Microphone permission was denied. Please allow microphone access and try again."
        );
        return;
      }

      setAskError(
        "BOMBA AI could not hear the voice input. Please try again."
      );
    };

    recognition.onend = () => {
      setVoiceListening(false);
    };

    try {
      recognition.start();
    } catch (error) {
      console.error(
        "Voice start error:",
        error
      );

      setVoiceListening(false);

      setAskError(
        "Voice input could not be started. Please try again."
      );
    }
  }

  function downloadImage() {
    if (!image) return;

    const link = document.createElement("a");
    link.href = image;
    link.download = "bomba-ai-flyer.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function selectFeature(name) {
    setMenuOpen(false);

    if (name === "Universal Builder") {
      setActiveFeature("Universal Builder");
      setError("");
      setAskError("");
      return;
    }

    if (name === "ASK BOMBA AI") {
      setActiveFeature("ASK BOMBA AI");
      setError("");
      setAskError("");
      return;
    }

    if (name === "Flyer") {
      setActiveFeature("Flyer");
      setError("");
      return;
    }

    setError(
      `${name} is coming next. We're building BOMBA AI one feature at a time.`
    );
  }

  function resetBuilder() {
    setBuilderProject(null);
    setBuilderPlan(null);
    setBuilderBuildLogs([]);
    setBuilderBuildError("");
    setBuilderBuildLoading(false);
    setBuilderView("start");
    setBuilderPrompt("");
    setAskPrompt("");
    setAskAnswer("");
    setAskError("");
    setCopyStatus("");
    setError("");
  }

  function goHome() {
    setMenuOpen(false);
    setActiveFeature("Flyer");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function openFlyer() {
    setMenuOpen(false);
    setActiveFeature("Flyer");
    setError("");

    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  }

  function openBuilder() {
    setMenuOpen(false);
    setActiveFeature("Universal Builder");
    setError("");

    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  }

  function openAsk() {
    setMenuOpen(false);
    setActiveFeature("ASK BOMBA AI");
    setAskError("");

    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  }

  function openAuth() {
    setMenuOpen(false);
    window.location.href = "/auth";
  }

  const totalStages =
    Number(builderProject?.total_stages || 0);

  const currentStage =
    Number(builderProject?.current_stage || 0);

  const progressPercent = totalStages
    ? Math.min(
        100,
        Math.round(
          (currentStage / totalStages) * 100
        )
      )
    : 0;

  const buildCompleted =
    builderProject?.is_completed === true ||
    (totalStages > 0 &&
      currentStage >= totalStages);

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <button
          type="button"
          onClick={goHome}
          style={styles.brandButton}
        >
          <div style={styles.brand}>
            <div style={styles.logo}>TB</div>

            <div>
              <div style={styles.brandName}>
                {BRAND.name}
              </div>

              <div style={styles.tagline}>
                {BRAND.tagline}
              </div>
            </div>
          </div>
        </button>

        <button
          type="button"
          style={{
            ...styles.menuButton,
            ...(menuOpen
              ? styles.menuButtonOpen
              : {}),
          }}
          onClick={() => {
            setMenuOpen((current) => !current);
            setError("");
          }}
          aria-label="Open BOMBA AI menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </header>

      {menuOpen && (
        <>
          <div
            style={styles.menuOverlay}
            onClick={() => setMenuOpen(false)}
          />

          <div style={styles.menuPanel}>
            <div style={styles.menuHeader}>
              <div>
                <div style={styles.menuBrand}>
                  BOMBA AI
                </div>

                <div style={styles.menuTagline}>
                  Automate. Grow. Earn.
                </div>
              </div>

              <div style={styles.menuTB}>TB</div>
            </div>

            <div style={styles.menuDivider}></div>

            <button
              type="button"
              style={styles.menuItem}
              onClick={goHome}
            >
              <span style={styles.menuIcon}>🏠</span>
              <span>Home</span>
            </button>

            <button
              type="button"
              style={styles.menuItem}
              onClick={openFlyer}
            >
              <span style={styles.menuIcon}>🎨</span>
              <span>Flyer Generator</span>
            </button>

            <button
              type="button"
              style={styles.menuItem}
              onClick={openBuilder}
            >
              <span style={styles.menuIcon}>🛠️</span>
              <span>Universal Builder</span>
            </button>

            <button
              type="button"
              style={styles.menuItem}
              onClick={openAsk}
            >
              <span style={styles.menuIcon}>💬</span>
              <span>Ask BOMBA AI</span>
            </button>

            <button
              type="button"
              style={styles.menuItem}
              onClick={openAuth}
            >
              <span style={styles.menuIcon}>🔐</span>
              <span>Login / Sign Up</span>
            </button>

            <div style={styles.menuDivider}></div>

            <div style={styles.menuComing}>
              <div style={styles.menuComingTitle}>
                More coming soon
              </div>

              <div style={styles.menuComingText}>
                Website • Logo • Image • AI Tools
              </div>
            </div>
          </div>
        </>
      )}

      <section style={styles.hero}>
        <div style={styles.eyebrow}>
          UNIVERSAL AI CREATION PLATFORM
        </div>

        <h1 style={styles.heroTitle}>
          {BRAND.slogan}
        </h1>

        <p style={styles.heroText}>
          Create flyers, websites, logos, images, apps and
          more with one intelligent AI platform.
        </p>

        <div style={styles.featureRow}>
          {FEATURES.map((feature) => {
            const isActive =
              activeFeature === feature.name;

            return (
              <button
                key={feature.name}
                type="button"
                onClick={() =>
                  selectFeature(feature.name)
                }
                style={{
                  ...styles.feature,
                  ...(isActive
                    ? styles.featureActive
                    : {}),
                }}
              >
                <div style={styles.featureIcon}>
                  {feature.icon}
                </div>

                <div style={styles.featureName}>
                  {feature.name}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {activeFeature === "ASK BOMBA AI" ? (
        <section style={styles.workspace}>
          <div style={styles.sectionTop}>
            <div>
              <div style={styles.smallGold}>
                INTELLIGENT ASSISTANT
              </div>

              <h2 style={styles.sectionTitle}>
                Ask BOMBA AI anything
              </h2>
            </div>

            <div style={styles.liveBadge}>
              <span style={styles.liveDot}></span>
              AI READY
            </div>
          </div>

          <div style={styles.askCard}>
            <div style={styles.askLogo}>TB</div>

            <h2 style={styles.askTitle}>
              Ask BOMBA AI anything
            </h2>

            <p style={styles.askDescription}>
              Your independent AI assistant for questions,
              ideas, business, writing, coding, planning
              and more.
            </p>

            <label style={styles.label}>
              Your question or instruction
            </label>

            <textarea
              value={askPrompt}
              onChange={(e) => {
                setAskPrompt(e.target.value);
                setAskError("");
              }}
              placeholder="Ask anything... Example: Give me 5 business ideas I can start in Nigeria with ₦100,000."
              style={styles.askTextarea}
            />

            <div style={styles.askActions}>
              <button
                type="button"
                onClick={startVoiceInput}
                disabled={
                  voiceListening || askLoading
                }
                style={{
                  ...styles.voiceButton,
                  opacity:
                    voiceListening || askLoading
                      ? 0.65
                      : 1,
                }}
              >
                {voiceListening
                  ? "🎙️ LISTENING..."
                  : "🎙️ VOICE"}
              </button>

              <button
                type="button"
                onClick={askBombaAI}
                disabled={askLoading}
                style={{
                  ...styles.askButton,
                  opacity: askLoading ? 0.65 : 1,
                }}
              >
                {askLoading
                  ? "🧠 THINKING..."
                  : "💬 ASK BOMBA AI"}
              </button>
            </div>

            {voiceListening && (
              <div style={styles.voiceStatus}>
                🎙️ BOMBA AI is listening. Speak clearly...
              </div>
            )}

            {askError && (
              <div style={styles.error}>
                {askError}
              </div>
            )}

            {askLoading && (
              <div style={styles.askLoadingCard}>
                <div style={styles.askLoadingLogo}>
                  TB
                </div>

                <div>
                  <strong>
                    BOMBA AI is thinking...
                  </strong>

                  <div style={styles.askLoadingText}>
                    BOMBA AI is preparing your answer.
                  </div>
                </div>
              </div>
            )}

            {askAnswer && !askLoading && (
              <div style={styles.answerCard}>
                <div style={styles.answerHeader}>
                  <div style={styles.answerLogo}>
                    TB
                  </div>

                  <div>
                    <div style={styles.answerLabel}>
                      BOMBA AI
                    </div>

                    <div style={styles.answerSubLabel}>
                      Independent AI Assistant
                    </div>
                  </div>
                </div>

                <div style={styles.answerText}>
                  {askAnswer}
                </div>

                <div style={styles.copyActions}>
                  <button
                    type="button"
                    onClick={copyAskAnswer}
                    style={styles.copyButton}
                  >
                    📋 COPY ANSWER
                  </button>

                  {askAnswer.includes("```") && (
                    <button
                      type="button"
                      onClick={copyCodeFromAnswer}
                      style={styles.copyButton}
                    >
                      💻 COPY CODE
                    </button>
                  )}
                </div>

                {copyStatus && (
                  <div style={styles.copyStatus}>
                    {copyStatus}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setAskPrompt("");
                    setAskAnswer("");
                    setAskError("");
                    setCopyStatus("");
                  }}
                  style={styles.askNewButton}
                >
                  + ASK ANOTHER QUESTION
                </button>
              </div>
            )}
          </div>
        </section>
      ) : activeFeature === "Universal Builder" ? (
        <section style={styles.workspace}>
          <div style={styles.sectionTop}>
            <div>
              <div style={styles.smallGold}>
                BUILD
              </div>

              <h2 style={styles.sectionTitle}>
                Universal Builder
              </h2>
            </div>

            <div style={styles.liveBadge}>
              <span style={styles.liveDot}></span>
              BUILDER READY
            </div>
          </div>

          {builderView === "start" && (
            <div style={styles.builderCard}>
              <div style={styles.builderLogo}>
                TB
              </div>

              <h2 style={styles.builderTitle}>
                Build anything with BOMBA AI
              </h2>

              <p style={styles.builderDescription}>
                Describe what you want to build. BOMBA AI
                will understand the request, create the
                project plan, build it in real stages, save
                your progress, and continue from where it
                stopped.
              </p>

              <label style={styles.label}>
                What do you want to build?
              </label>

              <textarea
                value={builderPrompt}
                onChange={(e) => {
                  setBuilderPrompt(e.target.value);
                  setError("");
                }}
                placeholder="Example: Build a school management system for students, teachers, classes and school administrators..."
                style={styles.textarea}
              />

              <button
                type="button"
                disabled={loading}
                onClick={startBuilder}
                style={{
                  ...styles.generateButton,
                  opacity: loading ? 0.65 : 1,
                }}
              >
                {loading
                  ? "🧠 CREATING PLAN..."
                  : "🚀 START BUILDING"}
              </button>

              {error && (
                <div style={styles.error}>
                  {error}
                </div>
              )}

              <div style={styles.builderSteps}>
                <div style={styles.builderStep}>
                  <div style={styles.stepNumber}>1</div>

                  <div>
                    <strong>Describe</strong>

                    <div style={styles.stepText}>
                      Tell BOMBA what you want.
                    </div>
                  </div>
                </div>

                <div style={styles.builderStep}>
                  <div style={styles.stepNumber}>2</div>

                  <div>
                    <strong>Understand & Plan</strong>

                    <div style={styles.stepText}>
                      BOMBA AI understands your request
                      and creates the real project plan.
                    </div>
                  </div>
                </div>

                <div style={styles.builderStep}>
                  <div style={styles.stepNumber}>3</div>

                  <div>
                    <strong>Build</strong>

                    <div style={styles.stepText}>
                      The AI actually builds the next
                      project stage.
                    </div>
                  </div>
                </div>

                <div style={styles.builderStep}>
                  <div style={styles.stepNumber}>4</div>

                  <div>
                    <strong>Save</strong>

                    <div style={styles.stepText}>
                      Completed work is saved to the
                      project.
                    </div>
                  </div>
                </div>

                <div style={styles.builderStep}>
                  <div style={styles.stepNumber}>5</div>

                  <div>
                    <strong>Continue</strong>

                    <div style={styles.stepText}>
                      Future build sessions continue from
                      the saved stage.
                    </div>
                  </div>
                </div>

                <div style={styles.builderStep}>
                  <div style={styles.stepNumber}>6</div>

                  <div>
                    <strong>Control</strong>

                    <div style={styles.stepText}>
                      Owner and admin controls come later.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {builderView === "workspace" &&
            builderProject && (
              <div style={styles.builderWorkspace}>
                <div style={styles.workspaceHeader}>
                  <div>
                    <div style={styles.smallGold}>
                      PROJECT WORKSPACE
                    </div>

                    <h2 style={styles.workspaceTitle}>
                      {builderProject.project_name ||
                        "New BOMBA Project"}
                    </h2>
                  </div>

                  <div style={styles.projectStatus}>
                    {buildCompleted
                      ? "COMPLETE"
                      : "ACTIVE"}
                  </div>
                </div>

                <div style={styles.requestBox}>
                  <div style={styles.boxLabel}>
                    ORIGINAL REQUEST
                  </div>

                  <div style={styles.requestText}>
                    {builderProject.original_request}
                  </div>
                </div>

                <div style={styles.progressCard}>
                  <div style={styles.progressTop}>
                    <div>
                      <div style={styles.boxLabel}>
                        BUILD PROGRESS
                      </div>

                      <div style={styles.progressTitle}>
                        Stage {currentStage} of{" "}
                        {totalStages || "—"}
                      </div>
                    </div>

                    <div style={styles.progressPercent}>
                      {progressPercent}%
                    </div>
                  </div>

                  <div style={styles.progressTrack}>
                    <div
                      style={{
                        ...styles.progressBar,
                        width: `${progressPercent}%`,
                      }}
                    ></div>
                  </div>

                  <div style={styles.progressNote}>
                    {buildCompleted
                      ? "The planned build stages have been completed."
                      : currentStage
                      ? "BOMBA AI has saved your latest build progress. BUILD will continue from the next saved stage."
                      : "Your project is saved and your plan is ready. Press BUILD to start the real AI build engine."}
                  </div>
                </div>

                <div style={styles.workspaceActions}>
                  <button
                    type="button"
                    onClick={() =>
                      setBuilderView("plan")
                    }
                    style={styles.workspaceButton}
                  >
                    📋 PLAN
                  </button>

                  <button
                    type="button"
                    onClick={buildBuilderProject}
                    disabled={
                      builderBuildLoading ||
                      buildCompleted
                    }
                    style={{
                      ...styles.workspaceButtonPrimary,
                      marginTop: 0,
                      opacity:
                        builderBuildLoading ||
                        buildCompleted
                          ? 0.65
                          : 1,
                    }}
                  >
                    {builderBuildLoading
                      ? "🏗️ BUILDING..."
                      : buildCompleted
                      ? "✅ BUILD COMPLETE"
                      : "🚀 BUILD"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setBuilderView("preview")
                    }
                    style={styles.workspaceButton}
                  >
                    👁️ PREVIEW
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setBuilderView("files")
                    }
                    style={styles.workspaceButton}
                  >
                    🔒 FILES & CODE
                  </button>
                </div>

                <button
                  type="button"
                  onClick={openAsk}
                  style={styles.askFromProjectButton}
                >
                  💬 OPEN ASK BOMBA AI
                </button>

                <div style={styles.workspaceInfo}>
                  <div style={styles.infoIcon}>✓</div>

                  <div>
                    <strong>
                      Project saved successfully
                    </strong>

                    <div style={styles.infoText}>
                      BOMBA AI can continue working from
                      this saved project.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetBuilder}
                  style={styles.newProjectButton}
                >
                  + NEW PROJECT
                </button>
              </div>
            )}

          {builderView === "plan" &&
            builderProject && (
              <div style={styles.builderWorkspace}>
                <div style={styles.workspaceHeader}>
                  <div>
                    <div style={styles.smallGold}>
                      PROJECT PLAN
                    </div>

                    <h2 style={styles.workspaceTitle}>
                      BOMBA AI Plan
                    </h2>
                  </div>
                </div>

                {builderPlan ? (
                  <>
                    <div style={styles.planIntro}>
                      <h3 style={styles.planProjectName}>
                        {builderPlan.projectName ||
                          builderProject.project_name ||
                          "BOMBA Project"}
                      </h3>

                      {builderPlan.summary && (
                        <p style={styles.planSummary}>
                          {builderPlan.summary}
                        </p>
                      )}

                      {builderPlan.goal && (
                        <p style={styles.planSummary}>
                          <strong>Goal:</strong>{" "}
                          {builderPlan.goal}
                        </p>
                      )}
                    </div>

                    {Array.isArray(
                      builderPlan.features
                    ) &&
                      builderPlan.features.length > 0 && (
                        <div style={styles.planSection}>
                          <div style={styles.boxLabel}>
                            FEATURES
                          </div>

                          {builderPlan.features.map(
                            (feature, index) => (
                              <div
                                key={`feature-${index}`}
                                style={styles.planItem}
                              >
                                <div
                                  style={
                                    styles.planNumber
                                  }
                                >
                                  {index + 1}
                                </div>

                                <div>
                                  <strong>
                                    {feature.name}
                                  </strong>

                                  <div
                                    style={
                                      styles.stepText
                                    }
                                  >
                                    {
                                      feature.description
                                    }
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}

                    {Array.isArray(builderPlan.pages) &&
                      builderPlan.pages.length > 0 && (
                        <div style={styles.planSection}>
                          <div style={styles.boxLabel}>
                            PAGES
                          </div>

                          {builderPlan.pages.map(
                            (page, index) => (
                              <div
                                key={`page-${index}`}
                                style={styles.planItem}
                              >
                                <div
                                  style={
                                    styles.planNumber
                                  }
                                >
                                  {index + 1}
                                </div>

                                <div>
                                  <strong>
                                    {page.name}
                                  </strong>

                                  <div
                                    style={
                                      styles.stepText
                                    }
                                  >
                                    {page.purpose}
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}

                    {Array.isArray(
                      builderPlan.userRoles
                    ) &&
                      builderPlan.userRoles.length > 0 && (
                        <div style={styles.planSection}>
                          <div style={styles.boxLabel}>
                            USER ROLES
                          </div>

                          {builderPlan.userRoles.map(
                            (role, index) => (
                              <div
                                key={`role-${index}`}
                                style={styles.planItem}
                              >
                                <div
                                  style={
                                    styles.planNumber
                                  }
                                >
                                  {index + 1}
                                </div>

                                <div>
                                  <strong>
                                    {role.name}
                                  </strong>

                                  <div
                                    style={
                                      styles.stepText
                                    }
                                  >
                                    {role.description}
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}

                    {Array.isArray(
                      builderPlan.buildStages
                    ) &&
                      builderPlan.buildStages.length > 0 && (
                        <div style={styles.planSection}>
                          <div style={styles.boxLabel}>
                            REAL BUILD STAGES
                          </div>

                          {builderPlan.buildStages.map(
                            (stage, index) => (
                              <div
                                key={`stage-${index}`}
                                style={styles.planItem}
                              >
                                <div
                                  style={
                                    styles.planNumber
                                  }
                                >
                                  {stage.stage ||
                                    index + 1}
                                </div>

                                <div>
                                  <strong>
                                    {stage.name}
                                  </strong>

                                  <div
                                    style={
                                      styles.stepText
                                    }
                                  >
                                    {
                                      stage.description
                                    }
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}

                    <button
                      type="button"
                      onClick={() =>
                        setBuilderView("workspace")
                      }
                      style={styles.workspaceButtonPrimary}
                    >
                      ← BACK TO WORKSPACE
                    </button>

                    {!buildCompleted && (
                      <button
                        type="button"
                        onClick={buildBuilderProject}
                        disabled={builderBuildLoading}
                        style={styles.workspaceButtonPrimary}
                      >
                        {builderBuildLoading
                          ? "🏗️ BUILDING..."
                          : "🚀 BUILD THIS PROJECT"}
                      </button>
                    )}
                  </>
                ) : (
                  <div style={styles.fileEmpty}>
                    <div style={styles.fileIcon}>
                      🧠
                    </div>

                    <h3>
                      BOMBA AI is preparing your plan
                    </h3>

                    <p>
                      Your real project plan will appear
                      here before the build begins.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setBuilderView("workspace")
                  }
                  style={styles.workspaceButton}
                >
                  ← BACK TO WORKSPACE
                </button>
              </div>
            )}

          {builderView === "build" &&
            builderProject && (
              <div style={styles.builderWorkspace}>
                <div style={styles.workspaceHeader}>
                  <div>
                    <div style={styles.smallGold}>
                      BUILD SESSION
                    </div>

                    <h2 style={styles.workspaceTitle}>
                      {builderBuildLoading
                        ? "BOMBA AI is building"
                        : buildCompleted
                        ? "Build Complete"
                        : "Build Stage"}
                    </h2>
                  </div>

                  <div style={styles.projectStatus}>
                    {builderBuildLoading
                      ? "WORKING"
                      : buildCompleted
                      ? "DONE"
                      : "READY"}
                  </div>
                </div>

                <div style={styles.sessionCard}>
                  <div style={styles.sessionIcon}>
                    {builderBuildLoading
                      ? "🏗️"
                      : buildCompleted
                      ? "✅"
                      : "🚀"}
                  </div>

                  <h3 style={styles.sessionTitle}>
                    {builderBuildLoading
                      ? "BOMBA AI is doing real build work"
                      : buildCompleted
                      ? "The planned build stages are complete"
                      : "Ready for the next real build stage"}
                  </h3>

                  <p style={styles.sessionText}>
                    {builderBuildLoading
                      ? "The AI is working on the current project stage. The result will be saved when the stage is completed."
                      : "No artificial waiting is being used. Each BUILD action sends the project to the real build engine."}
                  </p>

                  <div style={styles.sessionRule}>
                    <strong>Current stage:</strong>{" "}
                    {currentStage} /{" "}
                    {totalStages || "—"}
                  </div>

                  <div style={styles.sessionRule}>
                    <strong>Continue:</strong>{" "}
                    from the exact saved stage
                  </div>
                </div>

                {builderBuildLogs.length > 0 && (
                  <div style={styles.buildLogCard}>
                    <div style={styles.boxLabel}>
                      REAL BUILD ACTIVITY
                    </div>

                    <div style={styles.buildLogs}>
                      {builderBuildLogs.map(
                        (log, index) => (
                          <div
                            key={`log-${index}`}
                            style={styles.buildLog}
                          >
                            {log}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {builderBuildError && (
                  <div style={styles.error}>
                    {builderBuildError}
                  </div>
                )}

                {!builderBuildLoading &&
                  !buildCompleted && (
                    <button
                      type="button"
                      onClick={buildBuilderProject}
                      style={styles.workspaceButtonPrimary}
                    >
                      🚀 BUILD NEXT STAGE
                    </button>
                  )}

                <button
                  type="button"
                  onClick={() =>
                    setBuilderView("workspace")
                  }
                  style={styles.workspaceButtonPrimary}
                >
                  ← BACK TO WORKSPACE
                </button>
              </div>
            )}

          {builderView === "preview" &&
            builderProject && (
              <div style={styles.builderWorkspace}>
                <div style={styles.workspaceHeader}>
                  <div>
                    <div style={styles.smallGold}>
                      PREVIEW
                    </div>

                    <h2 style={styles.workspaceTitle}>
                      Project Preview
                    </h2>
                  </div>
                </div>

                <div style={styles.previewBuilder}>
                  <div style={styles.previewBuilderLogo}>
                    TB
                  </div>

                  <h3>
                    {builderProject.project_name ||
                      "Your BOMBA Project"}
                  </h3>

                  {buildCompleted ? (
                    <p>
                      The build stages are complete.
                      Generated project files are preserved
                      and ready for the real preview engine.
                    </p>
                  ) : (
                    <p>
                      BOMBA AI is still building this
                      application. The preview will use the
                      generated project files as the Builder
                      stages are completed.
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setBuilderView("workspace")
                  }
                  style={styles.workspaceButtonPrimary}
                >
                  ← BACK TO WORKSPACE
                </button>
              </div>
            )}

          {builderView === "files" &&
            builderProject && (
              <div style={styles.builderWorkspace}>
                <div style={styles.workspaceHeader}>
                  <div>
                    <div style={styles.smallGold}>
                      PROJECT FILES
                    </div>

                    <h2 style={styles.workspaceTitle}>
                      Files & Code
                    </h2>
                  </div>
                </div>

                <div style={styles.lockedFilesCard}>
                  <div style={styles.lockIcon}>
                    🔒
                  </div>

                  <h3 style={styles.lockedFilesCardH3}>
                    SOURCE CODE LOCKED
                  </h3>

                  <p style={styles.lockedFilesCardP}>
                    BOMBA AI protects generated project
                    source code and ZIP files from normal
                    users. Preview and project use can be
                    provided while source access remains
                    protected.
                  </p>

                  <div style={styles.lockedFileStatus}>
                    <span>Project files generated:</span>
                    <strong>
                      {Array.isArray(
                        builderProject.project_files
                      ) &&
                      builderProject.project_files.length
                        ? " YES"
                        : currentStage > 0
                        ? " YES"
                        : " NOT YET"}
                    </strong>
                  </div>

                  <div style={styles.lockedFileStatus}>
                    <span>Source display:</span>
                    <strong> LOCKED</strong>
                  </div>

                  <div style={styles.lockedFileStatus}>
                    <span>ZIP export:</span>
                    <strong> LOCKED</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setBuilderView("workspace")
                  }
                  style={styles.workspaceButtonPrimary}
                >
                  ← BACK TO WORKSPACE
                </button>
              </div>
            )}
        </section>
      ) : (
        <section style={styles.workspace}>
          <div style={styles.sectionTop}>
            <div>
              <div style={styles.smallGold}>
                CREATE
              </div>

              <h2 style={styles.sectionTitle}>
                AI Flyer Generator
              </h2>
            </div>

            <div style={styles.liveBadge}>
              <span style={styles.liveDot}></span>
              AI READY
            </div>
          </div>

          <div style={styles.card}>
            <label style={styles.label}>
              Describe your flyer
            </label>

            <textarea
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                setError("");
              }}
              placeholder="Example: Create a premium birthday flyer for Kingsley Suoye, black and gold design, elegant celebration, Saturday 20 September..."
              style={styles.textarea}
            />

            <div style={styles.helper}>
              Be specific about the event, business,
              colors, text, style and information you want
              on the flyer.
            </div>

            <div style={styles.uploadBox}>
              <div style={styles.uploadTitle}>
                📸 Add your photo or logo
              </div>

              <div style={styles.uploadText}>
                Upload an image that BOMBA AI should use in
                your flyer.
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={styles.hiddenInput}
              />

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                style={styles.uploadButton}
              >
                📷{" "}
                {uploadedImage
                  ? "Change Photo / Logo"
                  : "Upload Photo / Logo"}
              </button>

              {uploadedImage && (
                <>
                  <div style={styles.uploadPreview}>
                    <img
                      src={uploadedImage}
                      alt="Uploaded photo or logo"
                      style={styles.previewImage}
                    />

                    <div style={styles.uploadInfo}>
                      <div style={styles.uploadedName}>
                        {uploadedName ||
                          "Uploaded image"}
                      </div>

                      <button
                        type="button"
                        onClick={
                          removeUploadedImage
                        }
                        style={styles.removeButton}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  </div>

                  <div style={styles.controlsBox}>
                    <div style={styles.controlGroup}>
                      <div style={styles.controlTitle}>
                        📐 Photo Size
                      </div>

                      <div style={styles.optionRow}>
                        {[
                          ["small", "Small"],
                          ["medium", "Medium"],
                          ["large", "Large"],
                          ["full", "Full"],
                        ].map(
                          ([value, label]) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() =>
                                setPhotoSize(
                                  value
                                )
                              }
                              style={{
                                ...styles.optionButton,
                                ...(photoSize ===
                                value
                                  ? styles.optionButtonActive
                                  : {}),
                              }}
                            >
                              {label}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div style={styles.controlGroup}>
                      <div style={styles.controlTitle}>
                        ↔️ Photo Position
                      </div>

                      <div style={styles.optionRow}>
                        {[
                          ["left", "Left"],
                          ["center", "Center"],
                          ["right", "Right"],
                        ].map(
                          ([value, label]) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() =>
                                setPhotoPosition(
                                  value
                                )
                              }
                              style={{
                                ...styles.optionButton,
                                ...(photoPosition ===
                                value
                                  ? styles.optionButtonActive
                                  : {}),
                              }}
                            >
                              {label}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div style={styles.controlNote}>
                      ✓ BOMBA AI will use your uploaded
                      image as the photo reference instead
                      of creating a different person.
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={generateFlyer}
              disabled={loading}
              style={{
                ...styles.generateButton,
                opacity: loading ? 0.65 : 1,
              }}
            >
              {loading ? (
                <>
                  <span style={styles.spinner}></span>
                  BOMBA IS CREATING...
                </>
              ) : (
                <>✨ GENERATE FLYER</>
              )}
            </button>

            {error && (
              <div style={styles.error}>
                {error}
              </div>
            )}
          </div>

          {loading && (
            <div style={styles.loadingCard}>
              <div style={styles.loadingLogo}>
                TB
              </div>

              <h3 style={styles.loadingTitle}>
                BOMBA AI is creating your flyer
              </h3>

              <p style={styles.loadingText}>
                Understanding your request → using your
                uploaded image → applying your photo
                settings → designing the composition →
                generating the flyer
              </p>
            </div>
          )}

          {image && !loading && (
            <div style={styles.resultSection}>
              <div style={styles.resultHeader}>
                <div>
                  <div style={styles.smallGold}>
                    RESULT
                  </div>

                  <h2 style={styles.resultTitle}>
                    Your BOMBA Flyer
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={downloadImage}
                  style={styles.downloadButton}
                >
                  ↓ Download
                </button>
              </div>

              <div style={styles.imageFrame}>
                <img
                  src={image}
                  alt="BOMBA AI generated flyer"
                  style={styles.generatedImage}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setImage("");

                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }}
                style={styles.createAnother}
              >
                + Create Another Flyer
              </button>
            </div>
          )}
        </section>
      )}

      <footer style={styles.footer}>
        <div style={styles.footerLogo}>TB</div>

        <div>
          <strong>BOMBA AI</strong>

          <div style={styles.footerText}>
            {BRAND.tagline}
          </div>
        </div>
      </footer>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#050505",
    color: "#ffffff",
    fontFamily:
      "Inter, Arial, Helvetica, sans-serif",
    paddingBottom: "40px",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 16px",
    borderBottom: "1px solid #1d1d1d",
    position: "sticky",
    top: 0,
    zIndex: 120,
    background: "rgba(5,5,5,0.96)",
    backdropFilter: "blur(12px)",
  },

  brandButton: {
    border: "none",
    background: "transparent",
    padding: 0,
    color: "#ffffff",
    cursor: "pointer",
    textAlign: "left",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
  },

  logo: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    background: "#FFD43B",
    color: "#000000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: "16px",
    boxShadow:
      "0 0 22px rgba(255,212,59,0.18)",
  },

  brandName: {
    fontSize: "17px",
    fontWeight: 900,
    letterSpacing: "0.5px",
  },

  tagline: {
    fontSize: "11px",
    color: "#aaaaaa",
    marginTop: "2px",
  },

  menuButton: {
    position: "relative",
    zIndex: 130,
    border: "1px solid #292929",
    background: "#111111",
    color: "#ffffff",
    borderRadius: "10px",
    width: "42px",
    height: "42px",
    fontSize: "20px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  menuButtonOpen: {
    background: "#FFD43B",
    color: "#000000",
    borderColor: "#FFD43B",
  },

  menuOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 90,
    background: "rgba(0,0,0,0.48)",
  },

  menuPanel: {
    position: "fixed",
    top: "72px",
    right: "16px",
    width: "260px",
    maxWidth: "calc(100vw - 32px)",
    background: "#0d0d0d",
    border: "1px solid #303030",
    borderRadius: "16px",
    padding: "9px",
    zIndex: 110,
    boxShadow:
      "0 20px 60px rgba(0,0,0,0.65)",
  },

  menuHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 9px 12px",
  },

  menuBrand: {
    fontSize: "14px",
    fontWeight: 950,
    letterSpacing: "0.5px",
  },

  menuTagline: {
    color: "#777777",
    fontSize: "9px",
    marginTop: "3px",
  },

  menuTB: {
    width: "34px",
    height: "34px",
    borderRadius: "9px",
    background: "#FFD43B",
    color: "#000000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 950,
  },

  menuDivider: {
    height: "1px",
    background: "#242424",
    margin: "3px 0 7px",
  },

  menuItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    border: "none",
    background: "transparent",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "13px 11px",
    fontSize: "13px",
    fontWeight: 800,
    textAlign: "left",
    cursor: "pointer",
  },

  menuIcon: {
    width: "24px",
    textAlign: "center",
    fontSize: "17px",
  },

  menuComing: {
    padding: "9px 10px 8px",
  },

  menuComingTitle: {
    color: "#FFD43B",
    fontSize: "10px",
    fontWeight: 900,
  },

  menuComingText: {
    color: "#666666",
    fontSize: "9px",
    lineHeight: 1.5,
    marginTop: "3px",
  },

  hero: {
    textAlign: "center",
    padding: "45px 18px 30px",
    maxWidth: "850px",
    margin: "0 auto",
  },

  eyebrow: {
    display: "inline-block",
    fontSize: "10px",
    letterSpacing: "2px",
    color: "#FFD43B",
    border: "1px solid #4b411d",
    background: "#100f08",
    padding: "7px 10px",
    borderRadius: "999px",
    marginBottom: "15px",
  },

  heroTitle: {
    margin: 0,
    fontSize: "clamp(34px, 9vw, 64px)",
    lineHeight: 1.02,
    fontWeight: 950,
    letterSpacing: "-2px",
  },

  heroText: {
    color: "#a8a8a8",
    maxWidth: "650px",
    margin: "18px auto 0",
    lineHeight: 1.6,
    fontSize: "14px",
  },

  featureRow: {
    display: "grid",
    gridTemplateColumns:
      "repeat(6, minmax(0, 1fr))",
    gap: "7px",
    marginTop: "28px",
    maxWidth: "760px",
    marginLeft: "auto",
    marginRight: "auto",
  },

  feature: {
    border: "1px solid #202020",
    background: "#0d0d0d",
    borderRadius: "12px",
    padding: "10px 4px",
    color: "#ffffff",
    cursor: "pointer",
    minWidth: 0,
  },

  featureActive: {
    border: "1px solid #FFD43B",
    background: "#171406",
    boxShadow:
      "0 0 18px rgba(255,212,59,0.08)",
  },

  featureIcon: {
    fontSize: "18px",
  },

  featureName: {
    marginTop: "5px",
    fontSize: "9px",
    color: "#bdbdbd",
    lineHeight: 1.25,
  },

  workspace: {
    maxWidth: "760px",
    margin: "0 auto",
    padding: "10px 16px 0",
  },

  sectionTop: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "15px",
    marginBottom: "14px",
  },

  smallGold: {
    color: "#FFD43B",
    fontSize: "10px",
    letterSpacing: "1.7px",
    fontWeight: 800,
  },

  sectionTitle: {
    margin: "5px 0 0",
    fontSize: "22px",
  },

  liveBadge: {
    fontSize: "9px",
    border: "1px solid #2b2b2b",
    borderRadius: "999px",
    padding: "7px 9px",
    color: "#cfcfcf",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  liveDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#FFD43B",
    display: "inline-block",
  },

  card: {
    background: "#0d0d0d",
    border: "1px solid #242424",
    borderRadius: "18px",
    padding: "18px",
    boxShadow:
      "0 15px 50px rgba(0,0,0,0.25)",
  },

  askCard: {
    background: "#0d0d0d",
    border: "1px solid #242424",
    borderRadius: "18px",
    padding: "22px 18px",
    boxShadow:
      "0 15px 50px rgba(0,0,0,0.25)",
  },

  askLogo: {
    width: "58px",
    height: "58px",
    margin: "0 auto 15px",
    borderRadius: "14px",
    background: "#FFD43B",
    color: "#000000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 950,
    fontSize: "19px",
    boxShadow:
      "0 0 25px rgba(255,212,59,0.14)",
  },

  askTitle: {
    margin: 0,
    textAlign: "center",
    fontSize: "23px",
    lineHeight: 1.2,
  },

  askDescription: {
    color: "#929292",
    fontSize: "12px",
    lineHeight: 1.65,
    maxWidth: "560px",
    margin: "11px auto 22px",
    textAlign: "center",
  },

  askTextarea: {
    width: "100%",
    minHeight: "135px",
    resize: "vertical",
    boxSizing: "border-box",
    background: "#050505",
    border: "1px solid #292929",
    borderRadius: "12px",
    color: "#ffffff",
    padding: "14px",
    outline: "none",
    fontSize: "14px",
    lineHeight: 1.55,
  },

  askActions: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 0.8fr) minmax(0, 1.6fr)",
    gap: "9px",
    marginTop: "12px",
  },

  voiceButton: {
    border: "1px solid #514719",
    background: "#171406",
    color: "#FFD43B",
    borderRadius: "11px",
    padding: "13px 8px",
    fontSize: "11px",
    fontWeight: 950,
    cursor: "pointer",
  },

  askButton: {
    border: "none",
    background: "#FFD43B",
    color: "#000000",
    borderRadius: "11px",
    padding: "13px 8px",
    fontSize: "11px",
    fontWeight: 950,
    cursor: "pointer",
  },

  voiceStatus: {
    marginTop: "10px",
    padding: "10px",
    background: "#171406",
    border: "1px solid #4b411d",
    borderRadius: "9px",
    color: "#FFD43B",
    textAlign: "center",
    fontSize: "10px",
    fontWeight: 800,
  },

  askLoadingCard: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    marginTop: "14px",
    padding: "13px",
    background: "#111111",
    border: "1px solid #292929",
    borderRadius: "11px",
    fontSize: "11px",
  },

  askLoadingLogo: {
    width: "38px",
    height: "38px",
    flexShrink: 0,
    borderRadius: "9px",
    background: "#FFD43B",
    color: "#000000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 950,
    fontSize: "12px",
  },

  askLoadingText: {
    color: "#777777",
    fontSize: "10px",
    lineHeight: 1.4,
    marginTop: "3px",
  },

  answerCard: {
    marginTop: "15px",
    background: "#080808",
    border: "1px solid #3a3316",
    borderRadius: "14px",
    padding: "16px",
  },

  answerHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    paddingBottom: "12px",
    borderBottom: "1px solid #242424",
  },

  answerLogo: {
    width: "36px",
    height: "36px",
    borderRadius: "9px",
    background: "#FFD43B",
    color: "#000000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 950,
    fontSize: "12px",
  },

  answerLabel: {
    color: "#FFD43B",
    fontSize: "11px",
    fontWeight: 950,
  },

  answerSubLabel: {
    color: "#666666",
    fontSize: "9px",
    marginTop: "2px",
  },

  answerText: {
    color: "#dddddd",
    fontSize: "13px",
    lineHeight: 1.7,
    whiteSpace: "pre-wrap",
    marginTop: "14px",
  },

  copyActions: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "8px",
    marginTop: "14px",
  },

  copyButton: {
    border: "1px solid #514719",
    background: "#171406",
    color: "#FFD43B",
    borderRadius: "10px",
    padding: "11px 8px",
    fontSize: "10px",
    fontWeight: 900,
    cursor: "pointer",
  },

  copyStatus: {
    marginTop: "8px",
    textAlign: "center",
    color: "#FFD43B",
    fontSize: "10px",
    fontWeight: 800,
  },

  askNewButton: {
    width: "100%",
    marginTop: "14px",
    border: "1px solid #303030",
    background: "#111111",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "11px",
    fontSize: "10px",
    fontWeight: 900,
    cursor: "pointer",
  },

  askFromProjectButton: {
    width: "100%",
    marginTop: "10px",
    border: "1px solid #514719",
    background: "#171406",
    color: "#FFD43B",
    borderRadius: "11px",
    padding: "12px",
    fontSize: "10px",
    fontWeight: 900,
    cursor: "pointer",
  },

  builderCard: {
    background: "#0d0d0d",
    border: "1px solid #242424",
    borderRadius: "18px",
    padding: "22px 18px",
    boxShadow:
      "0 15px 50px rgba(0,0,0,0.25)",
    textAlign: "center",
  },

  builderLogo: {
    width: "58px",
    height: "58px",
    margin: "0 auto 15px",
    borderRadius: "14px",
    background: "#FFD43B",
    color: "#000000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 950,
    fontSize: "19px",
    boxShadow:
      "0 0 25px rgba(255,212,59,0.14)",
  },

  builderTitle: {
    margin: 0,
    fontSize: "24px",
    lineHeight: 1.15,
  },

  builderDescription: {
    color: "#929292",
    fontSize: "12px",
    lineHeight: 1.65,
    maxWidth: "570px",
    margin: "11px auto 22px",
  },

  builderWorkspace: {
    background: "#0d0d0d",
    border: "1px solid #242424",
    borderRadius: "18px",
    padding: "18px",
    boxShadow:
      "0 15px 50px rgba(0,0,0,0.25)",
  },

  workspaceHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "18px",
  },

  workspaceTitle: {
    margin: "5px 0 0",
    fontSize: "24px",
    lineHeight: 1.2,
  },

  projectStatus: {
    border: "1px solid #514719",
    background: "#171406",
    color: "#FFD43B",
    borderRadius: "999px",
    padding: "7px 10px",
    fontSize: "9px",
    fontWeight: 900,
  },

  requestBox: {
    background: "#080808",
    border: "1px solid #242424",
    borderRadius: "12px",
    padding: "14px",
    marginBottom: "12px",
  },

  boxLabel: {
    color: "#777777",
    fontSize: "9px",
    letterSpacing: "1.4px",
    fontWeight: 900,
    marginBottom: "7px",
  },

  requestText: {
    color: "#dddddd",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  progressCard: {
    background: "#080808",
    border: "1px solid #242424",
    borderRadius: "12px",
    padding: "14px",
  },

  progressTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
  },

  progressTitle: {
    fontSize: "13px",
    fontWeight: 800,
  },

  progressPercent: {
    color: "#FFD43B",
    fontSize: "20px",
    fontWeight: 950,
  },

  progressTrack: {
    height: "8px",
    borderRadius: "999px",
    background: "#242424",
    marginTop: "13px",
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    background: "#FFD43B",
    borderRadius: "999px",
    transition: "width 0.3s ease",
  },

  progressNote: {
    color: "#777777",
    fontSize: "10px",
    lineHeight: 1.5,
    marginTop: "10px",
  },

  workspaceActions: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "9px",
    marginTop: "14px",
  },

  workspaceButton: {
    border: "1px solid #303030",
    background: "#111111",
    color: "#ffffff",
    borderRadius: "11px",
    padding: "13px 8px",
    fontSize: "11px",
    fontWeight: 900,
    cursor: "pointer",
  },

  workspaceButtonPrimary: {
    width: "100%",
    marginTop: "14px",
    border: "none",
    background: "#FFD43B",
    color: "#000000",
    borderRadius: "11px",
    padding: "13px",
    fontSize: "11px",
    fontWeight: 950,
    cursor: "pointer",
  },

  workspaceInfo: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
    marginTop: "15px",
    padding: "13px",
    borderRadius: "11px",
    background: "#111111",
    border: "1px solid #242424",
    fontSize: "11px",
  },

  infoIcon: {
    color: "#FFD43B",
    fontWeight: 950,
    fontSize: "17px",
  },

  infoText: {
    color: "#777777",
    fontSize: "10px",
    lineHeight: 1.5,
    marginTop: "3px",
  },

  newProjectButton: {
    width: "100%",
    marginTop: "9px",
    border: "1px solid #303030",
    background: "#090909",
    color: "#aaaaaa",
    borderRadius: "11px",
    padding: "11px",
    fontSize: "10px",
    fontWeight: 800,
    cursor: "pointer",
  },

  planIntro: {
    background: "#080808",
    border: "1px solid #242424",
    borderRadius: "12px",
    padding: "14px",
    marginBottom: "14px",
  },

  planProjectName: {
    margin: 0,
    fontSize: "17px",
  },

  planSummary: {
    color: "#929292",
    fontSize: "11px",
    lineHeight: 1.6,
    margin: "8px 0 0",
  },

  planSection: {
    marginBottom: "15px",
  },

  planItem: {
    display: "flex",
    gap: "11px",
    alignItems: "flex-start",
    padding: "14px",
    border: "1px solid #242424",
    background: "#080808",
    borderRadius: "11px",
    marginBottom: "9px",
    textAlign: "left",
    fontSize: "12px",
  },

  planNumber: {
    width: "28px",
    height: "28px",
    flexShrink: 0,
    borderRadius: "8px",
    background: "#211d08",
    color: "#FFD43B",
    border: "1px solid #4b411d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 950,
  },

  sessionCard: {
    textAlign: "center",
    background: "#080808",
    border: "1px solid #242424",
    borderRadius: "14px",
    padding: "25px 16px",
  },

  sessionIcon: {
    fontSize: "38px",
  },

  sessionTitle: {
    fontSize: "17px",
    margin: "12px 0 8px",
  },

  sessionText: {
    color: "#888888",
    fontSize: "11px",
    lineHeight: 1.6,
    maxWidth: "520px",
    margin: "0 auto 16px",
  },

  sessionRule: {
    background: "#111111",
    border: "1px solid #222222",
    borderRadius: "9px",
    padding: "9px",
    marginTop: "7px",
    color: "#bdbdbd",
    fontSize: "11px",
  },

  buildLogCard: {
    marginTop: "14px",
    background: "#080808",
    border: "1px solid #242424",
    borderRadius: "14px",
    padding: "14px",
  },

  buildLogs: {
    display: "grid",
    gap: "7px",
  },

  buildLog: {
    background: "#111111",
    border: "1px solid #222222",
    borderRadius: "9px",
    padding: "10px",
    color: "#cccccc",
    fontSize: "11px",
    lineHeight: 1.5,
  },

  lockedFilesCard: {
    textAlign: "center",
    padding: "30px 18px",
    background: "#080808",
    border: "1px solid #242424",
    borderRadius: "14px",
  },

  lockIcon: {
    fontSize: "40px",
    marginBottom: "10px",
  },

  lockedFilesCardH3: {
    margin: 0,
    color: "#FFD43B",
    fontSize: "16px",
  },

  lockedFilesCardP: {
    color: "#888888",
    fontSize: "11px",
    lineHeight: 1.6,
    maxWidth: "500px",
    margin: "10px auto 16px",
  },

  lockedFileStatus: {
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    background: "#111111",
    border: "1px solid #222222",
    borderRadius: "9px",
    padding: "9px 11px",
    marginTop: "7px",
    fontSize: "10px",
    color: "#999999",
    textAlign: "left",
  },

  previewBuilder: {
    textAlign: "center",
    padding: "45px 20px",
    background: "#080808",
    border: "1px solid #242424",
    borderRadius: "14px",
  },

  previewBuilderLogo: {
    width: "60px",
    height: "60px",
    margin: "0 auto 14px",
    borderRadius: "14px",
    background: "#FFD43B",
    color: "#000000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 950,
    fontSize: "18px",
  },

  fileEmpty: {
    textAlign: "center",
    padding: "45px 20px",
    background: "#080808",
    border: "1px solid #242424",
    borderRadius: "14px",
  },

  fileIcon: {
    fontSize: "35px",
  },

  builderSteps: {
    marginTop: "25px",
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "9px",
    textAlign: "left",
  },

  builderStep: {
    display: "flex",
    gap: "10px",
    padding: "12px",
    border: "1px solid #222222",
    background: "#090909",
    borderRadius: "11px",
    fontSize: "11px",
  },

  stepNumber: {
    flexShrink: 0,
    width: "25px",
    height: "25px",
    borderRadius: "8px",
    background: "#211d08",
    color: "#FFD43B",
    border: "1px solid #4b411d",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
  },

  stepText: {
    color: "#777777",
    marginTop: "3px",
    lineHeight: 1.4,
    fontSize: "10px",
  },

  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 800,
    marginBottom: "9px",
    textAlign: "left",
  },

  textarea: {
    width: "100%",
    minHeight: "145px",
    resize: "vertical",
    boxSizing: "border-box",
    background: "#050505",
    border: "1px solid #292929",
    borderRadius: "12px",
    color: "#ffffff",
    padding: "14px",
    outline: "none",
    fontSize: "14px",
    lineHeight: 1.55,
  },

  helper: {
    color: "#858585",
    fontSize: "11px",
    lineHeight: 1.5,
    marginTop: "8px",
    textAlign: "left",
  },

  uploadBox: {
    marginTop: "18px",
    border: "1px dashed #494949",
    background: "#090909",
    borderRadius: "14px",
    padding: "15px",
    textAlign: "left",
  },

  uploadTitle: {
    fontSize: "13px",
    fontWeight: 800,
  },

  uploadText: {
    color: "#858585",
    fontSize: "11px",
    lineHeight: 1.5,
    marginTop: "5px",
  },

  hiddenInput: {
    display: "none",
  },

  uploadButton: {
    marginTop: "12px",
    border: "1px solid #5c4e1d",
    background: "#171406",
    color: "#FFD43B",
    borderRadius: "10px",
    padding: "10px 13px",
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer",
  },

  uploadPreview: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "14px",
    padding: "10px",
    borderRadius: "11px",
    background: "#111111",
    border: "1px solid #252525",
  },

  previewImage: {
    width: "70px",
    height: "70px",
    objectFit: "cover",
    borderRadius: "9px",
    border: "1px solid #3a3a3a",
  },

  uploadInfo: {
    minWidth: 0,
  },

  uploadedName: {
    fontSize: "11px",
    color: "#dddddd",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "210px",
  },

  removeButton: {
    marginTop: "7px",
    border: "none",
    background: "transparent",
    color: "#ff7777",
    padding: 0,
    fontSize: "11px",
    cursor: "pointer",
  },

  controlsBox: {
    marginTop: "14px",
    paddingTop: "14px",
    borderTop: "1px solid #242424",
  },

  controlGroup: {
    marginBottom: "15px",
  },

  controlTitle: {
    fontSize: "12px",
    fontWeight: 800,
    marginBottom: "8px",
  },

  optionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "7px",
  },

  optionButton: {
    border: "1px solid #303030",
    background: "#121212",
    color: "#c5c5c5",
    borderRadius: "9px",
    padding: "9px 12px",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
  },

  optionButtonActive: {
    border: "1px solid #FFD43B",
    background: "#211d08",
    color: "#FFD43B",
  },

  controlNote: {
    color: "#9d9d9d",
    fontSize: "10px",
    lineHeight: 1.5,
    background: "#111111",
    borderRadius: "9px",
    padding: "9px",
  },

  generateButton: {
    width: "100%",
    marginTop: "17px",
    border: "none",
    borderRadius: "12px",
    background: "#FFD43B",
    color: "#000000",
    padding: "15px",
    fontWeight: 950,
    fontSize: "13px",
    cursor: "pointer",
    boxShadow:
      "0 8px 28px rgba(255,212,59,0.14)",
  },

  spinner: {
    display: "inline-block",
    width: "13px",
    height: "13px",
    border: "2px solid rgba(0,0,0,0.3)",
    borderTopColor: "#000000",
    borderRadius: "50%",
    marginRight: "8px",
    verticalAlign: "-2px",
    animation:
      "bombaSpin 0.8s linear infinite",
  },

  error: {
    marginTop: "12px",
    padding: "11px",
    borderRadius: "10px",
    background: "#241010",
    border: "1px solid #522121",
    color: "#ffaaaa",
    fontSize: "12px",
    lineHeight: 1.5,
    textAlign: "left",
  },

  loadingCard: {
    marginTop: "18px",
    border: "1px solid #2c2817",
    background: "#0e0d08",
    borderRadius: "16px",
    padding: "25px 18px",
    textAlign: "center",
  },

  loadingLogo: {
    width: "48px",
    height: "48px",
    margin: "0 auto 12px",
    borderRadius: "11px",
    background: "#FFD43B",
    color: "#000000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 950,
  },

  loadingTitle: {
    margin: 0,
    fontSize: "16px",
  },

  loadingText: {
    color: "#929292",
    fontSize: "11px",
    lineHeight: 1.6,
    maxWidth: "480px",
    margin: "9px auto 0",
  },

  resultSection: {
    marginTop: "24px",
  },

  resultHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "10px",
    marginBottom: "12px",
  },

  resultTitle: {
    margin: "5px 0 0",
    fontSize: "21px",
  },

  downloadButton: {
    border: "1px solid #514719",
    background: "#151205",
    color: "#FFD43B",
    borderRadius: "10px",
    padding: "9px 12px",
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
  },

  imageFrame: {
    background: "#000000",
    border: "1px solid #292929",
    borderRadius: "16px",
    overflow: "hidden",
  },

  generatedImage: {
    width: "100%",
    display: "block",
    height: "auto",
  },

  createAnother: {
    width: "100%",
    marginTop: "12px",
    background: "#111111",
    border: "1px solid #2c2c2c",
    color: "#ffffff",
    borderRadius: "11px",
    padding: "12px",
    fontWeight: 800,
    fontSize: "12px",
    cursor: "pointer",
  },

  footer: {
    maxWidth: "760px",
    margin: "50px auto 0",
    padding: "18px 16px",
    borderTop: "1px solid #1d1d1d",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#ffffff",
  },

  footerLogo: {
    width: "36px",
    height: "36px",
    borderRadius: "9px",
    background: "#FFD43B",
    color: "#000000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 950,
    fontSize: "13px",
  },

  footerText: {
    color: "#777777",
    fontSize: "10px",
    marginTop: "2px",
  },
};