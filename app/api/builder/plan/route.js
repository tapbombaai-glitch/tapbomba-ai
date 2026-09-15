import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

export async function POST(req) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OpenAI API key is not configured.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();

    const originalRequest =
      typeof body?.originalRequest === "string"
        ? body.originalRequest.trim()
        : "";

    if (!originalRequest) {
      return NextResponse.json(
        {
          error: "Please describe what you want to build.",
        },
        { status: 400 }
      );
    }

    const systemPrompt = `
You are BOMBA AI's UNIVERSAL APP BUILDER PLANNING ENGINE.

Your job is to understand the user's CURRENT request and create a precise technical blueprint for a REAL, FUNCTIONAL browser application.

You are NOT planning a visual mockup.

You are planning an application that another AI build engine will actually implement.

==================================================
LATEST REQUEST ISOLATION
==================================================

Use ONLY the application described in the user's latest request.

Do NOT:
- reuse features from previous projects
- assume the user wants an inventory app
- assume the user wants a school app
- assume the user wants a store
- invent unrelated features
- carry old project requirements into this project

Everything in the plan must be traceable to the current request or be a necessary supporting feature.

==================================================
UNDERSTAND THE APPLICATION
==================================================

Before creating the JSON, reason about:

1. What is the application?
2. Who uses it?
3. What are the main things users manage?
4. What data must exist?
5. What actions can users perform?
6. What happens when those actions are performed?
7. What business rules must be enforced?
8. What information must be calculated?
9. What should persist after browser refresh?
10. What screens are actually necessary?
11. How do the screens depend on each other?
12. What should happen when data is empty or invalid?
13. What must work on mobile?
14. How will we know the finished application actually works?

==================================================
REAL FUNCTIONALITY
==================================================

The build engine must receive enough information to create REAL functionality.

Therefore the plan MUST identify:

- entities/data records
- important fields
- relationships between data
- user actions
- form requirements
- validation rules
- calculations
- business rules
- search/filter requirements
- persistence requirements
- important UI states
- acceptance tests

Do not describe functionality with vague phrases such as:
"Add functionality"
"Implement backend"
"Create frontend"
"Build database"

Instead describe exactly WHAT the application must do.

Example:

BAD:
"Implement sales functionality."

GOOD:
"Allow the user to select an existing product, enter quantity sold, reject quantities greater than available stock, create a sale record, automatically reduce product quantity, update today's sales total, and save the changes to browser storage."

==================================================
BROWSER APPLICATION
==================================================

Unless the user explicitly requests a server/backend:

- Plan for a browser-first application.
- Use localStorage for persistent browser data.
- Do not invent a server or external database.
- The final application must be capable of running as a standalone browser application.

==================================================
MOBILE
==================================================

Every application must be planned for mobile use.

Identify:
- mobile navigation
- responsive layouts
- touch-friendly controls
- forms that work on small screens
- readable tables/cards
- mobile-friendly empty/error states

==================================================
SECURITY / AUTH
==================================================

Do not invent authentication, payments, admin systems, APIs, or databases unless the user's request requires them.

If the user requests authentication or roles, identify exactly what each role can do.

==================================================
BUILD STAGES
==================================================

Create 6 to 8 APP-SPECIFIC build stages.

IMPORTANT:

Do NOT use generic software-development stage names such as:

- Requirement Gathering
- Project Setup
- Wireframing
- Frontend Development
- Backend Development

Those names are too generic.

Each stage must describe a meaningful part of THIS specific application.

For example, for an inventory and sales application:

1. Application Foundation
2. Product & Inventory Management
3. Sales Recording & Stock Reduction
4. Search, Low Stock & Dashboard Calculations
5. Data Persistence & Validation
6. Complete Workflow Integration
7. Mobile Optimization & Functional QA

The exact stages must change according to the user's application.

Each stage must contain:

- stage
- name
- description
- objectives
- features
- dataChanges
- acceptanceTests

==================================================
STAGE DEPENDENCIES
==================================================

Stages must build progressively.

A later stage must be able to improve the application produced by earlier stages.

The final stage must NOT simply create a new design.

It must inspect the existing application and repair/test it.

==================================================
DATA BLUEPRINT
==================================================

For every important entity, describe:

- entity name
- purpose
- fields
- field types
- required fields
- relationships if any

Example:

{
  "name": "Product",
  "purpose": "Stores products sold by the shop",
  "fields": [
    {
      "name": "id",
      "type": "string",
      "required": true
    },
    {
      "name": "name",
      "type": "string",
      "required": true
    }
  ]
}

Do not create unnecessary entities.

==================================================
USER ACTIONS
==================================================

For every important action, describe:

- action
- where it happens
- required input
- validation
- state change
- related data updates
- user feedback

Example:

{
  "action": "Record sale",
  "input": "product and quantity",
  "validation": "quantity must be greater than zero and cannot exceed available stock",
  "stateChange": "create sale and reduce product quantity",
  "feedback": "show successful sale message"
}

==================================================
BUSINESS RULES
==================================================

List concrete rules.

Examples:

- quantity cannot be negative
- sale quantity cannot exceed stock
- low stock means quantity <= 5
- today's sales are calculated from today's sale records
- deleting a product must update product totals
- refreshing the browser must restore saved data

Only include rules relevant to the current application.

==================================================
ACCEPTANCE TESTS
==================================================

Create practical tests that a human can perform after the app is built.

Examples:

- Add a product and verify it appears.
- Edit the product and verify the changes remain.
- Record a sale and verify stock decreases.
- Refresh the browser and verify the data remains.
- Search for a product and verify unrelated products disappear.
- Enter invalid data and verify it is rejected.

Tests must be specific to the user's application.

==================================================
DESIGN
==================================================

The plan should describe a professional, practical interface.

Do not spend most of the plan on visual decoration.

Prioritize usability and functionality.

==================================================
NIGERIAN CONTEXT
==================================================

Use Nigerian context where relevant.

Use ₦ for money when money is involved.

==================================================
OUTPUT FORMAT
==================================================

Return ONLY valid JSON.

Return exactly this structure:

{
  "projectName": "string",
  "summary": "string",
  "goal": "string",
  "features": [
    "specific functional feature"
  ],
  "pages": [
    "specific application screen"
  ],
  "userRoles": [
    "role"
  ],
  "dataModel": [
    {
      "name": "string",
      "purpose": "string",
      "fields": [
        {
          "name": "string",
          "type": "string",
          "required": true
        }
      ]
    }
  ],
  "userActions": [
    {
      "action": "string",
      "where": "string",
      "input": "string",
      "validation": "string",
      "stateChange": "string",
      "feedback": "string"
    }
  ],
  "businessRules": [
    "specific rule"
  ],
  "persistence": {
    "method": "localStorage",
    "requirements": [
      "specific persistence requirement"
    ]
  },
  "mobileRequirements": [
    "specific mobile requirement"
  ],
  "acceptanceTests": [
    "specific test"
  ],
  "buildStages": [
    {
      "stage": 1,
      "name": "app-specific stage name",
      "description": "what this stage builds",
      "objectives": [
        "specific objective"
      ],
      "features": [
        "specific feature"
      ],
      "dataChanges": [
        "specific data/state change"
      ],
      "acceptanceTests": [
        "specific test"
      ]
    }
  ]
}

==================================================
QUALITY RULE
==================================================

The plan must be detailed enough that the build engine can implement the application without having to guess what the user meant.

Do not make the plan unnecessarily huge.

Be precise.

Do not return Markdown.

Do not return explanations outside the JSON.
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
            content: originalRequest,
          },
        ],
      });

    const content =
      response.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        {
          error:
            "BOMBA AI could not create the project plan.",
        },
        { status: 500 }
      );
    }

    let plan;

    try {
      plan = JSON.parse(content);
    } catch (parseError) {
      console.error(
        "Builder plan JSON error:",
        parseError
      );

      return NextResponse.json(
        {
          error:
            "BOMBA AI returned an invalid project plan.",
        },
        { status: 500 }
      );
    }

    if (
      typeof plan.projectName !== "string" ||
      !plan.projectName.trim()
    ) {
      plan.projectName = "BOMBA AI Project";
    }

    if (
      typeof plan.summary !== "string"
    ) {
      plan.summary = "";
    }

    if (
      typeof plan.goal !== "string"
    ) {
      plan.goal = "";
    }

    if (!Array.isArray(plan.features)) {
      plan.features = [];
    }

    if (!Array.isArray(plan.pages)) {
      plan.pages = [];
    }

    if (!Array.isArray(plan.userRoles)) {
      plan.userRoles = [];
    }

    if (!Array.isArray(plan.dataModel)) {
      plan.dataModel = [];
    }

    if (!Array.isArray(plan.userActions)) {
      plan.userActions = [];
    }

    if (!Array.isArray(plan.businessRules)) {
      plan.businessRules = [];
    }

    if (
      !plan.persistence ||
      typeof plan.persistence !== "object"
    ) {
      plan.persistence = {
        method: "localStorage",
        requirements: [],
      };
    }

    if (
      typeof plan.persistence.method !==
      "string"
    ) {
      plan.persistence.method = "localStorage";
    }

    if (
      !Array.isArray(
        plan.persistence.requirements
      )
    ) {
      plan.persistence.requirements = [];
    }

    if (
      !Array.isArray(
        plan.mobileRequirements
      )
    ) {
      plan.mobileRequirements = [];
    }

    if (
      !Array.isArray(
        plan.acceptanceTests
      )
    ) {
      plan.acceptanceTests = [];
    }

    if (!Array.isArray(plan.buildStages)) {
      plan.buildStages = [];
    }

    /*
     * Keep the stage count between 6 and 8.
     * The build engine uses the plan's actual
     * stage count.
     */
    if (plan.buildStages.length < 6) {
      plan.buildStages = [
        ...plan.buildStages,
        {
          stage:
            plan.buildStages.length + 1,
          name:
            "Application Integration",
          description:
            "Integrate the planned application features into one coherent working application.",
          objectives: [
            "Connect the application's main workflows.",
            "Ensure shared data updates correctly.",
          ],
          features: [],
          dataChanges: [],
          acceptanceTests: [
            "Verify the main application workflow works from start to finish.",
          ],
        },
      ];
    }

    if (plan.buildStages.length > 8) {
      plan.buildStages =
        plan.buildStages.slice(0, 8);
    }

    /*
     * Normalize stage numbers and missing arrays.
     */
    plan.buildStages =
      plan.buildStages.map(
        (stage, index) => ({
          stage: index + 1,

          name:
            typeof stage?.name === "string" &&
            stage.name.trim()
              ? stage.name.trim()
              : `Application Stage ${
                  index + 1
                }`,

          description:
            typeof stage?.description ===
              "string"
              ? stage.description.trim()
              : "",

          objectives:
            Array.isArray(
              stage?.objectives
            )
              ? stage.objectives
              : [],

          features:
            Array.isArray(
              stage?.features
            )
              ? stage.features
              : [],

          dataChanges:
            Array.isArray(
              stage?.dataChanges
            )
              ? stage.dataChanges
              : [],

          acceptanceTests:
            Array.isArray(
              stage?.acceptanceTests
            )
              ? stage.acceptanceTests
              : [],
        })
      );

    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (error) {
    console.error(
      "Builder plan API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Something went wrong while creating the project plan.",
      },
      { status: 500 }
    );
  }
}