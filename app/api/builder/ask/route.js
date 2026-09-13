async function askBombaAI() {
  const question = askPrompt.trim();

  if (!question) {
    setAskError(
      "Type or speak a question for BOMBA AI."
    );
    return;
  }

  setAskLoading(true);
  setAskError("");
  setAskAnswer("");

  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase is not configured.");
    }

    const { createClient } = await import(
      "@supabase/supabase-js"
    );

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey
    );

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error(
        "Please log in before using ASK BOMBA AI."
      );
    }

    /*
      ASK BOMBA works without a Builder project.

      If a project is already open, we send it as context.
      If there is no project, BOMBA simply answers normally.
    */

    let activeProject = builderProject;
    let activePlan = builderPlan;

    /*
      If there is no project in the current page state,
      try to load the user's latest saved project.

      This is optional context only.
      It is NOT required for ASK BOMBA.
    */
    if (!activeProject?.id) {
      const {
        data: savedProject,
        error: projectError,
      } = await supabase
        .from("builder_projects")
        .select("*")
        .eq("owner_id", session.user.id)
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (!projectError && savedProject) {
        activeProject = savedProject;

        setBuilderProject(savedProject);

        if (
          Array.isArray(savedProject.build_plan) &&
          savedProject.build_plan.length > 0
        ) {
          activePlan = {
            projectName:
              savedProject.project_name,
            buildStages:
              savedProject.build_plan,
          };

          setBuilderPlan(activePlan);
        }
      }
    }

    const response = await fetch(
      "/api/builder/ask",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          /*
            projectId is OPTIONAL now.
          */
          projectId:
            activeProject?.id || "",

          question,

          project:
            activeProject || null,

          plan:
            activePlan || null,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
          "BOMBA AI could not answer your question."
      );
    }

    if (!data?.answer) {
      throw new Error(
        "BOMBA AI did not return an answer."
      );
    }

    setAskAnswer(data.answer);
  } catch (err) {
    console.error(
      "ASK BOMBA AI error:",
      err
    );

    setAskError(
      err?.message ||
        "Something went wrong while asking BOMBA AI."
    );
  } finally {
    setAskLoading(false);
  }
}