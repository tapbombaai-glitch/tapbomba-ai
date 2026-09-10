import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY is not set",
        },
        { status: 500 }
      );
    }

    const body = await req.json();

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    const system =
      typeof body.system === "string"
        ? body.system
        : "";

    const imageData =
      typeof body.imageData === "string"
        ? body.imageData
        : "";

    const generateFlyer =
      body.generateFlyer === true;

    /*
     * ============================================================
     * REAL FLYER GENERATION
     * ============================================================
     */

    if (generateFlyer) {
      if (!message) {
        return NextResponse.json(
          {
            error:
              "Please describe the flyer you want.",
          },
          { status: 400 }
        );
      }

      if (!imageData) {
        return NextResponse.json(
          {
            error:
              "Please select a product image first.",
          },
          { status: 400 }
        );
      }

      if (!imageData.startsWith("data:image/")) {
        return NextResponse.json(
          {
            error:
              "The selected image format is not supported.",
          },
          { status: 400 }
        );
      }

      /*
       * The image-generation API can use the uploaded image
       * as the visual reference for the flyer.
       *
       * We use the current GPT image generation model.
       */
      const response = await openai.responses.create({
        model: "gpt-5.6-luna",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `
Create a professional commercial advertising flyer.

USER REQUEST:
${message}

DESIGN REQUIREMENTS:

- Create a REAL visual promotional flyer.
- Square format: 1024 x 1024.
- Use the uploaded product image as the main product/reference.
- Keep the product recognizable.
- Make the product the visual focus.
- Create a polished professional marketing composition.
- Use attractive commercial typography.
- Make the price, offer, or important information easy to notice when provided.
- Use the exact business/product information supplied by the user.
- Do not invent a phone number, address, website, price, discount, or contact information.
- If contact information was not supplied, do not create fake contact information.
- Use clean spacing.
- Make the result suitable for WhatsApp, Instagram, Facebook, and social-media advertising.
- Do not create a phone-shaped webpage.
- Do not create an HTML screenshot.
- Do not return a text-only design.
- Generate the actual finished image.
- Do not add BOMBA AI branding unless the user explicitly requested it.
                `.trim(),
              },
              {
                type: "input_image",
                image_url: imageData,
              },
            ],
          },
        ],
        tools: [
          {
            type: "image_generation",
            action: "auto",
            size: "1024x1024",
          },
        ],
      });

      /*
       * Find the generated image returned by the image-generation tool.
       */
      const imageOutput = response.output?.find(
        (item: any) =>
          item?.type === "image_generation_call"
      ) as any;

      if (!imageOutput?.result) {
        console.error(
          "No generated image found:",
          response.output
        );

        return NextResponse.json(
          {
            error:
              "The AI finished without returning a flyer image.",
          },
          { status: 500 }
        );
      }

      const imageBase64 = imageOutput.result;

      return NextResponse.json({
        success: true,
        image: `data:image/png;base64,${imageBase64}`,
        reply:
          "Your professional flyer has been generated.",
      });
    }

    /*
     * ============================================================
     * NORMAL BOMBA AI CHAT
     * ============================================================
     *
     * This section preserves the latest-request behavior.
     */

    let input: string;

    if (message) {
      input = message;
    } else if (
      Array.isArray(body.messages) &&
      body.messages.length > 0
    ) {
      const latestUserMessage = [
        ...body.messages,
      ]
        .reverse()
        .find(
          (m: any) =>
            m?.role === "user" &&
            typeof m?.content === "string" &&
            m.content.trim()
        );

      input =
        latestUserMessage?.content?.trim() || "";
    } else {
      return NextResponse.json(
        {
          error:
            'Please send either { message: string } or { messages: array }',
        },
        { status: 400 }
      );
    }

    if (!input) {
      return NextResponse.json(
        {
          error: "Please enter a message.",
        },
        { status: 400 }
      );
    }

    const response =
      await openai.responses.create({
        model: "gpt-4o-mini",

        instructions:
          system ||
          `
You are BOMBA AI — a practical and intelligent AI assistant.

IMPORTANT:
- Treat the latest request as the current task.
- Do not unnecessarily continue an older task.
- Do not copy unrelated information from previous requests.
- Do not automatically reuse old logos, designs, app ideas,
  product names, code, features, or instructions.
- Only use older information when the latest request clearly depends on it.
- If the user starts a completely new task, start fresh with that task.
- Give practical, clear and useful answers.
- When the user asks to build something, help them plan and build it
  step by step rather than pretending it is already completed.

Use Nigerian Naira (₦) when discussing Nigerian prices.
`,

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
    console.error(
      "BOMBA AI OpenAI error:",
      error
    );

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