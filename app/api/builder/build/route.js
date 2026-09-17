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

function cleanFilePath(path: unknown) {
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
      path: cleanFilePath(file.path),
      content: file.content,
    }))
    .filter((file) => file.path);
}

function mergeFiles(
  existingFiles: unknown,
  generatedFiles: unknown
) {
  const files = [...normalizeFiles(existingFiles)];

  for (const generatedFile of normalizeFiles(generatedFiles)) {
    const index = files.findIndex(
      (file) =>
        cleanFilePath(file.path).toLowerCase() ===
        cleanFilePath(generatedFile.path).toLowerCase()
    );

    if (index >= 0) {
      files[index] = generatedFile;
    } else {
      files.push(generatedFile);
    }
  }

  return files;
}

function getIndexFile(files: unknown) {
  return normalizeFiles(files).find(
    (file) =>
      cleanFilePath(file.path).toLowerCase() ===
      "index.html"
  );
}

/* =========================================================
   STAGE INSTRUCTIONS
========================================================= */

function stageInstructions(stageNumber: number) {
  const instructions: Record<number, string> = {
    1: `
FOUNDATION + PRODUCT IMPLEMENTATION STAGE

This is NOT a generic website foundation.

FIRST understand the user's requested product.

Build the actual requested product immediately.

The first generated version must already look and behave like the
specific application requested by the user.

For example:

If the user requests a food delivery application:
- Build the food delivery experience.
- Do not create "Modern Web App".
- Do not create generic Home/About/Contact pages.
- Include food categories.
- Include restaurants or food products.
- Include search.
- Include location.
- Include realistic food names.
- Include prices.
- Include ratings where appropriate.
- Include cart functionality where appropriate.

If the user requests a school application:
- Build the school application.

If the user requests an inventory application:
- Build the inventory application.

If the user requests a booking application:
- Build the booking application.

The product type must come from the user's actual request.

Must include:
- Complete valid HTML5 document
- Professional responsive layout
- Product-specific home/dashboard screen
- Product-specific navigation
- Real UI components appropriate to the requested product
- Working JavaScript
- Real event listeners
- Real interactions
- Realistic demo data
- No generic template
- No tutorial
- No placeholder-only interface
- No fake buttons

The application must already be usable in a browser after Stage 1.
`,

    2: `
DATA AND STORAGE STAGE

Continue the SAME requested application.

Do NOT replace the product with another template.

Create a real data model appropriate to the user's requested product.

Must implement:
- JavaScript application state
- Appropriate arrays/objects
- Realistic demo data
- localStorage persistence where appropriate
- Load helpers
- Save helpers
- Add functions
- Update functions
- Delete functions
- Empty states
- UI rendered from application data

For a food delivery application this may include:
- restaurants
- food items
- categories
- cart items
- quantities
- prices
- delivery information
- orders

For another product, use data appropriate to THAT product.

Do not blindly add food-delivery features to unrelated applications.

Data must actually drive the UI.
`,

    3: `
SCREENS AND WORKFLOWS STAGE

Continue the SAME application.

Build the major workflows identified from the user's request and project plan.

Requirements:
- Navigation actually changes views
- Buttons perform real actions
- Forms actually submit
- Search actually searches
- Filters actually filter
- Data changes appear immediately
- Screens share the same application state
- No disconnected mock screens
- No placeholder workflows

The user must be able to complete the important workflow from beginning to end.

For example, if the product is food delivery:
Browse → search → choose food → add to cart → adjust quantity → view cart → checkout.

For other products, implement the workflow appropriate to the requested product.
`,

    4: `
FORMS AND CRUD STAGE

Implement complete user interaction for the requested application.

Every important action must:
- Have a real event listener
- Read user input
- Validate input
- Update application state
- Save appropriate data
- Re-render affected UI
- Give useful success/error feedback

Implement real:
- Add
- Edit
- Delete
- Save
- Cancel
- Search
- Select
- Submit
- Confirm
- Quantity changes
- Filtering where appropriate

Do not use alert() as a substitute for functionality.

Do not create buttons that only appear to work.
`,

    5: `
BUSINESS LOGIC STAGE

Implement the actual business rules of the requested application.

All calculations and status values must come from live application state.

Examples:

Food delivery:
- cart subtotal
- delivery fee
- total
- quantity changes
- restaurant filtering
- category filtering
- search
- order creation
- order status

Inventory:
- stock changes
- sales
- totals
- low stock
- reports

Booking:
- availability
- booking creation
- dates
- status

The examples above are illustrative only.

Use the business rules appropriate to the user's actual request.

When one piece of data changes, every dependent part of the application must update.
`,

    6: `
FINAL FUNCTIONAL QA + MOBILE STAGE

Do NOT redesign the application.

Inspect the SAME application and repair it.

Verify:

- Requested product is actually represented
- Branding/name from the user request is preserved
- Navigation works
- Mobile navigation works
- Search works when applicable
- Categories/filtering work when applicable
- Every important button works
- Forms work
- Add works
- Edit works where applicable
- Delete works where applicable
- Cart works where applicable
- Checkout flow works where applicable
- Business calculations work
- Data updates correctly
- localStorage works where appropriate
- Dashboard values come from live data
- No important JavaScript errors
- No dead buttons
- No fake placeholder interactions
- No generic "Modern Web App" fallback
- No "My Modern App" fallback
- No outdated hard-coded 2023 footer
- Responsive mobile layout works

The final application must be a genuine functional browser application.

Do not simply claim that something works.

Actually implement it.
`,

    7: `
INTEGRATION REPAIR STAGE

Treat the existing application as a production candidate.

Do not redesign it.

Test the complete application flow.

Repair:
- navigation
- data flow
- forms
- CRUD
- persistence
- calculations
- search
- filtering
- business rules
- UI refresh
- mobile behavior
- JavaScript errors

Make sure the features work together.
`,

    8: `
FINAL PRODUCTION QA STAGE

Do not add unnecessary features.

Inspect and repair the complete application.

The final application must:
- Open directly as index.html
- Work without React
- Work without Next.js
- Work without npm
- Work without external packages
- Work inside an iframe
- Have working JavaScript
- Have working navigation
- Have working forms
- Have working business logic
- Preserve browser data where appropriate
- Have no obvious dead buttons
- Have no placeholder-only functionality
- Be responsive on mobile
- Preserve previously completed functionality

Return the complete repaired index.html.
`,
  };

  return instructions[stageNumber] || instructions[6];
}

