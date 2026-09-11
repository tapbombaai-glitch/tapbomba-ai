import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // Check API key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    // Read request
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
        {
          status: 400,
        }
      );
    }

    const defaultSystem = [
      "You are BOMBA AI, a practical and intelligent AI assistant.",
      "Answer the user's latest request directly.",
      "Do not carry unrelated requirements from previous requests.",
      "Give useful and practical answers.",
      "Use Nigerian context when appropriate.",
      "Use ₦ for Nigerian Naira.",
    ].join(" ");

    const systemPrompt = system || defaultSystem;

    const isAppBuilder =
      system.toLowerCase().includes("app builder") ||
      message.toLowerCase().includes("complete standalone html") ||
      message.toLowerCase().includes("build this current app");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",

      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: message,
        },
      ],

      temperature: isAppBuilder ? 0.2 : 0.7,

      // Give App Builder enough room to return a complete app.
      max_tokens: isAppBuilder ? 12000 : 2500,
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() || "";

    if (!reply) {
      return NextResponse.json(
        {
          error: "The AI returned an empty response.",
        },
        {
          status: 500,
        }
      );
    }

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
      {
        status: 500,
      }
    );
  }
}