"use client";

import { useState } from "react";

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
  { icon: "📱", name: "App" },
];

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  function downloadImage() {
    if (!image) return;

    const link = document.createElement("a");
    link.href = image;
    link.download = "bomba-ai-flyer.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.logo}>{BRAND.short}</div>

          <div>
            <div style={styles.brandName}>{BRAND.name}</div>
            <div style={styles.tagline}>{BRAND.tagline}</div>
          </div>
        </div>

        <button style={styles.menuButton}>☰</button>
      </header>

      <section style={styles.hero}>
        <div style={styles.eyebrow}>UNIVERSAL AI CREATION PLATFORM</div>

        <h1 style={styles.heroTitle}>
          {BRAND.slogan}
        </h1>

        <p style={styles.heroText}>
          Create flyers, websites, logos, images, apps and more
          with one intelligent AI platform.
        </p>

        <div style={styles.featureRow}>
          {FEATURES.map((feature) => (
            <div key={feature.name} style={styles.feature}>
              <div style={styles.featureIcon}>{feature.icon}</div>
              <div style={styles.featureName}>{feature.name}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.workspace}>
        <div style={styles.sectionTop}>
          <div>
            <div style={styles.smallGold}>CREATE</div>
            <h2 style={styles.sectionTitle}>AI Flyer Generator</h2>
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

          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}
        </div>

        {loading && (
          <div style={styles.loadingCard}>
            <div style={styles.loadingLogo}>TB</div>
            <h3 style={styles.loadingTitle}>
              BOMBA AI is creating your flyer
            </h3>
            <p style={styles.loadingText}>
              Understanding your request → designing the
              composition → generating the image
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
    color: "#fff",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    paddingBottom: 50,
  },

  header: {
    width: "100%",
    maxWidth: 1100,
    margin: "0 auto",
    padding: "18px 18px",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #1b1b1b",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: "#FFD43B",
    color: "#050505",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 1000,
    fontSize: 20,
    letterSpacing: -1,
    boxShadow: "0 0 24px rgba(255,212,59,.18)",
  },

  brandName: {
    fontSize: 20,
    fontWeight: 900,
    letterSpacing: 1,
  },

  tagline: {
    color: "#999",
    fontSize: 11,
    marginTop: 3,
  },

  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    border: "1px solid #292929",
    background: "#111",
    color: "#fff",
    fontSize: 20,
    cursor: "pointer",
  },

  hero: {
    maxWidth: 950,
    margin: "0 auto",
    padding: "55px 18px 35px",
    textAlign: "center",
  },

  eyebrow: {
    color: "#FFD43B",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 2,
    marginBottom: 18,
  },

  heroTitle: {
    margin: 0,
    fontSize: "clamp(36px, 8vw, 72px)",
    lineHeight: 0.98,
    fontWeight: 1000,
    letterSpacing: -3,
  },

  heroText: {
    maxWidth: 650,
    margin: "22px auto 0",
    color: "#aaa",
    fontSize: 16,
    lineHeight: 1.6,
  },

  featureRow: {
    display: "flex",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 34,
  },

  feature: {
    minWidth: 82,
    padding: "12px 14px",
    background: "#0d0d0d",
    border: "1px solid #222",
    borderRadius: 12,
  },

  featureIcon: {
    fontSize: 20,
    marginBottom: 5,
  },

  featureName: {
    fontSize: 11,
    color: "#bbb",
    fontWeight: 700,
  },

  workspace: {
    maxWidth: 900,
    margin: "10px auto 0",
    padding: "0 18px",
  },

  sectionTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 15,
    marginBottom: 16,
  },

  smallGold: {
    color: "#FFD43B",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 2,
    marginBottom: 5,
  },

  sectionTitle: {
    margin: 0,
    fontSize: 25,
    fontWeight: 900,
  },

  liveBadge: {
    border: "1px solid #303030",
    background: "#101010",
    borderRadius: 20,
    padding: "7px 10px",
    fontSize: 9,
    fontWeight: 900,
    color: "#bbb",
  },

  liveDot: {
    display: "inline-block",
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#FFD43B",
    marginRight: 6,
  },

  card: {
    background: "#0c0c0c",
    border: "1px solid #252525",
    borderRadius: 18,
    padding: 18,
  },

  label: {
    display: "block",
    color: "#fff",
    fontWeight: 800,
    fontSize: 14,
    marginBottom: 10,
  },

  textarea: {
    width: "100%",
    minHeight: 145,
    boxSizing: "border-box",
    resize: "vertical",
    borderRadius: 13,
    border: "1px solid #292929",
    background: "#050505",
    color: "#fff",
    padding: 15,
    fontSize: 15,
    lineHeight: 1.5,
    outline: "none",
  },

  helper: {
    color: "#777",
    fontSize: 11,
    lineHeight: 1.5,
    marginTop: 9,
  },

  generateButton: {
    width: "100%",
    marginTop: 17,
    minHeight: 52,
    border: "none",
    borderRadius: 12,
    background: "#FFD43B",
    color: "#050505",
    fontWeight: 1000,
    fontSize: 14,
    cursor: "pointer",
  },

  spinner: {
    display: "inline-block",
    width: 13,
    height: 13,
    border: "2px solid #555",
    borderTop: "2px solid #050505",
    borderRadius: "50%",
    marginRight: 8,
    verticalAlign: "-2px",
  },

  error: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    background: "#211010",
    border: "1px solid #5b2222",
    color: "#ff9b9b",
    fontSize: 13,
  },

  loadingCard: {
    marginTop: 18,
    padding: 30,
    borderRadius: 18,
    background: "#0c0c0c",
    border: "1px solid #252525",
    textAlign: "center",
  },

  loadingLogo: {
    width: 58,
    height: 58,
    margin: "0 auto 16px",
    borderRadius: 15,
    background: "#FFD43B",
    color: "#050505",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 1000,
    fontSize: 20,
  },

  loadingTitle: {
    margin: 0,
    fontSize: 19,
  },

  loadingText: {
    color: "#888",
    fontSize: 13,
    lineHeight: 1.5,
    maxWidth: 450,
    margin: "10px auto 0",
  },

  resultSection: {
    marginTop: 24,
  },

  resultHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 15,
    marginBottom: 14,
  },

  resultTitle: {
    margin: 0,
    fontSize: 25,
  },

  downloadButton: {
    background: "#FFD43B",
    color: "#050505",
    border: "none",
    borderRadius: 10,
    padding: "11px 14px",
    fontWeight: 900,
    cursor: "pointer",
  },

  imageFrame: {
    background: "#000",
    border: "1px solid #282828",
    borderRadius: 18,
    padding: 10,
    maxWidth: 700,
    margin: "0 auto",
  },

  generatedImage: {
    width: "100%",
    display: "block",
    borderRadius: 11,
  },

  createAnother: {
    width: "100%",
    marginTop: 14,
    padding: 14,
    background: "#111",
    border: "1px solid #292929",
    color: "#fff",
    borderRadius: 11,
    fontWeight: 800,
    cursor: "pointer",
  },

  footer: {
    maxWidth: 900,
    margin: "55px auto 0",
    padding: "20px 18px",
    borderTop: "1px solid #1c1c1c",
    display: "flex",
    alignItems: "center",
    gap: 12,
    color: "#aaa",
  },

  footerLogo: {
    width: 38,
    height: 38,
    borderRadius: 9,
    background: "#FFD43B",
    color: "#050505",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 1000,
  },

  footerText: {
    fontSize: 11,
    color: "#666",
    marginTop: 3,
  },
};