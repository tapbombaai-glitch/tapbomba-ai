import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function safeParseJSON(content) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function askAI(systemPrompt, userPrompt) {
  const completion = await openai.chat.completions.create({
    model: MODEL,
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

  const content =
    completion.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("BOMBA AI returned an empty response.");
  }

  const parsed = safeParseJSON(content);

  if (!parsed) {
    throw new Error(
      "BOMBA AI returned invalid JSON."
    );
  }

  return parsed;
}

function getSeverityErrors(diagnosis) {
  const errors = Array.isArray(diagnosis?.errors)
    ? diagnosis.errors
    : [];

  return errors.filter((error) =>
    ["high", "critical"].includes(
      String(error?.severity || "").toLowerCase()
    )
  );
}

function validateRepairedHTML(code) {
  const content = String(code || "").trim();

  if (!content) {
    return {
      valid: false,
      reason: "The repaired code is empty.",
    };
  }

  if (content.length < 400) {
    return {
      valid: false,
      reason:
        "The repaired index.html is too small to be a complete application.",
    };
  }

  const lower = content.toLowerCase();

  if (
    !lower.includes("<!doctype html") &&
    !lower.includes("<html")
  ) {
    return {
      valid: false,
      reason:
        "The repaired code is not a complete HTML document.",
    };
  }

  if (!lower.includes("<body")) {
    return {
      valid: false,
      reason:
        "The repaired application has no body element.",
    };
  }

  if (!lower.includes("<script")) {
    return {
      valid: false,
      reason:
        "The repaired application does not contain JavaScript.",
    };
  }

  if (
    !lower.includes("addeventlistener") &&
    !lower.includes("onclick")
  ) {
    return {
      valid: false,
      reason:
        "The repaired application does not appear to contain event handling.",
    };
  }

  return {
    valid: true,
    reason: "",
  };
}

const diagnosisSystemPrompt = `
You are BOMBA AI Doctor.

You are the technical diagnosis and repair engine for BOMBA AI.

Your job is to inspect application code and identify REAL problems.

IMPORTANT:

1. Analyze the complete code provided.
2. Look for multiple real problems.
3. Check syntax.
4. Check HTML structure.
5. Check CSS/DOM problems when clearly identifiable.
6. Check JavaScript.
7. Check undefined functions and variables when clearly identifiable.
8. Check event listeners.
9. Check forms.
10. Check navigation.
11. Check obvious logic problems.
12. Check obvious runtime problems.
13. Check broken selectors.
14. Check missing elements referenced by JavaScript.
15. Check duplicated or incorrectly nested code.
16. Check obvious API/request problems.
17. Do not invent errors.
18. If something is uncertain, say so.
19. Do not claim that you executed the application.
20. Preserve the application's existing purpose and working functionality.

This is DIAGNOSIS MODE.

Return ONLY valid JSON:

{
  "diagnosis": "short overall diagnosis",
  "severity": "none | low | medium | high | critical",
  "errors": [
    {
      "type": "syntax | html | javascript | css | api | logic | build | other",
      "severity": "low | medium | high | critical",
      "title": "short title",
      "explanation": "clear explanation",
      "location": "file and area if identifiable",
      "evidence": "relevant code evidence",
      "suggestedFix": "specific correction"
    }
  ],
  "warnings": [],
  "safeToRepair": true
}
`;

const repairSystemPrompt = `
You are BOMBA AI Doctor's automatic code repair engine.

Your job is to repair the provided application WITHOUT redesigning it.

IMPORTANT RULES:

1. Preserve the user's original application purpose.
2. Preserve working features.
3. Repair identified problems.
4. Do not remove working functionality.
5. Do not replace the application with a generic demo.
6. Do not add unrelated features.
7. Do not use React.
8. Do not use Vue.
9. Do not use Svelte.
10. Do not use npm packages.
11. Keep the application directly runnable in a browser.
12. Keep index.html self-contained when it was self-contained.
13. Repair broken buttons so they perform their intended actions.
14. Repair broken forms.
15. Repair broken navigation.
16. Repair missing functions.
17. Repair obvious JavaScript errors.
18. Repair broken DOM selectors.
19. Repair obvious logic errors.
20. Preserve localStorage functionality when present.
21. Preserve existing application data structures when possible.
22. Do not blindly rewrite the entire application.
23. Make the smallest practical changes necessary.
24. Return the COMPLETE repaired file.
25. Do not return a code fragment.
26. Do not return markdown.
27. Do not claim the application was executed.

Return ONLY valid JSON:

{
  "repaired": true,
  "summary": "short description of repairs",
  "files": [
    {
      "path": "index.html",
      "content": "complete repaired index.html"
    }
  ]
}
`;

const verifySystemPrompt = `
You are the final verification layer of BOMBA AI Doctor.

Inspect the repaired application carefully.

Determine whether there are still obvious HIGH or CRITICAL problems.

Do not invent problems.

You have NOT executed the code unless execution evidence is explicitly provided.

Check:

- HTML structure
- JavaScript structure
- event handlers
- referenced DOM elements
- obvious undefined functions
- obvious undefined variables
- navigation
- forms
- important buttons
- obvious application logic
- persistence code
- obvious syntax problems
- obvious broken interactions

Return ONLY valid JSON:

{
  "verified": true,
  "severity": "none | low | medium | high | critical",
  "remainingErrors": [
    {
      "type": "syntax | html | javascript | css | api | logic | build | other",
      "severity": "low | medium | high | critical",
      "title": "short title",
      "explanation": "clear explanation",
      "location": "file and area if identifiable"
    }
  ],
  "summary": "short verification summary"
}

Set verified to false if HIGH or CRITICAL problems remain.
`;

export async function POST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        {
          success: false,
          error:
            "OpenAI API key is not configured.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const {
      code,
      filename = "index.html",
      language = "html",
      userMessage = "",
      mode = "auto-repair",
    } = body || {};

    if (!code || typeof code !== "string") {
      return Response.json(
        {
          success: false,
          error:
            "No code was provided for AI Doctor.",
        },
        { status: 400 }
      );
    }

    /*
     * ==========================================
     * STEP 1 — DIAGNOSIS
     * ==========================================
     */

    const diagnosis = await askAI(
      diagnosisSystemPrompt,
      `
FILE:
${filename}

LANGUAGE:
${language}

USER MESSAGE:
${userMessage || "Inspect this application carefully."}

CODE:
---BEGIN CODE---
${code}
---END CODE---

Diagnose the application now.
Return only the requested JSON.
`
    );

    const blockingErrors =
      getSeverityErrors(diagnosis);

    /*
     * ==========================================
     * NO SERIOUS PROBLEMS
     * ==========================================
     */

    if (blockingErrors.length === 0) {
      return Response.json({
        success: true,
        doctor: "BOMBA AI Doctor",
        mode: "diagnosis",
        repaired: false,
        verified: true,
        filename,
        diagnosis,
        verification: {
          verified: true,
          severity:
            diagnosis?.severity || "none",
          remainingErrors: [],
          summary:
            "No high or critical problems were identified.",
        },
        code,
      });
    }

    /*
     * ==========================================
     * STEP 2 — AUTOMATIC REPAIR
     * ==========================================
     */

    if (mode === "diagnose-only") {
      return Response.json({
        success: true,
        doctor: "BOMBA AI Doctor",
        mode: "diagnosis",
        repaired: false,
        verified: false,
        filename,
        diagnosis,
      });
    }

    const repairResult = await askAI(
      repairSystemPrompt,
      `
FILE:
${filename}

LANGUAGE:
${language}

ORIGINAL APPLICATION:
---BEGIN ORIGINAL CODE---
${code}
---END ORIGINAL CODE---

AI DOCTOR DIAGNOSIS:
${JSON.stringify(
  diagnosis,
  null,
  2
)}

HIGH/CRITICAL PROBLEMS:
${JSON.stringify(
  blockingErrors,
  null,
  2
)}

Repair the identified problems.

Preserve the existing application.

Return the COMPLETE repaired file.
`
    );

    const repairedFiles =
      Array.isArray(repairResult?.files)
        ? repairResult.files
        : [];

    const repairedFile =
      repairedFiles.find(
        (file) =>
          file &&
          typeof file.content === "string" &&
          String(file.path || "").toLowerCase() ===
            String(filename).toLowerCase()
      ) ||
      repairedFiles.find(
        (file) =>
          file &&
          typeof file.content === "string"
      );

    if (!repairedFile) {
      return Response.json(
        {
          success: false,
          error:
            "AI Doctor could not return a repaired application file.",
          diagnosis,
        },
        { status: 500 }
      );
    }

    const repairedCode =
      repairedFile.content;

    /*
     * ==========================================
     * BASIC REPAIR VALIDATION
     * ==========================================
     */

    const basicValidation =
      validateRepairedHTML(
        repairedCode
      );

    if (!basicValidation.valid) {
      return Response.json(
        {
          success: false,
          error:
            `AI Doctor produced invalid repaired code: ${basicValidation.reason}`,
          diagnosis,
          repair: repairResult,
        },
        { status: 422 }
      );
    }

    /*
     * ==========================================
     * STEP 3 — VERIFY REPAIR
     * ==========================================
     */

    const verification =
      await askAI(
        verifySystemPrompt,
        `
FILE:
${filename}

REPAIRED APPLICATION:
---BEGIN REPAIRED CODE---
${repairedCode}
---END REPAIRED CODE---

Verify the repaired application carefully.

Return only the requested JSON.
`
      );

    const remainingErrors =
      Array.isArray(
        verification?.remainingErrors
      )
        ? verification.remainingErrors
        : [];

    const remainingBlockingErrors =
      remainingErrors.filter(
        (error) =>
          ["high", "critical"].includes(
            String(
              error?.severity || ""
            ).toLowerCase()
          )
      );

    const verified =
      verification?.verified === true &&
      remainingBlockingErrors.length === 0;

    /*
     * ==========================================
     * FINAL RESULT
     * ==========================================
     */

    if (!verified) {
      return Response.json(
        {
          success: false,
          doctor: "BOMBA AI Doctor",
          mode: "auto-repair",
          repaired: true,
          verified: false,
          filename,
          diagnosis,
          repair: {
            summary:
              repairResult?.summary ||
              "AI Doctor attempted to repair the application.",
          },
          verification,
          repairedCode,
          error:
            "AI Doctor repaired the application, but verification still found serious problems. The repaired code should not automatically replace the last known-good version.",
        },
        { status: 422 }
      );
    }

    return Response.json({
      success: true,
      doctor: "BOMBA AI Doctor",
      mode: "auto-repair",
      repaired: true,
      verified: true,
      filename,
      diagnosis,
      repair: {
        summary:
          repairResult?.summary ||
          "AI Doctor repaired the identified problems.",
      },
      verification,
      repairedCode,
      code: repairedCode,
      summary:
        "AI Doctor diagnosed the application, repaired the identified serious problems, and completed a verification pass.",
    });
  } catch (error) {
    console.error(
      "BOMBA AI Doctor error:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          error?.message ||
          "BOMBA AI Doctor could not complete the repair process.",
      },
      { status: 500 }
    );
  }
}