/* =========================================================
   PRODUCT UNDERSTANDING
========================================================= */

function buildSystemPrompt(stageNumber: number) {
  return `
You are BOMBA AI's PRODUCTION UNIVERSAL APPLICATION BUILD ENGINE.

Your job is NOT to give coding tutorials.

Your job is NOT to provide generic starter templates.

Your job is to ACTUALLY BUILD the application described by the user.

==================================================
CORE PRINCIPLE
==================================================

USER REQUEST = SOURCE OF TRUTH.

You must understand what product the user requested and build THAT PRODUCT.

Never replace a specific product request with:

- "Modern Web App"
- "My Modern App"
- Home/About/Contact starter template
- generic dashboard
- coding tutorial
- explanation of how to build it

If the user says "Build QuickChop food delivery app",
you must build QuickChop.

If the user says "Build a school management app",
you must build a school management app.

If the user says "Build an inventory system",
you must build an inventory system.

The generated interface must visibly reflect the requested product.

==================================================
DO NOT ANSWER THE USER
==================================================

You are the BUILD ENGINE.

Do not say:
"Here's an example..."
"To help you..."
"You can expand..."
"Create these files..."
"If you want..."

BUILD THE APPLICATION.

==================================================
TECHNOLOGY
==================================================

Use ONLY:

- HTML
- CSS
- Vanilla JavaScript

Do NOT use:

- React
- Vue
- Svelte
- Next.js
- npm packages
- build tools
- external JavaScript frameworks

index.html must be complete and directly runnable.

CSS should normally be inside index.html.

JavaScript should normally be inside index.html.

The application must work:
- directly in a browser
- inside an iframe
- without a server unless explicitly required

==================================================
PRODUCT-SPECIFIC UI
==================================================

The UI must be appropriate to the requested product.

Do not use generic sections simply because they are easy to generate.

Generate realistic content appropriate to the user's request.

For a food delivery application, for example:

- brand name
- location selector
- search
- promotional banner
- categories
- restaurant cards
- food cards
- prices
- ratings
- delivery information
- cart
- cart badge
- quantity controls
- checkout
- order state

For other applications, generate components appropriate to THAT application.

==================================================
FUNCTIONALITY
==================================================

Every important button must actually work.

Never create buttons that only:
- alert()
- console.log()
- change decorative styling
- pretend an operation occurred

Implement actual functionality.

If user asks to:
- add → actually add
- edit → actually edit
- delete → actually delete
- search → actually search
- filter → actually filter
- checkout → actually process the browser-side checkout flow
- save → actually save
- submit → actually submit

==================================================
STATE
==================================================

Use coherent application state.

After important changes:

1. update state
2. save state where appropriate
3. re-render UI

Use localStorage when browser persistence makes sense.

==================================================
RESPONSIVE DESIGN
==================================================

The generated application must be mobile-first.

It must also work on desktop.

Do not make a desktop-only interface.

==================================================
CURRENT YEAR
==================================================

Never hard-code an outdated year such as 2023.

Use JavaScript for the current year where appropriate:

new Date().getFullYear()

==================================================
PRESERVE EXISTING APPLICATION
==================================================

If an existing index.html is supplied:

- continue the SAME application
- preserve working functionality
- improve it
- do not replace it with a generic demo
- do not remove working features

==================================================
NIGERIA
==================================================

Use Nigerian context and Nigerian Naira (₦) where appropriate unless the user requests otherwise.

==================================================
CURRENT BUILD STAGE
==================================================

Stage ${stageNumber}

${stageInstructions(stageNumber)}

==================================================
OUTPUT
==================================================

Return ONLY valid JSON.

Format:

{
  "files": [
    {
      "path": "index.html",
      "content": "complete HTML document"
    }
  ],
  "summary": "short description of what was actually built"
}

No markdown.
No code fences.
No explanation outside JSON.
`;
}

