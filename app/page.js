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

  if (
    /business|company|corporate|service|consulting|agency|professional/.test(
      text
    )
  ) {
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
  const [appView, setAppView] = useState("preview");

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

  const issues = useMemo(() => analyzeProject(project), [project]);

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

      setAppView("preview");
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
    setAppView("preview");
    setSaved(false);
    setCopied(false);
  }

  function openPreview() {
    if (project.type === "app") {
      setAppView("preview");
    }

    setStage("preview");
  }

  function runDoctor() {
    setStage("doctor");
  }

  function openAppDashboard() {
    setAppView("dashboard");
    setStage("preview");
  }

  function closeAppDashboard() {
    setAppView("preview");
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
    const plan = project.appPlan || buildAppPlan(project.idea);

    const text = [
      "BOMBA AI APP PLAN",
      "",
      `Idea: ${project.idea}`,
      "",
      "FEATURES:",
      ...plan.features.map((item) => `- ${item}`),
      "",
      "SCREENS:",
      ...plan.screens.map((item) => `- ${item}`),
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
        <div style={styles.eyebrow}>UNIVERSAL CREATION PLATFORM</div>

        <h1 style={styles.heroTitle}>
          Describe it.
          <br />
          <span style={{ color: BRAND.accent }}>BOMBA builds it.</span>
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
            Tell BOMBA AI what you want in your own words. You are
            not limited to a fixed category.
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
            <label style={styles.label}>Describe your creation</label>

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
                <div style={styles.exampleTitle}>Try an example</div>

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
              <div style={styles.sectionTitle}>Flyer Preview</div>

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

      {stage === "preview" &&
        project.type === "app" &&
        (appView === "dashboard" ? (
          <GeneratedAppDashboard
            project={project}
            onBack={closeAppDashboard}
          />
        ) : (
          <AppPreview
            project={project}
            onOpenDashboard={openAppDashboard}
          />
        ))}

      {stage === "doctor" && (
        <Doctor
          project={project}
          issues={issues}
          setStage={setStage}
          openPreview={openPreview}
          onOpenDashboard={openAppDashboard}
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
}) {
  const styleKey = chooseFlyerStyle(project.idea);

  return (
    <section style={styles.card}>
      <div style={styles.sectionHeader}>
        <div>
          <div style={styles.sectionTitle}>Build your flyer</div>

          <div style={styles.muted}>
            BOMBA AI uses your idea and automatically chooses a
            suitable modern design.
          </div>
        </div>

        <span style={styles.badge}>AI FLYER</span>
      </div>

      <div style={styles.directionBox}>
        <strong>🧠 AI Design Direction</strong>

        <span>
          {styleKey === "celebration"
            ? "Celebration style selected automatically."
            : styleKey === "elegant"
            ? "Elegant premium style selected automatically."
            : styleKey === "business"
            ? "Professional business style selected automatically."
            : styleKey === "energetic"
            ? "Energetic promotional style selected automatically."
            : "Premium modern style selected automatically."}
        </span>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Your Flyer Idea</label>

        <textarea
          style={styles.textarea}
          value={project.idea}
          readOnly
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Add Pictures 📷</label>

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
              <div
                key={`${image}-${index}`}
                style={styles.imageItem}
              >
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

        <div style={styles.appIdea}>{project.idea}</div>
      </div>

      <div style={styles.builderGrid}>
        <div style={styles.builderPanel}>
          <div style={styles.panelTitle}>
            🧠 App Understanding
          </div>

          <p style={styles.muted}>
            BOMBA AI