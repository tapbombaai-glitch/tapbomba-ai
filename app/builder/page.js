"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export default function UniversalBuilder() {
  const [idea, setIdea] = useState("");
  const [building, setBuilding] = useState(false);
  const [message, setMessage] = useState("");
  const [project, setProject] = useState(null);
  const [plan, setPlan] = useState(null);
  const [stageMessage, setStageMessage] = useState("");

  const [supabase] = useState(() =>
    createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  );

  useEffect(() => {
    loadLatestProject();
  }, []);

  async function loadLatestProject() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return;
      }

      const { data, error } = await supabase
        .from("builder_projects")
        .select("*")
        .eq("owner_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Load project error:", error);
        return;
      }

      if (data) {
        setProject(data);

        if (Array.isArray(data.build_plan) && data.build_plan.length > 0) {
          setPlan({
            projectName: data.project_name,
            buildStages: data.build_plan,
          });
        }
      }
    } catch (error) {
      console.error("Project loading error:", error);
    }
  }

  async function startBuild() {
    if (!idea.trim()) {
      setMessage("Describe what you want BOMBA AI to build.");
      return;
    }

    setBuilding(true);
    setMessage("");
    setStageMessage("🧠 BOMBA AI is understanding your project...");
    setPlan(null);
    setProject(null);

    try {
      /* -------------------------------------------------
         AUTH
      ------------------------------------------------- */

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setMessage("Please log in before starting a project.");
        setBuilding(false);
        return;
      }

      /* -------------------------------------------------
         STEP 1 — CREATE AI PLAN
      ------------------------------------------------- */

      setStageMessage("📋 Creating the real project plan...");

      const planResponse = await fetch("/api/builder/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalRequest: idea.trim(),
        }),
      });

      const planData = await planResponse.json();

      if (!planResponse.ok || !planData?.success || !planData?.plan) {
        throw new Error(
          planData?.error || "BOMBA AI could not create the project plan."
        );
      }

      const generatedPlan = planData.plan;

      const buildStages = Array.isArray(generatedPlan.buildStages)
        ? generatedPlan.buildStages
        : [];

      if (buildStages.length === 0) {
        throw new Error(
          "BOMBA AI created a plan but no build stages were returned."
        );
      }

      setPlan(generatedPlan);

      setStageMessage(
        `📋 Plan ready: ${buildStages.length} real build stages.`
      );

      /* -------------------------------------------------
         STEP 2 — CREATE PROJECT
      ------------------------------------------------- */

      setStageMessage("💾 Saving your project and build plan...");

      const projectResponse = await fetch("/api/builder/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          originalRequest: idea.trim(),
        }),
      });

      const projectData = await projectResponse.json();

      if (!projectResponse.ok || !projectData?.success || !projectData?.project) {
        throw new Error(
          projectData?.error || "Could not create the BOMBA project."
        );
      }

      const createdProject = projectData.project;

      /* -------------------------------------------------
         STEP 3 — SAVE THE ACTUAL PLAN
      ------------------------------------------------- */

      setStageMessage("💾 Saving the real build stages...");

      const {
        data: updatedProject,
        error: savePlanError,
      } = await supabase
        .from("builder_projects")
        .update({
          project_name:
            generatedPlan.projectName ||
            createdProject.project_name ||
            "BOMBA AI Project",

          build_plan: buildStages,

          total_stages: buildStages.length,

          current_stage: 0,

          status: "ready",

          is_paused: false,

          is_completed: false,

          updated_at: new Date().toISOString(),
        })
        .eq("id", createdProject.id)
        .eq("owner_id", session.user.id)
        .select()
        .single();

      if (savePlanError || !updatedProject) {
        console.error("Save build plan error:", savePlanError);

        throw new Error(
          savePlanError?.message ||
            "The project was created, but the build plan could not be saved."
        );
      }

      setProject(updatedProject);

      /* -------------------------------------------------
         SUCCESS
      ------------------------------------------------- */

      setStageMessage(
        `📋 Plan ready: ${buildStages.length} real build stages.`
      );

      setMessage(
        "✅ Project created successfully. The complete build plan has been saved."
      );
    } catch (error) {
      console.error("Universal Builder error:", error);

      setMessage(
        error?.message ||
          "Something went wrong while preparing your project."
      );

      setStageMessage("");
    } finally {
      setBuilding(false);
    }
  }

  async function buildNextStage() {
    if (!project?.id) {
      setMessage("Please create a project first.");
      return;
    }

    setBuilding(true);
    setMessage("");
    setStageMessage("🏗️ Starting the real build engine...");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setMessage("Please log in before building.");
        setBuilding(false);
        return;
      }

      const response = await fetch("/api/builder/build", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          projectId: project.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "The build engine could not continue."
        );
      }

      if (data.completed) {
        setStageMessage("✅ BOMBA AI has completed the entire build.");
        setMessage(
          `🎉 Build completed successfully. ${data.filesCreated || 0} files created.`
        );
      } else if (data.cooldown) {
        setStageMessage("⏸️ Build session saved.");
        setMessage(
          data.message ||
            "The build session has ended and your progress has been saved."
        );
      } else {
        setStageMessage(
          `🏗️ Build progress: Stage ${data.currentStage} of ${data.totalStages}`
        );

        setMessage(
          data.stageSummary ||
            "BOMBA AI saved the latest build progress."
        );
      }

      await loadLatestProject();
    } catch (error) {
      console.error("Build engine error:", error);

      setMessage(
        error?.message ||
          "Something went wrong while running the build engine."
      );
    } finally {
      setBuilding(false);
    }
  }

  const currentStage = Number(project?.current_stage || 0);
  const totalStages = Number(project?.total_stages || 0);

  const progress =
    totalStages > 0
      ? Math.round((currentStage / totalStages) * 100)
      : 0;

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
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}
        <div style={{ marginBottom: "26px" }}>
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
              marginBottom: "14px",
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
            Describe what you want to build. BOMBA AI will understand it,
            create a real plan, build it gradually, save your progress, and
            continue from the exact saved stage.
          </p>
        </div>

        {/* PROJECT REQUEST */}
        <section
          style={{
            background: "#111",
            border: "1px solid #292929",
            borderRadius: "18px",
            padding: "18px",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: "900",
              color: "#FFD43B",
              marginBottom: "8px",
              letterSpacing: "0.08em",
            }}
          >
            BUILDER READY
          </div>

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
            placeholder="Example: Build a modern school management system with students, teachers, classes, attendance, results, fees and an admin dashboard."
            rows={8}
            disabled={building}
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

        {/* BUILD SESSION */}
        <section
          style={{
            background: "#111",
            border: "1px solid #292929",
            borderRadius: "18px",
            padding: "18px",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: "900",
              color: "#FFD43B",
              marginBottom: "8px",
              letterSpacing: "0.08em",
            }}
          >
            BUILD SESSION
          </div>

          <h2
            style={{
              margin: "0 0 12px",
              fontSize: "22px",
            }}
          >
            Build Stage
          </h2>

          <div
            style={{
              fontSize: "14px",
              color: "#aaa",
              marginBottom: "12px",
            }}
          >
            {project
              ? `Current stage: ${currentStage} / ${totalStages}`
              : "READY"}
          </div>

          {project && totalStages > 0 && (
            <div style={{ marginBottom: "14px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  color: "#aaa",
                  marginBottom: "7px",
                }}
              >
                <span>Build progress</span>
                <span>{progress}%</span>
              </div>

              <div
                style={{
                  width: "100%",
                  height: "8px",
                  background: "#292929",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: "#FFD43B",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
          )}

          <div
            style={{
              color: "#aaa",
              fontSize: "14px",
              lineHeight: "1.6",
              marginBottom: "14px",
            }}
          >
            <strong style={{ color: "#fff" }}>
              Session:
            </strong>{" "}
            3-minute build window
            <br />
            <strong style={{ color: "#fff" }}>
              Continue:
            </strong>{" "}
            from the exact saved stage
          </div>

          {project && !project.is_completed && (
            <button
              onClick={buildNextStage}
              disabled={building}
              style={{
                width: "100%",
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
              {building
                ? "BOMBA AI IS BUILDING..."
                : "🚀 BUILD"}
            </button>
          )}
        </section>

        {/* REAL BUILD ACTIVITY */}
        {(stageMessage || plan) && (
          <section
            style={{
              background: "#111",
              border: "1px solid #292929",
              borderRadius: "18px",
              padding: "18px",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: "900",
                color: "#FFD43B",
                marginBottom: "12px",
                letterSpacing: "0.08em",
              }}
            >
              REAL BUILD ACTIVITY
            </div>

            {stageMessage && (
              <div
                style={{
                  color: "#ddd",
                  lineHeight: "1.6",
                  marginBottom: "12px",
                }}
              >
                {stageMessage}
              </div>
            )}

            {plan && (
              <div
                style={{
                  background: "#080808",
                  border: "1px solid #252525",
                  borderRadius: "14px",
                  padding: "14px",
                }}
              >
                <div
                  style={{
                    fontWeight: "900",
                    marginBottom: "10px",
                  }}
                >
                  📋 Plan ready:{" "}
                  {Array.isArray(plan.buildStages)
                    ? plan.buildStages.length
                    : 0}{" "}
                  real build stages.
                </div>

                <div
                  style={{
                    display: "grid",
                    gap: "8px",
                  }}
                >
                  {Array.isArray(plan.buildStages) &&
                    plan.buildStages.map((stage, index) => (
                      <div
                        key={`${stage.stage || index}-${stage.name || "stage"}`}
                        style={{
                          padding: "10px",
                          borderRadius: "10px",
                          background: "#111",
                          border: "1px solid #222",
                        }}
                      >
                        <strong>
                          Stage {stage.stage || index + 1}:{" "}
                          {stage.name || "Build stage"}
                        </strong>

                        {stage.description && (
                          <div
                            style={{
                              color: "#999",
                              fontSize: "13px",
                              marginTop: "4px",
                              lineHeight: "1.5",
                            }}
                          >
                            {stage.description}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* MESSAGE */}
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