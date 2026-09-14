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

Create the real application foundation.

You must establish:

- Complete HTML document
- Professional responsive layout
- Application header
- Desktop navigation/sidebar where appropriate
- Mobile navigation
- Main content area
- Application theme
- Reusable UI patterns
- Main dashboard or home screen
- Navigation targets for the major planned sections
- Basic responsive behavior

Do not build disconnected visual cards.

The application shell must already feel like the beginning of the final product.
`,

    2: `
DATA AND STORAGE STAGE

Add the application's real data layer using browser JavaScript.

Implement:

- A clear data model
- Realistic demo/sample data
- localStorage persistence where appropriate
- Loading data from localStorage
- Saving changes to localStorage
- Empty states
- Basic data rendering

Do not merely display hard-coded cards.

If the application manages products, customers, students, patients, medicines, orders, inventory, employees, appointments, etc., create appropriate realistic data structures.

The data created here must be usable by later stages.
`,

    3: `
SCREENS AND WORKFLOWS STAGE

Build the major functional screens described by the project plan.

Examples include:

- Dashboard
- Records/list screen
- Details screen
- Add/create screen
- Edit screen
- Reports
- Settings
- Inventory
- Orders
- Customers
- Students
- Patients
- Products
- Appointments
- Other domain-specific sections

Use the existing application shell and data model.

Navigation must actually switch between sections.

Do not create unrelated standalone pages.
`,

    4: `
FORMS AND CRUD STAGE

Add real user interaction.

Where relevant implement:

- Add
- Edit
- Delete
- Save
- Cancel
- Forms
- Form validation
- Required fields
- Error messages
- Success messages
- Confirmation dialogs
- Modal dialogs
- localStorage updates

Every important button must have a real JavaScript event handler.

Do not create buttons that only look clickable.
`,

    5: `
BUSINESS LOGIC STAGE

Implement the important business rules of the requested application.

Depending on the application, this may include:

- Calculations
- Totals
- Subtotals
- Discounts
- Stock calculations
- Profit calculations
- Order status
- Payment status
- Appointment status
- Inventory status
- Search
- Filtering
- Sorting
- Dashboard statistics
- Reports
- Cart logic
- Checkout logic
- Workflow state changes

Use real JavaScript calculations based on application data.

Do not use fake numbers that do not update when the underlying data changes.
`,

    6: `
UX AND MOBILE STAGE

Improve the actual usability of the application.

Implement:

- Responsive mobile layout
- Mobile navigation
- Useful empty states
- Loading states where appropriate
- Success/error notifications
- Confirmation prompts
- Better forms
- Better table/list behavior on small screens
- Clear active navigation state
- Accessible buttons and controls
- Sensible spacing and hierarchy
- Prevention of accidental destructive actions

Do not redesign the application into an unrelated product.

Improve what already exists.
`,

    7: `
INTEGRATION STAGE

Now integrate the entire application into ONE coherent system.

Verify that:

- Navigation works
- All important screens are connected
- Forms modify the correct data
- Data persists
- Search works
- Filters work
- Calculations update
- Status changes update the UI
- Dashboard numbers reflect the underlying data
- Modals open and close
- Buttons perform their intended actions
- Mobile navigation works
- Existing functionality from earlier stages remains intact

Repair inconsistencies instead of creating duplicate systems.

The result should feel like one finished browser application.
`,

    8: `
FINAL QA AND REPAIR STAGE

This is the final production-quality browser prototype pass.

Do NOT start a new design.

Inspect the complete application logically and repair it.

Check:

- Broken JavaScript
- Missing event handlers
- Broken navigation
- Broken forms
- Broken calculations
- Broken localStorage
- Missing DOM elements
- Invalid selectors
- Buttons that do nothing
- Search/filter problems
- Modal problems
- Mobile layout problems
- Data synchronization problems
- Empty-state problems
- Status update problems
- Duplicate functionality
- Inconsistent naming
- Visual layout problems

Make the final index.html self-contained and directly runnable in a browser.

The final application must be usable, not merely impressive-looking.
`,
  };

  return (
    instructions[stageNumber] ||
    instructions[8]
  );
}

function buildSystemPrompt(stageNumber) {
  return `
You are the production build engine for a universal AI application builder.

Your job is to transform the user's CURRENT application request into a REAL FUNCTIONAL BROWSER PROTOTYPE.

This is NOT a design-only task.

The generated application must actually work.

==================================================
CORE RULES
==================================================

1. Build ONLY the current user's project.

2. NEVER reuse unrelated applications or previous user projects.

3. NEVER mention BOMBA AI inside the generated application unless the user explicitly requests BOMBA AI branding.

4. The generated application must be a real browser application.

5. Use:
   - HTML
   - CSS
   - Vanilla JavaScript

6. Do NOT use:
   - React
   - Next.js
   - npm packages
   - build systems
   - server APIs
   - frameworks
   - external dependencies required for the application to function

7. index.html MUST be the primary browser entry point.

8. index.html must be self-contained.

9. CSS should normally be inside index.html.

10. JavaScript should normally be inside index.html.

11. The final index.html must be capable of opening directly inside a browser iframe.

12. Do not create a fake interface where buttons only look functional.

13. Every important interactive control must have working JavaScript.

14. Use realistic sample data when useful.

15. Use localStorage for browser persistence when appropriate.

16. Make the application responsive on phones and desktops.

17. Use Nigerian context and ₦ for money-related Nigerian applications unless the user requests another currency.

18. Do not replace working functionality with unrelated functionality.

19. Continue improving the SAME application.

20. Preserve functionality from previous stages.

21. If index.html already exists, modify and improve it.

22. Do not create a completely new unrelated index.html at every stage.

==================================================
APPLICATION ARCHITECTURE
==================================================

