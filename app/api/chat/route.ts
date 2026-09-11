import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_SYSTEM = [
  "You are BOMBA AI, a practical and intelligent AI assistant.",
  "Answer the user's latest request directly.",
  "Do not carry unrelated requirements from previous requests.",
  "Give useful and practical answers.",
  "Use Nigerian context when appropriate.",
  "Use ₦ for Nigerian Naira.",
].join(" ");

const APP_BUILDER_SYSTEM = [
  "You are BOMBA AI's professional App Builder.",
  "Your job is to turn the user's current app request into a REAL, FUNCTIONAL browser application prototype.",
  "",
  "The application must NOT be a static mockup.",
  "Do NOT create placeholder cards such as 'Class List', 'Assignment List', or 'Chat Interface' without functionality.",
  "",
  "Every important button must perform an action.",
  "Forms must accept input and process it.",
  "Navigation must actually switch between screens.",
  "Search fields must actually filter displayed data.",
  "Add, edit, delete, save, submit, and other actions should actually work where relevant.",
  "Use JavaScript for the application logic.",
  "Use localStorage when persistent browser data is useful.",
  "Use realistic sample data so the application is immediately usable.",
  "Show success, error, empty, and confirmation states where appropriate.",
  "Make calculations work instead of displaying fake numbers.",
  "Make the application responsive and mobile-first.",
  "Use accessible buttons, labels, inputs, and readable text.",
  "Do not require external libraries or a backend unless the user specifically asks for one.",
  "",
  "The generated application should feel like a real working prototype that a user can click through and test.",
  "",
  "IMPORTANT OUTPUT RULE:",
  "Return ONLY one complete standalone HTML document.",
  "Start with <!DOCTYPE html>.",
  "End with </html>.",
  "Do not use Markdown code fences.",
  "Do not explain the code outside the HTML.",
  "Put CSS inside <style> and JavaScript inside <script>.",
  "Include the viewport meta tag.",
  "Keep the application reasonably compact so the complete HTML is returned.",
].join("\n");

export async function POST(req: NextRequest) {
  try {
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

    const isAppBuild =
      system.toLowerCase().includes("app builder") ||
      message.toLowerCase().includes("build this current app") ||
      message.toLowerCase().includes("standalone html");

    const systemPrompt = isAppBuild
      ? APP_BUILDER_SYSTEM
      : system || DEFAULT_SYSTEM;

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

      temperature: isAppBuild ? 0.2 : 0.7,

      max_tokens: isAppBuild ? 14000 : 3000,
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