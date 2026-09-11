// ============================================================
// BOMBA AI — CORE BRAIN + ROUTER v2.0
// "Describe it. BOMBA builds it."
// Automate. Grow. Earn.
// ============================================================

import "server-only";
import OpenAI from "openai";

// ------------------------------------------------------------
// OpenAI client
// IMPORTANT: OPENAI_API_KEY must stay in .env.local
// Never put the key directly in this file.
// ------------------------------------------------------------

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ------------------------------------------------------------
// BOMBA AI INTENTS
// ------------------------------------------------------------

export const INTENTS = Object.freeze({
  FLYER: "flyer",
  IMAGE: "image",
  CONTENT: "content",
  LOGO: "logo",
  CODE: "code",
  APP: "app",
  WEBSITE: "website",
  BUSINESS_TOOL: "business_tool",
  SPECIALIST: "specialist",
  CHAT: "chat",
  UNKNOWN: "unknown",
});

// ------------------------------------------------------------
// Create a completely independent request
// ------------------------------------------------------------

export function createRequest({
  userId = "anonymous",
  text = "",
  projectId = null,
} = {}) {
  return {
    requestId: crypto.randomUUID(),
    userId,
    rawText: String(text).trim(),
    projectId,
    intent: INTENTS.UNKNOWN,
    context: {},
    createdAt: new Date().toISOString(),
  };
}

// ------------------------------------------------------------
// Clean AI response
// ------------------------------------------------------------

function cleanIntent(value) {
  if (!value) {
    return INTENTS.UNKNOWN;
  }

  const cleaned = String(value)
    .toLowerCase()
    .trim()
    .replace(/[`"'.,:;!?]/g, "")
    .split(/\s+/)[0];

  return Object.values(INTENTS).includes(cleaned)
    ? cleaned
    : INTENTS.UNKNOWN;
}

// ------------------------------------------------------------
// BOMBA BRAIN — REAL AI UNDERSTANDING
// ------------------------------------------------------------

export async function understandRequest(request) {
  if (!request || typeof request.rawText !== "string") {
    return {
      ...request,
      intent: INTENTS.UNKNOWN,
    };
  }

  const text = request.rawText.trim();

  if (!text) {
    return {
      ...request,
      intent: INTENTS.UNKNOWN,
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",

      temperature: 0,

      max_tokens: 10,

      messages: [
        {
          role: "system",
          content: `
You are BOMBA Brain, the intelligent routing brain of BOMBA AI.

Your job is to understand what the user wants and classify the request into EXACTLY ONE intent.

Available intents:

flyer
image
content
logo
code
app
website
business_tool
specialist
chat
unknown

Definitions:

flyer = user wants a flyer, poster, promotional graphic, event flyer, advert design, announcement design, or similar visual advertisement.

image = user wants an image, picture, illustration, artwork, photo-style image, or image editing.

content = user wants written content such as captions, social media posts, advertisements, product descriptions, emails, scripts, articles, or promotional writing.

logo = user wants a logo, brand mark, business logo, company logo, or brand identity graphic.

code = user wants programming code, debugging, fixing code, explaining code, or a software coding task.

app = user wants to build an application, mobile app, web app, SaaS application, dashboard application, school app, delivery app, marketplace app, or another software application.

website = user wants to build a website, landing page, business website, portfolio, blog, online store website, or other website.

business_tool = user wants a business system, management tool, CRM, inventory system, accounting tool, booking system, business dashboard, or business automation tool.

specialist = user wants specialist knowledge or a specialist tool such as horticulture, agriculture, farming, plant care, landscaping, architecture, or another specialized professional area.

chat = general questions, conversation, explanations, advice, brainstorming, or requests that do not require one of the creation modules above.

unknown = the request is too unclear to classify.

IMPORTANT:
- Understand the meaning, not just individual keywords.
- Consider the entire request.
- Return ONLY ONE intent word.
- Do not explain your answer.
          `,
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const aiResult =
      response?.choices?.[0]?.message?.content || "";

    const intent = cleanIntent(aiResult);

    return {
      ...request,
      intent,
    };
  } catch (error) {
    console.error("BOMBA Brain AI Error:", error);

    // Safe fallback.
    return {
      ...request,
      intent: INTENTS.UNKNOWN,
      context: {
        ...request.context,
        aiError: true,
      },
    };
  }
}

// ------------------------------------------------------------
// ROUTER
// ------------------------------------------------------------

const ROUTES = Object.freeze({
  [INTENTS.FLYER]: "FlyerModule",

  [INTENTS.IMAGE]: "ImageModule",

  [INTENTS.CONTENT]: "ContentModule",

  [INTENTS.LOGO]: "LogoModule",

  [INTENTS.CODE]: "CodeModule",

  [INTENTS.APP]: "AppBuilderModule",

  [INTENTS.WEBSITE]: "WebsiteModule",

  [INTENTS.BUSINESS_TOOL]: "BusinessToolsModule",

  [INTENTS.SPECIALIST]: "SpecialistModule",

  [INTENTS.CHAT]: "ChatModule",

  [INTENTS.UNKNOWN]: "FallbackModule",
});

// ------------------------------------------------------------
// Route a request to the correct BOMBA module
// ------------------------------------------------------------

export function routeRequest(request) {
  if (!request || !request.intent) {
    return "FallbackModule";
  }

  return ROUTES[request.intent] || "FallbackModule";
}

// ------------------------------------------------------------
// MAIN BOMBA BRAIN OPERATION
// ------------------------------------------------------------

export async function processRequest({
  userId = "anonymous",
  text = "",
  projectId = null,
} = {}) {
  try {
    // Every request gets its own unique ID.
    const request = createRequest({
      userId,
      text,
      projectId,
    });

    // Real AI understands the request.
    const understoodRequest = await understandRequest(request);

    // Router chooses the correct creation module.
    const module = routeRequest(understoodRequest);

    return {
      success: true,

      request: understoodRequest,

      module,

      intent: understoodRequest.intent,

      message: "BOMBA understood your request.",
    };
  } catch (error) {
    console.error("BOMBA Brain Crashed:", error);

    return {
      success: false,

      error: "BOMBA Brain could not process this request.",

      module: "FallbackModule",

      intent: INTENTS.UNKNOWN,
    };
  }
}

// ------------------------------------------------------------
// Export routes for API/module use
// ------------------------------------------------------------

export { ROUTES };