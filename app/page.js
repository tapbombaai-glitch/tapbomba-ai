"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const BRAND = {
  name: "BOMBA AI",
  tagline: "Automate. Grow. Earn.",
  accent: "#FFD43B",
};

const DEFAULT_PROJECT = {
  type: "flyer",
  businessName: "",
  headline: "",
  description: "",
  price: "",
  whatsapp: "",
  image: "",
  template: "premium",
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
    label: "NEW DROP",
    background:
      "linear-gradient(145deg, #06152a 0%, #0b3b67 55%, #071018 100%)",
    accent: "#FFD43B",
  },
};

function checkWhatsApp(value) {
  if (!value.trim()) return false;

  const digits = value.replace(/\D/g, "");

  return digits.length >= 10 && digits.length <= 15;
}

function analyzeProject(project) {
  const issues = [];

  if (!project.businessName.trim()) {
    issues.push({
      type: "missing",
      title: "Business name missing",
      message: "Add your business name so customers know who created the offer.",
    });
  }

  if (!project.headline.trim()) {
    issues.push({
      type: "missing",
      title: "Headline missing",
      message: "Add a strong headline to tell customers what you are offering.",
    });
  }

  if (project.headline.length > 65) {
    issues.push({
      type: "overflow",
      title: "Headline may be too long",
      message: "Shorten the headline so it remains readable on smaller phones.",
    });
  }

  if (!project.description.trim()) {
    issues.push({
      type: "missing",
      title: "Description missing",
      message: "Add a short description explaining the product or service.",
    });
  }

  if (!project.price.trim()) {
    issues.push({
      type: "missing",
      title: "Price missing",
      message: "Add a price or remove the price section if this offer is free.",
    });
  }

  if (!project.whatsapp.trim()) {
    issues.push({
      type: "contact",
      title: "WhatsApp number missing",
      message: "Add a WhatsApp number so customers can contact you.",
    });
  } else if (!checkWhatsApp(project.whatsapp)) {
    issues.push({
      type: "contact",
      title: "WhatsApp number looks wrong",
      message: "Check the number. Include the country code when possible.",
    });
  }

  if (!project.image) {
    issues.push({
      type: "image",
      title: "No product image",
      message:
        "Your flyer can work without a photo, but adding a good product image can make it stronger.",
      optional: true,
    });
  }

  return issues;
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

  function update(field, value) {
    setProject((current) => ({
      ...current,
      [field]: value,
    }));

    setSaved(false);
  }

  function startBuilding() {
    setStage("build");
    setShowDoctor(false);
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
      alert("BOMBA AI could not save this project on this device.");
    }
  }

  function resetProject() {
    const confirmed = window.confirm(
      "Start a new project? Your current unsaved work will be cleared."
    );

    if (!confirmed) return;

    localStorage.removeItem("bomba-universal-project");

    setProject(DEFAULT_PROJECT);
    setStage("describe");
    setSaved(false);
    setShowDoctor(false);
  }

  function copyProjectData() {
    const text = [
      `Business: ${project.businessName}`,
      `Headline: ${project.headline}`,
      `Description: ${project.description}`,
      `Price: ${project.price}`,
      `WhatsApp: ${project.whatsapp}`,
    ].join("\n");

    navigator.clipboard?.writeText(text);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1500);
  }

  function handleImage(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert(
        "This image is larger than 8MB. Choose a smaller image for better phone performance."
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      update("image", reader.result);
    };

    reader.readAsDataURL(file);
  }

  function autoFix() {
    let next = { ...project };

    if (!next.price.trim()) {
      next.price = "₦";
    }

    if (!next.whatsapp.trim()) {
      next.whatsapp = "234";
    }

    if (next.headline.length > 65) {
      next.headline = next.headline.substring(0, 62) + "...";
    }

    setProject(next);
    setSaved(false);
  }

  function exportFlyer() {
    const template = TEMPLATES[project.template];

    const flyerWindow = window.open("", "_blank");

    if (!flyerWindow) {
      alert("Please allow pop-ups in your browser to export the flyer.");
      return;
    }

    const imageHTML = project.image
      ? `<img src="${project.image}" class="product-image" />`
      : `<div class="image-placeholder">YOUR<br/>PRODUCT<br/>PHOTO</div>`;

    flyerWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${project.businessName || "BOMBA AI Flyer"}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
            font-family: Arial, Helvetica, sans-serif;
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

          .gold {
            color: ${template.accent};
          }

          .business {
            font-size: clamp(24px, 4vw, 55px);
            font-weight: 900;
            letter-spacing: 1px;
          }

          .label {
            display: inline-block;
            margin-top: 18px;
            padding: 10px 18px;
            background: ${template.accent};
            color: #111;
            font-weight: 900;
            border-radius: 30px;
            font-size: clamp(14px, 2vw, 24px);
          }

          .headline {
            font-size: clamp(38px, 7vw, 90px);
            line-height: .95;
            font-weight: 950;
            margin: 0;
            max-width: 90%;
          }

          .description {
            font-size: clamp(18px, 3vw, 35px);
            line-height: 1.25;
            max-width: 80%;
            color: #eeeeee;
          }

          .product {
            position: absolute;
            right: 5%;
            top: 25%;
            width: 42%;
            height: 42%;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .product-image {
            width: 100%;
            height: 100%;
            object-fit: contain;
            filter: drop-shadow(0 20px 25px rgba(0,0,0,.45));
          }

          .image-placeholder {
            width: 100%;
            height: 100%;
            border: 2px dashed rgba(255,255,255,.3);
            border-radius: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: rgba(255,255,255,.35);
            font-size: 25px;
            font-weight: 800;
          }

          .bottom {
            display: flex;
            justify-content: space-between;
            align-items: end;
            gap: 20px;
          }

          .price {
            font-size: clamp(30px, 5vw, 65px);
            font-weight: 950;
            color: ${template.accent};
          }

          .contact {
            font-size: clamp(15px, 2.5vw, 28px);
            font-weight: 800;
            text-align: right;
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
          <div>
            <div class="business">${escapeHTML(project.businessName || "YOUR BUSINESS")}</div>
            <div class="label">${template.label}</div>
          </div>

          <div>
            <h1 class="headline">${escapeHTML(project.headline || "YOUR HEADLINE")}</h1>
            <p class="description">${escapeHTML(project.description || "Add your product description here.")}</p>
          </div>

          <div class="product">
            ${imageHTML}
          </div>

          <div class="bottom">
            <div class="price">${escapeHTML(project.price || "₦0")}</div>
            <div class="contact">
              WhatsApp<br/>
              ${escapeHTML(project.whatsapp || "Add your number")}
            </div>
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
        <div>
          <div style={styles.logoRow}>
            <div style={styles.logo}>TB</div>

            <div>
              <div style={styles.brand}>{BRAND.name}</div>
              <div style={styles.tagline}>{BRAND.tagline}</div>
            </div>
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
          Create professional flyers, websites, apps, dashboards,
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
              if (key === "preview") setStage("preview");
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
          <div style={styles.sectionTitle}>What do you want to create?</div>

          <p style={styles.muted}>
            Start with a creation request. Universal Builder will eventually
            use the same flow for apps, websites, dashboards and content.
          </p>

          <div style={styles.creationGrid}>
            <button
              style={styles.creationCardActive}
              onClick={() => update("type", "flyer")}
            >
              <span style={styles.creationIcon}>🎨</span>
              <strong>Professional Flyer</strong>
              <small>Marketing • Product • Sales</small>
            </button>

            <button style={styles.creationCard}>
              <span style={styles.creationIcon}>🌐</span>
              <strong>Website</strong>
              <small>Coming in Universal Builder</small>
            </button>

            <button style={styles.creationCard}>
              <span style={styles.creationIcon}>📱</span>
              <strong>Web App</strong>
              <small>Coming in Universal Builder</small>
            </button>

            <button style={styles.creationCard}>
              <span style={styles.creationIcon}>📊</span>
              <strong>Dashboard</strong>
              <small>Coming in Universal Builder</small>
            </button>
          </div>

          <div style={styles.requestBox}>
            <label style={styles.label}>Describe your creation</label>

            <textarea
              placeholder="Example: Create a premium sneaker promotion flyer for my business..."
              style={styles.textarea}
              value={project.headline}
              onChange={(e) => update("headline", e.target.value)}
            />

            <button style={styles.primaryButton} onClick={startBuilding}>
              Start Building →
            </button>
          </div>
        </section>
      )}

      {stage === "build" && (
        <section style={styles.workspace}>
          <div style={styles.editorCard}>
            <div style={styles.sectionHeader}>
              <div>
                <div style={styles.sectionTitle}>Build your flyer</div>
                <div style={styles.muted}>
                  Your changes appear instantly in the preview.
                </div>
              </div>

              <span style={styles.badge}>FLYER</span>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Business Name</label>
              <input
                style={styles.input}
                placeholder="TAP BOMBER"
                value={project.businessName}
                onChange={(e) =>
                  update("businessName", e.target.value)
                }
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Headline</label>
              <input
                style={styles.input}
                placeholder="NEW SNEAKER DROP"
                value={project.headline}
                onChange={(e) => update("headline", e.target.value)}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Description</label>
              <textarea
                style={styles.textareaSmall}
                placeholder="Premium sneakers available now."
                value={project.description}
                onChange={(e) =>
                  update("description", e.target.value)
                }
              />
            </div>

            <div style={styles.twoColumns}>
              <div style={styles.field}>
                <label style={styles.label}>Price</label>
                <input
                  style={styles.input}
                  placeholder="₦25,000"
                  value={project.price}
                  onChange={(e) => update("price", e.target.value)}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>WhatsApp</label>
                <input
                  style={styles.input}
                  placeholder="2348012345678"
                  value={project.whatsapp}
                  onChange={(e) =>
                    update("whatsapp", e.target.value)
                  }
                />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Template</label>

              <div style={styles.templateGrid}>
                {Object.entries(TEMPLATES).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => update("template", key)}
                    style={{
                      ...styles.templateButton,
                      ...(project.template === key
                        ? styles.selectedTemplate
                        : {}),
                    }}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Product Photo</label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImage}
                style={{ display: "none" }}
              />

              <button
                style={styles.secondaryButton}
                onClick={() => fileInputRef.current?.click()}
              >
                {project.image ? "Change Photo" : "Upload Photo"}
              </button>
            </div>

            <div style={styles.actionRow}>
              <button style={styles.secondaryButton} onClick={saveProject}>
                {saved ? "✓ Saved" : "Save Draft"}
              </button>

              <button style={styles.primaryButton} onClick={openPreview}>
                Preview →
              </button>
            </div>
          </div>

          <FlyerPreview project={project} />
        </section>
      )}

      {stage === "preview" && (
        <section>
          <div style={styles.previewHeader}>
            <div>
              <div style={styles.sectionTitle}>Preview</div>
              <div style={styles.muted}>
                Check your design before exporting.
              </div>
            </div>

            <div style={styles.actionRow}>
              <button style={styles.secondaryButton} onClick={() => setStage("build")}>
                ← Edit
              </button>

              <button style={styles.primaryButton} onClick={runDoctor}>
                🩺 AI Doctor
              </button>
            </div>
          </div>

          <FlyerPreview project={project} large />

          <div style={styles.exportBar}>
            <button style={styles.secondaryButton} onClick={saveProject}>
              💾 Save
            </button>

            <button style={styles.secondaryButton} onClick={copyProjectData}>
              {copied ? "✓ Copied" : "Copy Details"}
            </button>

            <button style={styles.primaryButton} onClick={exportFlyer}>
              Export Flyer →
            </button>
          </div>
        </section>
      )}

      {stage === "doctor" && (
        <section>
          <div style={styles.doctorHeader}>
            <div>
              <div style={styles.sectionTitle}>🩺 BOMBA AI Doctor</div>

              <p style={styles.muted}>
                Checking your creation for common problems before export.
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
                    seriousIssues.length === 1 ? "" : "S"
                  }`}
            </div>
          </div>

          <div style={styles.doctorCard}>
            {issues.length === 0 ? (
              <div style={styles.successBox}>
                <div style={styles.successIcon}>✓</div>

                <h2>Creation looks healthy</h2>

                <p>
                  No major problems were detected. You can continue to
                  preview, save or export your flyer.
                </p>
              </div>
            ) : (
              <>
                {issues.map((issue, index) => (
                  <div
                    key={`${issue.title}-${index}`}
                    style={{
                      ...styles.issue,
                      ...(issue.optional
                        ? styles.optionalIssue
                        : {}),
                    }}
                  >
                    <div style={styles.issueIcon}>
                      {issue.optional ? "ℹ" : "!"}
                    </div>

                    <div>
                      <strong>{issue.title}</strong>
                      <p>{issue.message}</p>
                    </div>
                  </div>
                ))}

                <button style={styles.fixButton} onClick={autoFix}>
                  🔧 Fix What BOMBA Can Fix
                </button>
              </>
            )}
          </div>

          <FlyerPreview project={project} />

          <div style={styles.actionRowCenter}>
            <button
              style={styles.secondaryButton}
              onClick={() => setStage("build")}
            >
              ← Modify
            </button>

            <button style={styles.primaryButton} onClick={exportFlyer}>
              Export →
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

function FlyerPreview({ project, large = false }) {
  const template = TEMPLATES[project.template] || TEMPLATES.premium;

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
          background: template.background,
        }}
      >
        <div style={styles.flyerTop}>
          <div style={styles.flyerBusiness}>
            {project.businessName || "YOUR BUSINESS"}
          </div>

          <div
            style={{
              ...styles.flyerLabel,
              color: "#111",
              background: template.accent,
            }}
          >
            {template.label}
          </div>
        </div>

        <div style={styles.flyerMain}>
          <div style={styles.flyerCopy}>
            <h2>{project.headline || "YOUR HEADLINE"}</h2>

            <p>
              {project.description ||
                "Your product or service description goes here."}
            </p>

            <div
              style={{
                ...styles.flyerPrice,
                color: template.accent,
              }}
            >
              {project.price || "₦0"}
            </div>
          </div>

          <div style={styles.flyerImageBox}>
            {project.image ? (
              <img
                src={project.image}
                alt="Product"
                style={styles.flyerImage}
              />
            ) : (
              <div style={styles.photoPlaceholder}>
                <span>＋</span>
                <small>PRODUCT PHOTO</small>
              </div>
            )}
          </div>
        </div>

        <div style={styles.flyerBottom}>
          <span>WhatsApp</span>

          <strong>
            {project.whatsapp || "Add WhatsApp number"}
          </strong>
        </div>
      </div>
    </div>
  );
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
    minHeight: "120px",
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

  field: {
    marginBottom: "17px",
  },

  input: {
    width: "100%",
    background: "#080808",
    color: "#fff",
    border: "1px solid #292929",
    borderRadius: "11px",
    padding: "13px",
    outline: "none",
    boxSizing: "border-box",
  },

  textareaSmall: {
    width: "100%",
    minHeight: "80px",
    background: "#080808",
    color: "#fff",
    border: "1px solid #292929",
    borderRadius: "11px",
    padding: "13px",
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
  },

  twoColumns: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "10px",
  },

  templateGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "8px",
  },

  templateButton: {
    background: "#111",
    border: "1px solid #282828",
    color: "#aaa",
    padding: "11px 5px",
    borderRadius: "9px",
    cursor: "pointer",
  },

  selectedTemplate: {
    borderColor: "#FFD43B",
    color: "#FFD43B",
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

  flyerTop: {
    position: "relative",
    zIndex: 2,
  },

  flyerBusiness: {
    fontWeight: 950,
    fontSize: "clamp(17px, 3vw, 29px)",
    letterSpacing: ".5px",
  },

  flyerLabel: {
    display: "inline-block",
    padding: "7px 12px",
    borderRadius: "20px",
    marginTop: "10px",
    fontWeight: 950,
    fontSize: "clamp(9px, 1.5vw, 15px)",
  },

  flyerMain: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    position: "relative",
    zIndex: 2,
  },

  flyerCopy: {
    width: "58%",
  },

  flyerCopyH2: {},

  flyerImageBox: {
    width: "42%",
    aspectRatio: "1 / 1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  flyerImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    filter: "drop-shadow(0 15px 15px rgba(0,0,0,.4))",
  },

  photoPlaceholder: {
    width: "100%",
    aspectRatio: "1 / 1",
    border: "1px dashed rgba(255,255,255,.25)",
    borderRadius: "15px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "rgba(255,255,255,.35)",
  },

  flyerPrice: {
    fontWeight: 950,
    fontSize: "clamp(22px, 4vw, 42px)",
    marginTop: "15px",
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

  issueP: {},

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