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
    throw new Error("The AI build engine returned an empty response.");
  }

  let cleaned = content.trim();

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
      const possibleJson = cleaned.slice(firstBrace, lastBrace + 1);

      try {
        return JSON.parse(possibleJson);
      } catch (innerError) {
        console.error("AI JSON parse error:", innerError);
      }
    }

    throw new Error("The AI build engine returned invalid JSON.");
  }
}

function mergeProjectFiles(existingFiles, newFiles) {
  const map = new Map();

  for (const file of Array.isArray(existingFiles) ? existingFiles : []) {
    if (
      file &&
      typeof file.path === "string" &&
      typeof file.content === "string"
    ) {
      map.set(file.path, file);
    }
  }

  for (const file of Array.isArray(newFiles) ? newFiles : []) {
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

export async function POST(req) {
  try {
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
          error: "OpenAI API key is not configured.",
        },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          error: "Please log in before building your project.",
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
          error: "The original project request is missing.",
        },
        { status: 400 }
      );
    }

    if (!plan || typeof plan !== "object") {
      return NextResponse.json(
        {
          error: "A valid project plan is required before building.",
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
          error: "The project plan does not contain any build stages.",
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
          error: "Your login session could not be verified.",
        },
        { status: 401 }
      );
    }

    const { data: project, error: projectError } = await supabase
      .from("builder_projects")
      .select("*")
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .single();

    if (projectError || !project) {
      console.error("Builder project lookup error:", projectError);

      return NextResponse.json(
        {
          error: "The builder project could not be found.",
        },
        { status: 404 }
      );
    }

    const now = getNow();

    const currentStage =
      Number.isInteger(project.current_stage)
        ? project.current_stage
        : 0;

    const totalStages = stages.length;

    if (project.is_completed || currentStage >= totalStages) {
      return NextResponse.json({
        success: true,
        completed: true,
        message: "This project has already completed all build stages.",
        project: {
          ...project,
          project_files: [],
        },
      });
    }

    if (
      project.cooldown_ends_at &&
      new Date(project.cooldown_ends_at) > now
    ) {
      const cooldownEnds = new Date(project.cooldown_ends_at);

      return NextResponse.json(
        {
          error:
            "Your build session is on cooldown. Please continue when the next build session opens.",
          cooldownEndsAt: cooldownEnds.toISOString(),
          project: {
            ...project,
            project_files: [],
          },
        },
        { status: 429 }
      );
    }

    let sessionStartedAt = project.build_session_started_at
      ? new Date(project.build_session_started_at)
      : null;

    let sessionEndsAt = project.build_session_ends_at
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

    const stageIndex = currentStage;
    const stage = stages[stageIndex];

    if (!stage) {
      return NextResponse.json(
        {
          error: "The next build stage could not be found.",
        },
        { status: 500 }
      );
    }

    const stageNumber =
      Number(stage.stage) || stageIndex + 1;

    const previousFiles = Array.isArray(project.project_files)
      ? project.project_files
      : [];

    const previousFileSummary = previousFiles
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
        (sessionEndsAt.getTime() - now.getTime()) /
          60000
      )
    );

    const buildPrompt = `
You are the REAL BUILD ENGINE for BOMBA AI.

You are not a planning assistant.

You are responsible for actually building the user's software project one stage at a time.

USER'S ORIGINAL REQUEST:
${originalRequest}

PROJECT NAME:
${plan.projectName || "BOMBA Project"}

PROJECT SUMMARY:
${plan.summary || ""}

PROJECT GOAL:
${plan.goal || ""}

FEATURES:
${JSON.stringify(plan.features || [], null, 2)}

PAGES:
${JSON.stringify(plan.pages || [], null, 2)}

USER ROLES:
${JSON.stringify(plan.userRoles || [], null, 2)}

ALL BUILD STAGES:
${JSON.stringify(stages, null, 2)}

CURRENT BUILD STAGE:
Stage ${stageNumber} of ${totalStages}

CURRENT STAGE NAME:
${stage.name || "Unnamed stage"}

CURRENT STAGE DESCRIPTION:
${stage.description || ""}

FILES ALREADY CREATED:
${previousFilesContext}

BUILD SESSION:
There are approximately ${remainingMinutes} minute(s) remaining in the current real build session.

YOUR JOB:

Actually build this stage.

Do not merely explain what should be built.

Create or modify real project files.

The application must be a functional browser-based web application.

Prefer a simple, reliable architecture that can run as a standalone web application.

Use HTML, CSS, and JavaScript where appropriate.

If the project requires multiple pages, create the necessary files.

If previous files already exist, preserve them and improve or extend them instead of unnecessarily replacing working functionality.

Create professional, organized, responsive interfaces.

Use realistic sample data when needed so the application can be previewed immediately.

Do not put BOMBA AI branding inside the generated application unless the user's request specifically asks for it.

Do not create fake progress functionality.

Do not claim that a file was created unless you actually provide that file in the response.

For this stage, return every file that was created or modified.

The response MUST be valid JSON only.

Use this exact structure:

{
  "stageName": "name of completed stage",
  "summary": "short explanation of what was actually built",
  "files": [
    {
      "path": "relative/path/to/file.html",
      "content": "complete file contents"
    }
  ]
}

IMPORTANT:

- Return complete file contents, not snippets.
- Every file must be usable as provided.
- Do not use markdown code fences.
- Do not return commentary outside the JSON.
- Do not return an empty files array unless the stage genuinely requires no file changes.
`;

    console.log(
      `[BOMBA BUILD] Starting stage ${stageNumber}/${totalStages}: ${stage.name}`
    );

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are BOMBA AI's real software build engine. Return only valid JSON and actually create the requested files.",
        },
        {
          role: "user",
          content: buildPrompt,
        },
      ],
    });

    const content =
      response.choices?.[0]?.message?.content;

    const buildResult = parseJsonFromAI(content);

    const newFiles = Array.isArray(buildResult.files)
      ? buildResult.files
      : [];

    if (newFiles.length === 0) {
      throw new Error(
        "The AI build engine completed the stage without returning any files."
      );
    }

    const mergedFiles = mergeProjectFiles(
      previousFiles,
      newFiles
    );

    const nextStage = currentStage + 1;
    const completed = nextStage >= totalStages;

    const updatedAt = getNow();

    let cooldownEndsAt = null;
    let nextStatus = "building";
    let isPaused = false;

    if (completed) {
      nextStatus = "completed";
    } else if (updatedAt >= sessionEndsAt) {
      cooldownEndsAt = addHours(
        updatedAt,
        COOLDOWN_HOURS
      );

      nextStatus = "paused";
      isPaused = true;
    }

    const updateData = {
      project_name:
        plan.projectName ||
        project.project_name ||
        "BOMBA Project",

      build_plan: stages,

      project_files: mergedFiles,

      current_stage: nextStage,

      total_stages: totalStages,

      status: nextStatus,

      build_session_started_at:
        sessionStartedAt.toISOString(),

      build_session_ends_at:
        sessionEndsAt.toISOString(),

      cooldown_ends_at: cooldownEndsAt
        ? cooldownEndsAt.toISOString()
        : null,

      is_paused: isPaused,

      is_completed: completed,

      updated_at: updatedAt.toISOString(),
    };

    const { data: updatedProject, error: updateError } =
      await supabase
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

    console.log(
      `[BOMBA BUILD] Completed stage ${stageNumber}/${totalStages}`
    );

    /*
     * IMPORTANT:
     * The browser receives build metadata, not the actual source code.
     * The generated files remain stored in Supabase.
     */

    return NextResponse.json({
      success: true,

      completed,

      stage: {
        number: stageNumber,
        name:
          buildResult.stageName ||
          stage.name ||
          `Stage ${stageNumber}`,
        summary:
          buildResult.summary ||
          stage.description ||
          "",
      },

      nextStage: completed
        ? null
        : nextStage + 1,

      totalStages,

      session: {
        startedAt:
          sessionStartedAt.toISOString(),
        endsAt:
          sessionEndsAt.toISOString(),
        remainingMinutes: Math.max(
          0,
          Math.ceil(
            (sessionEndsAt.getTime() -
              updatedAt.getTime()) /
              60000
          ),
        ),
      },

      project: {
        id: updatedProject.id,
        project_name:
          updatedProject.project_name,
        current_stage:
          updatedProject.current_stage,
        total_stages:
          updatedProject.total_stages,
        status:
          updatedProject.status,
        is_paused:
          updatedProject.is_paused,
        is_completed:
          updatedProject.is_completed,
        build_session_started_at:
          updatedProject.build_session_started_at,
        build_session_ends_at:
          updatedProject.build_session_ends_at,
        cooldown_ends_at:
          updatedProject.cooldown_ends_at,
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