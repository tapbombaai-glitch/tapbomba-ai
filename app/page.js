"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const BRAND = {
  name: "BOMBA AI",
  tagline: "Automate. Grow. Earn.",
  accent: "#FFD43B",
};

const DEFAULT_PROJECT = {
  type: "flyer",
  prompt: "",
  images: [],
  template: "auto",
};

const TEMPLATES = {
  premium: {
    name: "Premium",
    label: "PREMIUM",
    background:
      "linear-gradient(145deg, #07111f 0%, #101827 48%, #260b0b 100%)",
    accent: "#FFD43B",
  },

  sales: {
    name: "Sales",
    label: "SALE",
    background:
      "linear-gradient(145deg, #260000 0%, #8b0000 48%, #120000 100%)",
    accent: "#FFD43B",
  },

  newdrop: {
    name: "New Drop",
    label: "NEW",
    background:
      "linear-gradient(145deg, #06152a 0%, #0b3b67 55%, #071018 100%)",
    accent: "#FFD43B",
  },

  celebration: {
    name: "Celebration",
    label: "CELEBRATION",
    background:
      "linear-gradient(145deg, #24102f 0%, #632c68 48%, #10101e 100%)",
    accent: "#FFD43B",
  },

  event: {
    name: "Event",
    label: "EVENT",
    background:
      "linear-gradient(145deg, #071d1d 0%, #075b58 48%, #071014 100%)",
    accent: "#FFD43B",
  },
};

function cleanText(value) {
  return String(value || "").trim();
}

function chooseTemplate(prompt) {
  const text = cleanText(prompt).toLowerCase();

  if (
    /birthday|party|celebration|anniversary|graduation|congratulations|baby shower|bridal shower/.test(
      text
    )
  ) {
    return "celebration";
  }

  if (
    /church|program|programme|conference|seminar|event|meeting|service|worship|school|campus/.test(
      text
    )
  ) {
    return "event";
  }

  if (
    /sale|discount|offer|promo|promotion|price|₦|naira|buy|shop|selling|available/.test(
      text
    )
  ) {
    return "sales";
  }

  if (
    /new|launch|drop|release|collection|product|fashion|shoe|sneaker|clothing/.test(
      text
    )
  ) {
    return "newdrop";
  }

  return "premium";
}

function extractTitle(prompt) {
  const text = cleanText(prompt);

  if (!text) return "YOUR IDEA";

  const firstSentence = text.split(/[.!?\n]/)[0].trim();

  if (firstSentence.length <= 55) {
    return firstSentence;
  }

  return `${firstSentence.substring(0, 52)}...`;
}

function analyzeProject(project) {
  const issues = [];

  const prompt = cleanText(project.prompt);

  if (!prompt) {
    issues.push({
      type: "missing",
      title: "Flyer description is empty",
      message:
        "Describe what you want the flyer to communicate before generating it.",
    });
  } else if (prompt.length < 10) {
    issues.push({
      type: "detail",
      title: "Add a little more detail",
      message:
        "A longer description gives BOMBA AI more information to work with.",
    });
  }

  if (!project.images || project.images.length === 0) {
    issues.push({
      type: "image",
      title: "No picture added",
      message:
        "This is optional. Your flyer can still be created without a picture.",
      optional: true,
    });
  }

  return issues;
}

function getAppPlan(prompt) {
  const text = cleanText(prompt);
  const lower = text.toLowerCase();

  const features = [];

  if (/login|sign in|signup|register|account|user/.test(lower)) {
    features.push("User accounts and authentication");
  }

  if (/admin|administrator|management|manage/.test(lower)) {
    features.push("Admin management area");
  }

  if (/payment|pay|checkout|wallet|subscription|price/.test(lower)) {
    features.push("Payment or transaction flow");
  }

  if (/chat|message|messaging|communication/.test(lower)) {
    features.push("Messaging and communication");
  }

  if (/booking|appointment|reservation|schedule/.test(lower)) {
    features.push("Booking and scheduling");
  }

  if (/shop|store|product|ecommerce|cart|delivery/.test(lower)) {
    features.push("Products, shopping and ordering");
  }

  if (/school|student|teacher|class|education/.test(lower)) {
    features.push("Education and school management");
  }

  if (/dashboard|analytics|report|statistics/.test(lower)) {
    features.push("Dashboard and reporting");
  }

  if (/social|post|follow|friend|community/.test(lower)) {
    features.push("Social and community features");
  }

  if (features.length === 0) {
    features.push(
      "Custom pages based on the app idea",
      "Responsive mobile-first interface",
      "Core functionality based on the requested purpose"
    );
  }

  return {
    purpose: text || "Your application idea",
    features,
    pages: [
      "Home / Landing page",
      "Main application area",
      "User experience based on the requested features",
      "Settings / management area where needed",
    ],
  };
}

