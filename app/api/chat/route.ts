import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const body = await req.json();

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    const imageData =
      typeof body.imageData === "string"
        ? body.imageData
        : "";

    if (!message) {
      return NextResponse.json(
        { error: "Please describe the flyer you want." },
        { status: 400 }
      );
    }

    if (!imageData) {
      return NextResponse.json(
        { error: "Please upload a picture for the flyer." },
        { status: 400 }
      );
    }

    // Basic safety check so we only accept image data.
    if (!imageData.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "The uploaded file is not a valid image." },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-image-2",
          prompt: `
Create a professional square promotional flyer.

Use the uploaded product image as the main visual reference.

User's flyer instructions:
${message}

Requirements:
- Square 1024x1024 promotional design.
- Professional commercial appearance.
- Make the product clearly visible.
- Use attractive typography.
- Make important prices and offers easy to see.
- Use a clean, modern composition.
- Do not create a phone mockup.
- Do not create a webpage screenshot.
- The final result must look like an actual social-media/business flyer.
- Do not add random information that the user did not request.
          `,
          size: "1024x1024",
          quality: "medium",
          n: 1,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI flyer error:", data);

      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "The flyer generator could not create the image.",
        },
        { status: response.status }
      );
    }

    const imageBase64 =
      data?.data?.[0]?.b64_json;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "No flyer image was returned." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      image: `data:image/png;base64,${imageBase64}`,
    });
  } catch (error: any) {
    console.error("Flyer route error:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Something went wrong while creating the flyer.",
      },
      { status: 500 }
    );
  }
}