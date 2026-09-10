// app/api/chat/route.ts

import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not set" },
        { status: 500 }
      );
    }

    const body = await req.json();

    let input: string;

    // Use ONLY the latest user request.
    // This prevents unrelated older requests from being carried
    // into a new task.
    if (typeof body.message === "string") {
      input = body.message.trim();
    } else if (Array.isArray(body.messages) && body.messages.length > 0) {
      const latestUserMessage = [...body.messages]
        .reverse()
        .find(
          (m: any) =>
            m?.role === "user" &&
            typeof m?.content === "string" &&
            m.content.trim()
        );

      input = latestUserMessage?.content?.trim() || "";
    } else {
      return NextResponse.json(
        {
          error:
            'Please send either { message: string } or { messages: array }',
        },
        { status: 400 }
      );
    }

    if (!input) {
      return NextResponse.json(
        { error: "Please enter a message." },
        { status: 400 }
      );
    }

    const response = await openai.responses.create({
      model: "gpt-4o-mini",

      instructions: `
You are BOMBA AI — a practical and intelligent AI assistant.

Your main job is to understand and respond to the user's LATEST request.

IMPORTANT:
- Treat the latest request as the current task.
- Do not unnecessarily continue an older task.
- Do not copy unrelated information from previous requests.
- Do not automatically reuse old logos, designs, app ideas, product names,
  code, features, or instructions.
- Only use older information when the latest request clearly depends on it.
- If the user starts a completely new task, start fresh with that task.
- Give practical, clear and useful answers.
- When the user asks to build something, help them plan and build it step
  by step rather than pretending it is already completed.
- When appropriate, provide complete copy-and-paste-ready code.
- Keep the response focused on the current request.

BOMBA AI can help with:
- Business ideas
- Content creation
- App building
- Marketing
- Product ideas
- UI and features
- Logos and flyers
- General practical assistance

Use Nigerian Naira (₦) when discussing Nigerian prices.
`,

      input,
    });

    const reply =
      response.output_text ||
      "Sorry, I couldn't generate a response.";

    return NextResponse.json({
      reply,
      message: reply,
      content: reply,
      output: reply,
    });
  } catch (error: any) {
    console.error("BOMBA AI OpenAI error:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Failed to generate response",
      },
      { status: 500 }
    );
  }
}