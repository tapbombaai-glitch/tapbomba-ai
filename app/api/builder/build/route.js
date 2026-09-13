import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 180;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */

function cleanJsonText(text) {
  if (!text || typeof text !== "string") return "";

  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseJsonFromAI(text) {
  const cleaned = cleanJsonText(text);

  if (!cleaned) {
    throw new Error("AI returned an empty build plan.");
  }

  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (
      firstBrace !== -1 &&
      lastBrace !== -1 &&
      lastBrace > firstBrace
    ) {
      const extracted = cleaned.slice(
        firstBrace,
        lastBrace + 1
      );

      try {
        return JSON.parse(extracted);
      } catch (_) {
        throw new Error(
          "The AI returned an invalid build plan."
        );
      }
    }

    throw new Error(
      "The AI returned an invalid build plan."
    );
  }
}

function normalizeBuildPlan(rawPlan) {
  if (Array.isArray(rawPlan)) {
    return rawPlan;
  }

  if (
    rawPlan &&
    Array.isArray(rawPlan.buildStages)
  ) {
    return rawPlan.buildStages;
  }

  if (
    rawPlan &&
    Array.isArray(rawPlan.stages)
  ) {
    return rawPlan.stages;
  }

  if (
    rawPlan &&
    Array.isArray(rawPlan.plan)
  ) {
    return rawPlan.plan;
  }

  return [];
}

/* -------------------------------------------------------
   CREATE BUILD PLAN
------------------------------------------------------- */

export async function POST(req) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (
      !supabaseUrl ||
      !supabaseAnonKey
    ) {
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
            "OpenAI environment variable is not configured.",
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
          error:
            "A project ID is required to create the build plan.",
        },
        { status: 400 }
      );
    }

    /* ---------------------------------------------------
       AUTH
    --------------------------------------------------- */

    const authHeader =
      req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          error:
            "Please log in before creating a build plan.",
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
      console.error(
        "Builder project load error:",
        projectError
      );

      return NextResponse.json(
        {
          error:
            "Project not found or you do not have access to it.",
        },
        { status: 404 }
      );
    }

    /* ---------------------------------------------------
       EXISTING PLAN
    --------------------------------------------------- */

    const existingPlan =
      normalizeBuildPlan(
        project.build_plan
      );

    if (existingPlan.length > 0) {
      return NextResponse.json({
        success: true,
        projectId: project.id,
        projectName: project.project_name,
        buildPlan: existingPlan,
        build_plan: existingPlan,
        totalStages: existingPlan.length,
        total_stages: existingPlan.length,
        message:
          "The project already has a saved build plan.",
      });
    }

    /* ---------------------------------------------------
       OPTIONAL FRONTEND PLAN
    --------------------------------------------------- */

    let buildPlan = normalizeBuildPlan(
      body?.plan ||
        body?.buildPlan ||
        body?.build_plan
    );

    /* ---------------------------------------------------
       GENERATE PLAN WITH AI IF NEEDED
    --------------------------------------------------- */

    if (buildPlan.length === 0) {
      const originalRequest =
        typeof project.original_request ===
        "string"
          ? project.original_request.trim()
          : "";

      if (!originalRequest) {
        return NextResponse.json(
          {
            error:
              "This project does not contain an original build request.",
          },
          { status: 400 }
        );
      }

      const systemPrompt = `
You are BOMBA AI's software architecture and build planning engine.

Create a REAL multi-stage software build plan for the user's requested application.

The plan must describe actual implementation work.

Do not create fake waiting stages.

Do not create vague stages.

Each stage must contain:
- stage
- name
- description

The stages must progress logically from project foundation to a polished,
functional application.

The final stages should include testing, refinement, responsiveness,
and final integration where appropriate.

Return ONLY valid JSON.

Use exactly:

{
  "buildStages": [
    {
      "stage": 1,
      "name": "Stage name",
      "description": "Specific implementation work"
    }
  ]
}

Create between 6 and 10 meaningful stages.
`;

      const userPrompt = `
ORIGINAL USER REQUEST:

${originalRequest}

Create the complete real build plan now.
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
          "OpenAI build plan error:",
          error
        );

        return NextResponse.json(
          {
            error:
              error?.message ||
              "BOMBA AI could not create the build plan.",
          },
          { status: 500 }
        );
      }

      const rawContent =
        aiResponse?.choices?.[0]?.message?.content;

      let planResult;

      try {
        planResult =
          parseJsonFromAI(rawContent);
      } catch (error) {
        console.error(
          "Build plan JSON error:",
          error
        );

        return NextResponse.json(
          {
            error:
              error?.message ||
              "BOMBA AI returned an invalid build plan.",
          },
          { status: 500 }
        );
      }

      buildPlan =
        normalizeBuildPlan(planResult);
    }

    /* ---------------------------------------------------
       VALIDATE PLAN
    --------------------------------------------------- */

    if (buildPlan.length === 0) {
      return NextResponse.json(
        {
          error:
            "BOMBA AI did not create any build stages.",
        },
        { status: 500 }
      );
    }

    /* ---------------------------------------------------
       NORMALIZE STAGES
    --------------------------------------------------- */

    buildPlan = buildPlan.map(
      (stage, index) => ({
        stage:
          Number(stage?.stage) ||
          index + 1,

        name:
          typeof stage?.name ===
          "string"
            ? stage.name
            : `Build Stage ${index + 1}`,

        description:
          typeof stage?.description ===
          "string"
            ? stage.description
            : "Continue implementing the application.",
      })
    );

    const totalStages =
      buildPlan.length;

    /* ---------------------------------------------------
       SAVE PLAN TO builder_projects
    --------------------------------------------------- */

    const {
      data: savedProject,
      error: saveError,
    } = await supabase
      .from("builder_projects")
      .update({
        build_plan: buildPlan,
        total_stages: totalStages,
        current_stage: 0,
        status: "planned",
        is_paused: false,
        is_completed: false,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", project.id)
      .eq("owner_id", user.id)
      .select("*")
      .single();

    if (saveError) {
      console.error(
        "Build plan save error:",
        saveError
      );

      return NextResponse.json(
        {
          error:
            "The build plan was created but could not be saved.",
          details: saveError.message,
        },
        { status: 500 }
      );
    }

    /* ---------------------------------------------------
       SUCCESS
    --------------------------------------------------- */

    return NextResponse.json({
      success: true,

      projectId:
        savedProject.id,

      projectName:
        savedProject.project_name,

      buildPlan:
        savedProject.build_plan,

      build_plan:
        savedProject.build_plan,

      totalStages:
        savedProject.total_stages,

      total_stages:
        savedProject.total_stages,

      currentStage:
        savedProject.current_stage,

      status:
        savedProject.status,

      message:
        `BOMBA AI created and saved ${totalStages} real build stages.`,
    });
  } catch (error) {
    console.error(
      "BOMBA Builder Plan error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Something went wrong while creating the build plan.",
      },
      { status: 500 }
    );
  }
}