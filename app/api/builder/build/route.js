import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 180;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const BUILD_SESSION_MINUTES = 3;
const COOLDOWN_HOURS = 10;

// Keep a small safety margin below the platform's 180-second limit.
const MAX_ENGINE_RUNTIME_MS = 170000;

function getNow() {
  return new Date();
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function parseJsonFromAI(content) {
  if (!content) {
    throw new Error(
      "The AI build engine returned an empty response."
    );
  }

  let cleaned = String(content).trim();

  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1) {
      const possibleJson = cleaned.slice(
        firstBrace,
        lastBrace + 1
      );

      try {
        return JSON.parse(possibleJson);
      } catch (innerError) {
        console.error(
          "AI JSON parse error:",
          innerError
        );
      }
    }

    throw new Error(
      "The AI build engine returned invalid JSON."
    );
  }
}

function mergeProjectFiles(existingFiles, newFiles) {
  const map = new Map();

  for (const file of Array.isArray(existingFiles)
    ? existingFiles
    : []) {
    if (
      file &&
      typeof file.path === "string" &&
      typeof file.content === "string"
    ) {
      map.set(file.path, file);
    }
  }

  for (const file of Array.isArray(newFiles)
    ? newFiles
    : []) {
    if (
      file &&
      typeof file.path === "string" &&
      typeof file.content === "string"
    ) {
      map.set(file.path, {
        path: file.path,
        content: file.content,
      });
    }
  }

  return Array.from(map.values());
}

function getRemainingSessionSeconds(sessionEndsAt) {
  return Math.max(
    0,
    Math.floor(
      (sessionEndsAt.getTime() - Date.now()) / 1000
    )
  );
}

