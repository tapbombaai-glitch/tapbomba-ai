"use client";

import { useEffect, useState } from "react";

const BRAND = {
  name: "BOMBA AI",
  accent: "#FFD43B",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProjects() {
    setLoading(true);
    setError("");

    try {
      // Supabase is loaded only in the browser.
      // This avoids the previous "process is not defined" problem.
      const { createClient } = await import(
        "@supabase/supabase-js"
      );

      const supabase = createClient(
        "https://gsfznvyYOUR-SUPABASE-DOMAIN.supabase.co",
        "YOUR-SUPABASE-ANON-KEY"
      );

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error(
          "Please log in to view your projects."
        );
      }

      const response = await fetch(
        "/api/builder/projects/list",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "BOMBA AI could not load your projects."
        );
      }

      setProjects(result?.projects || []);
    } catch (err) {
      console.error("My Projects error:", err);

      setError(
        err?.message ||
          "Something went wrong while loading your projects."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  function getProgress(project) {
    const total = Number(project?.total_stages || 0);
    const current = Number(project?.current_stage || 0);

    if (project?.is_completed === true) {
      return 100;
    }

    if (!total) {
      return 0;
    }

    return Math.min(
      100,
      Math.round((current / total) * 100)
    );
  }

  function getStatus(project) {
    if (project?.is_completed === true) {
      return "COMPLETED";
    }

    if (project?.status === "building") {
      return "BUILDING";
    }

    if (Number(project?.current_stage || 0) > 0) {
      return "IN PROGRESS";
    }

    return "SAVED";
  }

  function openProject(project) {
    alert(
      `Project found:\n\n${
        project?.project_name || "BOMBA Project"
      }`
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "#fff",
        padding: "20px",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                color: BRAND.accent,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 1.5,
              }}
            >
              BOMBA AI
            </div>

            <h1
              style={{
                margin: "6px 0 0",
                fontSize: 30,
              }}
            >
              My Projects
            </h1>

            <p
              style={{
                margin: "8px 0 0",
                color: "#aaa",
                lineHeight: 1.5,
              }}
            >
              Your saved Universal Builder projects.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            style={{
              border: "1px solid #333",
              background: "#111",
              color: "#fff",
              padding: "12px 16px",
              borderRadius: 10,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ← HOME
          </button>
        </div>

        {loading && (
          <div
            style={{
              padding: 24,
              borderRadius: 16,
              background: "#111",
              border: "1px solid #222",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 30,
                marginBottom: 10,
              }}
            >
              🧠
            </div>

            <strong>
              BOMBA AI is loading your projects...
            </strong>
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              padding: 20,
              borderRadius: 16,
              background: "#170d0d",
              border: "1px solid #5a2222",
              color: "#ffb4b4",
            }}
          >
            <strong>Could not load projects</strong>

            <p
              style={{
                marginBottom: 16,
                lineHeight: 1.5,
              }}
            >
              {error}
            </p>

            <button
              type="button"
              onClick={loadProjects}
              style={{
                background: BRAND.accent,
                color: "#000",
                border: "none",
                padding: "12px 18px",
                borderRadius: 10,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              🔄 TRY AGAIN
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          projects.length === 0 && (
            <div
              style={{
                padding: 30,
                borderRadius: 18,
                background: "#111",
                border: "1px solid #292929",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  marginBottom: 12,
                }}
              >
                📁
              </div>

              <h2
                style={{
                  margin: "0 0 8px",
                }}
              >
                No projects yet
              </h2>

              <p
                style={{
                  color: "#999",
                  lineHeight: 1.5,
                }}
              >
                Your saved Universal Builder projects
                will appear here automatically.
              </p>

              <button
                type="button"
                onClick={() => {
                  window.location.href = "/";
                }}
                style={{
                  marginTop: 10,
                  background: BRAND.accent,
                  color: "#000",
                  border: "none",
                  padding: "13px 20px",
                  borderRadius: 10,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                🚀 BUILD A PROJECT
              </button>
            </div>
          )}

        {!loading &&
          !error &&
          projects.length > 0 && (
            <div
              style={{
                display: "grid",
                gap: 16,
              }}
            >
              {projects.map((project) => {
                const progress = getProgress(project);
                const status = getStatus(project);

                return (
                  <div
                    key={project.id}
                    style={{
                      background: "#101010",
                      border: "1px solid #292929",
                      borderRadius: 18,
                      padding: 20,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 12,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color: BRAND.accent,
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: 1,
                          }}
                        >
                          PROJECT
                        </div>

                        <h2
                          style={{
                            margin: "6px 0 8px",
                            fontSize: 21,
                          }}
                        >
                          {project.project_name ||
                            "New BOMBA Project"}
                        </h2>
                      </div>

                      <div
                        style={{
                          padding: "7px 10px",
                          borderRadius: 999,
                          background: "#191919",
                          border: "1px solid #333",
                          color:
                            status === "COMPLETED"
                              ? BRAND.accent
                              : "#ddd",
                          fontSize: 10,
                          fontWeight: 800,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {status}
                      </div>
                    </div>

                    <div
                      style={{
                        color: "#aaa",
                        lineHeight: 1.5,
                        fontSize: 14,
                        marginBottom: 16,
                      }}
                    >
                      {project.original_request ||
                        "No project description available."}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 8,
                        fontSize: 13,
                      }}
                    >
                      <span
                        style={{
                          color: "#aaa",
                        }}
                      >
                        Build progress
                      </span>

                      <strong>{progress}%</strong>
                    </div>

                    <div
                      style={{
                        height: 8,
                        background: "#222",
                        borderRadius: 999,
                        overflow: "hidden",
                        marginBottom: 18,
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${progress}%`,
                          background: BRAND.accent,
                          borderRadius: 999,
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 10,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          openProject(project)
                        }
                        style={{
                          background: BRAND.accent,
                          color: "#000",
                          border: "none",
                          padding: "11px 16px",
                          borderRadius: 10,
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        📂 OPEN
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          alert(
                            "Preview will be connected next."
                          )
                        }
                        style={{
                          background: "#191919",
                          color: "#fff",
                          border: "1px solid #333",
                          padding: "11px 16px",
                          borderRadius: 10,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        👁️ PREVIEW
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          alert(
                            "Files & Code will be connected next."
                          )
                        }
                        style={{
                          background: "#191919",
                          color: "#fff",
                          border: "1px solid #333",
                          padding: "11px 16px",
                          borderRadius: 10,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        💻 FILES & CODE
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </main>
  );
}