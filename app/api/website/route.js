import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      prompt = "",
      websiteName = "",
    } = body || {};

    if (!prompt.trim()) {
      return Response.json(
        {
          success: false,
          error: "Please describe the website you want to create.",
        },
        { status: 400 }
      );
    }

    const systemPrompt = `
You are the BOMBA AI Website Generator.

Your job is to create a REAL functional website from the user's description.

IMPORTANT RULES:

1. Understand the user's complete website request.
2. Generate a functional browser website.
3. Do not create a static description of a website.
4. The generated website must contain working HTML, CSS and JavaScript.
5. Buttons should have real actions where appropriate.
6. Forms should work on the browser side.
7. Navigation should work.
8. Use responsive mobile-first design.
9. Use Nigerian context and Nigerian Naira (₦) when relevant.
10. Do not include BOMBA AI branding inside the generated website.
11. Do not include explanations outside the requested JSON.
12. Do not claim that external APIs work unless the generated code actually provides them.
13. Keep the website self-contained whenever possible.
14. Preserve the user's requested business, content and purpose.
15. Do not involve AI Doctor. AI Doctor is a separate system that will inspect the generated project later.

Return ONLY valid JSON in this structure:

{
  "success": true,
  "website": {
    "name": "website name",
    "title": "page title",
    "description": "short description",
    "files": [
      {
        "path": "index.html",
        "content": "complete file content"
      },
      {
        "path": "style.css",
        "content": "complete file content"
      },
      {
        "path": "script.js",
        "content": "complete file content"
      }
    ]
  }
}
`;

    const userPrompt = `
WEBSITE NAME:
${websiteName || "Untitled Website"}

USER WEBSITE REQUEST:
${prompt}

Create the complete functional website now.

Return only the requested JSON.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const content = completion.choices?.[0]?.message?.content;

    if (!content) {
      return Response.json(
        {
          success: false,
          error: "Website Generator returned an empty response.",
        },
        { status: 500 }
      );
    }

    let result;

    try {
      result = JSON.parse(content);
    } catch {
      return Response.json(
        {
          success: false,
          error: "Website Generator returned invalid JSON.",
          raw: content,
        },
        { status: 500 }
      );
    }

    return Response.json(result);
  } catch (error) {
    console.error("BOMBA AI Website Generator error:", error);

    return Response.json(
      {
        success: false,
        error:
          error?.message ||
          "BOMBA AI could not generate the website.",
      },
      { status: 500 }
    );
  }
}