export async function POST(req) {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          error:
            "Supabase environment variables are not configured.",
        },
        { status: 500 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "OpenAI API key is not configured.",
        },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          error:
            "Please log in before building your project.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();

    const projectId =
      typeof body?.projectId === "string"
        ? body.projectId.trim()
        : "";

    const originalRequest =
      typeof body?.originalRequest === "string"
        ? body.originalRequest.trim()
        : "";

    const plan = body?.plan;

    if (!projectId) {
      return NextResponse.json(
        {
          error: "A project ID is required.",
        },
        { status: 400 }
      );
    }

    if (!originalRequest) {
      return NextResponse.json(
        {
          error:
            "The original project request is missing.",
        },
        { status: 400 }
      );
    }

    if (!plan || typeof plan !== "object") {
      return NextResponse.json(
        {
          error:
            "A valid project plan is required before building.",
        },
        { status: 400 }
      );
    }

    const stages = Array.isArray(plan.buildStages)
      ? plan.buildStages
      : [];

    if (stages.length === 0) {
      return NextResponse.json(
        {
          error:
            "The project plan does not contain any build stages.",
        },
        { status: 400 }
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
          error:
            "Your login session could not be verified.",
        },
        { status: 401 }
      );
    }

    const { data: project, error: projectError } =
      await supabase
        .from("builder_projects")
        .select("*")
        .eq("id", projectId)
        .eq("owner_id", user.id)
        .single();

    if (projectError || !project) {
      console.error(
        "Builder project lookup error:",
        projectError
      );

      return NextResponse.json(
        {
          error:
            "The builder project could not be found.",
        },
        { status: 404 }
      );
    }

    let now = getNow();

    let currentStage = Number.isInteger(
      project.current_stage
    )
      ? project.current_stage
      : 0;

    const totalStages = stages.length;

    /*
     * PROJECT ALREADY COMPLETE
     */
    if (
      project.is_completed ||
      currentStage >= totalStages
    ) {
      return NextResponse.json({
        success: true,
        completed: true,
        paused: false,
        message:
          "This project has already completed all build stages.",
        project: {
          ...project,
          project_files: [],
        },
      });
    }

    /*
     * COOLDOWN CHECK
     */
    if (
      project.cooldown_ends_at &&
      new Date(project.cooldown_ends_at) > now
    ) {
      const cooldownEnds = new Date(
        project.cooldown_ends_at
      );

      return NextResponse.json(
        {
          success: false,
          paused: true,
          completed: false,
          error:
            "Your build session is on cooldown. Please continue when the next build session opens.",
          cooldownEndsAt:
            cooldownEnds.toISOString(),
          project: {
            ...project,
            project_files: [],
          },
        },
        { status: 429 }
      );
    }

    /*
     * START OR CONTINUE BUILD SESSION
     */
    let sessionStartedAt =
      project.build_session_started_at
        ? new Date(project.build_session_started_at)
        : null;

    let sessionEndsAt =
      project.build_session_ends_at
        ? new Date(project.build_session_ends_at)
        : null;

    const sessionIsActive =
      sessionStartedAt &&
      sessionEndsAt &&
      now < sessionEndsAt;

    if (!sessionIsActive) {
      sessionStartedAt = now;

      sessionEndsAt = addMinutes(
        now,
        BUILD_SESSION_MINUTES
      );
    }

    /*
     * SAFETY CHECK
     */
    if (now >= sessionEndsAt) {
      const cooldownEndsAt = addHours(
        now,
        COOLDOWN_HOURS
      );

      const { data: pausedProject, error: pauseError } =
        await supabase
          .from("builder_projects")
          .update({
            status: "paused",
            is_paused: true,
            build_session_started_at:
              sessionStartedAt.toISOString(),
            build_session_ends_at:
              sessionEndsAt.toISOString(),
            cooldown_ends_at:
              cooldownEndsAt.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq("id", project.id)
          .eq("owner_id", user.id)
          .select()
          .single();

      if (pauseError) {
        console.error(
          "Pause project error:",
          pauseError
        );
      }

      return NextResponse.json({
        success: true,
        paused: true,
        completed: false,
        message:
          "The 3-minute build session has ended. Your project is safely saved and will continue after the cooldown.",
        cooldownEndsAt:
          cooldownEndsAt.toISOString(),
        project: {
          ...(pausedProject || project),
          project_files: [],
        },
      });
    }

    /*
     * KEEP THE CURRENT FILES IN MEMORY.
     */
    let projectFiles = Array.isArray(
      project.project_files
    )
      ? project.project_files
      : [];

    let lastStage = null;
    let stagesCompletedThisRequest = 0;

    /*
     * AUTOMATIC BUILD LOOP
     *
     * This is the major change.
     *
     * The server automatically continues from one stage
     * to the next while the real build session is active.
     */
    while (
      currentStage < totalStages
    ) {
      now = getNow();

      const engineRuntime =
        now.getTime() -
        new Date(
          project.updated_at || now
        ).getTime();

      const sessionRemainingSeconds =
        getRemainingSessionSeconds(
          sessionEndsAt
        );

      /*
       * Stop before the platform/runtime limit.
       */
      if (
        engineRuntime >=
        MAX_ENGINE_RUNTIME_MS
      ) {
        break;
      }

      /*
       * Stop when the real 3-minute build window ends.
       */
      if (sessionRemainingSeconds <= 5) {
        break;
      }

      const stageIndex = currentStage;
      const stage = stages[stageIndex];

      if (!stage) {
        break;
      }

      const stageNumber =
        Number(stage.stage) ||
        stageIndex + 1;

      const previousFileSummary =
        projectFiles
          .map((file) => {
            if (!file?.path) return "";
            return `- ${file.path}`;
          })
          .filter(Boolean)
          .join("\n");

      const previousFilesContext =
        previousFileSummary ||
        "No project files have been created yet.";

      const remainingMinutes = Math.max(
        0,
        Math.ceil(
          getRemainingSessionSeconds(
            sessionEndsAt
          ) / 60
        )
      );

      const buildPrompt = `
You are the REAL BUILD ENGINE for BOMBA AI.

You are not a planning assistant.

You are actually building a real software project one stage at a time.

USER'S ORIGINAL REQUEST:
${originalRequest}

PROJECT NAME:
${plan.projectName || "BOMBA Project"}

PROJECT SUMMARY:
${plan.summary || ""}

PROJECT GOAL:
${plan.goal || ""}

FEATURES:
${JSON.stringify(
  plan.features || [],
  null,
  2
)}

PAGES:
${JSON.stringify(
  plan.pages || [],
  null,
  2
)}

USER ROLES:
${JSON.stringify(
  plan.userRoles || [],
  null,
  2
)}

ALL BUILD STAGES:
${JSON.stringify(
  stages,
  null,
  2
)}

CURRENT BUILD STAGE:
Stage ${stageNumber} of ${totalStages}

CURRENT STAGE NAME:
${stage.name || "Unnamed stage"}

CURRENT STAGE DESCRIPTION:
${stage.description || ""}

FILES ALREADY CREATED:
${previousFilesContext}

REAL BUILD SESSION:
Approximately ${remainingMinutes} minute(s) remain in this real build session.

YOUR JOB:

Actually build the current stage.

Create or modify real project files.

The application must be functional, organized and usable.

Prefer simple, reliable browser technology.

Use HTML, CSS and JavaScript where appropriate.

If previous files exist, preserve their working functionality and extend them.

Do not unnecessarily delete working functionality.

Create professional, responsive interfaces.

Use realistic sample data where appropriate.

Do not put BOMBA AI branding inside the generated application unless requested by the user.

Do not create fake progress bars or fake build activity.

For this stage, return every file that was created or modified.

Every returned file must contain its COMPLETE contents.

The output must be valid JSON.

Use EXACTLY this structure:

{
  "stageName": "completed stage name",
  "summary": "what was actually built",
  "files": [
    {
      "path": "relative/path/to/file.html",
      "content": "complete file contents"
    }
  ]
}

IMPORTANT:

- Return complete files.
- Do not return snippets.
- Do not use markdown code fences.
- Do not return commentary outside JSON.
- Do not return an empty files array unless absolutely necessary.
`;

      console.log(
        `[BOMBA BUILD] Starting stage ${stageNumber}/${totalStages}`
      );

      let response;

      try {
        response =
          await openai.chat.completions.create({
            model: "gpt-4o-mini",
            temperature: 0.1,
            response_format: {
              type: "json_object",
            },
            messages: [
              {
                role: "system",
                content:
                  "You are BOMBA AI's real software build engine. Return ONLY valid JSON. Actually create the requested files.",
              },
              {
                role: "user",
                content: buildPrompt,
              },
            ],
          });
      } catch (aiError) {
        console.error(
          `[BOMBA BUILD] AI error on stage ${stageNumber}:`,
          aiError
        );

        throw new Error(
          aiError?.message ||
            `The AI build engine failed on stage ${stageNumber}.`
        );
      }

      const content =
        response.choices?.[0]?.message?.content;

      const buildResult =
        parseJsonFromAI(content);

      const newFiles = Array.isArray(
        buildResult.files
      )
        ? buildResult.files
        : [];

      if (newFiles.length === 0) {
        throw new Error(
          `Stage ${stageNumber} completed without returning any project files.`
        );
      }

      /*
       * MERGE THE NEW FILES INTO THE PROJECT.
       */
      projectFiles = mergeProjectFiles(
        projectFiles,
        newFiles
      );

      const nextStage =
        currentStage + 1;

      const completed =
        nextStage >= totalStages;

      now = getNow();

      let nextStatus = "building";
      let isPaused = false;
      let cooldownEndsAt = null;

      if (completed) {
        nextStatus = "completed";
        isPaused = false;
      } else if (now >= sessionEndsAt) {
        cooldownEndsAt = addHours(
          now,
          COOLDOWN_HOURS
        );

        nextStatus = "paused";
        isPaused = true;
      }

      /*
       * SAVE AFTER EVERY STAGE.
       *
       * This is important because if the server stops,
       * the project still knows exactly where it stopped.
       */
      const updateData = {
        project_name:
          plan.projectName ||
          project.project_name ||
          "BOMBA Project",

        build_plan: stages,

        project_files: projectFiles,

        current_stage: nextStage,

        total_stages: totalStages,

        status: nextStatus,

        build_session_started_at:
          sessionStartedAt.toISOString(),

        build_session_ends_at:
          sessionEndsAt.toISOString(),

        cooldown_ends_at:
          cooldownEndsAt
            ? cooldownEndsAt.toISOString()
            : null,

        is_paused: isPaused,

        is_completed: completed,

        updated_at:
          now.toISOString(),
      };

      const {
        data: savedProject,
        error: updateError,
      } = await supabase
        .from("builder_projects")
        .update(updateData)
        .eq("id", project.id)
        .eq("owner_id", user.id)
        .select()
        .single();

      if (updateError) {
        console.error(
          "Builder project update error:",
          updateError
        );

        return NextResponse.json(
          {
            error:
              updateError.message ||
              "The build stage was created but could not be saved.",
          },
          { status: 500 }
        );
      }

      currentStage = nextStage;

      lastStage = {
        number: stageNumber,
        name:
          buildResult.stageName ||
          stage.name ||
          `Stage ${stageNumber}`,
        summary:
          buildResult.summary ||
          stage.description ||
          "",
      };

      stagesCompletedThisRequest += 1;

      console.log(
        `[BOMBA BUILD] Completed stage ${stageNumber}/${totalStages}`
      );

      /*
       * PROJECT IS FINISHED.
       */
      if (completed) {
        return NextResponse.json({
          success: true,
          completed: true,
          paused: false,

          message:
            "BOMBA AI has completed the entire project.",

          stagesCompletedThisRequest,

          lastStage,

          nextStage: null,

          totalStages,

          session: {
            startedAt:
              sessionStartedAt.toISOString(),
            endsAt:
              sessionEndsAt.toISOString(),
            remainingMinutes: Math.max(
              0,
              Math.ceil(
                getRemainingSessionSeconds(
                  sessionEndsAt
                ) / 60
              )
            ),
          },

          project: {
            id: savedProject.id,
            project_name:
              savedProject.project_name,
            current_stage:
              savedProject.current_stage,
            total_stages:
              savedProject.total_stages,
            status:
              savedProject.status,
            is_paused:
              savedProject.is_paused,
            is_completed:
              savedProject.is_completed,
            build_session_started_at:
              savedProject.build_session_started_at,
            build_session_ends_at:
              savedProject.build_session_ends_at,
            cooldown_ends_at:
              savedProject.cooldown_ends_at,
          },
        });
      }

      /*
       * If the 3-minute session ended immediately after
       * saving this stage, pause safely.
       */
      if (now >= sessionEndsAt) {
        const cooldownEndsAt =
          addHours(
            now,
            COOLDOWN_HOURS
          );

        const {
          data: pausedProject,
          error: pauseError,
        } = await supabase
          .from("builder_projects")
          .update({
            status: "paused",
            is_paused: true,
            cooldown_ends_at:
              cooldownEndsAt.toISOString(),
            updated_at:
              now.toISOString(),
          })
          .eq("id", project.id)
          .eq("owner_id", user.id)
          .select()
          .single();

        if (pauseError) {
          console.error(
            "Automatic pause error:",
            pauseError
          );
        }

        return NextResponse.json({
          success: true,
          completed: false,
          paused: true,

          message:
            "The real build session ended. BOMBA AI safely saved the latest completed stage.",

          stagesCompletedThisRequest,

          lastStage,

          cooldownEndsAt:
            cooldownEndsAt.toISOString(),

          project: {
            ...(pausedProject || project),
            project_files: [],
          },
        });
      }

      /*
       * Otherwise the WHILE LOOP automatically starts
       * the next stage.
       */
    }

    /*
     * If we reach here, the runtime/session budget ended
     * before the complete project was finished.
     */
    now = getNow();

    const cooldownEndsAt =
      addHours(
        now,
        COOLDOWN_HOURS
      );

    const { data: pausedProject, error: pauseError } =
      await supabase
        .from("builder_projects")
        .update({
          status: "paused",
          is_paused: true,
          cooldown_ends_at:
            cooldownEndsAt.toISOString(),
          updated_at:
            now.toISOString(),
        })
        .eq("id", project.id)
        .eq("owner_id", user.id)
        .select()
        .single();

    if (pauseError) {
      console.error(
        "Final automatic pause error:",
        pauseError
      );
    }

    return NextResponse.json({
      success: true,
      completed: false,
      paused: true,

      message:
        "BOMBA AI saved the latest completed build stage. The remaining stages will continue in the next build session.",

      stagesCompletedThisRequest,

      lastStage,

      cooldownEndsAt:
        cooldownEndsAt.toISOString(),

      project: {
        ...(pausedProject || project),
        project_files: [],
      },
    });
  } catch (error) {
    console.error(
      "BOMBA Build Engine error:",
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