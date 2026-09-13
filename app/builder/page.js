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
          error: "Please log in before using ASK BOMBA AI.",
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

    /*
      ASK BOMBA AI works in two modes:

      1. GENERAL MODE
         The user simply asks BOMBA a question.
         No Builder project is required.

      2. PROJECT MODE
         If a projectId exists, BOMBA uses the user's
         saved Builder project as additional context.
    */

    let savedProject = null;

    if (projectId) {
      const { data, error: projectError } =
        await supabase
          .from("builder_projects")
          .select(
            "id, project_name, original_request, current_stage, total_stages, status, is_paused, is_completed, build_plan"
          )
          .eq("id", projectId)
          .eq("owner_id", user.id)
          .maybeSingle();

      if (projectError) {
        console.error(
          "ASK BOMBA project lookup error:",
          projectError
        );

        return NextResponse.json(
          {
            error:
              "BOMBA AI could not load the project context.",
          },
          { status: 500 }
        );
      }

      if (data) {
        savedProject = data;
      }
    }

    const currentStage = savedProject
      ? Number(savedProject.current_stage || 0)
      : 0;

    const totalStages = savedProject
      ? Number(savedProject.total_stages || 0)
      : 0;

    const projectContext = savedProject
      ? `
CURRENT BUILDER PROJECT

Project name:
${savedProject.project_name || "BOMBA Project"}

Original request:
${savedProject.original_request || ""}

Current build stage:
${currentStage} of ${totalStages || "unknown"}

Status:
${savedProject.status || "unknown"}

Paused:
${savedProject.is_paused ? "yes" : "no"}

Completed:
${savedProject.is_completed ? "yes" : "no"}

Saved build plan:
${JSON.stringify(
  savedProject.build_plan || plan || {},
  null,
  2
)}
`
      : `
NO BUILDER PROJECT IS REQUIRED FOR THIS QUESTION.

Treat this as a general ASK BOMBA AI conversation.
`;

    const prompt = `
You are ASK BOMBA AI, the general intelligent assistant inside BOMBA AI.

BOMBA AI is a universal AI creation platform.

Your job is to understand what the user actually wants and provide the most useful response.

You are NOT only a Builder assistant.

The user may ask you about:

- general questions
- business
- entrepreneurship
- marketing
- sales
- content creation
- social media
- websites
- web applications
- mobile applications
- logos
- flyers
- images
- branding
- coding
- software errors
- product ideas
- business plans
- Nigerian/African businesses
- horticulture and plants
- school systems
- e-commerce
- restaurants
- fashion
- real estate
- technology
- education
- or almost anything else

If the user asks BOMBA to create something, understand the request and explain the best next action.

If the user asks BOMBA to build a website, do not assume it is a shoe website.

The website could be for ANY legitimate business, organization, service, product, or idea.

Examples include:

- shoe store
- restaurant
- school
- pharmacy
- hotel
- barber
- supermarket
- real estate
- church
- plant business
- logistics company
- fashion brand
- technology company
- personal portfolio
- or something completely different.

Adapt your response to the user's actual request.

IMPORTANT:

1. Do not require a Builder project for normal questions.

2. If a Builder project exists, use its context when it is relevant.

3. If no Builder project exists, answer normally.

4. Never invent a project.

5. Never claim that files were changed unless the actual Builder engine has done that work.

6. Never claim that a website, app, logo, flyer, or other creation has already been generated unless the relevant generation system actually generated it.

7. If the user asks a normal question, answer the question directly.

8. If the user asks for business help, give practical advice.

9. If the user asks for content, make it ready to use.

10. If the user asks for code, provide useful code or explain the correct implementation.

11. If the user asks about an existing Builder project, use the supplied project information.

12. If the user asks what has actually been built, use only the saved project information.

13. Do not confuse an example with the user's actual request.

14. Understand the latest request clearly and do not carry unrelated old requests into the answer.

15. Use Nigerian context and ₦ when Nigerian money is relevant.

16. Keep answers clear and useful rather than unnecessarily long.

17. If the user asks you to build something that requires the actual Builder or another BOMBA creation engine, explain what should be built and that the appropriate creation engine should perform the actual generation. Do not pretend that this ASK endpoint itself has edited files.

18. ASK BOMBA AI should feel like the intelligence behind the whole BOMBA platform.

${projectContext}

CLIENT-SIDE PROJECT INFORMATION:
${JSON.stringify(project || {}, null, 2)}

USER'S LATEST QUESTION OR INSTRUCTION:
${question}

Return ONLY the answer text.
`;

    const response =
      await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You are ASK BOMBA AI, a capable general-purpose AI assistant inside BOMBA AI. Always respond to the user's latest request using only relevant context.",
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
      mode: savedProject
        ? "project"
        : "general",
      project: savedProject
        ? {
            id: savedProject.id,
            currentStage,
            totalStages,
            status: savedProject.status,
            isPaused: savedProject.is_paused,
            isCompleted: savedProject.is_completed,
          }
        : null,
    });
  } catch (error) {
    console.error(
      "BOMBA ASK Engine error:",
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