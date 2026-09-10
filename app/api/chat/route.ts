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
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const system = typeof body?.system === "string" ? body.system.trim() : "";

    if (!message) {
      return NextResponse.json(
        { error: "Please enter a message." },
        { status: 400 }
      );
    }

    const systemPrompt =
      system ||
      `You are BOMBA AI — a practical and intelligent AI assistant for Nigerian and African business owners.

IMPORTANT:
- Answer the user's latest request clearly and directly.
- Give practical, useful answers.
- When useful, give ready-to-copy content.
- Use Nigerian Naira (₦) when talking about prices.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.7,
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ||
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
        error: error?.message || "The AI server could not process your request.",
      },
      { status: 500 }
    );
  }
}