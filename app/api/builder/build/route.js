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
      (file) => file.path === generatedFile.path
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

Create a real working application foundation (not a design mockup).

Must include:
- Complete valid HTML5 document
- Professional responsive layout
- Application header
- Working navigation (desktop + mobile)
- Main content area
- Clear theme and reusable UI patterns
- A real home/dashboard screen
- Navigation that actually switches content (using JavaScript)

The shell must already feel like the beginning of a real product.
`,

    2: `
DATA AND STORAGE STAGE

Add a real data layer using vanilla JavaScript.

Must implement:
- Clear data model (arrays of objects)
- Realistic sample/demo data
- localStorage load + save
- Functions to get, add, update, delete data
- Empty states
- UI that is rendered from the data (not hard-coded cards)

All later stages must reuse this data layer.
`,

    3: `
SCREENS AND WORKFLOWS STAGE

Build the major functional screens from the plan.

Navigation must actually switch between sections using JavaScript.
Each screen must be connected to the shared data model.
Do not create disconnected pages.
`,

    4: `
FORMS AND CRUD STAGE

Add real user interaction.

Every important action (Add, Edit, Delete, Save, Cancel) must:
- Have a real event listener
- Validate input
- Update the data model
- Save to localStorage
- Re-render the affected UI
- Show success/error feedback

Buttons that only look clickable are forbidden.
`,

    5: `
BUSINESS LOGIC STAGE

Implement real calculations and rules:
- Totals, subtotals, discounts, stock, status changes, search, filter, sort, dashboard stats, reports, cart, etc.

All numbers and status must come from the live data and update when data changes.
`,

    6: `
UX AND MOBILE STAGE

Improve real usability:
- Fully responsive layout
- Mobile navigation that works
- Empty states, loading states, notifications
- Confirmation for destructive actions
- Better forms and tables on small screens
- Active navigation state

Do not redesign into a different product.
`,

    7: `
INTEGRATION STAGE

Make everything work together as one coherent application.

Verify and fix:
- Navigation
- Forms → data → re-render
- Persistence
- Search/filter
- Calculations
- Status updates
- Modals
- Mobile menu
- No broken features from earlier stages
`,

    8: `
FINAL QA AND REPAIR STAGE

This is the final production pass.

Do NOT start a new design.

Thoroughly inspect and repair:
- Broken or missing event handlers
- Buttons that do nothing
- Broken navigation
- Broken forms / validation
- Broken localStorage
- Broken calculations
- Missing DOM elements / wrong selectors
- Data not syncing with UI
- Mobile issues
- Any JavaScript errors

The final index.html must be a complete, self-contained, directly runnable browser application.
`,
  };

  return instructions[stageNumber] || instructions[8];
}

function buildSystemPrompt(stageNumber) {
  return `
You are the production build engine for a universal AI application builder.

Your only job is to produce a REAL FUNCTIONAL browser application using pure HTML + CSS + Vanilla JavaScript.

==================================================
STRICT RULES
==================================================

1. Build ONLY the current user's project.
2. NEVER mention BOMBA AI unless the user explicitly asked for branding.
3. Use ONLY:
   - HTML
   - CSS
   - Vanilla JavaScript
4. NO React, Vue, Next.js, npm, frameworks, or external dependencies.
5. index.html is the single source of truth and must be completely self-contained.
6. CSS and JavaScript must normally live inside index.html.
7. The file must open and work correctly inside a browser iframe.
8. Prefer a clean architecture inside the single file:
   - Data layer (arrays + localStorage helpers)
   - Render functions that build the UI from data
   - Event binding functions
   - Business logic functions
9. Every important button/link must have a real working event handler that:
   - Changes data
   - Saves to localStorage (when appropriate)
   - Re-renders the UI
10. Do not create fake/demo-only buttons.
11. Continue improving the SAME application. Never throw away working features.
12. If an index.html already exists, return the full improved version of it.
13. Use Nigerian Naira (₦) for money unless the user requested another currency.
14. Make it fully responsive.

==================================================
CURRENT STAGE
==================================================

You are on BUILD STAGE ${stageNumber}.

${stageInstructions(stageNumber)}

==================================================
OUTPUT FORMAT (VERY IMPORTANT)
==================================================

Return ONLY valid JSON in this exact shape:

{
  "files": [
    {
      "path": "index.html",
      "content": "the complete HTML document as a string"
    }
  ],
  "summary": "short description of what was done in this stage"
}

