import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const body = await req.json();

    const originalRequest =
      typeof body?.originalRequest === "string"
        ? body.originalRequest.trim()
        : "";

    if (!originalRequest) {
      return NextResponse.json(
        {
          error: "Please describe what you want to build.",
        },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `
You are the AI Planning Engine for BOMBA AI.

Your job is to turn a user's app idea into a clear, practical software project plan.

Do not build the application yet.
Do not write code yet.

Create a structured plan that another AI building engine can later use to build the application.

Return ONLY valid JSON.

The JSON must have this structure:

{
  "projectName": "short project name",
  "summary": "short description",
  "goal": "main purpose of the application",
  "features": [
    {
      "name": "feature name",
      "description": "what the feature does"
    }
  ],
  "pages": [
    {
      "name": "page name",
      "purpose": "what the page is for"
    }
  ],
  "userRoles": [
    {
      "name": "role name",
      "description": "what this role can do"
    }
  ],
  "buildStages": [
    {
      "stage": 1,
      "name": "stage name",
      "description": "what will be built"
    }
  ]
}

Keep the plan practical and suitable for a real web application.

Break large applications into reasonable build stages.
`,
        },
        {
          role: "user",
          content: originalRequest,
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        {
          error: "The AI did not return a project plan.",
        },
        { status: 500 }
      );
    }

    let plan;

    try {
      plan = JSON.parse(content);
    } catch (error) {
      console.error("Planner JSON error:", error);

      return NextResponse.json(
        {
          error: "The AI returned an invalid project plan.",
          raw: content,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (error) {
    console.error("Builder planning error:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Something went wrong while creating the project plan.",
      },
      { status: 500 }
    );
  }
}