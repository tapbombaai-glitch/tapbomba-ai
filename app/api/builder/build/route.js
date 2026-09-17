import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

/* =========================================================
   FILE HELPERS
========================================================= */

function cleanPath(path: unknown) {
  return String(path || "")
    .trim()
    .replace(/^\/+/, "");
}

function normalizeFiles(files: unknown) {
  if (!Array.isArray(files)) return [];

  return files
    .filter(
      (file) =>
        file &&
        typeof file.path === "string" &&
        file.path.trim() &&
        typeof file.content === "string"
    )
    .map((file) => ({
      path: cleanPath(file.path),
      content: file.content,
    }))
    .filter((file) => file.path);
}

function mergeFiles(existing: unknown, generated: unknown) {
  const files = [...normalizeFiles(existing)];

  for (const generatedFile of normalizeFiles(generated)) {
    const index = files.findIndex(
      (file) =>
        cleanPath(file.path).toLowerCase() ===
        cleanPath(generatedFile.path).toLowerCase()
    );

    if (index >= 0) {
      files[index] = generatedFile;
    } else {
      files.push(generatedFile);
    }
  }

  return files;
}

function getIndex(files: unknown) {
  return normalizeFiles(files).find(
    (file) =>
      cleanPath(file.path).toLowerCase() === "index.html"
  );
}

/* =========================================================
   STAGE INSTRUCTIONS
========================================================= */

function getStagePrompt(stage: number) {
  const stages: Record<number, string> = {
    1: `
STAGE 1 — REAL PRODUCT FOUNDATION

Build the actual product requested by the user.

Do NOT build a generic website.

Requirements:
- Complete HTML5 document
- Product-specific branding and content
- Product-specific screens
- Realistic demo data
- Mobile-first responsive UI
- Vanilla JavaScript
- Everything in index.html
- Working navigation
- Working important buttons
- Working basic interactions

CRITICAL BUTTON RULE:

Every visible important button must perform a real action.

Do not create buttons that:
- do nothing
- only console.log()
- only alert()
- exist only for decoration

Use real event listeners and real application state.

The application must already behave like the requested product after Stage 1.
`,

    2: `
STAGE 2 — DATA AND APPLICATION STATE

Continue the SAME application.

Do not replace it with a new template.

Implement:
- coherent application state
- realistic data
- localStorage where appropriate
- load/save helpers
- add/update/delete helpers where appropriate
- UI rendered from state

Important actions must:
1. read state
2. update state
3. save state when appropriate
4. update the UI

Every important button must remain functional.
`,

    3: `
STAGE 3 — COMPLETE USER WORKFLOWS

Continue the SAME application.

Implement the primary workflow requested by the user.

Examples:

Food delivery:
browse → search → category → restaurant → food → cart → checkout

Booking:
browse → select → date/time → booking → confirmation

Inventory:
products → add/edit → stock → transactions → totals

Use the workflow appropriate to the actual user request.

Navigation, search, filtering and forms must actually work.

Do not create disconnected mock screens.
`,

    4: `
STAGE 4 — INTERACTIONS, CRUD AND FORMS

Continue the SAME application.

Repair and implement important actions:

- Add
- Edit
- Delete
- Save
- Cancel
- Search
- Filter
- Submit
- Select
- Quantity controls
- Navigation
- Checkout where applicable

Every important action must:
- have a real event handler
- validate input when necessary
- update application state
- persist data where appropriate
- re-render affected UI
- provide useful feedback

No fake buttons.
No alert-only functionality.
`,

    5: `
STAGE 5 — BUSINESS LOGIC

Continue the SAME application.

Implement the real business rules required by the user's product.

All calculations must come from live application state.

Examples for a food app:
- quantities
- subtotal
- delivery fee
- total
- cart badge
- order creation
- order status

Use rules appropriate to the actual requested application.

When state changes, every dependent display must update.
`,

    6: `
STAGE 6 — FINAL INTERACTION AND QUALITY REPAIR

Do NOT redesign the application.

Inspect the SAME application.

Repair:
- dead buttons
- missing event listeners
- navigation failures
- broken forms
- broken search
- broken filtering
- broken add/edit/delete
- quantity controls
- cart
- checkout
- calculations
- localStorage
- UI refresh problems
- mobile interaction problems

Remove generic template remnants.

The final index.html must be a genuine functional browser application.
`,
  };

  return stages[stage] || stages[6];
}

/* =========================================================
   SYSTEM PROMPT
========================================================= */

