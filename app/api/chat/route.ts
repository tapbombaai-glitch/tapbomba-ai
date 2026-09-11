import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const prompt =
      typeof body?.prompt === "string"
        ? body.prompt.trim()
        : "";

    if (!prompt) {
      return NextResponse.json(
        { error: "Please describe the flyer you want." },
        { status: 400 }
      );
    }

    const result = await openai.images.generate({
      model: "gpt-image-2",
      prompt: `
Create a professional square promotional flyer.

User request:
${prompt}

Make it polished, attractive, readable, modern, and suitable
for social media. Do not invent important information.
Create the actual finished flyer image.
`,
      size: "1024x1024",
    });

    const image = result?.data?.[0]?.b64_json;

    if (!image) {
      return NextResponse.json(
        { error: "No image was returned by the AI." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      image: `data:image/png;base64,${image}`,
    });
  } catch (error) {
    console.error("BOMBA image error:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "BOMBA AI could not generate the flyer.",
      },
      { status: 500 }
    );
  }
}