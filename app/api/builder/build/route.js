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

function cleanFilePath(path) {
  return String(path || "")
    .trim()
    .replace(/^\/+/, "");
}

function normalizeFiles(files) {
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

function mergeFiles(existingFiles, generatedFiles) {
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

function getIndexFile(files) {
  return files.find(
    (file) =>
      cleanFilePath(file.path).toLowerCase() === "index.html"
  );
}

function stageInstructions(stageNumber) {
  const instructions = {
    1: `
FOUNDATION STAGE

Create a real working application foundation.

Must include:
- Complete valid HTML5 document
- Professional responsive layout
- Application header
- Working navigation
- Desktop and mobile navigation
- Main content area
- Real dashboard/home screen
- JavaScript-based screen switching
- Real event listeners
- No fake buttons

The application must already run directly in a browser.
`,

    2: `
DATA AND STORAGE STAGE

Add the application's real data layer.

Must implement:
- Clear JavaScript data model
- Arrays/objects representing application data
- Realistic initial/demo data where appropriate
- localStorage load helpers
- localStorage save helpers
- Add functions
- Update functions
- Delete functions
- Empty states
- UI rendered from live data

Do not hard-code data into visual cards when the data should be dynamic.

The application must preserve data after browser refresh.
`,

    3: `
SCREENS AND WORKFLOWS STAGE

Build the major functional screens from the project plan.

Requirements:
- Navigation actually switches screens
- Screens use the shared application state
- Forms actually submit
- Buttons perform real actions
- Data changes are reflected immediately
- No disconnected mock pages
- No placeholder interactions

Every major workflow must be usable from beginning to end.
`,

    4: `
FORMS AND CRUD STAGE

Implement complete user interaction.

Every important action must:
- Have a real event listener
- Read the user's input
- Validate the input
- Update application state
- Save appropriate data
- Re-render the affected UI
- Give success or error feedback

Implement real:
- Add
- Edit
- Delete
- Save
- Cancel
- Search
- Select
- Submit
- Confirm actions

Buttons that only show an alert or console.log instead of performing the requested operation are forbidden.
`,

    5: `
BUSINESS LOGIC STAGE

Implement the actual business rules of the requested application.

All calculations and status values must come from live application data.

Examples include:
- Totals
- Subtotals
- Sales
- Stock changes
- Low-stock rules
- Search
- Filtering
- Sorting
- Reports
- Cart calculations
- Status changes
- Dashboard statistics
- Relationships between records

When one piece of data changes, every dependent part of the application must update.

For example, if the application records a sale, inventory must actually decrease and dashboard totals must update.
`,

    6: `
FINAL FUNCTIONAL QA + MOBILE STAGE

This is the final build stage.

DO NOT create a new design.

Thoroughly inspect the existing application and repair it.

Verify ALL of the following:

- Navigation works
- Mobile navigation works
- Every important button has a working event listener
- Forms work
- Add works
- Edit works
- Delete works
- Search works
- Business calculations work
- Data updates correctly
- localStorage saves data
- localStorage restores data after refresh
- Dependent dashboard values update
- No important JavaScript errors remain
- No missing DOM selectors remain
- No dead buttons remain
- No fake placeholder interactions remain
- Empty states work
- Confirmation dialogs work where appropriate
- Responsive layout works on mobile
- Existing working features are preserved

The final index.html must be a complete, self-contained, directly runnable browser application.

This is a FUNCTIONAL application test, not a visual design test.
`,

    7: `
INTEGRATION REPAIR STAGE

If this stage is reached, treat the existing application as a production candidate.

Do not redesign it.

Test the entire application flow from start to finish.

Repair:
- Navigation
- Data flow
- Forms
- CRUD
- localStorage
- Calculations
- Search
- Filtering
- Business rules
- UI refresh
- Mobile behavior
- JavaScript errors

Make sure features work together instead of working only in isolation.
`,

    8: `
FINAL PRODUCTION QA STAGE

This is the final verification pass.

Do not add unnecessary features.

Inspect and repair the complete application.

The final application must:
- Open directly as index.html
- Work without React, Next.js, npm, or external packages
- Work inside an iframe
- Have working JavaScript
- Have working navigation
- Have working forms
- Have working business logic
- Preserve browser data when appropriate
- Have no obvious dead buttons
- Have no placeholder-only functionality
- Be responsive on mobile
- Preserve all previously completed functionality

Return the complete repaired index.html.
`,
  };

  return instructions[stageNumber] || instructions[6];
}

function buildSystemPrompt(stageNumber) {
  return `
You are the production build engine for a universal AI application builder.

Your job is to produce a REAL FUNCTIONAL browser application.

You are NOT a UI mockup generator.

==================================================
STRICT TECHNOLOGY RULES
==================================================

1. Build ONLY the current user's requested application.

2. Use ONLY:
   - HTML
   - CSS
   - Vanilla JavaScript

3. Do NOT use:
   - React
   - Vue
   - Svelte
   - Next.js
   - npm packages
   - build tools
   - external JavaScript frameworks

4. index.html must be a complete self-contained HTML document.

5. CSS should normally be inside index.html.

6. JavaScript should normally be inside index.html.

7. The application must run by opening index.html directly.

8. The application must run inside a browser iframe.

9. Do not depend on a server unless the user's request explicitly requires a server.

10. For browser-only applications, use localStorage for persistence when appropriate.

==================================================
FUNCTIONAL APPLICATION RULES
==================================================

1. Every important button MUST perform the requested action.

2. Never create buttons that only:
   - alert()
   - console.log()
   - change a decorative CSS class
   - pretend an operation happened

3. If a user asks to add something, implement real adding.

4. If a user asks to edit something, implement real editing.

5. If a user asks to delete something, implement real deletion.

6. If a user asks to record a transaction, implement the transaction.

7. If a transaction affects another part of the application, update that part too.

8. If data should persist, save it to localStorage.

9. On startup, load saved data from localStorage.

10. After every important data change:
    - update state
    - save state
    - render the affected UI

11. Dashboard numbers must come from real application state.

12. Search must actually filter the displayed records.

13. Forms must validate input.

14. Empty states must work.

15. Error states must work.

16. Mobile navigation must actually work.

17. Do not leave unfinished placeholder functionality.

==================================================
ARCHITECTURE
==================================================

Prefer this structure inside index.html:

1. Application state/data
2. localStorage helpers
3. Utility functions
4. Render functions
5. Navigation functions
6. Form functions
7. CRUD functions
8. Business logic
9. Event binding
10. Initial application startup

Keep the application coherent.

Do not create disconnected screens.

==================================================
CURRENT BUILD STAGE
==================================================

Stage ${stageNumber}

${stageInstructions(stageNumber)}

==================================================
PRESERVE EXISTING APPLICATION
==================================================

If an existing index.html is provided:

- Continue the SAME application.
- Preserve working features.
- Improve the existing application.
- Do not replace it with an unrelated demo.
- Do not remove working functionality.
- Do not return fragments.
- Return the COMPLETE updated index.html.

==================================================
MONEY
==================================================

Use Nigerian Naira (₦) when money is required unless the user explicitly requests another currency.

==================================================
OUTPUT
==================================================

Return ONLY valid JSON:

{
  "files": [
    {
      "path": "index.html",
      "content": "complete HTML document"
    }
  ],
  "summary": "short description"
}

No markdown.
No code fences.
No explanation outside JSON.
`;
}

function validateGeneratedApplication(html) {
  const content = String(html || "").trim();

  if (!content) {
    return {
      valid: false,
      reason: "index.html is empty.",
    };
  }

  if (content.length < 400) {
    return {
      valid: false,
      reason:
        "index.html is too small to be a complete application.",
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
        "Generated index.html is not a complete HTML document.",
    };
  }

  if (!lower.includes("<body")) {
    return {
      valid: false,
      reason:
        "Generated index.html does not contain a body.",
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
        "Generated application does not appear to contain interactive event handling.",
    };
  }

  return {
    valid: true,
    reason: "",
  };
}

export async function POST(req) {
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

    const authHeader = req.headers.get("authorization");

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
    } = await supabase.auth.getUser();

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
          error:
            "Missing build data.",
        },
        { status: 400 }
      );
    }

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
          error:
            "Project not found.",
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

    if (nextStage > totalStages) {
      return NextResponse.json({
        success: true,
        project,
        stage: currentStage,
        files: normalizeFiles(
          project.project_files
        ),
        completed: true,
        summary:
          "The application build is already complete.",
      });
    }

    const stage =
      stages[nextStage - 1] || {
        name: `Build Stage ${nextStage}`,
        description:
          "Continue building and improving the application.",
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

You MUST improve this existing application.

Do NOT replace it with an unrelated demo.

Preserve working features.

CURRENT index.html:
${existingIndex.content}
`
        : `
There is no existing index.html yet.

Create the complete application foundation now.
`;

    const systemPrompt =
      buildSystemPrompt(
        nextStage
      );

    const userPrompt = `
CURRENT USER APPLICATION REQUEST:
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
CRITICAL BUILD REQUIREMENTS
==================================================

Continue the SAME application.

Preserve working functionality.

Return a COMPLETE updated index.html.

The final application must be genuinely functional.

Do not create visual-only buttons.

Do not use fake interactions.

Do not merely describe functionality.

Actually implement the JavaScript required for the requested functionality.

If the application needs browser persistence, implement localStorage.

If the application has related data, make sure changes propagate correctly.

If a sale changes inventory, inventory must actually change.

If a product is deleted, it must actually disappear from the data.

If a dashboard displays totals, those totals must be calculated from the live data.

If a search field is requested, it must actually filter the records.

If the application contains forms, the forms must actually submit and update state.

==================================================
STAGE OBJECTIVE
==================================================

${stageInstructions(
  nextStage
)}

Return only the required JSON.
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

    let result;

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
      normalizeFiles(
        result?.files
      );

    const generatedIndex =
      generatedFiles.find(
        (file) =>
          cleanFilePath(
            file.path
          ).toLowerCase() ===
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

    const validation =
      validateGeneratedApplication(
        generatedIndex.content
      );

    if (!validation.valid) {
      console.error(
        "Generated application validation failed:",
        validation.reason
      );

      return NextResponse.json(
        {
          error:
            `Generated application failed functional validation: ${validation.reason}`,
        },
        { status: 500 }
      );
    }

    // ==========================================
    // AI DOCTOR — DIAGNOSIS ONLY
    // ==========================================

    let doctorDiagnosis = null;

    try {
      const doctorResponse = await fetch(
        new URL("/api/doctor", req.url),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: generatedIndex.content,
            filename: generatedIndex.path,
            language: "html",
            userMessage:
              "Diagnose this generated application before the Builder saves this stage. Do not repair it.",
          }),
        }
      );

      const doctorResult =
        await doctorResponse.json();

      if (!doctorResponse.ok || !doctorResult?.success) {
        console.error(
          "AI Doctor diagnosis failed:",
          doctorResult
        );

        return NextResponse.json(
          {
            error:
              "AI Doctor could not complete the diagnosis. The build stage was not saved.",
            doctor: doctorResult,
          },
          { status: 500 }
        );
      }

      doctorDiagnosis =
        doctorResult.diagnosis || null;

      const doctorErrors =
        Array.isArray(
          doctorDiagnosis?.errors
        )
          ? doctorDiagnosis.errors
          : [];

      const blockingErrors =
        doctorErrors.filter(
          (error) =>
            ["high", "critical"].includes(
              String(
                error?.severity || ""
              ).toLowerCase()
            )
        );

      if (blockingErrors.length > 0) {
        console.error(
          "AI Doctor found blocking errors:",
          blockingErrors
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "AI Doctor found blocking problems in the generated application. The build stage was not saved.",
            doctor: doctorDiagnosis,
            stage: {
              stageNumber: nextStage,
              stageName:
                stage.name ||
                `Build Stage ${nextStage}`,
            },
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
          error:
            "AI Doctor could not be reached. The build stage was not saved.",
        },
        { status: 500 }
      );
    }

    const files =
      mergeFiles(
        existingFiles,
        generatedFiles
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

    return NextResponse.json({
      success: true,

      project: updated,

      doctor: doctorDiagnosis,

      stage: {
        stageNumber: nextStage,
        stageName:
          stage.name ||
          `Build Stage ${nextStage}`,
        summary:
          typeof result?.summary ===
            "string" &&
          result.summary.trim()
            ? result.summary.trim()
            : `Stage ${nextStage} completed successfully.`,
      },

      files,

      completed,

      summary:
        typeof result?.summary ===
          "string" &&
        result.summary.trim()
          ? result.summary.trim()
          : `Stage ${nextStage} completed successfully.`,
    });
  } catch (error) {
    console.error(
      "Builder build error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Build failed.",
      },
      { status: 500 }
    );
  }
}