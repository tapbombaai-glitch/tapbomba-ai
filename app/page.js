"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const BRAND = {
  name: "BOMBA AI",
  tagline: "Automate. Grow. Earn.",
  accent: "#FFD43B",
};

const DEFAULT_PROJECT = {
  type: "flyer",
  idea: "",
  images: [],
  appPlan: null,
};

const APP_EXAMPLES = [
  "Build a school management system for students, teachers, classes and administrators.",
  "Build a food delivery app where customers can order food and restaurants can manage orders.",
  "Build an online store for selling clothes with products, cart, checkout and an admin dashboard.",
  "Build a church management app for members, events, announcements and donations.",
];

const FLYER_STYLES = {
  premium: {
    background:
      "linear-gradient(135deg, #050505 0%, #121826 48%, #24100c 100%)",
    accent: "#FFD43B",
  },
  celebration: {
    background:
      "linear-gradient(135deg, #16051f 0%, #4b174f 48%, #101c45 100%)",
    accent: "#FFD43B",
  },
  elegant: {
    background:
      "linear-gradient(135deg, #080808 0%, #24201a 48%, #111 100%)",
    accent: "#E8D49A",
  },
  business: {
    background:
      "linear-gradient(135deg, #050b12 0%, #10243a 52%, #071018 100%)",
    accent: "#FFD43B",
  },
  energetic: {
    background:
      "linear-gradient(135deg, #170000 0%, #710000 50%, #130000 100%)",
    accent: "#FFD43B",
  },
};

function chooseFlyerStyle(idea) {
  const text = idea.toLowerCase();

  if (
    /birthday|party|celebration|celebrate|baby shower|graduation/.test(text)
  ) {
    return "celebration";
  }

  if (/wedding|bridal|engagement|anniversary|elegant|luxury/.test(text)) {
    return "elegant";
  }

  if (
    /sale|discount|offer|promo|promotion|product|shop|selling|price|launch/.test(
      text
    )
  ) {
    return "energetic";
  }

  if (/business|company|corporate|service|consulting|agency|professional/.test(text)) {
    return "business";
  }

  return "premium";
}

function buildAppPlan(idea) {
  const text = idea.toLowerCase();

  const features = [];

  if (/school|student|teacher|class|education/.test(text)) {
    features.push(
      "Student management",
      "Teacher management",
      "Classes and academic records",
      "School dashboard"
    );
  }

  if (/food|restaurant|delivery|order/.test(text)) {
    features.push(
      "Product/menu management",
      "Customer ordering",
      "Order tracking",
      "Restaurant/admin dashboard"
    );
  }

  if (/shop|store|ecommerce|e-commerce|clothes|product|selling/.test(text)) {
    features.push(
      "Product catalogue",
      "Shopping cart",
      "Customer accounts",
      "Order management"
    );
  }

  if (/church|member|donation|sermon|event/.test(text)) {
    features.push(
      "Member management",
      "Events and announcements",
      "Donation management",
      "Admin dashboard"
    );
  }

  if (/booking|appointment|reservation/.test(text)) {
    features.push(
      "Service listing",
      "Booking system",
      "Appointment management",
      "Admin dashboard"
    );
  }

  if (/inventory|stock|warehouse/.test(text)) {
    features.push(
      "Inventory management",
      "Stock tracking",
      "Transaction records",
      "Management dashboard"
    );
  }

  if (/social|community|chat|messaging/.test(text)) {
    features.push(
      "User profiles",
      "Community feed",
      "Messaging",
      "Notifications"
    );
  }

  if (/dashboard|analytics|report/.test(text)) {
    features.push(
      "Dashboard",
      "Statistics",
      "Reports",
      "Activity monitoring"
    );
  }

  if (features.length === 0) {
    features.push(
      "User accounts",
      "Main application dashboard",
      "Core feature management",
      "Notifications",
      "Admin controls"
    );
  }

  return {
    title: "Universal App",
    description:
      "BOMBA AI interpreted your idea and created a starting architecture for the application.",
    features: [...new Set(features)].slice(0, 10),
    screens: [
      "Welcome / Landing",
      "Sign in / Sign up",
      "Main Dashboard",
      "Core Feature",
      "User Profile",
      "Notifications",
      "Admin Dashboard",
    ],
  };
}

