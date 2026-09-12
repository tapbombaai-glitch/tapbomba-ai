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

    const referenceImage =
      typeof body?.referenceImage === "string"
        ? body.referenceImage
        : "";

    const photoSize =
      typeof body?.photoSize === "string"
        ? body.photoSize
        : "medium";

    const photoPosition =
      typeof body?.photoPosition === "string"
        ? body.photoPosition
        : "center";

    if (!prompt) {
      return NextResponse.json(
        { error: "Please describe the flyer you want." },
        { status: 400 }
      );
    }

    let finalPrompt = `
Create a professional square promotional flyer.

USER REQUEST:
${prompt}

DESIGN REQUIREMENTS:
- Create the actual finished flyer.
- Make it polished, premium, attractive, modern and professional.
- Make all important text clean and readable.
- Do not invent important information.
- Use a strong visual hierarchy.
- Make the final composition suitable for WhatsApp, Instagram and Facebook.
`;

    if (referenceImage) {
      const sizeInstruction = {
        small:
          "Make the uploaded photo relatively small while keeping the person's face clearly visible.",
        medium:
          "Make the uploaded photo medium-sized and clearly visible without dominating the flyer.",
        large:
          "Make the uploaded photo large and prominent while keeping the flyer balanced.",
        full:
          "Make the uploaded photo very prominent and use it as a major part of the flyer composition.",
      };

      const positionInstruction = {
        left: "Place the uploaded photo mainly on the LEFT side of the flyer.",
        center:
          "Place the uploaded photo mainly in the CENTER of the flyer.",
        right:
          "Place the uploaded photo mainly on the RIGHT side of the flyer.",
      };

      finalPrompt += `
UPLOADED PHOTO INSTRUCTION:

An exact user-provided photo has been supplied with this request.

IMPORTANT:
- Use the supplied photo as the person's actual reference.
- Do NOT replace the person with another person.
- Do NOT invent a different face.
- Do NOT substitute another model.
- Preserve the person's recognizable facial identity.
- Keep the uploaded person's appearance as faithful to the supplied image as possible.
- Do not create a random person instead of the uploaded person.

PHOTO SIZE:
${sizeInstruction[photoSize] || sizeInstruction.medium}

PHOTO POSITION:
${positionInstruction[photoPosition] || positionInstruction.center}

Integrate the supplied photo naturally into the flyer while preserving the person's identity.
`;

      const imageResponse = await fetch(referenceImage);

      if (!imageResponse.ok) {
        return NextResponse.json(
          { error: "BOMBA AI could not read the uploaded photo." },
          { status: 400 }
        );
      }

      const imageBuffer = await imageResponse.arrayBuffer();

      const mimeType =
        imageResponse.headers.get("content-type") ||
        "image/png";

      const imageFile = new File(
        [imageBuffer],
        "bomba-reference-image.png",
        {
          type: mimeType,
        }
      );

      const result = await openai.images.edit({
        model: "gpt-image-2",
        image: imageFile,
        prompt: finalPrompt,
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
    }

    const result = await openai.images.generate({
      model: "gpt-image-2",
      prompt: finalPrompt,
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