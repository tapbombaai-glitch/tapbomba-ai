import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({
apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_SYSTEM = `
You are BOMBA AI, a practical and intelligent AI assistant.

Your tagline is: "Automate. Grow. Earn."

Help users with:

- Business ideas
- Business growth
- Marketing
- Social media
- Content creation
- Entrepreneurship
- App and website ideas
- Productivity
- General questions

Give clear, useful and practical answers.

When discussing Nigerian money, use the ₦ symbol.

Do not pretend to have performed an action that you cannot actually perform.

Keep answers easy to understand, especially on mobile phones.
`;

export async function POST(request: NextRequest) {
try {
if (!process.env.OPENAI_API_KEY) {
return NextResponse.json(
{ error: "OPENAI_API_KEY is not configured." },
{ status: 500 }
);
}

const body = await request.json();

const messages = Array.isArray(body?.messages)
  ? body.messages
  : [];

const userMessage =
  typeof body?.message === "string"
    ? body.message
    : "";

let chatMessages = messages;

if (chatMessages.length === 0 && userMessage.trim()) {
  chatMessages = [
    {
      role: "user",
      content: userMessage.trim(),
    },
  ];
}

if (chatMessages.length === 0) {
  return NextResponse.json(
    { error: "Please enter a message." },
    { status: 400 }
  );
}

const safeMessages = chatMessages
  .filter(
    (message: any) =>
      message &&
      (message.role === "user" ||
        message.role === "assistant" ||
        message.role === "system") &&
      typeof message.content === "string"
  )
  .map((message: any) => ({
    role: message.role,
    content: message.content,
  }));

const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    {
      role: "system",
      content: DEFAULT_SYSTEM,
    },
    ...safeMessages,
  ],
  temperature: 0.7,
});

const reply =
  completion.choices?.[0]?.message?.content ||
  "Sorry, I could not generate a response.";

return NextResponse.json({
  success: true,
  reply,
  message: reply,
});

} catch (error: any) {
console.error("BOMBA AI chat error:", error);

return NextResponse.json(
  {
    success: false,
    error:
      error?.message ||
      "Something went wrong while processing your request.",
  },
  { status: 500 }
);

}
}