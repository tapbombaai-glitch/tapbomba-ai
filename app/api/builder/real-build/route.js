import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 180;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function cleanJson(text) {
  if (!text || typeof text !== "string") return "";

  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseAIJson(text) {
  const cleaned = cleanJson(text);

  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }

    throw new Error("BOMBA AI returned invalid build data.");
  }
}

function normalizeFiles(files) {
  if (!Array.isArray(files)) return [];

  return files
    .filter(
      (file) =>
        file &&
        typeof file.path === "string" &&
        typeof file.content === "string"
    )
    .map((file) => ({
      path: file.path,
      content: file.content,
    }));
}

function mergeFiles(existingFiles, newFiles) {
  const map = new Map();

  for (const file of existingFiles) {
    if (file?.path) {
      map.set(file.path, {
        path: file.path,
        content: file.content || "",
      });
    }
  }

  for (const file of newFiles) {
    if (file?.path) {
      map.set(file.path, {
        path: file.path,
        content: file.content || "",
      });
    }
  }

  return Array.from(map.values());
}

export async function POST(req) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY is not configured.",
        },
        { status: 500 }
      );
    }

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          error:
            "Supabase environment variables are not configured.",
        },
        { status: 500 }
      );
    }

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

    const authHeader =
      req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          error: "Please log in before building.",
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
          error:
            "Your login session could not be verified.",
        },
        { status: 401 }
      );
    }

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
      return NextResponse.json(
        {
          error:
            "Project not found or you do not have access to it.",
        },
        { status: 404 }
      );
    }

    const buildPlan = Array.isArray(project.build_plan)
      ? project.build_plan
      : [];

    if (buildPlan.length === 0) {
      return NextResponse.json(
        {
          error:
            "This project does not have a build plan yet.",
        },
        { status: 400 }
      );
    }

    const currentStage =
      Number(project.current_stage) || 0;

    if (currentStage >= buildPlan.length) {
      return NextResponse.json({
        success: true,
        project: {
          ...project,
          project_files: Array.isArray(project.project_files)
            ? project.project_files
            : [],
          current_stage: buildPlan.length,
          total_stages: buildPlan.length,
          status: "completed",
          is_completed: true,
        },
        message:
          "BOMBA AI has completed all build stages.",
      });
    }

    const stage = buildPlan[currentStage];

    const existingFiles = Array.isArray(
      project.project_files
    )
      ? project.project_files
      : [];

    const systemPrompt = `
You are BOMBA AI's REAL SOFTWARE BUILD ENGINE.

You are not a planning assistant.

You are actually implementing the user's application.

You must work on ONE build stage at a time.

Return ONLY valid JSON.

Your response must use exactly this structure:

{
  "project_name": "string",
  "files": [
    {
      "path": "string",
      "content": "complete file content"
    }
  ],
  "summary": "short description of what was implemented"
}

IMPORTANT RULES:

1. Actually create or update application files.
2. Return complete file contents.
3. Never return placeholders such as "add code here".
4. Never return explanations outside the JSON.
5. Preserve existing functionality from previous stages.
6. If a file already exists, return its COMPLETE updated content.
7. Do not delete working functionality unless the current stage specifically requires it.
8. Build a real functional browser application.
9. Make the UI professional, responsive and mobile-friendly.
10. Use clean HTML, CSS and JavaScript where appropriate.
11. If the project is a Next.js application, use appropriate Next.js files.
12. Do not create fake build progress.
13. Do not merely describe what should be built.
14. The files returned must be usable as actual project files.
15. Improve the application intelligently while staying faithful to the user's request.

This is stage ${currentStage + 1} of ${buildPlan.length}.
`;

    const userPrompt = `
ORIGINAL USER REQUEST:

${project.original_request}

CURRENT BUILD STAGE:

Stage: ${stage?.stage || currentStage + 1}
Name: ${stage?.name || "Build stage"}
Description: ${
      stage?.description ||
      "Implement the next part of the application."
    }

EXISTING PROJECT FILES:

${JSON.stringify(existingFiles)}

Build ONLY the current stage, while preserving everything already implemented.

Return the complete updated files needed for this stage.
`;

    let aiResponse;

    try {
      aiResponse =
        await openai.chat.completions.create({
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
              content: userPrompt,
            },
          ],
        });
    } catch (error) {
      console.error(
        "Real Build OpenAI error:",
        error
      );

      return NextResponse.json(
        {
          error:
            error?.message ||
            "BOMBA AI could not execute the build stage.",
        },
        { status: 500 }
      );
    }

    const rawContent =
      aiResponse?.choices?.[0]?.message?.content;

    let buildResult;

    try {
      buildResult = parseAIJson(rawContent);
    } catch (error) {
      console.error(
        "Real Build JSON error:",
        error
      );

      return NextResponse.json(
        {
          error:
            error?.message ||
            "BOMBA AI returned invalid project files.",
        },
        { status: 500 }
      );
    }

    const newFiles = normalizeFiles(
      buildResult?.files
    );

    if (newFiles.length === 0) {
      return NextResponse.json(
        {
          error:
            "BOMBA AI completed the stage but returned no project files.",
        },
        { status: 500 }
      );
    }

    const updatedFiles = mergeFiles(
      existingFiles,
      newFiles
    );

    const nextStage =
      currentStage + 1;

    const completed =
      nextStage >= buildPlan.length;

    const projectName =
      typeof buildResult?.project_name === "string" &&
      buildResult.project_name.trim()
        ? buildResult.project_name.trim()
        : project.project_name;

    const {
      data: savedProject,
      error: saveError,
    } = await supabase
      .from("builder_projects")
      .update({
        project_name: projectName,
        project_files: updatedFiles,
        current_stage: nextStage,
        total_stages: buildPlan.length,
        status: completed
          ? "completed"
          : "building",
        is_completed: completed,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", project.id)
      .eq("owner_id", user.id)
      .select("*")
      .single();

    if (saveError) {
      console.error(
        "Real Build save error:",
        saveError
      );

      return NextResponse.json(
        {
          error:
            "BOMBA AI built the stage but could not save the updated project.",
          details: saveError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,

      project: savedProject,

      projectId: savedProject.id,

      projectName:
        savedProject.project_name,

      project_files:
        savedProject.project_files,

      current_stage:
        savedProject.current_stage,

      total_stages:
        savedProject.total_stages,

      status:
        savedProject.status,

      is_completed:
        savedProject.is_completed,

      stage: {
        number: currentStage + 1,
        name: stage?.name || "",
        description:
          stage?.description || "",
      },

      summary:
        buildResult?.summary ||
        `Stage ${currentStage + 1} was implemented successfully.`,

      message: completed
        ? "BOMBA AI completed the project."
        : `BOMBA AI completed build stage ${currentStage + 1} of ${buildPlan.length}.`,
    });
  } catch (error) {
    console.error(
      "BOMBA Real Build error:",
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