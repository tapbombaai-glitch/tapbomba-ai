import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 180;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const BUILD_SESSION_MINUTES = 3;
const COOLDOWN_HOURS = 10;

// Leave a small safety margin before Render's execution limit.
const MAX_ENGINE_RUNTIME_MS = 170000;

/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */

function cleanJsonText(text) {
  if (!text || typeof text !== "string") return "";

  let cleaned = text.trim();

  // Remove markdown code fences if the model adds them.
  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return cleaned;
}

function parseJsonFromAI(text) {
  const cleaned = cleanJsonText(text);

  if (!cleaned) {
    throw new Error("AI returned an empty response.");
  }

  try {
    return JSON.parse(cleaned);
  } catch (_) {
    // Try extracting the outermost JSON object.
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const extracted = cleaned.slice(firstBrace, lastBrace + 1);

      try {
        return JSON.parse(extracted);
      } catch (_) {
        throw new Error("The AI returned invalid JSON.");
      }
    }

    throw new Error("The AI returned invalid JSON.");
  }
}

function mergeProjectFiles(existingFiles, newFiles) {
  const map = new Map();

  for (const file of Array.isArray(existingFiles) ? existingFiles : []) {
    if (!file?.path) continue;

    map.set(file.path, {
      path: file.path,
      content: typeof file.content === "string" ? file.content : "",
    });
  }

  for (const file of Array.isArray(newFiles) ? newFiles : []) {
    if (!file?.path) continue;

    map.set(file.path, {
      path: file.path,
      content: typeof file.content === "string" ? file.content : "",
    });
  }

  return Array.from(map.values());
}

function getRemainingSessionSeconds(sessionEndsAt) {
  if (!sessionEndsAt) return 0;

  const end = new Date(sessionEndsAt).getTime();
  const remaining = end - Date.now();

  if (remaining <= 0) return 0;

  return Math.floor(remaining / 1000);
}

/* -------------------------------------------------------
   MAIN BUILD ENGINE
------------------------------------------------------- */