/* =========================================================
   APPLICATION VALIDATION
========================================================= */

function validateGeneratedApplication(
  html: string,
  originalRequest: string
) {
  const content = String(html || "").trim();

  if (!content) {
    return {
      valid: false,
      reason: "index.html is empty.",
    };
  }

  if (content.length < 1000) {
    return {
      valid: false,
      reason:
        "index.html is too small to be a meaningful application.",
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
        "Generated file is not a complete HTML document.",
    };
  }

  if (!lower.includes("<body")) {
    return {
      valid: false,
      reason:
        "Generated application does not contain a body.",
    };
  }

  if (!lower.includes("<script")) {
    return {
      valid: false,
      reason:
        "Generated application does not contain JavaScript.",
    };
  }

  if (
    !lower.includes("addeventlistener") &&
    !lower.includes("onclick")
  ) {
    return {
      valid: false,
      reason:
        "Generated application does not contain interactive event handling.",
    };
  }

  const genericFallbacks = [
    "welcome to my modern app",
    "my modern app",
    "modern web app example",
    "home section",
    "about section",
    "contact section",
  ];

  const foundGenericFallback =
    genericFallbacks.some((text) =>
      lower.includes(text)
    );

  if (foundGenericFallback) {
    return {
      valid: false,
      reason:
        "Generated application contains a generic starter-template fallback instead of a product-specific application.",
    };
  }

  if (!originalRequest.trim()) {
    return {
      valid: false,
      reason:
        "Original application request is missing.",
    };
  }

  return {
    valid: true,
    reason: "",
  };
}

/* =========================================================
   POST
========================================================= */

