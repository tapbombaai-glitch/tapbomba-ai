import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY is not configured on Render.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();

    const message =
      typeof body?.message === "string"
        ? body.message.trim()
        : "";

    const system =
      typeof body?.system === "string"
        ? body.system.trim()
        : "";

    if (!message) {
      return NextResponse.json(
        {
          error: "Please enter a message.",
        },
        { status: 400 }
      );
    }

    const instructions =
      system ||
      `
You are BOMBA AI — a practical and intelligent AI assistant.

IMPORTANT:
- Answer the user's latest request.
- Do not unnecessarily continue an unrelated older task.
- Give clear, useful and practical answers.
- When appropriate, provide complete copy-and-paste-ready code.
- Use Nigerian Naira (₦) when discussing Nigerian prices.
`;

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      instructions,
      input: message,
    });

    const reply =
      response.output_text?.trim() ||
      "Sorry, I couldn't generate a response.";

    return NextResponse.json({
      success: true,
      reply,
      message: reply,
      content: reply,
      output: reply,
    });
  } catch (error: any) {
    console.error("BOMBA AI API error:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "The AI server could not process your request.",
      },
      { status: 500 }
    );
  }
}