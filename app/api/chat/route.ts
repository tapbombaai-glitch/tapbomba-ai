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

    let input:
      | string
      | Array<{ role: "user" | "assistant"; content: string }>;

    if (typeof body.message === "string") {
      input = body.message;
    } else if (Array.isArray(body.messages) && body.messages.length > 0) {
      input = body.messages.map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content:
          typeof m.content === "string"
            ? m.content
            : String(m.content ?? ""),
      }));
    } else {
      return NextResponse.json(
        {
          error:
            'Please send either { message: string } or { messages: array }',
        },
        { status: 400 }
      );
    }

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      instructions:
        "You are TapBomba AI, an expert business and app-building assistant. " +
        "Help users design, build, and improve apps, logos, UI, features, " +
        "business ideas, marketing content, and product ideas. " +
        "Be creative, practical, helpful, and clear.",
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
    console.error("OpenAI error:", error);

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