No markdown. No code fences. No explanation outside the JSON.
The index.html content must be complete and runnable.
`;
}

export async function POST(req) {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase environment variables are not configured." },
        { status: 500 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured." },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Please log in before building." },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Your login session could not be verified." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const projectId =
      typeof body?.projectId === "string" ? body.projectId.trim() : "";
    const originalRequest =
      typeof body?.originalRequest === "string"
        ? body.originalRequest.trim()
        : "";
    const plan = body?.plan;

    if (!projectId || !originalRequest || !plan) {
      return NextResponse.json(
        { error: "Missing build data." },
        { status: 400 }
      );
    }

    const { data: project, error: projectError } = await supabase
      .from("builder_projects")
      .select("*")
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .single();

    if (projectError || !project) {
      console.error("Builder project lookup error:", projectError);
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    const stages = Array.isArray(plan.buildStages) ? plan.buildStages : [];
    const totalStages = stages.length > 0 ? stages.length : 8;
    const currentStage = Number(project.current_stage || 0);
    const nextStage = currentStage + 1;

    if (nextStage > totalStages) {
      return NextResponse.json({
        success: true,
        project,
        stage: currentStage,
        files: normalizeFiles(project.project_files),
        completed: true,
        summary: "The application build is already complete.",
      });
    }

    const stage = stages[nextStage - 1] || {
      name: `Build Stage ${nextStage}`,
      description: "Continue building and improving the application.",
    };

    const existingFiles = normalizeFiles(project.project_files);
    const existingIndex = getIndexFile(existingFiles);

    const fileList =
      existingFiles.length > 0
        ? existingFiles.map((file) => `- ${file.path}`).join("\n")
        : "No files have been generated yet.";

    const previousApplicationState = existingIndex
      ? `
THE CURRENT MASTER APPLICATION IS index.html.
You MUST improve this existing file. Do not replace it with a completely different application.

Current index.html:
${existingIndex.content}
`
      : `
There is no existing index.html yet.
Create the application foundation now.
`;

    const systemPrompt = buildSystemPrompt(nextStage);

    const userPrompt = `
CURRENT USER APPLICATION REQUEST:
${originalRequest}

==================================================
PROJECT PLAN:
${JSON.stringify(plan, null, 2)}

==================================================
CURRENT BUILD STAGE:
Stage ${nextStage} of ${totalStages}
Name: ${stage.name}
Description: ${stage.description}

==================================================
FILES CURRENTLY IN PROJECT:
${fileList}

==================================================
CURRENT APPLICATION STATE:
${previousApplicationState}

==================================================
CRITICAL INSTRUCTIONS FOR THIS STAGE:

- Continue the SAME application.
- Preserve all working features from previous stages.
- Return a COMPLETE updated index.html (not a fragment).
- Every important interactive element must have real working JavaScript.
- Prefer this internal structure inside the single HTML file:
  1. Data + localStorage helpers
  2. Render functions
  3. Event binding
  4. Business logic

Stage objective:
${stageInstructions(nextStage)}

Return only the required JSON.
`;

    const response = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.12,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "BOMBA AI could not generate this build stage." },
        { status: 500 }
      );
    }

    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error("Builder JSON parse error:", parseError);
      return NextResponse.json(
        { error: "BOMBA AI returned invalid build data." },
        { status: 500 }
      );
    }

    const generatedFiles = normalizeFiles(result?.files);
    const generatedIndex = generatedFiles.find(
      (file) => file.path.toLowerCase() === "index.html"
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

    if (generatedIndex.content.trim().length < 400) {
      return NextResponse.json(
        {
          error:
            "The generated index.html is too small to be a valid application.",
        },
        { status: 500 }
      );
    }

    const files = mergeFiles(existingFiles, generatedFiles);
    const finalIndex = getIndexFile(files);

    if (!finalIndex) {
      return NextResponse.json(
        { error: "The final project does not contain index.html." },
        { status: 500 }
      );
    }

    const completed = nextStage >= totalStages;

    const { data: updated, error: updateError } = await supabase
      .from("builder_projects")
      .update({
        project_name:
          plan.projectName || project.project_name || "BOMBA Project",
        build_plan: plan,
        project_files: files,
        current_stage: nextStage,
        total_stages: totalStages,
        status: completed ? "completed" : "building",
        is_completed: completed,
        is_paused: false,
      })
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Builder project update error:", updateError);
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      project: updated,
      stage: nextStage,
      files,
      completed,
      summary:
        typeof result?.summary === "string" && result.summary.trim()
          ? result.summary.trim()
          : `Stage ${nextStage} completed successfully.`,
    });
  } catch (error) {
    console.error("Builder build error:", error);
    return NextResponse.json(
      { error: error?.message || "Build failed." },
      { status: 500 }
    );
  }
}