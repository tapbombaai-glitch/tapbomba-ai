import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    const systemPrompt = `
You are BOMBA AI's Universal App Builder planning engine.

Your job is to understand the user's latest app-building request and create a clear, practical build plan.

IMPORTANT RULES:
- Focus ONLY on the user's latest request.
- Do not reuse unrelated previous projects.
- Do not invent unrelated features.
- The plan must be suitable for building a real browser prototype.
- Keep the plan practical and organized.
- The app should work well on mobile and desktop.
- Use Nigerian context and Nigerian Naira (₦) when money is relevant.
- Return ONLY valid JSON.
- Do not use Markdown.
- Do not put JSON inside code fences.

Return exactly this structure:

{
  "projectName": "string",
  "summary": "string",
  "goal": "string",
  "features": ["string"],
  "pages": ["string"],
  "userRoles": ["string"],
  "buildStages": [
    {
      "stage": 1,
      "name": "string",
      "description": "string"
    }
  ]
}

Create between 4 and 8 build stages.

Each build stage must represent a meaningful part of the actual application that can be built progressively.
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
          content: originalRequest,
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        {
          error: "BOMBA AI could not create the project plan.",
        },
        { status: 500 }
      );
    }

    let plan;

    try {
      plan = JSON.parse(content);
    } catch (parseError) {
      console.error("Builder plan JSON error:", parseError);

      return NextResponse.json(
        {
          error: "BOMBA AI returned an invalid project plan.",
        },
        { status: 500 }
      );
    }

    if (!Array.isArray(plan.buildStages)) {
      plan.buildStages = [];
    }

    if (!Array.isArray(plan.features)) {
      plan.features = [];
    }

    if (!Array.isArray(plan.pages)) {
      plan.pages = [];
    }

    if (!Array.isArray(plan.userRoles)) {
      plan.userRoles = [];
    }

    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (error) {
    console.error("Builder plan API error:", error);

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