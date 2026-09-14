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

    const referenceImages = Array.isArray(body?.referenceImages)
      ? body.referenceImages.filter(
          (item) => typeof item === "string" && item.length > 0
        )
      : [];

    // Backward compatibility with the old single-photo version
    const oldReferenceImage =
      typeof body?.referenceImage === "string"
        ? body.referenceImage
        : "";

    const images =
      referenceImages.length > 0
        ? referenceImages.slice(0, 3)
        : oldReferenceImage
        ? [oldReferenceImage]
        : [];

    const photoSize =
      typeof body?.photoSize === "string"
        ? body.photoSize
        : "medium";

    const photoPositions = Array.isArray(body?.photoPositions)
      ? body.photoPositions
          .slice(0, 3)
          .map((item) =>
            typeof item === "string" ? item : "auto"
          )
      : [];

    // Backward compatibility with the old single position
    const oldPhotoPosition =
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

IMPORTANT INSTRUCTION:
The user's written instructions about the uploaded pictures are part of the design instructions.

If the user gives explicit positions such as:
- Picture 1 left
- Picture 2 center
- Picture 3 right

FOLLOW THOSE POSITIONS EXACTLY.

Do not randomly rearrange the pictures when the user has explicitly specified their positions.

If the user says something like:
"Arrange the three pictures professionally"
or does not specify positions, intelligently arrange all supplied pictures into a balanced, attractive professional composition.

DESIGN REQUIREMENTS:
- Create the actual finished flyer.
- Make it polished, premium, attractive, modern and professional.
- Make all important text clean and readable.
- Do not invent important information.
- Use a strong visual hierarchy.
- Make the final composition suitable for WhatsApp, Instagram and Facebook.
- Use all supplied reference pictures when pictures are provided.
- Do not ignore any supplied picture.
- Do not replace supplied people with random people.
- Preserve the identity and appearance of people in the supplied pictures.
`;

    if (images.length > 0) {
      const sizeInstruction = {
        small:
          "Keep the supplied pictures relatively small while keeping important details and faces visible.",
        medium:
          "Make the supplied pictures medium-sized and clearly visible without allowing them to dominate the flyer.",
        large:
          "Make the supplied pictures large and prominent while keeping the flyer balanced.",
        full:
          "Make the supplied pictures very prominent and use them as major parts of the flyer composition.",
      };

      finalPrompt += `

UPLOADED PICTURES:
There are ${images.length} user-provided picture(s).

You MUST use ALL ${images.length} supplied picture(s) in the final flyer.

PHOTO SIZE:
${sizeInstruction[photoSize] || sizeInstruction.medium}

`;

      images.forEach((_, index) => {
        const position =
          photoPositions[index] ||
          (images.length === 1 ? oldPhotoPosition : "auto");

        if (position === "left") {
          finalPrompt += `
PICTURE ${index + 1} POSITION:
Place Picture ${index + 1} mainly on the LEFT side of the flyer.
Do not move it to the center or right unless necessary for a tiny amount of visual overlap.
`;
        } else if (position === "center") {
          finalPrompt += `
PICTURE ${index + 1} POSITION:
Place Picture ${index + 1} mainly in the CENTER of the flyer.
`;
        } else if (position === "right") {
          finalPrompt += `
PICTURE ${index + 1} POSITION:
Place Picture ${index + 1} mainly on the RIGHT side of the flyer.
`;
        } else {
          finalPrompt += `
PICTURE ${index + 1} POSITION:
Arrange Picture ${index + 1} intelligently and professionally according to the overall flyer composition.
`;
        }
      });

      finalPrompt += `

PICTURE IDENTITY RULES:
- Picture 1 means the FIRST uploaded picture.
- Picture 2 means the SECOND uploaded picture.
- Picture 3 means the THIRD uploaded picture.
- Keep each picture recognizable.
- Do not replace a supplied person with another person.
- Do not invent a different face.
- Do not substitute another model.
- Do not discard any supplied picture.
- Use the supplied pictures as the actual visual references.
`;
      
      const imageFiles = [];

      for (let index = 0; index < images.length; index++) {
        const imageResponse = await fetch(images[index]);

        if (!imageResponse.ok) {
          return NextResponse.json(
            {
              error: `BOMBA AI could not read uploaded picture ${index + 1}.`,
            },
            { status: 400 }
          );
        }

        const imageBuffer = await imageResponse.arrayBuffer();

        const mimeType =
          imageResponse.headers.get("content-type") ||
          "image/png";

        const extension =
          mimeType.includes("jpeg") || mimeType.includes("jpg")
            ? "jpg"
            : mimeType.includes("webp")
            ? "webp"
            : "png";

        const imageFile = new File(
          [imageBuffer],
          `bomba-reference-${index + 1}.${extension}`,
          {
            type: mimeType,
          }
        );

        imageFiles.push(imageFile);
      }

      const result = await openai.images.edit({
        model: "gpt-image-2",
        image: imageFiles,
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