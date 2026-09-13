"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export default function UniversalBuilder() {
  const [idea, setIdea] = useState("");
  const [building, setBuilding] = useState(false);
  const [message, setMessage] = useState("");
  const [project, setProject] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [stageMessage, setStageMessage] = useState("");

  const [supabase] = useState(() =>
    createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  useEffect(() => { loadLatestProject(); }, []);

  async function loadLatestProject() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from("builder_projects").select("*").eq("owner_id", session.user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (data) {
        setProject(data);
        if (Array.isArray(data.build_plan) && data.build_plan.length > 0) {
          setPlan({ projectName: data.project_name, buildStages: data.build_plan });
        }
      }
    } catch (e) { console.error(e); }
  }

  async function startBuild() {
    if (!idea.trim()) { setMessage("Describe what you want BOMBA AI to build."); return; }
    setBuilding(true); setMessage(""); setStageMessage("🧠 BOMBA AI is understanding your project..."); setPlan(null); setProject(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setMessage("Please log in."); setBuilding(false); return; }

      setStageMessage("📋 Creating the real project plan...");
      // FIX 1: ADD AUTH HEADER TO PLAN CALL
      const planResponse = await fetch("/api/builder/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ originalRequest: idea.trim(), prompt: idea.trim() }),
      });
      const planData = await planResponse.json();
      if (!planResponse.ok ||!planData?.success) throw new Error(planData?.error || "Plan failed");

      // Support both formats
      const buildStages = planData.buildPlan || planData.plan || planData.buildStages || [];
      if (!Array.isArray(buildStages) || buildStages.length === 0) throw new Error("No build stages returned");

      const generatedPlan = { projectName: planData.projectName || "BOMBA Project", buildStages };
      setPlan(generatedPlan);
      setStageMessage(`📋 Plan ready: ${buildStages.length} real build stages.`);

      setStageMessage("💾 Saving your project...");
      const projectId = planData.projectId;
      let finalProject = null;

      if (projectId) {
        // Plan route already created project - just fetch it
        const { data } = await supabase.from("builder_projects").select("*").eq("id", projectId).single();
        finalProject = data;
      } else {
        // Fallback: create via projects API
        const projectResponse = await fetch("/api/builder/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ originalRequest: idea.trim() }),
        });
        const projectData = await projectResponse.json();
        if (!projectResponse.ok) throw new Error(projectData?.error || "Project create failed");
        finalProject = projectData.project;

        // Save plan via API not direct supabase
        await fetch("/api/builder/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ projectId: finalProject.id, prompt: idea.trim() }),
        });
        const { data: updated } = await supabase.from("builder_projects").select("*").eq("id", finalProject.id).single();
        finalProject = updated;
      }

      setProject(finalProject);
      setMessage(`✅ Project created with ${buildStages.length} real stages. Click BUILD to start Stage 1.`);
      setStageMessage(`📋 Plan ready: ${buildStages.length} real build stages.`);
    } catch (error: any) {
      console.error(error); setMessage(error?.message || "Something went wrong"); setStageMessage("");
    } finally { setBuilding(false); }
  }

  async function buildNextStage() {
    if (!project?.id) { setMessage("Please create a project first."); return; }
    setBuilding(true); setMessage(""); setStageMessage("🏗️ Starting real build stage 1...");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setMessage("Please log in."); setBuilding(false); return; }
      const response = await fetch("/api/builder/build", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ projectId: project.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Build failed");

      // FIX 2: USE RETURNED PROJECT DIRECTLY - NO RELOAD NEEDED
      if (data.project) {
        setProject(data.project);
        if (Array.isArray(data.project.build_plan)) {
          setPlan({ projectName: data.project.project_name, buildStages: data.project.build_plan });
        }
      }

      if (data.completed) {
        setStageMessage("✅ BOMBA AI completed the build!");
        setMessage(`🎉 Build completed! ${data.filesCreated || 0} files created.`);
      } else if (data.cooldown || data.paused) {
        setStageMessage("⏸️ Session saved, cooldown active");
        setMessage(data.message || "Progress saved");
      } else {
        setStageMessage(`🏗️ Built Stage ${data.currentStage} of ${data.totalStages}`);
        setMessage(data.stageSummary || "Progress saved");
      }
    } catch (error: any) {
      console.error(error); setMessage(error?.message || "Build error");
    } finally { setBuilding(false); }
  }

  const currentStage = Number(project?.current_stage || 0);
  const totalStages = Number(project?.total_stages || 0);
  const progress = totalStages > 0? Math.round((currentStage / totalStages) * 100) : 0;

  return (
    <main style={{ minHeight: "100vh", background: "#000", color: "#fff", padding: "24px 16px 50px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ marginBottom: "26px" }}>
          <div style={{ display: "inline-flex", width: "52px", height: "52px", borderRadius: "14px", background: "#FFD43B", color: "#000", fontWeight: "900", fontSize: "22px", alignItems: "center", justifyContent: "center", marginBottom: "14px" }}>TB</div>
          <h1 style={{ fontSize: "32px", fontWeight: "900", margin: "0 0 8px" }}>Universal Builder</h1>
          <p style={{ color: "#aaa", lineHeight: "1.6", margin: 0 }}>Describe what you want to build. BOMBA AI will create real plan, build it gradually, save progress.</p>
        </div>

        <section style={{ background: "#111", border: "1px solid #292929", borderRadius: "18px", padding: "18px", marginBottom: "18px" }}>
          <div style={{ fontSize: "12px", fontWeight: "900", color: "#FFD43B", marginBottom: "8px" }}>BUILDER READY</div>
          <label style={{ display: "block", fontWeight: "800", marginBottom: "10px" }}>What do you want to build?</label>
          <textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Example: Build a modern school management system..." rows={6} disabled={building} style={{ width: "100%", boxSizing: "border-box", background: "#050505", color: "#fff", border: "1px solid #333", borderRadius: "14px", padding: "15px", fontSize: "15px", outline: "none" }} />
          <button onClick={startBuild} disabled={building} style={{ width: "100%", marginTop: "14px", padding: "15px", border: "none", borderRadius: "12px", background: building? "#555" : "#FFD43B", color: "#000", fontSize: "16px", fontWeight: "900", cursor: building? "not-allowed" : "pointer" }}>{building? "Preparing..." : "Start Building 🚀"}</button>
        </section>

        <section style={{ background: "#111", border: "1px solid #292929", borderRadius: "18px", padding: "18px", marginBottom: "18px" }}>
          <div style={{ fontSize: "12px", fontWeight: "900", color: "#FFD43B", marginBottom: "8px" }}>BUILD SESSION</div>
          <h2 style={{ margin: "0 0 12px", fontSize: "22px" }}>Build Stage</h2>
          <div style={{ fontSize: "14px", color: "#aaa", marginBottom: "12px" }}>{project? `Current stage: ${currentStage} / ${totalStages}` : "READY"}</div>
          {project && totalStages > 0 && (
            <div style={{ marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#aaa", marginBottom: "7px" }}><span>Build progress</span><span>{progress}%</span></div>
              <div style={{ width: "100%", height: "8px", background: "#292929", borderRadius: "999px", overflow: "hidden" }}><div style={{ width: `${progress}%`, height: "100%", background: "#FFD43B" }} /></div>
            </div>
          )}
          {project &&!project.is_completed && (
            <button onClick={buildNextStage} disabled={building} style={{ width: "100%", padding: "15px", border: "none", borderRadius: "12px", background: building? "#555" : "#FFD43B", color: "#000", fontSize: "16px", fontWeight: "900", cursor: building? "not-allowed" : "pointer" }}>{building? "BOMBA AI IS BUILDING..." : "🚀 BUILD NEXT STAGE"}</button>
          )}
        </section>

        {(stageMessage || plan) && (
          <section style={{ background: "#111", border: "1px solid #292929", borderRadius: "18px", padding: "18px", marginBottom: "18px" }}>
            <div style={{ fontSize: "12px", fontWeight: "900", color: "#FFD43B", marginBottom: "12px" }}>REAL BUILD ACTIVITY</div>
            {stageMessage && <div style={{ color: "#ddd", lineHeight: "1.6", marginBottom: "12px" }}>{stageMessage}</div>}
            {plan && (
              <div style={{ background: "#080808", border: "1px solid #252525", borderRadius: "14px", padding: "14px" }}>
                <div style={{ fontWeight: "900", marginBottom: "10px" }}>📋 Plan ready: {plan.buildStages?.length || 0} real build stages.</div>
                <div style={{ display: "grid", gap: "8px" }}>{plan.buildStages?.map((s: any, i: number) => (<div key={i} style={{ padding: "10px", borderRadius: "10px", background: "#111", border: "1px solid #222" }}><strong>Stage {s.stage || i + 1}: {s.name}</strong>{s.description && <div style={{ color: "#999", fontSize: "13px", marginTop: "4px" }}>{s.description}</div>}</div>))}</div>
              </div>
            )}
          </section>
        )}
        {message && <div style={{ marginTop: "18px", padding: "14px", borderRadius: "12px", background: "#161616", border: "1px solid #333", color: "#ddd" }}>{message}</div>}
      </div>
    </main>
  );
}