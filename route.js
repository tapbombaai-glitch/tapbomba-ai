import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 180;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

    const plan = body?.plan || null;

    if (!projectId) {
      return NextResponse.json(
        {
          error: "Project ID is required.",
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

    // Verify the logged-in user.
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

    // Load the project belonging to this user.
    const { data: project, error: projectError } =
      await supabase
        .from("builder_projects")
        .select("*")
        .eq("id", projectId)
        .eq("owner_id", user.id)
        .single();

    if (projectError || !project) {
      return NextResponse.json(
        {
          error:
            "This project could not be found or does not belong to your account.",
        },
        { status: 404 }
      );
    }

    // Work out the build stages.
    const buildStages =
      Array.isArray(plan?.buildStages) &&
      plan.buildStages.length > 0
        ? plan.buildStages
        : [];

    const totalStages =
      buildStages.length > 0
        ? buildStages.length
        : Math.max(project.total_stages || 1, 1);

    const currentStage = Number(project.current_stage || 0);

    // Nothing left to build.
    if (currentStage >= totalStages) {
      return NextResponse.json({
        success: true,
        completed: true,
        message: "This project has already completed all available build stages.",
        project,
      });
    }

    // Start a three-minute build session if one is not active.
    const now = new Date();

    let sessionStartedAt = project.build_session_started_at
      ? new Date(project.build_session_started_at)
      : null;

    let sessionEndsAt = project.build_session_ends_at
      ? new Date(project.build_session_ends_at)
      : null;

    const activeSession =
      sessionStartedAt &&
      sessionEndsAt &&
      now < sessionEndsAt &&
      !project.is_paused;

    if (!activeSession) {
      // Check the ten-hour cooldown.
      if (project.cooldown_ends_at) {
        const cooldownEnds = new Date(
          project.cooldown_ends_at
        );

        if (now < cooldownEnds) {
          return NextResponse.json(
            {
              error:
                "This project is currently in its build cooldown.",
              cooldownEndsAt: cooldownEnds.toISOString(),
            },
            { status: 429 }
          );
        }
      }

      sessionStartedAt = now;

      sessionEndsAt = new Date(
        now.getTime() + 3 * 60 * 1000
      );
    }

    // Determine the stage we are building now.
    const stageNumber = currentStage + 1;

    const stage =
      buildStages.find(
        (item) => Number(item?.stage) === stageNumber
      ) ||
      buildStages[stageNumber - 1] ||
      {
        stage: stageNumber,
        name: `Application Stage ${stageNumber}`,
        description:
          "Build the next functional part of the application.",
      };

    const existingFiles = Array.isArray(project.project_files)
      ? project.project_files
      : [];

    const existingFilePaths = existingFiles
      .map((file) => file?.path)
      .filter(Boolean);

    // Ask the AI to build only the next stage.
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `
You are the BOMBA AI Build Engine.

You are building a real web application gradually.

IMPORTANT RULES:

1. Build ONLY the current stage.
2. Do not merely describe the stage.
3. Generate real usable application files.
4. Preserve the architecture of previous stages.
5. Do not delete existing functionality.
6. Make the generated application mobile-friendly.
7. Use HTML, CSS and JavaScript where appropriate.
8. The generated files must contain real working code.
9. Do not use Markdown code fences.
10. Return ONLY valid JSON.
11. Do not include explanations outside the JSON.
12. Do not add payment processing or credits.
13. Do not add fake payment functionality.
14. Keep the application independent from BOMBA AI branding unless the project specifically requests BOMBA AI branding.

Return exactly this structure:

{
  "stageName": "name of this stage",
  "summary": "short description",
  "files": [
    {
      "path": "index.html",
      "content": "complete file content"
    }
  ]
}

Each file must contain complete usable content.

If an existing file needs to be updated, return the complete replacement content for that file.
`,
        },
        {
          role: "user",
          content: `
ORIGINAL PROJECT REQUEST:

${originalRequest}

PROJECT PLAN:

${JSON.stringify(plan, null, 2)}

CURRENT BUILD STAGE:

Stage ${stageNumber} of ${totalStages}

Stage name:
${stage.name}

Stage description:
${stage.description}

FILES ALREADY CREATED:

${existingFilePaths.length > 0
  ? existingFilePaths.join("\n")
  : "No files have been created yet."}

Build ONLY this current stage.
`,
        },
      ],
    });

    const content =
      response.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        {
          error: "The AI did not return any build output.",
        },
        { status: 500 }
      );
    }

    let buildResult;

    try {
      buildResult = JSON.parse(content);
    } catch (error) {
      console.error("Build JSON error:", error);

      return NextResponse.json(
        {
          error: "The AI returned invalid build data.",
        },
        { status: 500 }
      );
    }

    if (
      !buildResult ||
      !Array.isArray(buildResult.files) ||
      buildResult.files.length === 0
    ) {
      return NextResponse.json(
        {
          error: "The AI did not generate usable project files.",
        },
        { status: 500 }
      );
    }

    // Merge the newly generated files with existing project files.
    const fileMap = new Map();

    for (const file of existingFiles) {
      if (file?.path) {
        fileMap.set(file.path, file);
      }
    }

    for (const file of buildResult.files) {
      if (
        file &&
        typeof file.path === "string" &&
        typeof file.content === "string"
      ) {
        fileMap.set(file.path, {
          path: file.path,
          content: file.content,
          stage: stageNumber,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    const updatedFiles = Array.from(fileMap.values());

    const nextStage = stageNumber;
    const completed = nextStage >= totalStages;

    // If the three-minute session has expired after this build,
    // prepare the ten-hour cooldown.
    const currentTime = new Date();

    let finalSessionEndsAt = sessionEndsAt;
    let cooldownEndsAt = project.cooldown_ends_at;

    if (currentTime >= sessionEndsAt) {
      cooldownEndsAt = new Date(
        currentTime.getTime() + 10 * 60 * 60 * 1000
      );
    }

    const { data: updatedProject, error: updateError } =
      await supabase
        .from("builder_projects")
        .update({
          build_plan: plan || project.build_plan || [],
          project_files: updatedFiles,
          current_stage: nextStage,
          total_stages: totalStages,
          status: completed ? "completed" : "building",
          build_session_started_at:
            sessionStartedAt.toISOString(),
          build_session_ends_at:
            finalSessionEndsAt.toISOString(),
          cooldown_ends_at: cooldownEndsAt
            ? new Date(cooldownEndsAt).toISOString()
            : null,
          is_paused: false,
          is_completed: completed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId)
        .eq("owner_id", user.id)
        .select()
        .single();

    if (updateError) {
      console.error("Build project update error:", updateError);

      return NextResponse.json(
        {
          error:
            updateError.message ||
            "The build was generated but could not be saved.",
        },
        { status: 500 }
      );
    }

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
      files: buildResult.files,
      project: updatedProject,
      message: completed
        ? "Your application has completed all build stages."
        : `Stage ${stageNumber} completed successfully.`,
    });
  } catch (error) {
    console.error("BOMBA Build Engine error:", error);

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