Think of the generated application as a small real software product.

It should normally contain:

- application shell
- navigation
- data layer
- UI rendering
- event handling
- business logic
- persistence
- responsive behavior

Keep the architecture coherent.

Use consistent IDs, classes, data structures and function names.

Do not create multiple competing implementations of the same feature.

==================================================
FUNCTIONALITY RULE
==================================================

A button is not functional simply because it has an onclick-looking appearance.

If you create:

Add Product

there must be JavaScript that actually adds a product.

If you create:

Delete

there must be JavaScript that actually deletes the correct record.

If you create:

Search

there must be JavaScript that actually filters the data.

If you create:

Checkout

there must be JavaScript that actually calculates the order and updates the appropriate state.

If you create:

Change Status

the underlying record must actually change.

==================================================
DATA RULE
==================================================

For data-driven applications:

- Define clear data structures.
- Load initial demo data.
- Read persisted data from localStorage.
- Save changes back to localStorage.
- Re-render the affected UI after changes.

Avoid hard-coded UI values when they should come from data.

Dashboard statistics should be calculated from the application's data.

==================================================
FORMS RULE
==================================================

Forms should include:

- sensible labels
- appropriate input types
- required fields where appropriate
- validation
- error feedback
- successful save behavior
- cancel behavior
- data persistence

==================================================
MOBILE RULE
==================================================

The application must work on small phone screens.

Do not simply shrink desktop tables.

Use:

- responsive layout
- horizontal scrolling where necessary
- stacked cards where useful
- mobile navigation
- touch-friendly buttons
- readable typography

==================================================
BUSINESS APPLICATION RULE
==================================================

For business/management applications, prefer real workflows such as:

Dashboard
→ records
→ create
→ edit
→ delete
→ search
→ filter
→ details
→ status
→ reports

The exact workflow depends on the user's project.

==================================================
COMMERCE RULE
==================================================

For commerce applications where relevant:

- products
- product details
- cart
- quantity changes
- subtotal
- total
- checkout
- order creation
- order status

must work together.

==================================================
FINAL QUALITY RULE
==================================================

The final application should feel like a functional prototype that a real person could test.

Do not optimize only for visual appearance.

Prioritize:

FUNCTIONALITY
then
CONSISTENCY
then
USABILITY
then
VISUAL POLISH

==================================================
CURRENT STAGE
==================================================

You are currently generating BUILD STAGE ${stageNumber}.

${stageInstructions(stageNumber)}

==================================================
OUTPUT FORMAT
==================================================

Return ONLY valid JSON.

Use exactly:

{
  "files": [
    {
      "path": "index.html",
      "content": "complete file content"
    }
  ],
  "summary": "short description"
}

The index.html content must be complete.

Do not return Markdown.

Do not use code fences.

Do not return explanations outside the JSON.
`;
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
          error: "Missing build data.",
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
          error: "Project not found.",
        },
        { status: 404 }
      );
    }

    const stages = Array.isArray(
      plan.buildStages
    )
      ? plan.buildStages
      : [];

    const totalStages =
      stages.length > 0
        ? stages.length
        : 8;

    const currentStage =
      Number(project.current_stage || 0);

    const nextStage =
      currentStage + 1;

    if (nextStage > totalStages) {
      return NextResponse.json({
        success: true,
        project,
        stage: currentStage,
        files:
          normalizeFiles(
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

    const existingFilesForAI =
      existingFiles.map((file) => ({
        path: file.path,
        content: file.content,
      }));

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
THE CURRENT MASTER APPLICATION IS:

index.html

The existing index.html MUST be preserved and improved.

Here is the current index.html:

${existingIndex.content}
`
        : `
There is no existing index.html yet.

Create the application foundation now.
`;

    const systemPrompt =
      buildSystemPrompt(nextStage);

    const userPrompt = `
CURRENT USER APPLICATION REQUEST:

${originalRequest}

==================================================

PROJECT PLAN:

${JSON.stringify(
  plan,
  null,
  2
)}

==================================================

CURRENT BUILD STAGE:

Stage ${nextStage} of ${totalStages}

Stage name:
${stage.name}

Stage description:
${stage.description}

==================================================

FILES CURRENTLY IN PROJECT:

${fileList}

==================================================

CURRENT APPLICATION STATE:

${previousApplicationState}

==================================================

IMPORTANT BUILD INSTRUCTION:

You are continuing an existing application.

Do NOT create a separate application.

Do NOT throw away working features.

Do NOT create another unrelated index.html.

The application must continue from the current state.

Stage ${nextStage} must add the functionality required for this stage while preserving the previous functionality.

If an existing index.html exists, return the UPDATED COMPLETE index.html.

The returned index.html must contain everything required to run the application.

Do not return only a partial fragment.

==================================================

STAGE-SPECIFIC OBJECTIVE:

${stageInstructions(nextStage)}

==================================================

FINAL REQUIREMENT:

Return the complete updated application files.

The most important file is:

index.html

It must be complete and directly runnable.
`;

    const response =
      await openai.chat.completions.create({
        model: MODEL,
        temperature: 0.15,
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
      normalizeFiles(result?.files);

    const generatedIndex =
      generatedFiles.find(
        (file) =>
          file.path.toLowerCase() ===
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

    if (
      generatedIndex.content.trim().length <
      200
    ) {
      return NextResponse.json(
        {
          error:
            "The generated index.html is too small to be a valid application.",
        },
        { status: 500 }
      );
    }

    const files = mergeFiles(
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

        build_plan: plan,

        project_files: files,

        current_stage: nextStage,

        total_stages: totalStages,

        status: completed
          ? "completed"
          : "building",

        is_completed: completed,

        is_paused: false,
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

      stage: nextStage,

      files,

      completed,

      summary:
        typeof result?.summary === "string" &&
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