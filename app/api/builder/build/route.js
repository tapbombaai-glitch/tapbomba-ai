import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OpenAI API key is not configured.",
        },
        { status: 500 }
      );
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          error: "Supabase environment variables are not configured.",
        },
        { status: 500 }
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
          error: "Builder project ID is required.",
        },
        { status: 400 }
      );
    }

    if (!originalRequest) {
      return NextResponse.json(
        {
          error: "Original project request is required.",
        },
        { status: 400 }
      );
    }

    if (!plan) {
      return NextResponse.json(
        {
          error: "Project plan is required before building.",
        },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          error: "Please log in before building the project.",
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
          error: "Builder project could not be found.",
        },
        { status: 404 }
      );
    }

    const buildStages = Array.isArray(plan.buildStages)
      ? plan.buildStages
      : [];

    if (buildStages.length === 0) {
      return NextResponse.json(
        {
          error: "The project plan does not contain any build stages.",
        },
        { status: 400 }
      );
    }

    const currentStage = Number(project.current_stage || 0);

    const requestedStage =
      typeof body?.requestedStage === "number"
        ? body.requestedStage
        : currentStage + 1;

    const stageNumber = Math.max(
      1,
      Math.min(requestedStage, buildStages.length)
    );

    const stage =
      buildStages.find(
        (item) => Number(item?.stage) === stageNumber
      ) || buildStages[stageNumber - 1];

    if (!stage) {
      return NextResponse.json(
        {
          error: "The requested build stage could not be found.",
        },
        { status: 400 }
      );
    }

    if (project.is_completed === true) {
      return NextResponse.json({
        success: true,
        project,
        stage: {
          number: stageNumber,
          name: stage?.name || "Completed",
          description: stage?.description || "",
        },
        message: "This project has already been completed.",
      });
    }

    const existingFiles = Array.isArray(project.project_files)
      ? project.project_files
      : [];

    const previousStageFiles = existingFiles.filter(
      (file) => Number(file?.stage || 0) < stageNumber
    );

    const systemPrompt = `
You are BOMBA AI's REAL BUILD ENGINE.

You are not creating a plan.
You are now building the next actual stage of a browser application.

IMPORTANT RULES:

1. Build ONLY the requested user's latest project.
2. Build ONLY the current stage.
3. Do not replace unrelated previous work.
4. Preserve previously generated files.
5. Return valid JSON only.
6. Do not use Markdown.
7. The result must contain actual usable browser code.
8. The application must be mobile-friendly.
9. Use HTML, CSS and JavaScript for the browser prototype.
10. Do not include BOMBA AI branding inside the generated application unless the user specifically requested it.
11. Do not create fake placeholder descriptions instead of code.
12. Every generated file must have real source code.
13. Keep the project simple enough to build progressively.

The user requested:

${originalRequest}

PROJECT PLAN:

${JSON.stringify(plan)}

CURRENT BUILD STAGE:

${JSON.stringify(stage)}

PREVIOUS FILES:

${JSON.stringify(previousStageFiles)}

Return exactly this JSON structure:

{
  "stage": 1,
  "stageName": "string",
  "summary": "string",
  "files": [
    {
      "path": "index.html",
      "content": "complete file content"
    }
  ]
}

For stage 1, create the foundation of the actual browser prototype.

Include an index.html file whenever appropriate.

CSS and JavaScript may be placed inside index.html for the first prototype so the result can immediately run in a browser.

Do not return empty files.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
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
          content: `Build stage ${stageNumber}: ${stage?.name || ""}

${stage?.description || ""}`,
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        {
          error: "BOMBA AI did not return build content.",
        },
        { status: 500 }
      );
    }

    let buildResult;

    try {
      buildResult = JSON.parse(content);
    } catch (parseError) {
      console.error("Builder build JSON error:", parseError);

      return NextResponse.json(
        {
          error: "BOMBA AI returned invalid build data.",
        },
        { status: 500 }
      );
    }

    const generatedFiles = Array.isArray(buildResult.files)
      ? buildResult.files.filter(
          (file) =>
            file &&
            typeof file.path === "string" &&
            typeof file.content === "string"
        )
      : [];

    if (generatedFiles.length === 0) {
      return NextResponse.json(
        {
          error: "BOMBA AI did not generate any project files.",
        },
        { status: 500 }
      );
    }

    const filesByPath = new Map();

    for (const file of existingFiles) {
      if (
        file &&
        typeof file.path === "string" &&
        typeof file.content === "string"
      ) {
        filesByPath.set(file.path, file);
      }
    }

    for (const file of generatedFiles) {
      filesByPath.set(file.path, {
        path: file.path,
        content: file.content,
        stage: stageNumber,
      });
    }

    const updatedFiles = Array.from(filesByPath.values());

    const totalStages = buildStages.length;

    const completed =
      stageNumber >= totalStages;

    const nextProject = {
      ...project,
      project_files: updatedFiles,
      current_stage: stageNumber,
      total_stages: totalStages,
      build_plan: plan.buildStages,
      project_name:
        project.project_name !== "New BOMBA Project"
          ? project.project_name
          : plan.projectName || "BOMBA Project",
      status: completed ? "completed" : "building",
      is_completed: completed,
      is_paused: false,
    };

    const { data: updatedProject, error: updateError } =
      await supabase
        .from("builder_projects")
        .update({
          project_files: updatedFiles,
          current_stage: stageNumber,
          total_stages: totalStages,
          build_plan: plan.buildStages,
          project_name:
            project.project_name !== "New BOMBA Project"
              ? project.project_name
              : plan.projectName || "BOMBA Project",
          status: completed ? "completed" : "building",
          is_completed: completed,
          is_paused: false,
        })
        .eq("id", projectId)
        .eq("owner_id", user.id)
        .select()
        .single();

    if (updateError || !updatedProject) {
      console.error(
        "Builder project update error:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            updateError?.message ||
            "BOMBA AI built the stage but could not save the updated project.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      project: updatedProject,
      stage: {
        number: stageNumber,
        name:
          buildResult.stageName ||
          stage?.name ||
          `Build Stage ${stageNumber}`,
        summary:
          buildResult.summary ||
          stage?.description ||
          "Build stage completed.",
      },
      files: generatedFiles,
      completed,
    });
  } catch (error) {
    console.error("Builder build API error:", error);

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