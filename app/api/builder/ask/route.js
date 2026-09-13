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
      throw new Error(
        "Supabase is not configured."
      );
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
        "Please log in before using Ask BOMBA AI."
      );
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
          projectId:
            builderProject?.id || null,

          question,

          project:
            builderProject || null,

          plan:
            builderPlan || null,
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

    await revealAskAnswerGradually(
      data.answer
    );
  } catch (err) {
    console.error(
      "Ask BOMBA AI error:",
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