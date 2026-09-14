import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase environment variables are not configured." },
        { status: 500 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured." },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Please log in before building." },
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
        { error: "Your login session could not be verified." },
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

    if (!projectId || !originalRequest || !plan) {
      return NextResponse.json(
        { error: "Missing build data." },
        { status: 400 }
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
      console.error("Builder project lookup error:", projectError);

      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    const stages = Array.isArray(plan.buildStages)
      ? plan.buildStages
      : [];

    const nextStage =
      Number(project.current_stage || 0) + 1;

    const stage = stages[nextStage - 1];

    if (!stage) {
      return NextResponse.json({
        success: true,
        project,
        stage: nextStage,
        files: project.project_files || [],
        completed: true,
      });
    }

    const existingFiles = Array.isArray(
      project.project_files
    )
      ? project.project_files
      : [];

    const existingFilesForAI = existingFiles
      .map((file) => ({
        path: file?.path || "",
        content:
          typeof file?.content === "string"
            ? file.content
            : "",
      }))
      .filter((file) => file.path);

    const previousSummary =
      existingFiles.length > 0
        ? existingFiles
            .map((file) => file?.path)
            .filter(Boolean)
            .join(", ")
        : "No files have been generated yet.";

    const systemPrompt = `
You are BOMBA AI's production browser-application build engine.

You are building a REAL FUNCTIONAL BROWSER PROTOTYPE from a user's application request.

IMPORTANT:

1. Build ONLY the user's current project.
2. Do not reuse unrelated projects.
3. Do not mention BOMBA AI inside the generated application unless the user explicitly requests it.
4. Do not create a static mockup.
5. The generated application must contain real HTML, CSS and JavaScript.
6. Buttons must actually perform actions.
7. Forms must actually work.
8. Navigation must actually work.
9. Search and filtering must actually work when relevant.
10. Calculations must actually work when relevant.
11. Use localStorage when browser persistence is useful.
12. Make the application responsive on mobile and desktop.
13. Use professional UI and clear visual hierarchy.
14. Use Nigerian context and ₦ when money is relevant.
15. Never intentionally destroy functionality from previous stages.
16. Continue and improve the existing application.
17. Keep the application self-contained so index.html can run directly in a browser.
18. Do not depend on React, Next.js, npm packages, external build systems, or server APIs.
19. Use HTML, CSS and vanilla JavaScript inside the generated files.
20. If an existing index.html already exists, improve it rather than replacing working functionality with a completely unrelated page.
21. Preserve important existing features while adding the current stage.
22. Make the final result usable as a browser prototype, not merely visually attractive.

BUILD STRATEGY:

The project is being built progressively.

Each stage must add meaningful functionality.

Stage 1 should establish the application foundation.

Later stages should expand the same application.

The final stage should leave the application in a polished, functional state.

The application should have realistic sample data when appropriate so the user can immediately test it.

For business applications, include realistic interactions such as:
- navigation
- dashboards
- forms
- tables
- search
- filters
- actions
- status changes
- calculations
- notifications
- local persistence

For commerce applications, include realistic flows such as:
- catalogue
- product details
- cart
- checkout
- order handling
- totals

For management systems, include realistic flows such as:
- records
- creation
- editing
- deletion
- searching
- filtering
- dashboards
- reports

Do not claim a feature works unless the generated JavaScript actually implements it.

OUTPUT RULE:

Return ONLY valid JSON.

Use exactly this structure:

{
  "files": [
    {
      "path": "index.html",
      "content": "complete file content"
    }
  ],
  "summary": "short description of what this stage added"
}

The main browser entry file MUST be:

index.html

If additional files are genuinely useful, they may be included, but index.html must remain self-contained and functional.

Do not use Markdown code fences.

Do not return explanations outside the JSON.
`;

    const userPrompt = `
CURRENT PROJECT REQUEST:

${originalRequest}

PROJECT PLAN:

${JSON.stringify(plan)}

CURRENT BUILD STAGE:

Stage ${nextStage} of ${stages.length}

Stage name:
${stage.name}

Stage description:
${stage.description}

FILES ALREADY GENERATED:

${previousSummary}

CURRENT PROJECT FILE CONTENT:

${JSON.stringify(existingFilesForAI)}

YOUR TASK:

Build this stage as part of the SAME application.

If index.html already exists, continue improving it.

Do not create a separate unrelated application.

Make the current stage functional and integrate it with the previous functionality.

The final result must be capable of running directly inside a browser iframe using index.html.
`;

    const response =
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

    const content =
      response.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        {
          error:
            "BOMBA AI could not generate this build stage.",
        },
        { status: 500 }
      );
    }

    let result;

    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error(
        "Builder JSON parse error:",
        parseError
      );

      return NextResponse.json(
        {
          error:
            "BOMBA AI returned invalid build data.",
        },
        { status: 500 }
      );
    }

    const newFiles = Array.isArray(result.files)
      ? result.files
      : [];

    const validFiles = newFiles.filter(
      (file) =>
        file &&
        typeof file.path === "string" &&
        file.path.trim() &&
        typeof file.content === "string"
    );

    if (validFiles.length === 0) {
      return NextResponse.json(
        {
          error:
            "BOMBA AI did not generate valid project files.",
        },
        { status: 500 }
      );
    }

    const files = [...existingFiles];

    for (const file of validFiles) {
      const cleanPath = file.path.trim();

      const normalizedFile = {
        path: cleanPath,
        content: file.content,
      };

      const index = files.findIndex(
        (item) =>
          item?.path === cleanPath
      );

      if (index >= 0) {
        files[index] = normalizedFile;
      } else {
        files.push(normalizedFile);
      }
    }

    const completed =
      nextStage >= stages.length;

    const { data: updated, error: updateError } =
      await supabase
        .from("builder_projects")
        .update({
          project_name:
            plan.projectName ||
            project.project_name ||
            "BOMBA Project",

          build_plan: plan,

          project_files: files,

          current_stage: nextStage,

          total_stages: stages.length,

          status: completed
            ? "completed"
            : "building",

          is_completed: completed,

          is_paused: false,
        })
        .eq("id", projectId)
        .eq("owner_id", user.id)
        .select()
        .single();

    if (updateError) {
      console.error(
        "Builder project update error:",
        updateError
      );

      throw updateError;
    }

    return NextResponse.json({
      success: true,

      project: updated,

      stage: nextStage,

      files: validFiles,

      completed,

      summary:
        typeof result.summary === "string"
          ? result.summary
          : `Stage ${nextStage} completed.`,
    });
  } catch (error) {
    console.error(
      "Builder build error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Build failed.",
      },
      { status: 500 }
    );
  }
}