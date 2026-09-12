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
];

export default function Home() {
  const [activeFeature, setActiveFeature] = useState("Flyer");

  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState("");
  const [uploadedImage, setUploadedImage] = useState("");
  const [uploadedName, setUploadedName] = useState("");
  const [photoSize, setPhotoSize] = useState("medium");
  const [photoPosition, setPhotoPosition] = useState("center");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [builderPrompt, setBuilderPrompt] = useState("");
  const [builderProject, setBuilderProject] = useState(null);
  const [builderView, setBuilderView] = useState("start");

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
          data?.error || "BOMBA AI could not generate the flyer."
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

  async function startBuilder() {
    const text = builderPrompt.trim();

    if (!text) {
      setError("Describe what you want BOMBA AI to build.");
      return;
    }

    setLoading(true);
    setError("");
    setBuilderView("start");

    try {
      const response = await fetch("/api/builder/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalRequest: text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "BOMBA AI could not save your project."
        );
      }

      if (!data?.project) {
        throw new Error("The project was not returned.");
      }

      setBuilderProject(data.project);
      setBuilderView("workspace");
      setError("");
    } catch (err) {
      setError(
        err?.message ||
          "Something went wrong while saving your project."
      );
    } finally {
      setLoading(false);
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
    if (name === "Universal Builder") {
      setActiveFeature("Universal Builder");
      setError("");
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
    setBuilderView("start");
    setBuilderPrompt("");
    setError("");
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <button
          type="button"
          onClick={() => {
            setActiveFeature("Flyer");
            setError("");
          }}
          style={styles.brandButton}
        >
          <div style={styles.brand}>
            <div style={styles.logo}>{BRAND.short}</div>

            <div>
              <div style={styles.brandName}>{BRAND.name}</div>
              <div style={styles.tagline}>{BRAND.tagline}</div>
            </div>
          </div>
        </button>

        <button
          type="button"
          style={styles.menuButton}
          onClick={() => setError("Dashboard menu is coming next.")}
        >
          ☰
        </button>
      </header>

      <section style={styles.hero}>
        <div style={styles.eyebrow}>
          UNIVERSAL AI CREATION PLATFORM
        </div>

        <h1 style={styles.heroTitle}>{BRAND.slogan}</h1>

        <p style={styles.heroText}>
          Create flyers, websites, logos, images, apps and more
          with one intelligent AI platform.
        </p>

        <div style={styles.featureRow}>
          {FEATURES.map((feature) => {
            const isActive = activeFeature === feature.name;

            return (
              <button
                key={feature.name}
                type="button"
                onClick={() => selectFeature(feature.name)}
                style={{
                  ...styles.feature,
                  ...(isActive ? styles.featureActive : {}),
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

      {activeFeature === "Universal Builder" ? (
        <section style={styles.workspace}>
          <div style={styles.sectionTop}>
            <div>
              <div style={styles.smallGold}>BUILD</div>

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
              <div style={styles.builderLogo}>TB</div>

              <h2 style={styles.builderTitle}>
                Build anything with BOMBA AI
              </h2>

              <p style={styles.builderDescription}>
                Describe what you want to build. BOMBA AI will
                plan it, build it gradually, save your progress,
                and continue from where it stopped.
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
                  ? "CREATING PROJECT..."
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
                    <strong>Plan</strong>

                    <div style={styles.stepText}>
                      BOMBA creates the project plan.
                    </div>
                  </div>
                </div>

                <div style={styles.builderStep}>
                  <div style={styles.stepNumber}>3</div>

                  <div>
                    <strong>Build</strong>

                    <div style={styles.stepText}>
                      The project is built gradually.
                    </div>
                  </div>
                </div>

                <div style={styles.builderStep}>
                  <div style={styles.stepNumber}>4</div>

                  <div>
                    <strong>Save</strong>

                    <div style={styles.stepText}>
                      Your progress stays safely stored.
                    </div>
                  </div>
                </div>

                <div style={styles.builderStep}>
                  <div style={styles.stepNumber}>5</div>

                  <div>
                    <strong>Continue</strong>

                    <div style={styles.stepText}>
                      Future sessions continue from where you stopped.
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

          {builderView === "workspace" && builderProject && (
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
                  DRAFT
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
                      Stage{" "}
                      {builderProject.current_stage || 0}
                      {" "}of{" "}
                      {builderProject.total_stages || 0}
                    </div>
                  </div>

                  <div style={styles.progressPercent}>
                    {builderProject.total_stages
                      ? Math.round(
                          ((builderProject.current_stage || 0) /
                            builderProject.total_stages) *
                            100
                        )
                      : 0}
                    %
                  </div>
                </div>

                <div style={styles.progressTrack}>
                  <div
                    style={{
                      ...styles.progressBar,
                      width: `${
                        builderProject.total_stages
                          ? Math.min(
                              100,
                              Math.round(
                                ((builderProject.current_stage || 0) /
                                  builderProject.total_stages) *
                                  100
                              )
                            )
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>

                <div style={styles.progressNote}>
                  Your project is safely saved. The actual AI
                  planning and gradual build engine will be
                  connected next.
                </div>
              </div>

              <div style={styles.workspaceActions}>
                <button
                  type="button"
                  onClick={() => setBuilderView("plan")}
                  style={styles.workspaceButton}
                >
                  📋 PLAN
                </button>

                <button
                  type="button"
                  onClick={() => setBuilderView("build")}
                  style={styles.workspaceButtonPrimary}
                >
                  🚀 BUILD
                </button>

                <button
                  type="button"
                  onClick={() => setBuilderView("preview")}
                  style={styles.workspaceButton}
                >
                  👁️ PREVIEW
                </button>

                <button
                  type="button"
                  onClick={() => setBuilderView("files")}
                  style={styles.workspaceButton}
                >
                  💻 FILES & CODE
                </button>
              </div>

              <div style={styles.workspaceInfo}>
                <div style={styles.infoIcon}>✓</div>

                <div>
                  <strong>Project saved successfully</strong>

                  <div style={styles.infoText}>
                    BOMBA AI can now continue working from this
                    saved project.
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

          {builderView === "plan" && builderProject && (
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

              <div style={styles.planItem}>
                <div style={styles.planNumber}>1</div>

                <div>
                  <strong>Project foundation</strong>

                  <div style={styles.stepText}>
                    Set up the project structure and core
                    configuration.
                  </div>
                </div>
              </div>

              <div style={styles.planItem}>
                <div style={styles.planNumber}>2</div>

                <div>
                  <strong>Core features</strong>

                  <div style={styles.stepText}>
                    Build the main features described in the
                    project request.
                  </div>
                </div>
              </div>

              <div style={styles.planItem}>
                <div style={styles.planNumber}>3</div>

                <div>
                  <strong>User interface</strong>

                  <div style={styles.stepText}>
                    Create a responsive and mobile-friendly
                    interface.
                  </div>
                </div>
              </div>

              <div style={styles.planItem}>
                <div style={styles.planNumber}>4</div>

                <div>
                  <strong>Testing and improvement</strong>

                  <div style={styles.stepText}>
                    Test the project and continue improving it
                    during future build sessions.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setBuilderView("workspace")}
                style={styles.workspaceButtonPrimary}
              >
                ← BACK TO WORKSPACE
              </button>
            </div>
          )}

          {builderView === "build" && builderProject && (
            <div style={styles.builderWorkspace}>
              <div style={styles.workspaceHeader}>
                <div>
                  <div style={styles.smallGold}>
                    BUILD SESSION
                  </div>

                  <h2 style={styles.workspaceTitle}>
                    Ready to Build
                  </h2>
                </div>
              </div>

              <div style={styles.sessionCard}>
                <div style={styles.sessionIcon}>🚀</div>

                <h3 style={styles.sessionTitle}>
                  Your project is ready for the build engine
                </h3>

                <p style={styles.sessionText}>
                  The project has been saved successfully.
                  The 3-minute build session engine will be
                  connected in the next step.
                </p>

                <div style={styles.sessionRule}>
                  <strong>Build session:</strong> 3 minutes
                </div>

                <div style={styles.sessionRule}>
                  <strong>Cooldown:</strong> 10 hours
                </div>

                <div style={styles.sessionRule}>
                  <strong>Continue:</strong> from the exact saved stage
                </div>
              </div>

              <button
                type="button"
                onClick={() => setBuilderView("workspace")}
                style={styles.workspaceButtonPrimary}
              >
                ← BACK TO WORKSPACE
              </button>
            </div>
          )}

          {builderView === "preview" && builderProject && (
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

                <p>
                  Your project preview will appear here as BOMBA
                  builds the actual application.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setBuilderView("workspace")}
                style={styles.workspaceButtonPrimary}
              >
                ← BACK TO WORKSPACE
              </button>
            </div>
          )}

          {builderView === "files" && builderProject && (
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

              <div style={styles.fileEmpty}>
                <div style={styles.fileIcon}>💻</div>

                <h3>Files will appear here</h3>

                <p>
                  BOMBA AI will generate the actual project
                  files and code as the build engine progresses.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setBuilderView("workspace")}
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
              <div style={styles.smallGold}>CREATE</div>

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
              Be specific about the event, business, colors, text,
              style and information you want on the flyer.
            </div>

            <div style={styles.uploadBox}>
              <div style={styles.uploadTitle}>
                📸 Add your photo or logo
              </div>

              <div style={styles.uploadText}>
                Upload an image that BOMBA AI should use in your flyer.
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
                        {uploadedName || "Uploaded image"}
                      </div>

                      <button
                        type="button"
                        onClick={removeUploadedImage}
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
                        ].map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              setPhotoSize(value)
                            }
                            style={{
                              ...styles.optionButton,
                              ...(photoSize === value
                                ? styles.optionButtonActive
                                : {}),
                            }}
                          >
                            {label}
                          </button>
                        ))}
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
                        ].map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              setPhotoPosition(value)
                            }
                            style={{
                              ...styles.optionButton,
                              ...(photoPosition === value
                                ? styles.optionButtonActive
                                : {}),
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={styles.controlNote}>
                      ✓ BOMBA AI will use your uploaded image as
                      the photo reference instead of creating a
                      different person.
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
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

            {error && <div style={styles.error}>{error}</div>}
          </div>

          {loading && (
            <div style={styles.loadingCard}>
              <div style={styles.loadingLogo}>TB</div>

              <h3 style={styles.loadingTitle}>
                BOMBA AI is creating your flyer
              </h3>

              <p style={styles.loadingText}>
                Understanding your request → using your uploaded
                image → applying your photo settings → designing
                the composition → generating the flyer
              </p>
            </div>
          )}

          {image && !loading && (
            <div style={styles.resultSection}>
              <div style={styles.resultHeader}>
                <div>
                  <div style={styles.smallGold}>RESULT</div>

                  <h2 style={styles.resultTitle}>
                    Your BOMBA Flyer
                  </h2>
                </div>

                <button
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
    fontFamily: "Inter, Arial, Helvetica, sans-serif",
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
    zIndex: 20,
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
    boxShadow: "0 0 22px rgba(255,212,59,0.18)",
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
    border: "1px solid #292929",
    background: "#111111",
    color: "#ffffff",
    borderRadius: "10px",
    width: "42px",
    height: "42px",
    fontSize: "20px",
    cursor: "pointer",
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
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: "7px",
    marginTop: "28px",
    maxWidth: "700px",
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
    boxShadow: "0 0 18px rgba(255,212,59,0.08)",
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
    boxShadow: "0 15px 50px rgba(0,0,0,0.25)",
  },

  builderCard: {
    background: "#0d0d0d",
    border: "1px solid #242424",
    borderRadius: "18px",
    padding: "22px 18px",
    boxShadow: "0 15px 50px rgba(0,0,0,0.25)",
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
    boxShadow: "0 0 25px rgba(255,212,59,0.14)",
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
    boxShadow: "0 15px 50px rgba(0,0,0,0.25)",
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
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
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
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
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
    boxShadow: "0 8px 28px rgba(255,212,59,0.14)",
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
    animation: "bombaSpin 0.8s linear infinite",
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