function buildSystemPrompt(stage: number) {
  return `
You are BOMBA AI's production Universal Application Builder.

Your job is to BUILD the actual application requested by the user.

You are NOT a coding tutor.

You are NOT generating a generic demo.

You are NOT explaining how the user could build the app.

You are building the app.

==================================================
NON-NEGOTIABLE PRODUCT RULE
==================================================

The user's request is the source of truth.

If the user requests QuickChop food delivery,
build QuickChop food delivery.

Do not replace it with:
- My Modern App
- Modern Web App
- generic Home/About/Contact
- generic dashboard
- tutorial
- placeholder website

The generated UI must visibly represent the requested product.

==================================================
TECHNOLOGY
==================================================

Use only:
- HTML
- CSS
- Vanilla JavaScript

No:
- React
- Vue
- Svelte
- Next.js
- npm packages
- framework dependencies

Everything should normally be contained inside:
index.html

It must run directly in a browser or iframe.

==================================================
REAL APPLICATION RULE
==================================================

The result must behave like an application.

Every important visible interactive element must work.

Buttons must not:
- do nothing
- only console.log()
- only alert()
- pretend an action happened

Use real event listeners.

When an action changes application data:

1. update state
2. save state when appropriate
3. re-render affected UI

==================================================
PRODUCT-SPECIFIC FUNCTIONALITY
==================================================

Implement functionality appropriate to the requested product.

For example, a food delivery app may need:

- location
- search
- categories
- restaurants
- food items
- ratings
- delivery information
- cart
- quantities
- checkout
- orders

Do NOT add unrelated features just because they are in the example.

==================================================
DESIGN
==================================================

Create a professional mobile-first application.

Use:
- clear hierarchy
- polished spacing
- responsive layout
- usable buttons
- readable typography
- realistic content
- useful empty/error states

The result should feel like a real application, not a coding exercise.

==================================================
NIGERIA
==================================================

Use Nigerian context and ₦ where appropriate unless the user requests otherwise.

==================================================
YEAR
==================================================

Do not hard-code 2023.

Use:
new Date().getFullYear()

==================================================
PRESERVE EXISTING APP
==================================================

If existing code is provided:

- continue the SAME application
- preserve working features
- improve it
- do not replace it with a generic application
- do not remove existing functionality unnecessarily

==================================================
CURRENT STAGE
==================================================

Stage ${stage}

${getStagePrompt(stage)}

==================================================
OUTPUT
==================================================

Return ONLY valid JSON:

{
  "files": [
    {
      "path": "index.html",
      "content": "<complete HTML document>"
    }
  ],
  "summary": "short description"
}

No markdown.
No code fences.
No explanation outside JSON.
`;
}

/* =========================================================
   BASIC VALIDATION
========================================================= */

function validateApp(html: string) {
  const content = String(html || "").trim();
  const lower = content.toLowerCase();

  if (content.length < 1000) {
    return {
      valid: false,
      reason: "Application is too small.",
    };
  }

  if (
    !lower.includes("<!doctype html") &&
    !lower.includes("<html")
  ) {
    return {
      valid: false,
      reason: "Missing HTML document.",
    };
  }

  if (!lower.includes("<body")) {
    return {
      valid: false,
      reason: "Missing body.",
    };
  }

  if (!lower.includes("<script")) {
    return {
      valid: false,
      reason: "Missing JavaScript.",
    };
  }

  if (
    !lower.includes("addeventlistener") &&
    !lower.includes("onclick")
  ) {
    return {
      valid: false,
      reason: "No event handling detected.",
    };
  }

  const genericFallbacks = [
    "welcome to my modern app",
    "my modern app",
    "modern web app example",
  ];

  const genericFound = genericFallbacks.some((text) =>
    lower.includes(text)
  );

  if (genericFound) {
    return {
      valid: false,
      reason:
        "Generic application fallback detected.",
    };
  }

  return {
    valid: true,
    reason: "",
  };
}

/* =========================================================
   BUTTON DOCTOR
========================================================= */

