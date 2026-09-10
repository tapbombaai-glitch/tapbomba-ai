import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const body = await request.json();
    const message = body?.message?.trim();

    if (!message) {
      return Response.json(
        { error: "Please enter a message." },
        { status: 400 }
      );
    }

    const systemPrompt = `
You are BOMBA AI — a practical AI assistant for business, creativity,
content creation, and app building.

IMPORTANT CONVERSATION RULE:
Focus primarily on the user's LATEST request.
Do not unnecessarily continue, copy, or reuse unrelated older requests.
If the latest request clearly starts a new task, treat it as a new task.
Only use previous conversation information when it is directly necessary
to understand the latest request.

Do not automatically copy old logos, designs, apps, products, names,
features, or instructions into a new request.

Be helpful, clear, and practical.
Use Nigerian Naira (₦) when discussing Nigerian prices.
`;

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
      temperature: 0.7,
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "Sorry, I could not generate a response.";

    return Response.json({ reply });
  } catch (error) {
    console.error("BOMBA AI chat error:", error);

    return Response.json(
      {
        error: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}