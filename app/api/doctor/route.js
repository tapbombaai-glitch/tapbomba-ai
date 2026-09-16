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
      code,
      filename = "unknown-file",
      language = "auto",
      userMessage = "",
    } = body || {};

    if (!code || typeof code !== "string") {
      return Response.json(
        {
          success: false,
          error: "No code was provided for diagnosis.",
        },
        { status: 400 }
      );
    }

    const systemPrompt = `
You are BOMBA AI Doctor.

Your job is to diagnose software projects accurately.

You are the technical diagnosis layer of BOMBA AI.

IMPORTANT RULES:

1. Analyze the COMPLETE code provided.
2. Look for multiple problems, not only the first error.
3. Check syntax errors.
4. Check JSX/React structure.
5. Check JavaScript and TypeScript problems.
6. Check missing brackets, parentheses, braces and quotes.
7. Check malformed template literals.
8. Check incorrect imports and exports.
9. Check undefined variables and functions when they are clearly identifiable.
10. Check obvious API/request problems.
11. Check obvious asynchronous problems.
12. Check obvious logic problems.
13. Check duplicated or incorrectly nested JSX.
14. Check problems that could prevent the application from building.
15. Do not invent an error just to produce an answer.
16. If something is uncertain, clearly say that it is uncertain.
17. Do NOT modify the code yet.
18. Do NOT pretend that you executed the code.
19. Do NOT claim that a build passed unless actual build information was provided.
20. Preserve the user's existing architecture and intent.

The user may communicate in any supported language.

Understand the user's language and respond in that language unless the user asks for another language.

You are currently in DIAGNOSIS MODE.

Return ONLY valid JSON using this structure:

{
  "diagnosis": "short overall diagnosis",
  "severity": "none | low | medium | high | critical",
  "errors": [
    {
      "type": "syntax | jsx | javascript | typescript | import | api | logic | build | other",
      "severity": "low | medium | high | critical",
      "title": "short error title",
      "explanation": "clear explanation",
      "location": "file and line/area if identifiable",
      "evidence": "relevant code fragment if useful",
      "suggestedFix": "what should be corrected"
    }
  ],
  "warnings": [
    "warning 1"
  ],
  "safeToRepair": true,
  "nextAction": "diagnose | repair | request_more_code"
}
`;

    const userPrompt = `
FILE:
${filename}

LANGUAGE:
${language}

USER MESSAGE:
${userMessage || "Please diagnose this file."}

CODE TO DIAGNOSE:
---BEGIN CODE---
${code}
---END CODE---

Analyze this code carefully according to the BOMBA AI Doctor rules.
Find as many real, relevant problems as possible.
Do not repair the code yet.
Return only the requested JSON.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
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
          error: "BOMBA AI Doctor returned an empty diagnosis.",
        },
        { status: 500 }
      );
    }

    let diagnosis;

    try {
      diagnosis = JSON.parse(content);
    } catch {
      return Response.json(
        {
          success: false,
          error: "BOMBA AI Doctor returned invalid diagnosis data.",
          raw: content,
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      doctor: "BOMBA AI Doctor",
      mode: "diagnosis",
      filename,
      diagnosis,
    });
  } catch (error) {
    console.error("BOMBA AI Doctor error:", error);

    return Response.json(
      {
        success: false,
        error:
          error?.message ||
          "BOMBA AI Doctor could not complete the diagnosis.",
      },
      { status: 500 }
    );
  }
}