async function runButtonDoctor(
  html: string,
  originalRequest: string
) {
  const prompt = `
You are BOMBA AI's Interaction Repair Engineer.

The user requested:

${originalRequest}

You are given the CURRENT complete application.

Your job is to repair broken interactions while preserving the existing application.

IMPORTANT:

Do NOT redesign the application.

Do NOT replace the product.

Do NOT create a new template.

Inspect the code for:

- buttons that do nothing
- navigation that does not work
- search that does not work
- filters that do not work
- forms that do not submit
- add buttons that do not update state
- quantity buttons that do not update state
- cart buttons that do not update the cart
- checkout actions that do not work
- edit/delete/save actions that do not work
- event listeners attached to missing elements
- JavaScript references to nonexistent DOM elements
- obvious runtime errors

Rules:

- Use real event listeners.
- Do not use alert() as the implementation of a feature.
- Do not use console.log() as the implementation of a feature.
- Preserve working functionality.
- Preserve the existing design.
- Keep the requested product.
- Return the COMPLETE index.html.

Return JSON only:

{
  "files": [
    {
      "path": "index.html",
      "content": "complete repaired HTML"
    }
  ],
  "summary": "short description of repairs"
}

CURRENT APPLICATION:

${html}
`;

  const completion =
    await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.1,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content:
            "You repair real web applications. Preserve existing functionality. Return JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

  const raw =
    completion.choices?.[0]?.message?.content;

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    const files = normalizeFiles(parsed?.files);

    const index = files.find(
      (file) =>
        cleanPath(file.path).toLowerCase() ===
        "index.html"
    );

    return index || null;
  } catch {
    return null;
  }
}

/* =========================================================
   AI DOCTOR
========================================================= */

async function runDoctor(
  html: string,
  originalRequest: string
) {
  try {
    const response = await fetch(
      new URL("/api/doctor", "http://localhost")
    );

    return response;
  } catch {
    return null;
  }
}

/* =========================================================
   MAIN HANDLER
========================================================= */