export async function POST(req) {
  const requestStartedAt = Date.now();

  try {
    /* ---------------------------------------------------
       ENVIRONMENT
    --------------------------------------------------- */

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          error: "Supabase environment variables are not configured.",
        },
        { status: 500 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OpenAI environment variable is not configured.",
        },
        { status: 500 }
      );
    }

    /* ---------------------------------------------------
       REQUEST
    --------------------------------------------------- */

    const body = await req.json();

    const projectId =
      typeof body?.projectId === "string"
        ? body.projectId.trim()
        : "";

    if (!projectId) {
      return NextResponse.json(
        {
          error: "A project ID is required.",
        },
        { status: 400 }
      );
    }

    /* ---------------------------------------------------
       AUTH
    --------------------------------------------------- */

    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          error: "Please log in before building your project.",
        },
        { status: 401 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Your login session could not be verified.",
        },
        { status: 401 }
      );
    }

    /* ---------------------------------------------------
       LOAD PROJECT
    --------------------------------------------------- */

    const {
      data: project,
      error: projectError,
    } = await supabase
      .from("builder_projects")
      .select("*")
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .single();

    if (projectError || !project) {
      console.error("Builder project load error:", projectError);

      return NextResponse.json(
        {
          error: "Project not found or you do not have access to it.",
        },
        { status: 404 }
      );
    }

    /* ---------------------------------------------------
       COMPLETED PROJECT
    --------------------------------------------------- */

    if (project.is_completed) {
      return NextResponse.json({
        success: true,
        completed: true,
        paused: false,
        projectId: project.id,
        currentStage: project.current_stage,
        totalStages: project.total_stages,
        projectName: project.project_name,
        message: "This project has already been completed.",
      });
    }

    /* ---------------------------------------------------
       COOLDOWN CHECK
    --------------------------------------------------- */

    if (project.cooldown_ends_at) {
      const cooldownEnd = new Date(
        project.cooldown_ends_at
      ).getTime();

      if (cooldownEnd > Date.now()) {
        const remainingMs = cooldownEnd - Date.now();
        const remainingMinutes = Math.ceil(
          remainingMs / 60000
        );

        return NextResponse.json({
          success: true,
          completed: false,
          paused: true,
          cooldown: true,
          projectId: project.id,
          currentStage: project.current_stage || 0,
          totalStages: project.total_stages || 0,
          projectName: project.project_name,
          cooldownEndsAt: project.cooldown_ends_at,
          cooldownRemainingMinutes: remainingMinutes,
          message:
            "The current build session has ended. BOMBA AI will continue from the next saved stage after the cooldown period.",
        });
      }
    }

    /* ---------------------------------------------------
       PROJECT PLAN
    --------------------------------------------------- */

    const buildPlan = Array.isArray(project.build_plan)
      ? project.build_plan
      : [];

    const totalStages =
      Number(project.total_stages) ||
      buildPlan.length ||
      0;

    if (totalStages === 0) {
      return NextResponse.json(
        {
          error:
            "This project does not have a build plan yet.",
        },
        { status: 400 }
      );
    }

    /* ---------------------------------------------------
       CURRENT STAGE
    --------------------------------------------------- */

    let currentStage =
      Number(project.current_stage) || 0;

    let projectFiles = Array.isArray(project.project_files)
      ? project.project_files
      : [];

    /* ---------------------------------------------------
       START / CONTINUE 3-MINUTE SESSION
    --------------------------------------------------- */

    let sessionEndsAt = project.build_session_ends_at;

    const existingSessionExpired =
      !sessionEndsAt ||
      new Date(sessionEndsAt).getTime() <= Date.now();

    if (existingSessionExpired) {
      const sessionStart = new Date();

      const sessionEnd = new Date(
        Date.now() +
          BUILD_SESSION_MINUTES * 60 * 1000
      );

      sessionEndsAt = sessionEnd.toISOString();

      const { error: sessionError } = await supabase
        .from("builder_projects")
        .update({
          build_session_started_at:
            sessionStart.toISOString(),

          build_session_ends_at:
            sessionEndsAt,

          is_paused: false,

          cooldown_ends_at: null,

          status: "building",

          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id)
        .eq("owner_id", user.id);

      if (sessionError) {
        console.error(
          "Session start error:",
          sessionError
        );

        return NextResponse.json(
          {
            error:
              "Could not start the build session.",
          },
          { status: 500 }
        );
      }
    }

    /* ---------------------------------------------------
       AUTOMATIC STAGE LOOP
    --------------------------------------------------- */

    while (currentStage < totalStages) {
      /* -----------------------------------------------
         CHECK REAL SESSION TIME
      ------------------------------------------------ */

      const remainingSeconds =
        getRemainingSessionSeconds(sessionEndsAt);

      if (remainingSeconds <= 0) {
        const cooldownEnds = new Date(
          Date.now() +
            COOLDOWN_HOURS * 60 * 60 * 1000
        ).toISOString();

        await supabase
          .from("builder_projects")
          .update({
            is_paused: true,
            status: "paused",
            cooldown_ends_at: cooldownEnds,
            updated_at: new Date().toISOString(),
          })
          .eq("id", project.id)
          .eq("owner_id", user.id);

        return NextResponse.json({
          success: true,
          completed: false,
          paused: true,
          cooldown: true,
          projectId: project.id,
          currentStage,
          totalStages,
          projectName: project.project_name,
          cooldownEndsAt: cooldownEnds,
          message:
            "The 3-minute build session has ended. Progress has been saved.",
        });
      }

      /* -----------------------------------------------
         SAFETY CHECK FOR SERVER RUNTIME
      ------------------------------------------------ */

      const engineRuntime =
        Date.now() - requestStartedAt;

      if (
        engineRuntime >=
        MAX_ENGINE_RUNTIME_MS
      ) {
        const cooldownEnds = new Date(
          Date.now() +
            COOLDOWN_HOURS * 60 * 60 * 1000
        ).toISOString();

        await supabase
          .from("builder_projects")
          .update({
            is_paused: true,
            status: "paused",
            cooldown_ends_at: cooldownEnds,
            updated_at: new Date().toISOString(),
          })
          .eq("id", project.id)
          .eq("owner_id", user.id);

        return NextResponse.json({
          success: true,
          completed: false,
          paused: true,
          cooldown: true,
          projectId: project.id,
          currentStage,
          totalStages,
          projectName: project.project_name,
          cooldownEndsAt: cooldownEnds,
          message:
            "BOMBA AI safely saved the latest build progress before the server runtime limit.",
        });
      }

      /* -----------------------------------------------
         STAGE INFORMATION
      ------------------------------------------------ */

      const stageNumber = currentStage + 1;

      const stage =
        buildPlan[currentStage] || {
          stage: stageNumber,
          name: `Build Stage ${stageNumber}`,
          description:
            "Continue building the application.",
        };

      /* -----------------------------------------------
         AI BUILD REQUEST
      ------------------------------------------------ */

      const systemPrompt = `
You are BOMBA AI's REAL SOFTWARE BUILD ENGINE.

You are not a planning assistant.

You are actively building a real web application.

The user has already requested this application and BOMBA AI
has already created a multi-stage build plan.

Your job is to perform ONLY the current build stage.

CURRENT STAGE:
${stageNumber}

STAGE NAME:
${stage.name}

STAGE DESCRIPTION:
${stage.description}

IMPORTANT RULES:

1. Actually create the files needed for this stage.
2. Return complete file contents.
3. Do not return placeholders such as:
   "add code here"
   "implement later"
   "TODO"
   "coming soon".

4. Build real functional software.

5. If earlier files already exist, preserve their functionality.

6. You may create new files.

7. You may update existing files when necessary.

8. Do not delete working functionality unless absolutely necessary.

9. The final application should be professional and organized.

10. Use responsive mobile-first design.

11. Include realistic sample data when appropriate.

12. Generated applications must NOT contain BOMBA AI branding unless
the user specifically requested BOMBA AI branding inside the generated app.

13. The generated project should be capable of becoming a real working
application, not merely a visual mockup.

14. If this stage depends on previous files, inspect the supplied
existing files and build on them.

15. Keep the project architecture clean.

RETURN ONLY VALID JSON.

Use exactly this structure:

{
  "stageCompleted": true,
  "summary": "short description of what was actually built",
  "files": [
    {
      "path": "relative/path/to/file",
      "content": "complete file contents"
    }
  ]
}

Every file must contain complete source code.
`;

      const existingFilesForAI =
        projectFiles.map((file) => ({
          path: file.path,
          content: file.content,
        }));

      const userPrompt = `
ORIGINAL USER REQUEST:

${project.original_request}

FULL BUILD PLAN:

${JSON.stringify(buildPlan, null, 2)}

CURRENT STAGE:

${JSON.stringify(stage, null, 2)}

FILES ALREADY CREATED:

${JSON.stringify(
  existingFilesForAI,
  null,
  2
)}

Build the current stage now.

Do real implementation work.

Return only valid JSON.
`;

      let aiResponse;

      try {
        aiResponse =
          await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.1,

            response_format: {
              type: "json_object",
            },

            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              {
                role: "user",
                content: userPrompt,
              },
            ],
          });
      } catch (error) {
        console.error(
          "OpenAI build error:",
          error
        );

        return NextResponse.json(
          {
            error:
              error?.message ||
              "The AI build engine could not complete this stage.",
            currentStage,
            totalStages,
          },
          { status: 500 }
        );
      }

      /* -----------------------------------------------
         PARSE AI RESPONSE
      ------------------------------------------------ */

      const rawContent =
        aiResponse?.choices?.[0]?.message?.content;

      let stageResult;

      try {
        stageResult =
          parseJsonFromAI(rawContent);
      } catch (error) {
        console.error(
          "Build JSON parsing error:",
          error
        );

        return NextResponse.json(
          {
            error:
              error?.message ||
              "The AI returned an invalid build response.",
            currentStage,
            totalStages,
          },
          { status: 500 }
        );
      }

      /* -----------------------------------------------
         VALIDATE FILES
      ------------------------------------------------ */

      const generatedFiles =
        Array.isArray(stageResult?.files)
          ? stageResult.files
          : [];

      if (generatedFiles.length === 0) {
        return NextResponse.json(
          {
            error:
              "The AI did not create any files for this stage.",
            currentStage,
            totalStages,
          },
          { status: 500 }
        );
      }

      /* -----------------------------------------------
         MERGE FILES
      ------------------------------------------------ */

      projectFiles = mergeProjectFiles(
        projectFiles,
        generatedFiles
      );

      /* -----------------------------------------------
         MOVE TO NEXT STAGE
      ------------------------------------------------ */

      currentStage = stageNumber;

      const completed =
        currentStage >= totalStages;

      /* -----------------------------------------------
         SAVE AFTER EVERY STAGE
      ------------------------------------------------ */

      const updateData = {
        project_files: projectFiles,

        current_stage: currentStage,

        total_stages: totalStages,

        status: completed
          ? "completed"
          : "building",

        is_paused: false,

        is_completed: completed,

        updated_at: new Date().toISOString(),
      };

      if (completed) {
        updateData.cooldown_ends_at = null;
      }

      const {
        error: saveError,
      } = await supabase
        .from("builder_projects")
        .update(updateData)
        .eq("id", project.id)
        .eq("owner_id", user.id);

      if (saveError) {
        console.error(
          "Stage save error:",
          saveError
        );

        return NextResponse.json(
          {
            error:
              "The build stage was created but could not be saved.",
            currentStage,
            totalStages,
          },
          { status: 500 }
        );
      }

      /* -----------------------------------------------
         COMPLETED
      ------------------------------------------------ */

      if (completed) {
        return NextResponse.json({
          success: true,
          completed: true,
          paused: false,
          cooldown: false,

          projectId: project.id,

          projectName:
            stageResult.projectName ||
            project.project_name,

          currentStage,

          totalStages,

          progress: 100,

          filesCreated: projectFiles.length,

          stageSummary:
            stageResult.summary ||
            `Completed build stage ${stageNumber}.`,

          message:
            "BOMBA AI has completed the entire build.",
        });
      }

      /* -----------------------------------------------
         CONTINUE AUTOMATICALLY
         No manual BUILD NEXT STAGE button required.
      ------------------------------------------------ */

      const timeLeft =
        getRemainingSessionSeconds(
          sessionEndsAt
        );

      if (timeLeft <= 0) {
        const cooldownEnds = new Date(
          Date.now() +
            COOLDOWN_HOURS * 60 * 60 * 1000
        ).toISOString();

        await supabase
          .from("builder_projects")
          .update({
            is_paused: true,
            status: "paused",
            cooldown_ends_at: cooldownEnds,
            updated_at: new Date().toISOString(),
          })
          .eq("id", project.id)
          .eq("owner_id", user.id);

        return NextResponse.json({
          success: true,
          completed: false,
          paused: true,
          cooldown: true,

          projectId: project.id,

          currentStage,

          totalStages,

          progress: Math.round(
            (currentStage / totalStages) * 100
          ),

          projectName: project.project_name,

          filesCreated:
            projectFiles.length,

          cooldownEndsAt:
            cooldownEnds,

          stageSummary:
            stageResult.summary ||
            `Completed stage ${stageNumber}.`,

          message:
            "BOMBA AI automatically saved the latest stage. The build session has ended.",
        });
      }

      // Continue the while loop automatically.
    }

    /* ---------------------------------------------------
       FALLBACK
    --------------------------------------------------- */

    return NextResponse.json({
      success: true,
      completed: currentStage >= totalStages,
      paused: false,
      projectId: project.id,
      currentStage,
      totalStages,
      projectName: project.project_name,
      filesCreated: projectFiles.length,
      message:
        "BOMBA AI saved the latest build progress.",
    });
  } catch (error) {
    console.error(
      "BOMBA Builder Engine error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Something went wrong while building the project.",
      },
      { status: 500 }
    );
  }
}