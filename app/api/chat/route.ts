// app/api/chat/route.ts
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"; // recommended for the official OpenAI SDK
export const maxDuration = 60;   // allow enough time for longer replies

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

    // Accept either a simple { message: "..." } or the common { messages: [...] } format
    // so it works with most frontends without changing page.js
    let input: string | Array<{ role: string; content: string }>;

    if (typeof body.message === "string") {
      input = body.message;
    } else if (Array.isArray(body.messages) && body.messages.length > 0) {
      // Convert chat-style messages into the format Responses API expects
      input = body.messages.map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: typeof m.content === "string" ? m.content : String(m.content ?? ""),
      }));
    } else {
      return NextResponse.json(
        { error: "Please send either { message: string } or { messages: array }" },
        { status: 400 }
      );
    }

    const response = await openai.responses.create({
      model: "gpt-5.6",               // current strong model – change if you prefer gpt-6-astra / gpt-5.6-sol etc.
      instructions: `You are Top Bomba AI, an expert App Builder assistant.
You help users design, build, and improve apps, logos, UI, features, and product ideas.
Be creative, practical, and clear. When the user asks for a logo, describe it in detail or give SVG/code suggestions.
Always stay in character as Top Bomba AI.`,
      input,
      // Optional: store: false if you don't want OpenAI to keep the conversation
    });

    // The easiest way to get the final text
    const reply = response.output_text ?? "Sorry, I couldn't generate a response.";

    // Return a simple shape that most frontends expect
    return NextResponse.json({
      reply,           // primary field most UIs look for
      message: reply,  // fallback
      content: reply,  // another common fallback
      output: reply,
    });
  } catch (error: any) {
    console.error("OpenAI error:", error);
    return NextResponse.json(
      {
        error: error?.message || "Failed to generate response",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}