export async function POST(req: Request) {
  try {
    /* =====================================================
       CONFIG
    ===================================================== */

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          error:
            "Supabase environment variables are not configured.",
        },
        { status: 500 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "OpenAI API key is not configured.",
        },
        { status: 500 }
      );
    }

    /* =====================================================
       AUTH
    ===================================================== */

    const authHeader =
      req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          error:
            "Please log in before building.",
        },
        { status: 401 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error:
            "Your login session could not be verified.",
        },
        { status: 401 }
      );
    }

    /* =====================================================
       INPUT
    ===================================================== */

    const body = await req.json();

    const projectId =
      typeof body?.projectId === "string"
        ? body.projectId.trim()
        : "";

    const originalRequest =
      typeof body?.originalRequest === "string"
        ? body.originalRequest.trim()
        : "";

    const plan = body?.plan;

    if (!projectId || !originalRequest || !plan) {
      return NextResponse.json(
        {
          error:
            "Missing projectId, originalRequest or plan.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       LOAD PROJECT
    ===================================================== */

    const {
      data: project,
      error: projectError,
    } = await supabase
      .from("builder_projects")
      .select("*")
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        {
          error: "Project not found.",
        },
        { status: 404 }
      );
    }

    const stages = Array.isArray(plan.buildStages)
      ? plan.buildStages
      : [];

    const totalStages =
      stages.length > 0
        ? stages.length
        : 6;

    const currentStage = Math.max(
      0,
      Number(project.current_stage || 0)
    );

    const nextStage =
      currentStage + 1;

    /* =====================================================
       ALREADY COMPLETE
    ===================================================== */

    if (nextStage > totalStages) {
      return NextResponse.json({
        success: true,
        project,
        completed: true,
        files: normalizeFiles(
          project.project_files
        ),
        continueBuild: false,
        nextStage: null,
        summary:
          "Build already complete.",
      });
    }

    const stageMeta =
      stages[nextStage - 1] || {
        name:
          `Stage ${nextStage}`,
        description:
          "Continue building the requested application.",
      };

    /* =====================================================
       EXISTING FILES
    ===================================================== */

    const existingFiles =
      normalizeFiles(
        project.project_files
      );

    const existingIndex =
      getIndex(existingFiles);

    /*
      IMPORTANT:
      We do NOT arbitrarily slice the existing application.

      The application must be preserved.
    */

    const existingApplication =
      existingIndex
        ? `
CURRENT APPLICATION:

The following is the current master index.html.

Continue this SAME application.
Preserve working functionality.
Improve it according to the current stage.

${existingIndex.content}
`
        : `
There is no existing application yet.

Create the complete product requested by the user.
`;

    /* =====================================================
       GENERATION
    ===================================================== */

    const systemPrompt =
      buildSystemPrompt(nextStage);

    const userPrompt = `
USER'S ORIGINAL REQUEST:

${originalRequest}

PROJECT PLAN:

${JSON.stringify(
  plan,
  null,
  2
)}

CURRENT STAGE:

Stage ${nextStage} of ${totalStages}

Stage name:
${stageMeta.name}

Stage description:
${stageMeta.description}

${existingApplication}

Build the actual requested product.

Do not create a tutorial.

Do not create a generic template.

Do not remove working functionality.

Return only valid JSON.
`;

    const completion =
      await openai.chat.completions.create({
        model: MODEL,
        temperature: 0.25,
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "system",
            content:
              systemPrompt,
          },
          {
            role: "user",
            content:
              userPrompt,
          },
        ],
      });

    const raw =
      completion.choices?.[0]?.message?.content;

    if (!raw) {
      return NextResponse.json(
        {
          error:
            "BOMBA AI returned an empty build response.",
        },
        { status: 500 }
      );
    }

    /* =====================================================
       PARSE
    ===================================================== */

    let result: any;

    try {
      result = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        {
          error:
            "BOMBA AI returned invalid JSON.",
        },
        { status: 500 }
      );
    }

    const generatedFiles =
      normalizeFiles(result?.files);

    const generatedIndex =
      generatedFiles.find(
        (file) =>
          cleanPath(file.path)
            .toLowerCase() ===
          "index.html"
      );

    if (!generatedIndex) {
      return NextResponse.json(
        {
          error:
            "BOMBA AI did not return index.html.",
        },
        { status: 500 }
      );
    }

    /* =====================================================
       GENERATION VALIDATION
    ===================================================== */

    const generatedValidation =
      validateApp(
        generatedIndex.content
      );

    if (!generatedValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          retryable: true,
          error:
            `Generated application failed basic validation: ${generatedValidation.reason}`,
        },
        { status: 422 }
      );
    }

    /* =====================================================
       BUTTON DOCTOR
    ===================================================== */

    let repairedCode =
      generatedIndex.content;

    try {
      const buttonFixed =
        await runButtonDoctor(
          repairedCode,
          originalRequest
        );

      if (buttonFixed) {
        const buttonValidation =
          validateApp(
            buttonFixed.content
          );

        if (buttonValidation.valid) {
          repairedCode =
            buttonFixed.content;
        }
      }
    } catch (buttonError) {
      console.error(
        "Button Doctor error:",
        buttonError
      );

      /*
        Button Doctor is a repair layer.

        If it fails, preserve the valid
        generated application instead of
        destroying the build.
      */
    }

    /* =====================================================
       MERGE
    ===================================================== */

    const repairedFiles =
      generatedFiles.map(
        (file) => {
          if (
            cleanPath(
              file.path
            ).toLowerCase() ===
            "index.html"
          ) {
            return {
              ...file,
              content:
                repairedCode,
            };
          }

          return file;
        }
      );

    const files =
      mergeFiles(
        existingFiles,
        repairedFiles
      );

    const finalIndex =
      getIndex(files);

    if (!finalIndex) {
      return NextResponse.json(
        {
          error:
            "Final project does not contain index.html.",
        },
        { status: 500 }
      );
    }

    /* =====================================================
       FINAL BASIC VALIDATION
    ===================================================== */

    const finalValidation =
      validateApp(
        finalIndex.content
      );

    if (!finalValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          retryable: true,
          error:
            `Final application validation failed: ${finalValidation.reason}`,
        },
        { status: 422 }
      );
    }

    /* =====================================================
       SAVE
    ===================================================== */

    const completed =
      nextStage >= totalStages;

    const {
      data: updated,
      error: updateError,
    } = await supabase
      .from("builder_projects")
      .update({
        project_name:
          plan.projectName ||
          project.project_name ||
          "BOMBA Project",

        build_plan:
          plan,

        project_files:
          files,

        current_stage:
          nextStage,

        total_stages:
          totalStages,

        status:
          completed
            ? "completed"
            : "building",

        is_completed:
          completed,

        is_paused:
          false,
      })
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error(
        "Project update error:",
        updateError
      );

      throw updateError;
    }

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json({
      success: true,

      project:
        updated,

      stage: {
        stageNumber:
          nextStage,

        totalStages,

        stageName:
          stageMeta.name,

        completed:
          true,

        summary:
          result?.summary ||
          `Stage ${nextStage} completed.`,
      },

      files,

      completed,

      /*
        The frontend uses these values to
        automatically start the next stage.
      */
      continueBuild:
        !completed,

      nextStage:
        !completed
          ? nextStage + 1
          : null,

      interactionRepair:
        true,

      summary:
        result?.summary ||
        `Stage ${nextStage} completed with interaction repair.`,
    });
  } catch (error: any) {
    console.error(
      "BOMBA Builder error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Builder failed.",
      },
      { status: 500 }
    );
  }
}