import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
          error: "OpenAI API key is not configured.",
        },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          error: "Please log in before using Ask BOMBA AI.",
        },
        { status: 401 }
      );
    }

    const body = await req.json();

    const projectId =
      typeof body?.projectId === "string"
        ? body.projectId.trim()
        : "";

    const question =
      typeof body?.question === "string"
        ? body.question.trim()
        : "";

    const project = body?.project || null;
    const plan = body?.plan || null;

    if (!projectId) {
      return NextResponse.json(
        {
          error: "A project ID is required.",
        },
        { status: 400 }
      );
    }

    if (!question) {
      return NextResponse.json(
        {
          error: "Please enter a question or instruction.",
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

    const { data: savedProject, error: projectError } =
      await supabase
        .from("builder_projects")
        .select(
          "id, project_name, original_request, current_stage, total_stages, status, is_paused, is_completed"
        )
        .eq("id", projectId)
        .eq("owner_id", user.id)
        .single();

    if (projectError || !savedProject) {
      console.error(
        "Ask project lookup error:",
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

    const currentStage = Number(
      savedProject.current_stage || 0
    );

    const totalStages = Number(
      savedProject.total_stages || 0
    );

    const prompt = `
You are ASK BOMBA AI inside the BOMBA AI Universal Builder.

You are a project-aware AI assistant.

The user is currently working on this project:

PROJECT NAME:
${savedProject.project_name || "BOMBA Project"}

ORIGINAL REQUEST:
${savedProject.original_request || ""}

CURRENT BUILD STAGE:
${currentStage} of ${totalStages || "unknown"}

PROJECT STATUS:
${savedProject.status || "unknown"}

PAUSED:
${savedProject.is_paused ? "yes" : "no"}

COMPLETED:
${savedProject.is_completed ? "yes" : "no"}

PROJECT PLAN:
${JSON.stringify(plan || {}, null, 2)}

PROJECT INFORMATION FROM THE CLIENT:
${JSON.stringify(project || {}, null, 2)}

USER'S QUESTION OR INSTRUCTION:
${question}

IMPORTANT RULES:

1. Answer the user's question using the current project context.

2. Be practical and concise.

3. If the user asks what has been built, use the actual current stage information.

4. If the user asks what should happen next, explain the next logical build stage based on the plan.

5. If the user suggests a new feature or change, understand it and explain how it could fit into the project.

6. Do NOT claim that you modified files.

7. Do NOT claim that you built anything.

8. Do NOT pretend to have run commands.

9. Do NOT invent completed work.

10. Ask BOMBA AI is an assistant for the project. Actual file creation remains the responsibility of the real BUILD engine.

11. If the user asks to make a change, clearly say that the requested change can be handled by the Builder's actual build process.

12. Keep the answer easy to understand for a Nigerian/African business owner.

13. Use ₦ when discussing Nigerian money.

Return ONLY the answer text.
`;

    const response =
      await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are Ask BOMBA AI. Answer accurately using only the supplied project context.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

    const answer =
      response.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return NextResponse.json(
        {
          error:
            "BOMBA AI did not return an answer.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      answer,
      project: {
        id: savedProject.id,
        currentStage,
        totalStages,
        status: savedProject.status,
        isPaused: savedProject.is_paused,
        isCompleted: savedProject.is_completed,
      },
    });
  } catch (error) {
    console.error(
      "BOMBA Ask Engine error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Something went wrong while asking BOMBA AI.",
      },
      { status: 500 }
    );
  }
}