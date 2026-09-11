import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

import {
  createRequest,
  understandRequest,
  routeRequest,
} from "@/lib/bomba-core";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================
// DEFAULT BOMBA AI
// ============================================================

const DEFAULT_SYSTEM = [
  "You are BOMBA AI, a practical and intelligent AI assistant.",
  "Your job is to help the user complete their CURRENT request.",
  "Answer the user's latest request directly.",
  "Do not carry unrelated requirements from previous requests.",
  "Do not invent requirements that the user did not request.",
  "Give useful and practical answers.",
  "Use Nigerian context when appropriate.",
  "Use ₦ for Nigerian Naira.",
  "Be clear, helpful, and action-oriented.",
].join(" ");

// ============================================================
// APP BUILDER
// ============================================================

const APP_BUILDER_SYSTEM = [
  "You are BOMBA AI's professional App Builder.",
  "Your job is to turn the user's CURRENT app request into a REAL, FUNCTIONAL browser application prototype.",
  "",
  "The application must NOT be a static mockup.",
  "Do NOT create placeholder cards such as 'Class List', 'Assignment List', or 'Chat Interface' without functionality.",
  "",
  "Every important button must perform an action.",
  "Forms must accept input and process it.",
  "Navigation must actually switch between screens.",
  "Search fields must actually filter displayed data.",
  "Add, edit, delete, save, submit, and other actions should actually work where relevant.",
  "Use JavaScript for application logic.",
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

// ============================================================
// FLYER
// ============================================================

const FLYER_SYSTEM = [
  "You are BOMBA AI's Flyer Creation Assistant.",
  "Understand the user's current flyer request.",
  "Create strong professional flyer copy and a clear visual design specification.",
  "Include suitable headline, supporting text, call-to-action, layout guidance, colors, typography, and image direction.",
  "Do not carry unrelated requirements from previous requests.",
  "If the user gives specific business, event, product, date, price, phone number, or location information, use it accurately.",
  "Do not invent important facts that the user did not provide.",
].join(" ");

// ============================================================
// CONTENT
// ============================================================

const CONTENT_SYSTEM = [
  "You are BOMBA AI's professional Content Creator.",
  "Create exactly what the user currently requests.",
  "Write polished, useful, natural content.",
  "Do not carry unrelated requirements from previous requests.",
  "Adapt the writing to the requested audience and platform.",
  "Use Nigerian context when appropriate.",
].join(" ");

// ============================================================
// LOGO
// ============================================================

const LOGO_SYSTEM = [
  "You are BOMBA AI's professional Logo and Brand Assistant.",
  "Understand the user's current logo request.",
  "Create a professional logo concept and detailed design direction.",
  "Include brand name, visual concept, typography, symbol ideas, color direction, and usage guidance.",
  "Do not carry unrelated requirements from previous requests.",
].join(" ");

// ============================================================
// CODE
// ============================================================

const CODE_SYSTEM = [
  "You are BOMBA AI's professional coding assistant.",
  "Solve the user's CURRENT coding request.",
  "Inspect the request carefully before answering.",
  "Provide correct, usable code when code is requested.",
  "Do not carry unrelated requirements from previous requests.",
  "Explain important changes briefly when necessary.",
  "Never expose secrets, API keys, passwords, or private credentials.",
].join(" ");

// ============================================================
// WEBSITE
// ============================================================

const WEBSITE_SYSTEM = [
  "You are BOMBA AI's professional Website Builder.",
  "Understand the user's current website request.",
  "Plan a real functional website rather than a static description.",
  "Include appropriate sections, navigation, responsive layout, forms, calls to action, and useful interactions where relevant.",
  "Do not carry unrelated requirements from previous requests.",
].join(" ");

// ============================================================
// BUSINESS TOOLS
// ============================================================

const BUSINESS_TOOL_SYSTEM = [
  "You are BOMBA AI's Business Tools specialist.",
  "Understand the user's current business-tool request.",
  "Design a practical system that solves the requested business problem.",
  "Think about real workflows, records, calculations, dashboards, forms, search, and useful actions where appropriate.",
  "Do not carry unrelated requirements from previous requests.",
].join(" ");

// ============================================================
// SPECIALIST
// ============================================================

const SPECIALIST_SYSTEM = [
  "You are BOMBA AI's specialist assistant.",
  "Understand the user's current specialist request.",
  "Give practical and accurate information.",
  "If the request concerns horticulture, plants, landscaping, propagation, planting, maintenance, or flower design, provide professional horticultural guidance.",
  "Do not carry unrelated requirements from previous requests.",
].join(" ");

// ============================================================
// IMAGE
// ============================================================

const IMAGE_SYSTEM = [
  "You are BOMBA AI's Image Creation Assistant.",
  "Understand the user's current image request.",
  "Create a detailed image-generation prompt suitable for an image generation system.",
  "Include subject, composition, environment, lighting, style, camera/view direction, colors, and important details.",
  "Do not carry unrelated requirements from previous requests.",
].join(" ");

// ============================================================
// CHAT
// ============================================================

const CHAT_SYSTEM = DEFAULT_SYSTEM;

// ============================================================
// SELECT SYSTEM FROM BOMBA INTENT
// ============================================================

function getSystemPrompt(intent, isAppBuild, customSystem) {
  if (isAppBuild || intent === "app") {
    return APP_BUILDER_SYSTEM;
  }

  switch (intent) {
    case "flyer":
      return FLYER_SYSTEM;

    case "image":
      return IMAGE_SYSTEM;

    case "content":
      return CONTENT_SYSTEM;

    case "logo":
      return LOGO_SYSTEM;

    case "code":
      return CODE_SYSTEM;

    case "website":
      return WEBSITE_SYSTEM;

    case "business_tool":
      return BUSINESS_TOOL_SYSTEM;

    case "specialist":
      return SPECIALIST_SYSTEM;

    case "chat":
      return customSystem || CHAT_SYSTEM;

    default:
      return customSystem || DEFAULT_SYSTEM;
  }
}

// ============================================================
// POST
// ============================================================

export async function POST(req) {
  try {
    // --------------------------------------------------------
    // Check OpenAI key
    // --------------------------------------------------------

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "OPENAI_API_KEY is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    // --------------------------------------------------------
    // Read request
    // --------------------------------------------------------

    const body = await req.json();

    const message =
      typeof body?.message === "string"
        ? body.message.trim()
        : "";

    const customSystem =
      typeof body?.system === "string"
        ? body.system.trim()
        : "";

    const userId =
      typeof body?.userId === "string" && body.userId.trim()
        ? body.userId.trim()
        : "anonymous";

    const projectId =
      typeof body?.projectId === "string" && body.projectId.trim()
        ? body.projectId.trim()
        : null;

    // --------------------------------------------------------
    // Validate message
    // --------------------------------------------------------

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a message.",
        },
        {
          status: 400,
        }
      );
    }

    // --------------------------------------------------------
    // BOMBA BRAIN
    //
    // Every request receives a NEW request ID.
    // This prevents unrelated old requests from being
    // treated as the current request.
    // --------------------------------------------------------

    const request = createRequest({
      userId,
      text: message,
      projectId,
    });

    const understoodRequest = await understandRequest(request);

    const intent = understoodRequest.intent;

    const module = routeRequest(understoodRequest);

    // --------------------------------------------------------
    // App Builder detection
    // --------------------------------------------------------

    const lowerMessage = message.toLowerCase();

    const isAppBuild =
      intent === "app" ||
      customSystem.toLowerCase().includes("app builder") ||
      lowerMessage.includes("build this current app") ||
      lowerMessage.includes("standalone html");

    // --------------------------------------------------------
    // Select the correct BOMBA system
    // --------------------------------------------------------

    const systemPrompt = getSystemPrompt(
      intent,
      isAppBuild,
      customSystem
    );

    // --------------------------------------------------------
    // Call OpenAI
    // --------------------------------------------------------

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

      max_tokens: isAppBuild ? 14000 : 5000,
    });

    // --------------------------------------------------------
    // Get AI response
    // --------------------------------------------------------

    const reply =
      completion.choices?.[0]?.message?.content?.trim() || "";

    if (!reply) {
      return NextResponse.json(
        {
          success: false,
          error: "The AI returned an empty response.",
          intent,
          module,
        },
        {
          status: 500,
        }
      );
    }

    // --------------------------------------------------------
    // Return BOMBA response
    // --------------------------------------------------------

    return NextResponse.json({
      success: true,

      reply,

      message: reply,

      content: reply,

      output: reply,

      // BOMBA Brain information
      intent,

      module,

      requestId: understoodRequest.requestId,

      projectId: understoodRequest.projectId,

      createdAt: understoodRequest.createdAt,
    });
  } catch (error) {
    // --------------------------------------------------------
    // SAFE ERROR HANDLING
    // --------------------------------------------------------

    console.error("BOMBA AI API error:", error);

    return NextResponse.json(
      {
        success: false,

        error:
          error?.message ||
          "The BOMBA AI server could not process your request.",

        intent: "unknown",

        module: "FallbackModule",
      },
      {
        status: 500,
      }
    );
  }
}