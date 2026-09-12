"use client";

import { useState } from "react";

export default function UniversalBuilder() {
  const [idea, setIdea] = useState("");
  const [building, setBuilding] = useState(false);
  const [message, setMessage] = useState("");

  const startBuild = async () => {
    if (!idea.trim()) {
      setMessage("Describe what you want BOMBA AI to build.");
      return;
    }

    setBuilding(true);
    setMessage("BOMBA AI is preparing your project...");

    // Backend connection will be added in the next step.
    setTimeout(() => {
      setBuilding(false);
      setMessage(
        "Project request received. The Universal Builder workspace will be connected next."
      );
    }, 1500);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        padding: "24px 16px 50px",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "30px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "#FFD43B",
              color: "#000",
              fontWeight: "900",
              fontSize: "22px",
              marginBottom: "16px",
            }}
          >
            TB
          </div>

          <h1
            style={{
              fontSize: "32px",
              fontWeight: "900",
              margin: "0 0 8px",
            }}
          >
            Universal Builder
          </h1>

          <p
            style={{
              color: "#aaa",
              lineHeight: "1.6",
              margin: 0,
            }}
          >
            Describe what you want to build. BOMBA AI will plan it, build it
            gradually, save your progress, and continue from where it stopped.
          </p>
        </div>

        {/* Project description */}
        <section
          style={{
            background: "#111",
            border: "1px solid #292929",
            borderRadius: "18px",
            padding: "18px",
            marginBottom: "18px",
          }}
        >
          <label
            style={{
              display: "block",
              fontWeight: "800",
              marginBottom: "10px",
            }}
          >
            What do you want to build?
          </label>

          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Example: Build a school management system with student registration, teachers, classes, fees, attendance and an admin dashboard."
            rows={8}
            style={{
              width: "100%",
              boxSizing: "border-box",
              resize: "vertical",
              background: "#050505",
              color: "#fff",
              border: "1px solid #333",
              borderRadius: "14px",
              padding: "15px",
              fontSize: "15px",
              lineHeight: "1.6",
              outline: "none",
            }}
          />

          <button
            onClick={startBuild}
            disabled={building}
            style={{
              width: "100%",
              marginTop: "14px",
              padding: "15px",
              border: "none",
              borderRadius: "12px",
              background: building ? "#555" : "#FFD43B",
              color: "#000",
              fontSize: "16px",
              fontWeight: "900",
              cursor: building ? "not-allowed" : "pointer",
            }}
          >
            {building ? "Preparing Project..." : "Start Building 🚀"}
          </button>
        </section>

        {/* Build model */}
        <section
          style={{
            background: "#111",
            border: "1px solid #292929",
            borderRadius: "18px",
            padding: "18px",
          }}
        >
          <h2
            style={{
              margin: "0 0 16px",
              fontSize: "20px",
            }}
          >
            How BOMBA Builder works
          </h2>

          <div style={{ display: "grid", gap: "12px" }}>
            {[
              ["1", "Describe", "Tell BOMBA AI what you want to build."],
              ["2", "Plan", "BOMBA creates the project structure and plan."],
              ["3", "Build", "The project is built gradually in short sessions."],
              ["4", "Save", "Everything built is safely saved in the project workspace."],
              ["5", "Continue", "After the cooldown, building continues from exactly where it stopped."],
              ["6", "Control", "The project owner/admin controls the project and generated code."],
            ].map(([number, title, text]) => (
              <div
                key={number}
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    minWidth: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "#FFD43B",
                    color: "#000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "900",
                  }}
                >
                  {number}
                </div>

                <div>
                  <strong>{title}</strong>
                  <div
                    style={{
                      color: "#999",
                      fontSize: "14px",
                      marginTop: "3px",
                      lineHeight: "1.5",
                    }}
                  >
                    {text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {message && (
          <div
            style={{
              marginTop: "18px",
              padding: "14px",
              borderRadius: "12px",
              background: "#161616",
              border: "1px solid #333",
              color: "#ddd",
              lineHeight: "1.5",
            }}
          >
            {message}
          </div>
        )}
      </div>
    </main>
  );
}