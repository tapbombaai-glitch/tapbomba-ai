import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase is not configured." },
        { status: 500 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI is not configured." },
        { status: 500 }
      );
    }

    const body = await req.json();

    const question =
      typeof body?.question === "string"
        ? body.question.trim()
        : "";

    if (!question) {
      return NextResponse.json(
        { error: "Type or speak a question for BOMBA AI." },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Please log in before using Ask BOMBA AI." },
        { status: 401 }
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
        { error: "Your login session could not be verified." },
        { status: 401 }
      );
    }

    const system = `
You are BOMBA AI, an independent professional AI assistant.

You are NOT the Universal Builder.
You do NOT receive or use Builder projects, Builder plans, or Builder context.

Answer the user's question directly and independently.

Help with:
- questions and explanations
- business ideas and strategy
- calculations
- writing and rewriting
- marketing and content
- coding and technical problems
- practical Nigerian/African business advice

Reply in the same language the user used.

Be clear, accurate, practical, and concise.
Do not invent information.
`.trim();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: system,
        },
        {
          role: "user",
          content: question,
        },
      ],
    });

    const answer =
      response.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return NextResponse.json(
        { error: "BOMBA AI did not return an answer." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (error) {
    console.error("Ask BOMBA AI API error:", error);

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