function analyzeProject(project) {
  const issues = [];

  if (!project.idea.trim()) {
    issues.push({
      type: "missing",
      title: "Creation idea is missing",
      message:
        "Describe what you want BOMBA AI to create before building.",
    });
  }

  if (project.idea.length > 1200) {
    issues.push({
      type: "warning",
      title: "Your description is very long",
      message:
        "A shorter description may help BOMBA AI understand the main goal more clearly.",
    });
  }

  if (project.type === "flyer" && project.images.length > 5) {
    issues.push({
      type: "warning",
      title: "Too many pictures",
      message: "A flyer can contain a maximum of 5 uploaded pictures.",
    });
  }

  return issues;
}

export default function Home() {
  const [project, setProject] = useState(DEFAULT_PROJECT);
  const [stage, setStage] = useState("describe");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    try {
      const savedProject = localStorage.getItem("bomba-universal-project");

      if (savedProject) {
        const parsed = JSON.parse(savedProject);

        setProject({
          ...DEFAULT_PROJECT,
          ...parsed,
        });

        setSaved(true);
      }
    } catch {
      // Ignore invalid saved data.
    }
  }, []);

  const issues = useMemo(
    () => analyzeProject(project),
    [project]
  );

  function update(field, value) {
    setProject((current) => ({
      ...current,
      [field]: value,
    }));

    setSaved(false);
  }

  function startBuilding() {
    if (!project.idea.trim()) {
      alert("Describe what you want BOMBA AI to create first.");
      return;
    }

    if (project.type === "app") {
      const plan = buildAppPlan(project.idea);

      setProject((current) => ({
        ...current,
        appPlan: plan,
      }));
    }

    setStage("build");
  }

  function saveProject() {
    try {
      localStorage.setItem(
        "bomba-universal-project",
        JSON.stringify(project)
      );

      setSaved(true);
    } catch {
      alert("BOMBA AI could not save this project on this device.");
    }
  }

  function resetProject() {
    const confirmed = window.confirm(
      "Start a new project? Your current saved work will be cleared."
    );

    if (!confirmed) return;

    localStorage.removeItem("bomba-universal-project");

    setProject(DEFAULT_PROJECT);
    setStage("describe");
    setSaved(false);
  }

  function openPreview() {
    setStage("preview");
  }

  function runDoctor() {
    setStage("doctor");
  }

  function handleImages(event) {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const remaining = 5 - project.images.length;

    if (remaining <= 0) {
      alert("You can add a maximum of 5 pictures.");
      return;
    }

    const selected = files.slice(0, remaining);

    const validFiles = selected.filter(
      (file) => file.size <= 8 * 1024 * 1024
    );

    if (validFiles.length !== selected.length) {
      alert(
        "One or more pictures were larger than 8MB and were not added."
      );
    }

    Promise.all(
      validFiles.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();

            reader.onload = () => resolve(reader.result);

            reader.readAsDataURL(file);
          })
      )
    ).then((images) => {
      setProject((current) => ({
        ...current,
        images: [...current.images, ...images].slice(0, 5),
      }));

      setSaved(false);
    });

    event.target.value = "";
  }

  function removeImage(index) {
    setProject((current) => ({
      ...current,
      images: current.images.filter((_, i) => i !== index),
    }));

    setSaved(false);
  }

  function copyAppPlan() {
    if (!project.appPlan) return;

    const text = [
      "BOMBA AI APP PLAN",
      "",
      `Idea: ${project.idea}`,
      "",
      "FEATURES:",
      ...project.appPlan.features.map((item) => `- ${item}`),
      "",
      "SCREENS:",
      ...project.appPlan.screens.map((item) => `- ${item}`),
    ].join("\n");

    navigator.clipboard?.writeText(text);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.logoRow}>
          <div style={styles.logo}>TB</div>

          <div>
            <div style={styles.brand}>{BRAND.name}</div>
            <div style={styles.tagline}>{BRAND.tagline}</div>
          </div>
        </div>

        <button style={styles.newButton} onClick={resetProject}>
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
          <span style={{ color: BRAND.accent }}>
            BOMBA builds it.
          </span>
        </h1>

        <p style={styles.heroText}>
          Create professional flyers, apps, websites, dashboards,
          business tools and more from one intelligent builder.
        </p>
      </section>

      <nav style={styles.steps}>
        {[
          ["describe", "1", "Describe"],
          ["build", "2", "Build"],
          ["preview", "3", "Preview"],
          ["doctor", "4", "AI Doctor"],
        ].map(([key, number, label]) => (
          <button
            key={key}
            onClick={() => {
              if (key === "describe") setStage("describe");
              if (key === "build") setStage("build");
              if (key === "preview") openPreview();
              if (key === "doctor") runDoctor();
            }}
            style={{
              ...styles.step,
              ...(stage === key ? styles.activeStep : {}),
            }}
          >
            <span style={styles.stepNumber}>{number}</span>
            {label}
          </button>
        ))}
      </nav>

      {stage === "describe" && (
        <section style={styles.card}>
          <div style={styles.sectionTitle}>
            What do you want to create?
          </div>

          <p style={styles.muted}>
            Tell BOMBA AI what you want in your own words.
            You are not limited to a fixed category.
          </p>

          <div style={styles.creationGrid}>
            <button
              style={
                project.type === "flyer"
                  ? styles.creationCardActive
                  : styles.creationCard
              }
              onClick={() => update("type", "flyer")}
            >
              <span style={styles.creationIcon}>🎨</span>
              <strong>Professional Flyer</strong>
              <small>
                Any event, product, business or personal idea
              </small>
            </button>

            <button
              style={
                project.type === "app"
                  ? styles.creationCardActive
                  : styles.creationCard
              }
              onClick={() => update("type", "app")}
            >
              <span style={styles.creationIcon}>🧩</span>
              <strong>Universal App Builder</strong>
              <small>
                Build any type of application from your idea
              </small>
            </button>
          </div>

          <div style={styles.requestBox}>
            <label style={styles.label}>
              Describe your creation
            </label>

            <textarea
              placeholder={
                project.type === "app"
                  ? "Example: Build a food delivery app where customers can order food, restaurants can manage orders and an admin can manage the platform..."
                  : "Example: Create a beautiful birthday party flyer for a 30th birthday celebration..."
              }
              style={styles.textarea}
              value={project.idea}
              onChange={(e) => update("idea", e.target.value)}
            />

            {project.type === "app" && (
              <div style={styles.examplesBox}>
                <div style={styles.exampleTitle}>
                  Try an example
                </div>

                {APP_EXAMPLES.map((example) => (
                  <button
                    key={example}
                    style={styles.exampleButton}
                    onClick={() => update("idea", example)}
                  >
                    {example}
                  </button>
                ))}
              </div>
            )}

            <button
              style={styles.primaryButton}
              onClick={startBuilding}
            >
              Start Building →
            </button>
          </div>
        </section>
      )}

      {stage === "build" && project.type === "flyer" && (
        <FlyerBuilder
          project={project}
          saved={saved}
          fileInputRef={fileInputRef}
          handleImages={handleImages}
          removeImage={removeImage}
          saveProject={saveProject}
          openPreview={openPreview}
          setStage={setStage}
        />
      )}

      {stage === "build" && project.type === "app" && (
        <AppBuilder
          project={project}
          saved={saved}
          saveProject={saveProject}
          openPreview={openPreview}
          copyAppPlan={copyAppPlan}
          copied={copied}
          setStage={setStage}
        />
      )}

      {stage === "preview" && project.type === "flyer" && (
        <section>
          <div style={styles.previewHeader}>
            <div>
              <div style={styles.sectionTitle}>
                Flyer Preview
              </div>

              <div style={styles.muted}>
                BOMBA AI automatically selected the visual
                direction from your idea.
              </div>
            </div>

            <div style={styles.actionRow}>
              <button
                style={styles.secondaryButton}
                onClick={() => setStage("build")}
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

          <FlyerPreview project={project} large />

          <div style={styles.exportBar}>
            <button
              style={styles.secondaryButton}
              onClick={saveProject}
            >
              💾 Save
            </button>

            <button
              style={styles.primaryButton}
              onClick={() => window.print()}
            >
              Export Flyer →
            </button>
          </div>
        </section>
      )}

      {stage === "preview" && project.type === "app" && (
        <AppPreview project={project} />
      )}

      {stage === "doctor" && (
        <Doctor
          project={project}
          issues={issues}
          setStage={setStage}
          openPreview={openPreview}
        />
      )}
    </main>
  );
}