export default function Home() {
  const [project, setProject] = useState(DEFAULT_PROJECT);
  const [stage, setStage] = useState("describe");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDoctor, setShowDoctor] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      const savedProject = localStorage.getItem("bomba-universal-project");

      if (savedProject) {
        const parsed = JSON.parse(savedProject);

        setProject({
          ...DEFAULT_PROJECT,
          ...parsed,
          images: Array.isArray(parsed.images)
            ? parsed.images
            : parsed.image
              ? [parsed.image]
              : [],
        });

        setSaved(true);
      }
    } catch {
      // Ignore invalid local storage data.
    }
  }, []);

  const issues = useMemo(
    () => analyzeProject(project),
    [project]
  );

  const seriousIssues = issues.filter((issue) => !issue.optional);

  const appPlan = useMemo(
    () => getAppPlan(project.prompt),
    [project.prompt]
  );

  function update(field, value) {
    setProject((current) => ({
      ...current,
      [field]: value,
    }));

    setSaved(false);
  }

  function selectCreationType(type) {
    setProject((current) => ({
      ...current,
      type,
    }));

    setSaved(false);
    setShowDoctor(false);
  }

  function startBuilding() {
    if (!cleanText(project.prompt)) {
      alert(
        "Tell BOMBA AI what you want to create first."
      );
      return;
    }

    setShowDoctor(false);

    if (project.type === "app") {
      setStage("build");
      return;
    }

    setProject((current) => ({
      ...current,
      template:
        current.template === "auto"
          ? chooseTemplate(current.prompt)
          : current.template,
    }));

    setStage("build");
  }

  function openPreview() {
    setStage("preview");
    setShowDoctor(false);
  }

  function runDoctor() {
    setStage("doctor");
    setShowDoctor(true);
  }

  function saveProject() {
    try {
      localStorage.setItem(
        "bomba-universal-project",
        JSON.stringify(project)
      );

      setSaved(true);
    } catch {
      alert(
        "BOMBA AI could not save this project on this device."
      );
    }
  }

  function resetProject() {
    const confirmed = window.confirm(
      "Start a new project? Your current unsaved work will be cleared."
    );

    if (!confirmed) return;

    localStorage.removeItem(
      "bomba-universal-project"
    );

    setProject(DEFAULT_PROJECT);
    setStage("describe");
    setSaved(false);
    setCopied(false);
    setShowDoctor(false);
  }

  function copyProjectData() {
    const text = [
      `BOMBA AI Creation`,
      `Type: ${project.type}`,
      "",
      `Description:`,
      project.prompt,
      "",
      `Images: ${project.images?.length || 0}`,
    ].join("\n");

    navigator.clipboard?.writeText(text);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  function handleImages(event) {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const oversized = files.find(
      (file) => file.size > 8 * 1024 * 1024
    );

    if (oversized) {
      alert(
        "One of the pictures is larger than 8MB. Please choose smaller pictures for better phone performance."
      );
      event.target.value = "";
      return;
    }

    const remainingSlots =
      5 - (project.images?.length || 0);

    if (remainingSlots <= 0) {
      alert(
        "You can add up to 5 pictures to one flyer."
      );
      event.target.value = "";
      return;
    }

    const selectedFiles = files.slice(
      0,
      remainingSlots
    );

    Promise.all(
      selectedFiles.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () =>
              resolve(reader.result);

            reader.onerror = reject;

            reader.readAsDataURL(file);
          })
      )
    )
      .then((newImages) => {
        setProject((current) => ({
          ...current,
          images: [
            ...(current.images || []),
            ...newImages,
          ],
        }));

        setSaved(false);
      })
      .catch(() => {
        alert("BOMBA AI could not read one of the pictures.");
      });

    event.target.value = "";
  }

  function removeImage(index) {
    setProject((current) => ({
      ...current,
      images: (current.images || []).filter(
        (_, imageIndex) => imageIndex !== index
      ),
    }));

    setSaved(false);
  }

  function autoFix() {
    if (project.type === "app") {
      if (!cleanText(project.prompt)) {
        alert(
          "Describe the app first so BOMBA AI can create a plan."
        );
        return;
      }

      setStage("build");
      return;
    }

    setProject((current) => ({
      ...current,
      template:
        current.template === "auto"
          ? chooseTemplate(current.prompt)
          : current.template,
    }));

    setSaved(false);
  }

  function exportFlyer() {
    if (project.type !== "flyer") {
      alert(
        "Export Flyer is available for flyer projects."
      );
      return;
    }

    const template =
      TEMPLATES[project.template] ||
      TEMPLATES.premium;

    const flyerWindow = window.open(
      "",
      "_blank"
    );

    if (!flyerWindow) {
      alert(
        "Please allow pop-ups in your browser to export the flyer."
      );
      return;
    }

    const images = project.images || [];

    const imageHTML =
      images.length > 0
        ? `
          <div class="image-grid">
            ${images
              .map(
                (image) =>
                  `<img src="${image}" class="product-image" />`
              )
              .join("")}
          </div>
        `
        : `
          <div class="image-placeholder">
            ADD YOUR<br/>PICTURE
          </div>
        `;

    const title = extractTitle(project.prompt);

    flyerWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${escapeHTML(
          title
        )} - BOMBA AI</title>

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        >

        <style>
          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: #111;
          }

          body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          .flyer {
            width: min(92vw, 1080px);
            aspect-ratio: 1 / 1;
            background: ${template.background};
            color: white;
            position: relative;
            overflow: hidden;
            padding: 7%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .glow-one {
            position: absolute;
            width: 45%;
            height: 45%;
            right: -15%;
            top: -15%;
            border-radius: 50%;
            background: ${template.accent};
            opacity: .08;
            filter: blur(20px);
          }

          .glow-two {
            position: absolute;
            width: 40%;
            height: 40%;
            left: -18%;
            bottom: -18%;
            border-radius: 50%;
            background: #ffffff;
            opacity: .05;
            filter: blur(25px);
          }

          .brand {
            position: relative;
            z-index: 2;
            font-size: clamp(18px, 3vw, 34px);
            font-weight: 950;
            letter-spacing: 1px;
          }

          .bomba {
            color: ${template.accent};
          }

          .label {
            display: inline-block;
            margin-top: 14px;
            padding: 9px 16px;
            background: ${template.accent};
            color: #111;
            font-weight: 950;
            border-radius: 30px;
            font-size: clamp(12px, 1.8vw, 20px);
          }

          .content {
            position: relative;
            z-index: 2;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5%;
            align-items: center;
            flex: 1;
            padding: 5% 0;
          }

          .copy {
            min-width: 0;
          }

          .headline {
            font-size: clamp(34px, 7vw, 90px);
            line-height: .95;
            font-weight: 950;
            margin: 0 0 5%;
            max-width: 100%;
          }

          .description {
            font-size: clamp(16px, 2.5vw, 29px);
            line-height: 1.35;
            color: #eeeeee;
            white-space: pre-wrap;
          }

          .visual {
            min-width: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .image-grid {
            width: 100%;
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .image-grid:has(
            img:only-child
          ) {
            grid-template-columns: 1fr;
          }

          .product-image {
            width: 100%;
            aspect-ratio: 1 / 1;
            object-fit: contain;
            filter:
              drop-shadow(
                0 20px 25px rgba(0,0,0,.45)
              );
            border-radius: 18px;
          }

          .image-placeholder {
            width: 100%;
            aspect-ratio: 1 / 1;
            border: 2px dashed
              rgba(255,255,255,.25);
            border-radius: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            color:
              rgba(255,255,255,.35);
            font-size: 22px;
            font-weight: 800;
          }

          .bottom {
            position: relative;
            z-index: 2;
            border-top: 1px solid
              rgba(255,255,255,.16);
            padding-top: 18px;
            font-size: clamp(12px, 2vw, 22px);
            color: #ddd;
            line-height: 1.4;
            white-space: pre-wrap;
          }

          @media (max-width: 650px) {
            .content {
              grid-template-columns: 1fr;
            }

            .visual {
              max-height: 42%;
            }

            .headline {
              font-size: clamp(
                30px,
                9vw,
                52px
              );
            }

            .description {
              font-size: 15px;
            }
          }

          @media print {
            body {
              background: white;
            }

            .flyer {
              width: 100vw;
              height: 100vh;
            }
          }
        </style>
      </head>

      <body>
        <div class="flyer">

          <div class="glow-one"></div>
          <div class="glow-two"></div>

          <div style="position:relative;z-index:2;">
            <div class="brand">
              <span class="bomba">TB</span>
              &nbsp;BOMBA AI
            </div>

            <div class="label">
              ${escapeHTML(template.label)}
            </div>
          </div>

          <div class="content">

            <div class="copy">
              <h1 class="headline">
                ${escapeHTML(title)}
              </h1>

              <div class="description">
                ${escapeHTML(project.prompt)}
              </div>
            </div>

            <div class="visual">
              ${imageHTML}
            </div>

          </div>

          <div class="bottom">
            Created with BOMBA AI • Automate. Grow. Earn.
          </div>

        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>

      </body>
      </html>
    `);

    flyerWindow.document.close();
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.logoRow}>
          <div style={styles.logo}>TB</div>

          <div>
            <div style={styles.brand}>
              {BRAND.name}
            </div>

            <div style={styles.tagline}>
              {BRAND.tagline}
            </div>
          </div>
        </div>

        <button
          style={styles.newButton}
          onClick={resetProject}
        >
          + New
        </button>
      </header>

      <section style={styles.hero}>
        <div style={styles.eyebrow}>
          UNIVERSAL CREATION PLATFORM
        </div>

        <h1 style={styles.heroTitle}>
          Describe it.
          <br />

          <span
            style={{
              color: BRAND.accent,
            }}
          >
            BOMBA builds it.
          </span>
        </h1>

        <p style={styles.heroText}>
          Create professional flyers, apps,
          websites, dashboards, business tools
          and more from one intelligent builder.
        </p>
      </section>

      <nav style={styles.steps}>
        {[
          ["describe", "1", "Describe"],
          ["build", "2", "Build"],
          ["preview", "3", "Preview"],
          ["doctor", "4", "AI Doctor"],
        ].map(
          ([key, number, label]) => (
            <button
              key={key}
              onClick={() => {
                if (key === "describe") {
                  setStage("describe");
                  setShowDoctor(false);
                }

                if (key === "build") {
                  setStage("build");
                  setShowDoctor(false);
                }

                if (key === "preview") {
                  setStage("preview");
                  setShowDoctor(false);
                }

                if (key === "doctor") {
                  runDoctor();
                }
              }}
              style={{
                ...styles.step,
                ...(stage === key
                  ? styles.activeStep
                  : {}),
              }}
            >
              <span style={styles.stepNumber}>
                {number}
              </span>

              {label}
            </button>
          )
        )}
      </nav>

      {stage === "describe" && (
        <section style={styles.card}>
          <div style={styles.sectionTitle}>
            What do you want to create?
          </div>

          <p style={styles.muted}>
            BOMBA AI is universal. Describe
            whatever you want to create. You do
            not have to choose a category before
            explaining your idea.
          </p>

          <div style={styles.creationGrid}>
            <button
              style={
                project.type === "flyer"
                  ? styles.creationCardActive
                  : styles.creationCard
              }
              onClick={() =>
                selectCreationType("flyer")
              }
            >
              <span style={styles.creationIcon}>
                🎨
              </span>

              <strong>
                Flyer Generator
              </strong>

              <small>
                Business • Personal • Events •
                Anything
              </small>
            </button>

            <button
              style={
                project.type === "app"
                  ? styles.creationCardActive
                  : styles.creationCard
              }
              onClick={() =>
                selectCreationType("app")
              }
            >
              <span style={styles.creationIcon}>
                🛠️
              </span>

              <strong>
                Universal App Builder
              </strong>

              <small>
                Build any kind of application
              </small>
            </button>

            <button
              style={styles.creationCard}
              onClick={() => {
                alert(
                  "Website Builder is part of the universal creation roadmap."
                );
              }}
            >
              <span style={styles.creationIcon}>
                🌐
              </span>

              <strong>
                Website
              </strong>

              <small>
                Universal website creation
              </small>
            </button>

            <button
              style={styles.creationCard}
              onClick={() => {
                alert(
                  "More universal creation tools will be added without changing the core BOMBA AI design."
                );
              }}
            >
              <span style={styles.creationIcon}>
                ✨
              </span>

              <strong>
                More
              </strong>

              <small>
                More creation tools
              </small>
            </button>
          </div>

          <div style={styles.requestBox}>
            <label style={styles.label}>
              Tell BOMBA AI what you want
            </label>

            <textarea
              placeholder={
                project.type === "flyer"
                  ? "Example: Create a beautiful birthday flyer for my daughter Sarah. Her birthday is December 20. Use an elegant modern design and leave space for her picture."
                  : "Example: Build a school management app for students, teachers, classes, payments and an admin dashboard."
              }
              style={styles.textarea}
              value={project.prompt}
              onChange={(e) =>
                update(
                  "prompt",
                  e.target.value
                )
              }
            />

            <p style={styles.helperText}>
              {project.type === "flyer"
                ? "You can describe a birthday, wedding, product, business, church event, school event, announcement or anything else. Pictures are optional."
                : "Describe any app idea. BOMBA AI will turn the description into an initial application plan."}
            </p>

            <button
              style={styles.primaryButton}
              onClick={startBuilding}
            >
              {project.type === "flyer"
                ? "✨ Generate My Flyer →"
                : "🚀 Build My App →"}
            </button>
          </div>
        </section>
      )}

      {stage === "build" &&
        project.type === "flyer" && (
          <section style={styles.workspace}>
            <div style={styles.editorCard}>
              <div style={styles.sectionHeader}>
                <div>
                  <div style={styles.sectionTitle}>
                    Build your flyer
                  </div>

                  <div style={styles.muted}>
                    BOMBA AI uses your idea and
                    automatically chooses a
                    suitable modern design.
                  </div>
                </div>

                <span style={styles.badge}>
                  AI FLYER
                </span>
              </div>

              <div style={styles.aiDesignBox}>
                <div style={styles.aiDesignTitle}>
                  🧠 AI Design Direction
                </div>

                <div style={styles.aiDesignText}>
                  {TEMPLATES[
                    project.template === "auto"
                      ? chooseTemplate(
                          project.prompt
                        )
                      : project.template
                  ]?.name || "Premium"}{" "}
                  visual style selected
                  automatically from your idea.
                </div>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Your Flyer Idea
                </label>

                <textarea
                  style={styles.textareaSmall}
                  value={project.prompt}
                  onChange={(e) =>
                    update(
                      "prompt",
                      e.target.value
                    )
                  }
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>
                  Add Pictures
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImages}
                  style={{
                    display: "none",
                  }}
                />

                <button
                  style={styles.secondaryButton}
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                >
                  📷{" "}
                  {project.images?.length
                    ? "Add More Pictures"
                    : "Upload Pictures"}
                </button>

                <div style={styles.imageHelp}>
                  You can add up to 5 pictures.
                  Product photos, personal
                  photos, event photos, logos or
                  any other pictures are allowed.
                </div>
              </div>

              {project.images?.length > 0 && (
                <div style={styles.uploadGrid}>
                  {project.images.map(
                    (image, index) => (
                      <div
                        key={`${index}-${image.substring(
                          0,
                          15
                        )}`}
                        style={
                          styles.uploadItem
                        }
                      >
                        <img
                          src={image}
                          alt={`Uploaded ${index + 1}`}
                          style={
                            styles.uploadImage
                          }
                        />

                        <button
                          style={
                            styles.removeImageButton
                          }
                          onClick={() =>
                            removeImage(
                              index
                            )
                          }
                        >
                          ×
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}

              <div style={styles.actionRow}>
                <button
                  style={styles.secondaryButton}
                  onClick={saveProject}
                >
                  {saved
                    ? "✓ Saved"
                    : "Save Draft"}
                </button>

                <button
                  style={styles.primaryButton}
                  onClick={openPreview}
                >
                  Preview →
                </button>
              </div>
            </div>

            <FlyerPreview
              project={project}
            />
          </section>
        )}

      {stage === "build" &&
        project.type === "app" && (
          <section style={styles.appBuilder}>
            <div style={styles.appBuilderCard}>
              <div style={styles.sectionHeader}>
                <div>
                  <div style={styles.sectionTitle}>
                    🛠️ Universal App Builder
                  </div>

                  <div style={styles.muted}>
                    BOMBA AI has analyzed your
                    application idea.
                  </div>
                </div>

                <span style={styles.badge}>
                  APP BUILDER
                </span>
              </div>

              <div style={styles.appIdeaBox}>
                <div style={styles.label}>
                  Your app idea
                </div>

                <p>
                  {project.prompt}
                </p>
              </div>

              <div style={styles.planGrid}>
                <div style={styles.planCard}>
                  <div style={styles.planIcon}>
                    🎯
                  </div>

                  <strong>
                    Purpose
                  </strong>

                  <p>
                    {appPlan.purpose}
                  </p>
                </div>

                <div style={styles.planCard}>
                  <div style={styles.planIcon}>
                    ⚙️
                  </div>

                  <strong>
                    Suggested Features
                  </strong>

                  <ul>
                    {appPlan.features.map(
                      (feature) => (
                        <li key={feature}>
                          {feature}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div style={styles.planCard}>
                  <div style={styles.planIcon}>
                    📱
                  </div>

                  <strong>
                    Suggested Screens
                  </strong>

                  <ul>
                    {appPlan.pages.map(
                      (page) => (
                        <li key={page}>
                          {page}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>

              <div style={styles.builderNotice}>
                <strong>
                  🚀 Universal Builder
                </strong>

                <p>
                  This is the planning stage.
                  BOMBA AI has no fixed app
                  category here. The final builder
                  can be expanded to generate the
                  actual project files and code from
                  this plan.
                </p>
              </div>

              <div style={styles.actionRow}>
                <button
                  style={styles.secondaryButton}
                  onClick={() =>
                    setStage("describe")
                  }
                >
                  ← Edit Idea
                </button>

                <button
                  style={styles.secondaryButton}
                  onClick={saveProject}
                >
                  {saved
                    ? "✓ Saved"
                    : "Save Plan"}
                </button>

                <button
                  style={styles.primaryButton}
                  onClick={() =>
                    setStage("preview")
                  }
                >
                  Preview Plan →
                </button>
              </div>
            </div>
          </section>
        )}

      {stage === "preview" &&
        project.type === "flyer" && (
          <section>
            <div style={styles.previewHeader}>
              <div>
                <div style={styles.sectionTitle}>
                  Preview
                </div>

                <div style={styles.muted}>
                  Check your professional flyer
                  before exporting.
                </div>
              </div>

              <div style={styles.actionRow}>
                <button
                  style={styles.secondaryButton}
                  onClick={() =>
                    setStage("build")
                  }
                >
                  ← Edit
                </button>

                <button
                  style={styles.primaryButton}
                  onClick={runDoctor}
                >
                  🩺 AI Doctor
                </button>
              </div>
            </div>

            <FlyerPreview
              project={project}
              large
            />

            <div style={styles.exportBar}>
              <button
                style={styles.secondaryButton}
                onClick={saveProject}
              >
                💾 Save
              </button>

              <button
                style={styles.secondaryButton}
                onClick={copyProjectData}
              >
                {copied
                  ? "✓ Copied"
                  : "Copy Details"}
              </button>

              <button
                style={styles.primaryButton}
                onClick={exportFlyer}
              >
                Export Flyer →
              </button>
            </div>
          </section>
        )}

      {stage === "preview" &&
        project.type === "app" && (
          <section>
            <div style={styles.previewHeader}>
              <div>
                <div style={styles.sectionTitle}>
                  App Builder Preview
                </div>

                <div style={styles.muted}>
                  Review the plan BOMBA AI created
                  from your idea.
                </div>
              </div>

              <div style={styles.actionRow}>
                <button
                  style={styles.secondaryButton}
                  onClick={() =>
                    setStage("build")
                  }
                >
                  ← Edit
                </button>

                <button
                  style={styles.primaryButton}
                  onClick={runDoctor}
                >
                  🩺 AI Doctor
                </button>
              </div>
            </div>

            <div style={styles.appPreview}>
              <div style={styles.mockTop}>
                <div style={styles.mockLogo}>
                  TB
                </div>

                <div>
                  <strong>
                    {extractTitle(
                      project.prompt
                    )}
                  </strong>

                  <small>
                    Powered by BOMBA AI
                  </small>
                </div>
              </div>

              <div style={styles.mockHero}>
                <div style={styles.mockBadge}>
                  APP PREVIEW
                </div>

                <h2>
                  {extractTitle(
                    project.prompt
                  )}
                </h2>

                <p>
                  {project.prompt}
                </p>
              </div>

              <div style={styles.mockCards}>
                {appPlan.features
                  .slice(0, 4)
                  .map((feature, index) => (
                    <div
                      key={feature}
                      style={styles.mockCard}
                    >
                      <span>
                        {[
                          "⚡",
                          "👥",
                          "📊",
                          "⚙️",
                        ][index] || "✨"}
                      </span>

                      <strong>
                        {feature}
                      </strong>
                    </div>
                  ))}
              </div>

              <div style={styles.mockFooter}>
                BOMBA AI • Automate. Grow. Earn.
              </div>
            </div>

            <div style={styles.exportBar}>
              <button
                style={styles.secondaryButton}
                onClick={saveProject}
              >
                💾 Save
              </button>

              <button
                style={styles.secondaryButton}
                onClick={copyProjectData}
              >
                {copied
                  ? "✓ Copied"
                  : "Copy Plan"}
              </button>
            </div>
          </section>
        )}

      {stage === "doctor" && (
        <section>
          <div style={styles.doctorHeader}>
            <div>
              <div style={styles.sectionTitle}>
                🩺 BOMBA AI Doctor
              </div>

              <p style={styles.muted}>
                Checking your creation for common
                problems.
              </p>
            </div>

            <div
              style={{
                ...styles.healthBadge,
                borderColor:
                  seriousIssues.length === 0
                    ? "#35d07f"
                    : "#ff5d5d",
              }}
            >
              {seriousIssues.length === 0
                ? "✓ READY"
                : `${seriousIssues.length} ISSUE${
                    seriousIssues.length === 1
                      ? ""
                      : "S"
                  }`}
            </div>
          </div>

          <div style={styles.doctorCard}>
            {issues.length === 0 ? (
              <div style={styles.successBox}>
                <div style={styles.successIcon}>
                  ✓
                </div>

                <h2>
                  Creation looks healthy
                </h2>

                <p>
                  No major problems were
                  detected. You can continue to
                  preview, save or export.
                </p>
              </div>
            ) : (
              <>
                {issues.map(
                  (issue, index) => (
                    <div
                      key={`${issue.title}-${index}`}
                      style={{
                        ...styles.issue,
                        ...(issue.optional
                          ? styles.optionalIssue
                          : {}),
                      }}
                    >
                      <div
                        style={
                          styles.issueIcon
                        }
                      >
                        {issue.optional
                          ? "ℹ"
                          : "!"}
                      </div>

                      <div>
                        <strong>
                          {issue.title}
                        </strong>

                        <p>
                          {issue.message}
                        </p>
                      </div>
                    </div>
                  )
                )}

                <button
                  style={styles.fixButton}
                  onClick={autoFix}
                >
                  🔧 Fix What BOMBA Can Fix
                </button>
              </>
            )}
          </div>

          {project.type === "flyer" ? (
            <FlyerPreview
              project={project}
            />
          ) : (
            <div style={styles.appBuilderCard}>
              <div style={styles.sectionTitle}>
                App Plan
              </div>

              <p style={styles.muted}>
                {project.prompt}
              </p>

              <div style={styles.planGrid}>
                <div style={styles.planCard}>
                  <strong>
                    Features
                  </strong>

                  <ul>
                    {appPlan.features.map(
                      (feature) => (
                        <li key={feature}>
                          {feature}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div style={styles.planCard}>
                  <strong>
                    Screens
                  </strong>

                  <ul>
                    {appPlan.pages.map(
                      (page) => (
                        <li key={page}>
                          {page}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div style={styles.actionRowCenter}>
            <button
              style={styles.secondaryButton}
              onClick={() =>
                setStage("build")
              }
            >
              ← Modify
            </button>

            {project.type === "flyer" && (
              <button
                style={styles.primaryButton}
                onClick={exportFlyer}
              >
                Export →
              </button>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

function FlyerPreview({
  project,
  large = false,
}) {
  const template =
    TEMPLATES[
      project.template === "auto"
        ? chooseTemplate(project.prompt)
        : project.template
    ] || TEMPLATES.premium;

  const title = extractTitle(
    project.prompt
  );

  const images = project.images || [];

  return (
    <div
      style={{
        ...styles.previewOuter,
        ...(large
          ? styles.largePreviewOuter
          : {}),
      }}
    >
      <div
        style={{
          ...styles.flyer,
          background:
            template.background,
        }}
      >
        <div style={styles.decorOne} />
        <div style={styles.decorTwo} />

        <div style={styles.flyerTop}>
          <div style={styles.flyerBrand}>
            <span
              style={{
                color: template.accent,
              }}
            >
              TB
            </span>{" "}
            BOMBA AI
          </div>

          <div
            style={{
              ...styles.flyerLabel,
              color: "#111",
              background:
                template.accent,
            }}
          >
            {template.label}
          </div>
        </div>

        <div style={styles.flyerMain}>
          <div style={styles.flyerCopy}>
            <h2 style={styles.flyerHeading}>
              {title}
            </h2>

            <p style={styles.flyerDescription}>
              {project.prompt ||
                "Describe your idea and BOMBA AI will build the design around it."}
            </p>
          </div>

          <div style={styles.flyerImageBox}>
            {images.length > 0 ? (
              <div
                style={styles.previewImageGrid}
              >
                {images
                  .slice(0, 4)
                  .map(
                    (image, index) => (
                      <img
                        key={`${index}-${image.substring(
                          0,
                          12
                        )}`}
                        src={image}
                        alt={`Flyer image ${
                          index + 1
                        }`}
                        style={
                          styles.flyerImage
                        }
                      />
                    )
                  )}
              </div>
            ) : (
              <div
                style={
                  styles.photoPlaceholder
                }
              >
                <span>＋</span>

                <small>
                  ADD PICTURE
                </small>
              </div>
            )}
          </div>
        </div>

        <div style={styles.flyerBottom}>
          <span>
            BOMBA AI
          </span>

          <strong>
            Automate. Grow. Earn.
          </strong>
        </div>
      </div>
    </div>
  );
}

function escapeHTML(value) {
  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#050505",
    color: "#fff",
    padding: "20px",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  header: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
  },

  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  logo: {
    width: "45px",
    height: "45px",
    borderRadius: "13px",
    background: "#FFD43B",
    color: "#050505",
    display: "grid",
    placeItems: "center",
    fontWeight: 1000,
    fontSize: "19px",
  },

  brand: {
    fontWeight: 900,
    fontSize: "18px",
  },

  tagline: {
    color: "#888",
    fontSize: "11px",
    marginTop: "2px",
  },

  newButton: {
    background: "#151515",
    border: "1px solid #303030",
    color: "#fff",
    padding: "10px 15px",
    borderRadius: "12px",
    cursor: "pointer",
  },

  hero: {
    maxWidth: "900px",
    margin: "60px auto 35px",
    textAlign: "center",
  },

  eyebrow: {
    color: "#FFD43B",
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "2px",
    marginBottom: "15px",
  },

  heroTitle: {
    fontSize:
      "clamp(38px, 8vw, 76px)",
    lineHeight: ".95",
    margin: 0,
    fontWeight: 950,
  },

  heroText: {
    maxWidth: "650px",
    margin: "22px auto 0",
    color: "#999",
    lineHeight: 1.6,
  },

  steps: {
    maxWidth: "1000px",
    margin: "0 auto 25px",
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "8px",
  },

  step: {
    background: "#101010",
    color: "#777",
    border: "1px solid #202020",
    borderRadius: "12px",
    padding: "12px 8px",
    cursor: "pointer",
    fontSize: "12px",
  },

  activeStep: {
    color: "#fff",
    borderColor: "#FFD43B",
  },

  stepNumber: {
    color: "#FFD43B",
    fontWeight: 900,
    marginRight: "5px",
  },

  card: {
    maxWidth: "1000px",
    margin: "0 auto",
    background: "#0d0d0d",
    border: "1px solid #202020",
    borderRadius: "20px",
    padding: "25px",
  },

  sectionTitle: {
    fontSize: "23px",
    fontWeight: 900,
  },

  muted: {
    color: "#888",
    lineHeight: 1.5,
    fontSize: "14px",
  },

  creationGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    marginTop: "25px",
  },

  creationCard: {
    minHeight: "135px",
    background: "#111",
    border: "1px solid #252525",
    borderRadius: "16px",
    color: "#777",
    padding: "18px",
    textAlign: "left",
    cursor: "pointer",
  },

  creationCardActive: {
    minHeight: "135px",
    background: "#161616",
    border: "1px solid #FFD43B",
    borderRadius: "16px",
    color: "#fff",
    padding: "18px",
    textAlign: "left",
    cursor: "pointer",
  },

  creationIcon: {
    display: "block",
    fontSize: "30px",
    marginBottom: "12px",
  },

  requestBox: {
    marginTop: "25px",
  },

  label: {
    display: "block",
    color: "#aaa",
    fontSize: "12px",
    fontWeight: 800,
    marginBottom: "8px",
  },

  textarea: {
    width: "100%",
    minHeight: "150px",
    resize: "vertical",
    background: "#080808",
    color: "#fff",
    border: "1px solid #292929",
    borderRadius: "13px",
    padding: "14px",
    outline: "none",
    fontSize: "15px",
    lineHeight: 1.5,
    boxSizing: "border-box",
  },

  textareaSmall: {
    width: "100%",
    minHeight: "120px",
    background: "#080808",
    color: "#fff",
    border: "1px solid #292929",
    borderRadius: "11px",
    padding: "13px",
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
    lineHeight: 1.5,
  },

  helperText: {
    color: "#666",
    fontSize: "12px",
    lineHeight: 1.5,
    marginTop: "9px",
  },

  workspace: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns:
      "minmax(280px, 430px) minmax(300px, 1fr)",
    gap: "20px",
  },

  editorCard: {
    background: "#0d0d0d",
    border: "1px solid #202020",
    borderRadius: "20px",
    padding: "22px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    gap: "15px",
    marginBottom: "20px",
  },

  badge: {
    height: "fit-content",
    padding: "6px 9px",
    borderRadius: "8px",
    background: "#FFD43B",
    color: "#111",
    fontSize: "10px",
    fontWeight: 900,
  },

  aiDesignBox: {
    background: "#121212",
    border: "1px solid #292929",
    borderRadius: "14px",
    padding: "14px",
    marginBottom: "20px",
  },

  aiDesignTitle: {
    fontWeight: 900,
    color: "#FFD43B",
    marginBottom: "5px",
  },

  aiDesignText: {
    color: "#999",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  field: {
    marginBottom: "17px",
  },

  actionRow: {
    display: "flex",
    gap: "9px",
    flexWrap: "wrap",
    marginTop: "20px",
  },

  primaryButton: {
    background: "#FFD43B",
    color: "#080808",
    border: "none",
    borderRadius: "11px",
    padding: "12px 17px",
    fontWeight: 900,
    cursor: "pointer",
  },

  secondaryButton: {
    background: "#151515",
    color: "#fff",
    border: "1px solid #303030",
    borderRadius: "11px",
    padding: "12px 15px",
    fontWeight: 800,
    cursor: "pointer",
  },

  imageHelp: {
    color: "#666",
    fontSize: "11px",
    lineHeight: 1.5,
    marginTop: "8px",
  },

  uploadGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "8px",
    marginTop: "12px",
  },

  uploadItem: {
    position: "relative",
    aspectRatio: "1 / 1",
    borderRadius: "12px",
    overflow: "hidden",
    background: "#111",
    border: "1px solid #292929",
  },

  uploadImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  removeImageButton: {
    position: "absolute",
    top: "5px",
    right: "5px",
    width: "25px",
    height: "25px",
    borderRadius: "50%",
    border: "none",
    background: "#111",
    color: "#fff",
    fontSize: "18px",
    cursor: "pointer",
  },

  previewOuter: {
    width: "100%",
    maxWidth: "560px",
    margin: "0 auto",
    aspectRatio: "1 / 1",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow:
      "0 20px 60px rgba(0,0,0,.35)",
  },

  largePreviewOuter: {
    maxWidth: "700px",
    marginTop: "25px",
  },

  flyer: {
    width: "100%",
    height: "100%",
    padding: "7%",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent:
      "space-between",
    boxSizing: "border-box",
  },

  decorOne: {
    position: "absolute",
    width: "45%",
    height: "45%",
    right: "-15%",
    top: "-15%",
    borderRadius: "50%",
    background: "#FFD43B",
    opacity: 0.06,
    filter: "blur(20px)",
  },

  decorTwo: {
    position: "absolute",
    width: "40%",
    height: "40%",
    left: "-18%",
    bottom: "-18%",
    borderRadius: "50%",
    background: "#fff",
    opacity: 0.04,
    filter: "blur(25px)",
  },

  flyerTop: {
    position: "relative",
    zIndex: 2,
  },

  flyerBrand: {
    fontWeight: 950,
    fontSize:
      "clamp(17px, 3vw, 29px)",
    letterSpacing: ".5px",
  },

  flyerLabel: {
    display: "inline-block",
    padding: "7px 12px",
    borderRadius: "20px",
    marginTop: "10px",
    fontWeight: 950,
    fontSize:
      "clamp(9px, 1.5vw, 15px)",
  },

  flyerMain: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    alignItems: "center",
    gap: "5%",
    position: "relative",
    zIndex: 2,
    flex: 1,
    minHeight: 0,
  },

  flyerCopy: {
    minWidth: 0,
  },

  flyerHeading: {
    fontSize:
      "clamp(25px, 5vw, 55px)",
    lineHeight: 0.98,
    fontWeight: 950,
    margin: 0,
    wordBreak: "break-word",
  },

  flyerDescription: {
    color: "#eeeeee",
    fontSize:
      "clamp(11px, 1.8vw, 17px)",
    lineHeight: 1.4,
    marginTop: "12px",
    whiteSpace: "pre-wrap",
    maxHeight: "35%",
    overflow: "hidden",
  },

  flyerImageBox: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  previewImageGrid: {
    width: "100%",
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "7px",
  },

  flyerImage: {
    width: "100%",
    aspectRatio: "1 / 1",
    objectFit: "contain",
    borderRadius: "13px",
    filter:
      "drop-shadow(0 15px 15px rgba(0,0,0,.4))",
  },

  photoPlaceholder: {
    width: "100%",
    aspectRatio: "1 / 1",
    border:
      "1px dashed rgba(255,255,255,.25)",
    borderRadius: "15px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color:
      "rgba(255,255,255,.35)",
  },

  flyerBottom: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    justifyContent:
      "space-between",
    gap: "10px",
    color: "#aaa",
    fontSize:
      "clamp(9px, 1.6vw, 14px)",
  },

  previewHeader: {
    maxWidth: "1000px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "15px",
    flexWrap: "wrap",
  },

  exportBar: {
    maxWidth: "700px",
    margin: "20px auto",
    display: "flex",
    justifyContent: "center",
    gap: "9px",
    flexWrap: "wrap",
  },

  appBuilder: {
    maxWidth: "1000px",
    margin: "0 auto",
  },

  appBuilderCard: {
    background: "#0d0d0d",
    border: "1px solid #202020",
    borderRadius: "20px",
    padding: "22px",
  },

  appIdeaBox: {
    background: "#080808",
    border:
      "1px solid #292929",
    borderRadius: "15px",
    padding: "18px",
    marginBottom: "20px",
  },

  appIdeaText: {
    color: "#fff",
    lineHeight: 1.6,
  },

  planGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "12px",
  },

  planCard: {
    background: "#111",
    border:
      "1px solid #252525",
    borderRadius: "15px",
    padding: "17px",
    color: "#ddd",
    lineHeight: 1.5,
  },

  planIcon: {
    fontSize: "25px",
    marginBottom: "10px",
  },

  builderNotice: {
    marginTop: "18px",
    background: "#151515",
    border:
      "1px solid #303030",
    borderRadius: "14px",
    padding: "16px",
  },

  appPreview: {
    maxWidth: "900px",
    minHeight: "520px",
    margin: "25px auto 0",
    background:
      "linear-gradient(145deg, #0b0b0b, #171717)",
    border:
      "1px solid #303030",
    borderRadius: "22px",
    padding: "25px",
    boxShadow:
      "0 20px 60px rgba(0,0,0,.35)",
  },

  mockTop: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    borderBottom:
      "1px solid #292929",
    paddingBottom: "15px",
  },

  mockLogo: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "#FFD43B",
    color: "#111",
    display: "grid",
    placeItems: "center",
    fontWeight: 950,
  },

  mockHero: {
    padding:
      "45px 10px 30px",
    maxWidth: "700px",
  },

  mockBadge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "20px",
    background: "#FFD43B",
    color: "#111",
    fontSize: "10px",
    fontWeight: 900,
  },

  mockHeroH2: {},

  mockCards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
  },

  mockCard: {
    background: "#0d0d0d",
    border:
      "1px solid #292929",
    borderRadius: "14px",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  mockFooter: {
    marginTop: "30px",
    color: "#666",
    fontSize: "12px",
  },

  doctorHeader: {
    maxWidth: "900px",
    margin: "0 auto",
    display: "flex",
    justifyContent:
      "space-between",
    gap: "20px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  healthBadge: {
    border: "1px solid",
    borderRadius: "20px",
    padding: "8px 12px",
    fontSize: "11px",
    fontWeight: 900,
  },

  doctorCard: {
    maxWidth: "900px",
    margin: "25px auto",
    background: "#0d0d0d",
    border:
      "1px solid #202020",
    borderRadius: "18px",
    padding: "18px",
  },

  issue: {
    display: "flex",
    gap: "12px",
    padding: "15px 0",
    borderBottom:
      "1px solid #222",
  },

  optionalIssue: {
    opacity: 0.7,
  },

  issueIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "#ff5d5d",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    fontWeight: 900,
  },

  fixButton: {
    marginTop: "18px",
    background: "#FFD43B",
    color: "#111",
    border: "none",
    borderRadius: "11px",
    padding: "13px 17px",
    fontWeight: 900,
    cursor: "pointer",
  },

  successBox: {
    textAlign: "center",
    padding: "25px",
  },

  successIcon: {
    width: "55px",
    height: "55px",
    borderRadius: "50%",
    background: "#35d07f",
    color: "#06150d",
    display: "grid",
    placeItems: "center",
    margin: "0 auto 15px",
    fontSize: "25px",
    fontWeight: 900,
  },

  actionRowCenter: {
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    flexWrap: "wrap",
    margin: "25px 0",
  },
};