export async function POST(req: Request) {
  try {
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

    const authHeader =
      req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          error: "Please log in before building.",
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
          error: "Missing build data.",
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
      console.error(
        "Builder project lookup error:",
        projectError
      );

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
        stage: currentStage,
        files: normalizeFiles(
          project.project_files
        ),
        completed: true,
        automaticRepair: true,
        summary:
          "The application build is already complete.",
      });
    }

    const stage =
      stages[nextStage - 1] || {
        name: `Build Stage ${nextStage}`,
        description:
          "Continue building the requested application.",
      };

    const existingFiles =
      normalizeFiles(
        project.project_files
      );

    const existingIndex =
      getIndexFile(existingFiles);

    const fileList =
      existingFiles.length > 0
        ? existingFiles
            .map(
              (file) =>
                `- ${file.path}`
            )
            .join("\n")
        : "No files have been generated yet.";

    const previousApplicationState =
      existingIndex
        ? `
THE CURRENT MASTER APPLICATION IS index.html.

CONTINUE THIS APPLICATION.

DO NOT REPLACE IT WITH A GENERIC DEMO.

PRESERVE WORKING FEATURES.

CURRENT index.html:

${existingIndex.content}
`
        : `
NO EXISTING APPLICATION FILE EXISTS YET.

CREATE THE ACTUAL PRODUCT REQUESTED BY THE USER.

Do not create a generic Modern Web App.
`;

    /* =====================================================
       OPENAI BUILD
    ===================================================== */

    const systemPrompt =
      buildSystemPrompt(nextStage);

    const userPrompt = `
==================================================
USER'S ORIGINAL APPLICATION REQUEST
==================================================

${originalRequest}

==================================================
PROJECT PLAN
==================================================

${JSON.stringify(
  plan,
  null,
  2
)}

==================================================
CURRENT BUILD STAGE
==================================================

Stage ${nextStage} of ${totalStages}

Name:
${stage.name}

Description:
${stage.description}

==================================================
CURRENT PROJECT FILES
==================================================

${fileList}

==================================================
CURRENT APPLICATION
==================================================

${previousApplicationState}

==================================================
NON-NEGOTIABLE REQUIREMENT
==================================================

Build the APPLICATION REQUESTED BY THE USER.

Do not give instructions.

Do not give a tutorial.

Do not create a generic example.

Do not create "My Modern App".

Do not create "Modern Web App".

Do not create generic Home/About/Contact sections unless the user explicitly requested them.

Use the actual product name from the user's request.

Use realistic product-specific content.

Implement actual functionality.

The result must be usable.

==================================================
STAGE OBJECTIVE
==================================================

${stageInstructions(nextStage)}

Return only valid JSON.
`;

    const response =
      await openai.chat.completions.create({
        model: MODEL,
        temperature: 0.1,
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
      response.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        {
          error:
            "BOMBA AI could not generate this build stage.",
        },
        { status: 500 }
      );
    }

    /* =====================================================
       PARSE
    ===================================================== */

    let result: any;

    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error(
        "Builder JSON parse error:",
        parseError
      );

      return NextResponse.json(
        {
          error:
            "BOMBA AI returned invalid build data.",
        },
        { status: 500 }
      );
    }

    const generatedFiles =
      normalizeFiles(result?.files);

    const generatedIndex =
      generatedFiles.find(
        (file) =>
          cleanFilePath(file.path)
            .toLowerCase() ===
          "index.html"
      );

    if (!generatedIndex) {
      return NextResponse.json(
        {
          error:
            "BOMBA AI did not return the required index.html application file.",
        },
        { status: 500 }
      );
    }

    /* =====================================================
       INITIAL VALIDATION
    ===================================================== */

    const validation =
      validateGeneratedApplication(
        generatedIndex.content,
        originalRequest
      );

    if (!validation.valid) {
      console.error(
        "Generated application validation failed:",
        validation.reason
      );

      return NextResponse.json(
        {
          success: false,
          error:
            `Generated application failed validation: ${validation.reason}`,
          retryable: true,
        },
        { status: 422 }
      );
    }

    /* =====================================================
       AI DOCTOR
    ===================================================== */

    let doctorResult: any = null;
    let repairedCode =
      generatedIndex.content;

    try {
      const doctorResponse =
        await fetch(
          new URL(
            "/api/doctor",
            req.url
          ),
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              code:
                generatedIndex.content,

              filename:
                generatedIndex.path,

              language: "html",

              mode: "auto-repair",

              userMessage: `
You are the final technical QA engineer for BOMBA AI.

The user's requested application was:

${originalRequest}

Do NOT turn the application into a generic template.

Verify that the generated code actually represents the requested product.

Repair blocking technical problems.

Preserve all working functionality.

Verify:
- JavaScript works
- event listeners work
- navigation works
- forms work
- requested product functionality works
- data state works
- localStorage works where appropriate
- mobile layout works
- buttons are not fake
- no generic Modern Web App fallback remains
- no My Modern App fallback remains
- no outdated hard-coded 2023 year remains

Return the repaired application.
`,
            }),
          }
        );

      doctorResult =
        await doctorResponse.json();

      if (!doctorResponse.ok) {
        console.error(
          "AI Doctor repair failed:",
          doctorResult
        );

        return NextResponse.json(
          {
            success: false,
            error:
              doctorResult?.error ||
              "AI Doctor could not repair the application. The build stage was not saved.",
            doctor:
              doctorResult,
          },
          {
            status:
              doctorResponse.status ||
              500,
          }
        );
      }

      if (!doctorResult?.success) {
        return NextResponse.json(
          {
            success: false,
            error:
              doctorResult?.error ||
              "AI Doctor could not verify the application. The build stage was not saved.",
            doctor:
              doctorResult,
          },
          { status: 422 }
        );
      }

      const returnedCode =
        typeof doctorResult?.repairedCode ===
          "string" &&
        doctorResult.repairedCode.trim()
          ? doctorResult.repairedCode
          : typeof doctorResult?.code ===
              "string" &&
            doctorResult.code.trim()
          ? doctorResult.code
          : generatedIndex.content;

      repairedCode =
        returnedCode;

      /* =====================================================
         DOCTOR VALIDATION
      ===================================================== */

      const repairedValidation =
        validateGeneratedApplication(
          repairedCode,
          originalRequest
        );

      if (!repairedValidation.valid) {
        console.error(
          "AI Doctor returned invalid application:",
          repairedValidation.reason
        );

        return NextResponse.json(
          {
            success: false,
            error:
              `AI Doctor returned an application that failed validation: ${repairedValidation.reason}`,
            doctor:
              doctorResult,
          },
          { status: 422 }
        );
      }
    } catch (doctorError) {
      console.error(
        "AI Doctor connection error:",
        doctorError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "AI Doctor could not be reached. The build stage was not saved.",
        },
        { status: 500 }
      );
    }

    /* =====================================================
       MERGE VERIFIED FILES
    ===================================================== */

    const finalGeneratedFiles =
      generatedFiles.map(
        (file) => {
          if (
            cleanFilePath(
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
        finalGeneratedFiles
      );

    const finalIndex =
      getIndexFile(files);

    if (!finalIndex) {
      return NextResponse.json(
        {
          error:
            "The final project does not contain index.html.",
        },
        { status: 500 }
      );
    }

    const finalValidation =
      validateGeneratedApplication(
        finalIndex.content,
        originalRequest
      );

    if (!finalValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error:
            `Final application validation failed: ${finalValidation.reason}`,
          doctor:
            doctorResult,
        },
        { status: 422 }
      );
    }

    /* =====================================================
       SAVE PROJECT
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
        "Builder project update error:",
        updateError
      );

      throw updateError;
    }

    /* =====================================================
       RESPONSE
    ===================================================== */

    const repairSummary =
      doctorResult?.repair?.summary ||
      doctorResult?.repairSummary ||
      doctorResult?.verification?.summary ||
      "AI Doctor checked and repaired the application.";

    return NextResponse.json({
      success: true,

      project:
        updated,

      doctor:
        doctorResult,

      stage: {
        stageNumber:
          nextStage,

        totalStages,

        stageName:
          stage.name ||
          `Build Stage ${nextStage}`,

        completed:
          true,

        summary:
          typeof result?.summary ===
            "string" &&
          result.summary.trim()
            ? result.summary.trim()
            : `Stage ${nextStage} completed.`,
      },

      files,

      completed,

      automaticRepair:
        true,

      repairSummary,

      /* The frontend can use this to
         automatically continue. */
      continueBuild:
        !completed,

      nextStage:
        !completed
          ? nextStage + 1
          : null,

      summary:
        typeof result?.summary ===
          "string" &&
        result.summary.trim()
          ? `${result.summary.trim()} AI Doctor checked, repaired, and verified the application.`
          : `Stage ${nextStage} completed. AI Doctor checked, repaired, and verified the application.`,
    });
  } catch (error: any) {
    console.error(
      "Builder build error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Build failed.",
      },
      { status: 500 }
    );
  }
}