function FlyerBuilder({
  project,
  saved,
  fileInputRef,
  handleImages,
  removeImage,
  saveProject,
  openPreview,
  setStage,
}) {
  return (
    <section style={styles.card}>
      <div style={styles.sectionHeader}>
        <div>
          <div style={styles.sectionTitle}>
            Build your flyer
          </div>

          <div style={styles.muted}>
            BOMBA AI uses your idea and automatically chooses
            a suitable modern design.
          </div>
        </div>

        <span style={styles.badge}>AI FLYER</span>
      </div>

      <div style={styles.directionBox}>
        <strong>🧠 AI Design Direction</strong>

        <span>
          {chooseFlyerStyle(project.idea) === "celebration"
            ? "Celebration style selected automatically."
            : chooseFlyerStyle(project.idea) === "elegant"
            ? "Elegant premium style selected automatically."
            : chooseFlyerStyle(project.idea) === "business"
            ? "Professional business style selected automatically."
            : chooseFlyerStyle(project.idea) === "energetic"
            ? "Energetic promotional style selected automatically."
            : "Premium modern style selected automatically."}
        </span>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>
          Your Flyer Idea
        </label>

        <textarea
          style={styles.textarea}
          value={project.idea}
          onChange={() => {}}
          readOnly
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>
          Add Pictures 📷
        </label>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImages}
          style={{ display: "none" }}
        />

        <button
          style={styles.secondaryButton}
          onClick={() => fileInputRef.current?.click()}
          disabled={project.images.length >= 5}
        >
          📷 Upload Pictures
        </button>

        <div style={styles.uploadHelp}>
          You can add up to 5 pictures. Product photos, personal
          photos, event photos, logos or any other pictures are
          allowed.
        </div>

        {project.images.length > 0 && (
          <div style={styles.imageGrid}>
            {project.images.map((image, index) => (
              <div key={`${image}-${index}`} style={styles.imageItem}>
                <img
                  src={image}
                  alt={`Uploaded ${index + 1}`}
                  style={styles.thumbnail}
                />

                <button
                  style={styles.removeImage}
                  onClick={() => removeImage(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.actionRow}>
        <button
          style={styles.secondaryButton}
          onClick={saveProject}
        >
          {saved ? "✓ Saved" : "Save Draft"}
        </button>

        <button
          style={styles.primaryButton}
          onClick={openPreview}
        >
          Preview →
        </button>
      </div>
    </section>
  );
}

function AppBuilder({
  project,
  saved,
  saveProject,
  openPreview,
  copyAppPlan,
  copied,
  setStage,
}) {
  const plan = project.appPlan || buildAppPlan(project.idea);

  return (
    <section style={styles.card}>
      <div style={styles.sectionHeader}>
        <div>
          <div style={styles.sectionTitle}>
            Universal App Builder
          </div>

          <div style={styles.muted}>
            BOMBA AI interpreted your idea and created a
            starting architecture.
          </div>
        </div>

        <span style={styles.badge}>APP BUILDER</span>
      </div>

      <div style={styles.appIdeaBox}>
        <div style={styles.label}>YOUR IDEA</div>
        <div style={styles.appIdea}>
          {project.idea}
        </div>
      </div>

      <div style={styles.builderGrid}>
        <div style={styles.builderPanel}>
          <div style={styles.panelTitle}>
            🧠 App Understanding
          </div>

          <p style={styles.muted}>
            BOMBA AI can use your description as the starting
            point for a custom application.
          </p>

          <div style={styles.statusBox}>
            <span>✓</span>
            Idea understood
          </div>

          <div style={styles.statusBox}>
            <span>✓</span>
            Application structure created
          </div>

          <div style={styles.statusBox}>
            <span>✓</span>
            Core features identified
          </div>

          <div style={styles.statusBox}>
            <span>✓</span>
            Initial screens identified
          </div>
        </div>

        <div style={styles.builderPanel}>
          <div style={styles.panelTitle}>
            🧩 Suggested Features
          </div>

          {plan.features.map((feature) => (
            <div key={feature} style={styles.featureRow}>
              <span>✓</span>
              {feature}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.builderPanel}>
        <div style={styles.panelTitle}>
          📱 Suggested Screens
        </div>

        <div style={styles.screenGrid}>
          {plan.screens.map((screen, index) => (
            <div key={screen} style={styles.screenCard}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{screen}</strong>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.builderNotice}>
        <strong>Next building stage</strong>
        <p>
          This is the planning and preview foundation. The next
          stage can turn this plan into actual app files and
          copy-ready code.
        </p>
      </div>

      <div style={styles.actionRow}>
        <button
          style={styles.secondaryButton}
          onClick={saveProject}
        >
          {saved ? "✓ Saved" : "Save Draft"}
        </button>

        <button
          style={styles.secondaryButton}
          onClick={copyAppPlan}
        >
          {copied ? "✓ Copied" : "Copy App Plan"}
        </button>

        <button
          style={styles.primaryButton}
          onClick={openPreview}
        >
          Preview App →
        </button>
      </div>

      <button
        style={styles.backButton}
        onClick={() => setStage("describe")}
      >
        ← Change App Idea
      </button>
    </section>
  );
}

function AppPreview({ project }) {
  const plan = project.appPlan || buildAppPlan(project.idea);

  return (
    <section style={styles.previewSection}>
      <div style={styles.previewHeader}>
        <div>
          <div style={styles.sectionTitle}>
            App Preview
          </div>

          <div style={styles.muted}>
            A visual foundation generated from your app idea.
          </div>
        </div>
      </div>

      <div style={styles.phonePreview}>
        <div style={styles.phoneTop}>
          <div style={styles.phoneLogo}>TB</div>

          <div>
            <strong>BOMBA APP</strong>
            <small>Preview</small>
          </div>
        </div>

        <div style={styles.phoneHero}>
          <span>YOUR APP</span>
          <h2>
            {project.idea.length > 80
              ? `${project.idea.substring(0, 80)}...`
              : project.idea}
          </h2>
        </div>

        <div style={styles.phoneStats}>
          <div>
            <strong>01</strong>
            <span>Dashboard</span>
          </div>

          <div>
            <strong>{plan.features.length}</strong>
            <span>Features</span>
          </div>

          <div>
            <strong>{plan.screens.length}</strong>
            <span>Screens</span>
          </div>
        </div>

        <div style={styles.phoneMenu}>
          {plan.screens.slice(0, 5).map((screen) => (
            <div key={screen} style={styles.phoneMenuItem}>
              <span>◆</span>
              {screen}
            </div>
          ))}
        </div>

        <div style={styles.phoneButton}>
          Open Dashboard →
        </div>
      </div>
    </section>
  );
}

function FlyerPreview({ project, large = false }) {
  const styleKey = chooseFlyerStyle(project.idea);
  const theme = FLYER_STYLES[styleKey];

  return (
    <div
      style={{
        ...styles.previewOuter,
        ...(large ? styles.largePreviewOuter : {}),
      }}
    >
      <div
        style={{
          ...styles.flyer,
          background: theme.background,
        }}
      >
        <div style={styles.flyerGlow} />

        <div style={styles.flyerTop}>
          <div style={styles.flyerBrand}>
            BOMBA AI
          </div>

          <div
            style={{
              ...styles.flyerLabel,
              color: "#111",
              background: theme.accent,
            }}
          >
            {styleKey === "celebration"
              ? "CELEBRATE"
              : styleKey === "elegant"
              ? "SPECIAL"
              : styleKey === "energetic"
              ? "NOW"
              : styleKey === "business"
              ? "PROFESSIONAL"
              : "FEATURED"}
          </div>
        </div>

        <div style={styles.flyerMainUniversal}>
          <div style={styles.flyerCopyUniversal}>
            <div
              style={{
                ...styles.flyerSmallText,
                color: theme.accent,
              }}
            >
              YOUR IDEA
            </div>

            <h2 style={styles.flyerHeadline}>
              {project.idea || "YOUR FLYER IDEA"}
            </h2>

            <p style={styles.flyerDescription}>
              BOMBA AI creates a modern visual design around
              your idea.
            </p>
          </div>

          {project.images.length > 0 ? (
            <div
              style={{
                ...styles.flyerImages,
                ...(project.images.length === 1
                  ? styles.singleFlyerImage
                  : {}),
              }}
            >
              {project.images.slice(0, 5).map((image, index) => (
                <img
                  key={`${image}-${index}`}
                  src={image}
                  alt=""
                  style={styles.flyerImage}
                />
              ))}
            </div>
          ) : (
            <div style={styles.flyerNoImage}>
              <span>+</span>
              <small>ADD YOUR PICTURE</small>
            </div>
          )}
        </div>

        <div style={styles.flyerBottom}>
          <span>BOMBA AI</span>
          <strong>Automate. Grow. Earn.</strong>
        </div>
      </div>
    </div>
  );
}

function Doctor({ project, issues, setStage, openPreview }) {
  return (
    <section>
      <div style={styles.doctorHeader}>
        <div>
          <div style={styles.sectionTitle}>
            🩺 BOMBA AI Doctor
          </div>

          <p style={styles.muted}>
            Checking your creation before you continue.
          </p>
        </div>

        <div style={styles.healthBadge}>
          {issues.length === 0
            ? "✓ READY"
            : `${issues.length} CHECK`}
        </div>
      </div>

      <div style={styles.doctorCard}>
        {issues.length === 0 ? (
          <div style={styles.successBox}>
            <div style={styles.successIcon}>✓</div>

            <h2>Creation looks healthy</h2>

            <p>
              No major problems were detected.
            </p>
          </div>
        ) : (
          issues.map((issue, index) => (
            <div key={`${issue.title}-${index}`} style={styles.issue}>
              <div style={styles.issueIcon}>!</div>

              <div>
                <strong>{issue.title}</strong>
                <p>{issue.message}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {project.type === "flyer" && (
        <FlyerPreview project={project} />
      )}

      {project.type === "app" && (
        <AppPreview project={project} />
      )}

      <div style={styles.actionRowCenter}>
        <button
          style={styles.secondaryButton}
          onClick={() => setStage("build")}
        >
          ← Modify
        </button>

        <button
          style={styles.primaryButton}
          onClick={openPreview}
        >
          Preview →
        </button>
      </div>
    </section>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#050505",
    color: "#fff",
    padding: "20px",
    fontFamily: "Arial, Helvetica, sans-serif",
  },

  header: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
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
    fontSize: "clamp(38px, 8vw, 76px)",
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
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
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
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
    marginTop: "25px",
  },

  creationCard: {
    minHeight: "145px",
    background: "#111",
    border: "1px solid #252525",
    borderRadius: "16px",
    color: "#777",
    padding: "18px",
    textAlign: "left",
    cursor: "pointer",
  },

  creationCardActive: {
    minHeight: "145px",
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
    minHeight: "130px",
    resize: "vertical",
    background: "#080808",
    color: "#fff",
    border: "1px solid #292929",
    borderRadius: "13px",
    padding: "14px",
    outline: "none",
    fontSize: "15px",
    boxSizing: "border-box",
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

  actionRow: {
    display: "flex",
    gap: "9px",
    flexWrap: "wrap",
    marginTop: "20px",
  },

  examplesBox: {
    marginTop: "15px",
    padding: "14px",
    background: "#090909",
    border: "1px solid #222",
    borderRadius: "13px",
  },

  exampleTitle: {
    color: "#FFD43B",
    fontWeight: 900,
    fontSize: "12px",
    marginBottom: "9px",
  },

  exampleButton: {
    display: "block",
    width: "100%",
    textAlign: "left",
    background: "#111",
    color: "#aaa",
    border: "1px solid #222",
    borderRadius: "9px",
    padding: "10px",
    marginTop: "7px",
    cursor: "pointer",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
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

  directionBox: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    background: "#111",
    border: "1px solid #282828",
    borderRadius: "13px",
    padding: "14px",
    marginBottom: "20px",
  },

  field: {
    marginBottom: "18px",
  },

  uploadHelp: {
    color: "#666",
    fontSize: "12px",
    marginTop: "8px",
    lineHeight: 1.5,
  },

  imageGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(85px, 1fr))",
    gap: "10px",
    marginTop: "15px",
  },

  imageItem: {
    position: "relative",
    aspectRatio: "1 / 1",
    borderRadius: "11px",
    overflow: "hidden",
    border: "1px solid #292929",
  },

  thumbnail: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  removeImage: {
    position: "absolute",
    right: "5px",
    top: "5px",
    width: "25px",
    height: "25px",
    borderRadius: "50%",
    border: "none",
    background: "#111",
    color: "#fff",
    cursor: "pointer",
    fontSize: "17px",
  },

  previewOuter: {
    width: "100%",
    maxWidth: "560px",
    margin: "0 auto",
    aspectRatio: "1 / 1",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0,0,0,.35)",
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
    justifyContent: "space-between",
    boxSizing: "border-box",
  },

  flyerGlow: {
    position: "absolute",
    width: "55%",
    height: "55%",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(255,212,59,.16), transparent 65%)",
    right: "-10%",
    top: "-10%",
  },

  flyerTop: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
  },

  flyerBrand: {
    fontWeight: 950,
    fontSize: "clamp(16px, 3vw, 28px)",
  },

  flyerLabel: {
    display: "inline-block",
    padding: "7px 12px",
    borderRadius: "20px",
    fontWeight: 950,
    fontSize: "clamp(9px, 1.5vw, 15px)",
  },

  flyerMainUniversal: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    minHeight: "60%",
  },

  flyerCopyUniversal: {
    width: "52%",
  },

  flyerSmallText: {
    fontSize: "clamp(8px, 1.5vw, 13px)",
    fontWeight: 900,
    letterSpacing: "2px",
    marginBottom: "10px",
  },

  flyerHeadline: {
    fontSize: "clamp(22px, 5vw, 58px)",
    lineHeight: ".98",
    margin: 0,
    fontWeight: 950,
    overflowWrap: "anywhere",
  },

  flyerDescription: {
    color: "#bbb",
    fontSize: "clamp(9px, 1.8vw, 16px)",
    lineHeight: 1.4,
    marginTop: "15px",
  },

  flyerImages: {
    width: "44%",
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "7px",
  },

  singleFlyerImage: {
    gridTemplateColumns: "1fr",
  },

  flyerImage: {
    width: "100%",
    aspectRatio: "1 / 1",
    objectFit: "cover",
    borderRadius: "15px",
    border: "1px solid rgba(255,255,255,.15)",
    boxShadow: "0 15px 35px rgba(0,0,0,.35)",
  },

  flyerNoImage: {
    width: "40%",
    aspectRatio: "1 / 1",
    borderRadius: "20px",
    border: "1px dashed rgba(255,255,255,.25)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "rgba(255,255,255,.35)",
  },

  flyerBottom: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    color: "#aaa",
    fontSize: "clamp(9px, 1.6vw, 14px)",
  },

  previewHeader: {
    maxWidth: "1000px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
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

  builderGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "14px",
    marginTop: "18px",
  },

  builderPanel: {
    background: "#101010",
    border: "1px solid #252525",
    borderRadius: "16px",
    padding: "17px",
    marginTop: "14px",
  },

  panelTitle: {
    fontWeight: 900,
    fontSize: "16px",
    marginBottom: "12px",
  },

  appIdeaBox: {
    background: "#080808",
    border: "1px solid #292929",
    borderRadius: "14px",
    padding: "15px",
    marginBottom: "5px",
  },

  appIdea: {
    color: "#fff",
    lineHeight: 1.5,
  },

  statusBox: {
    display: "flex",
    gap: "9px",
    alignItems: "center",
    padding: "9px 0",
    color: "#ccc",
    fontSize: "13px",
  },

  featureRow: {
    padding: "10px 0",
    borderBottom: "1px solid #222",
    color: "#ccc",
    fontSize: "13px",
  },

  screenGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "9px",
  },

  screenCard: {
    background: "#080808",
    border: "1px solid #252525",
    borderRadius: "11px",
    padding: "13px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  builderNotice: {
    marginTop: "15px",
    padding: "15px",
    background: "#151208",
    border: "1px solid #4c4118",
    borderRadius: "13px",
  },

  backButton: {
    background: "transparent",
    border: "none",
    color: "#888",
    padding: "15px 0 0",
    cursor: "pointer",
  },

  previewSection: {
    maxWidth: "1000px",
    margin: "0 auto",
  },

  phonePreview: {
    width: "min(100%, 390px)",
    minHeight: "650px",
    margin: "25px auto",
    padding: "22px",
    borderRadius: "34px",
    background:
      "linear-gradient(160deg, #171717, #070707)",
    border: "8px solid #202020",
    boxShadow: "0 25px 70px rgba(0,0,0,.5)",
    boxSizing: "border-box",
  },

  phoneTop: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  phoneLogo: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    background: "#FFD43B",
    color: "#111",
    display: "grid",
    placeItems: "center",
    fontWeight: 1000,
  },

  phoneTopSmall: {
    display: "block",
    color: "#777",
    fontSize: "10px",
  },

  phoneHero: {
    marginTop: "35px",
    padding: "22px",
    borderRadius: "20px",
    background:
      "linear-gradient(145deg, #191919, #0d0d0d)",
    border: "1px solid #292929",
  },

  phoneHeroSpan: {
    color: "#FFD43B",
    fontSize: "10px",
    fontWeight: 900,
  },

  phoneHeroH2: {
    fontSize: "23px",
    lineHeight: 1.1,
    marginBottom: 0,
  },

  phoneStats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "7px",
    marginTop: "12px",
  },

  phoneStat: {
    background: "#111",
    border: "1px solid #252525",
    borderRadius: "11px",
    padding: "11px",
  },

  phoneMenu: {
    marginTop: "15px",
  },

  phoneMenuItem: {
    display: "flex",
    gap: "10px",
    padding: "13px",
    borderBottom: "1px solid #202020",
    color: "#bbb",
    fontSize: "13px",
  },

  phoneButton: {
    marginTop: "20px",
    background: "#FFD43B",
    color: "#111",
    borderRadius: "12px",
    padding: "13px",
    textAlign: "center",
    fontWeight: 900,
  },

  doctorHeader: {
    maxWidth: "900px",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  healthBadge: {
    border: "1px solid #35d07f",
    color: "#35d07f",
    borderRadius: "20px",
    padding: "8px 12px",
    fontSize: "11px",
    fontWeight: 900,
  },

  doctorCard: {
    maxWidth: "900px",
    margin: "25px auto",
    background: "#0d0d0d",
    border: "1px solid #202020",
    borderRadius: "18px",
    padding: "18px",
  },

  issue: {
    display: "flex",
    gap: "12px",
    padding: "15px 0",
    borderBottom: "1px solid #222",
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