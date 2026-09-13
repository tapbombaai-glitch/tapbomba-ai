import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl =
process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey =
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const openaiApiKey =
process.env.OPENAI_API_KEY;

export async function POST(req) {
try {
if (
!supabaseUrl ||
!supabaseAnonKey
) {
return NextResponse.json(
{
error:
"Supabase environment variables are not configured.",
},
{ status: 500 }
);
}

if (!openaiApiKey) {  
  return NextResponse.json(  
    {  
      error:  
        "OpenAI API key is not configured.",  
    },  
    { status: 500 }  
  );  
}  

const body = await req.json();  

const question =  
  typeof body?.question === "string"  
    ? body.question.trim()  
    : "";  

const projectId =  
  typeof body?.projectId === "string"  
    ? body.projectId.trim()  
    : "";  

const project =  
  body?.project || null;  

const plan =  
  body?.plan || null;  

if (!question) {  
  return NextResponse.json(  
    {  
      error:  
        "Please enter a question for BOMBA AI.",  
    },  
    { status: 400 }  
  );  
}  

const authHeader =  
  req.headers.get("authorization");  

if (!authHeader) {  
  return NextResponse.json(  
    {  
      error:  
        "Please log in before using ASK BOMBA AI.",  
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

/*  
  ASK BOMBA AI can work without a Builder project.  

  If a projectId is provided, we verify that the  
  project belongs to the logged-in user and use it  
  as additional context.  
*/  

let savedProject = null;  

if (projectId) {  
  const {  
    data,  
    error: projectError,  
  } = await supabase  
    .from("builder_projects")  
    .select("*")  
    .eq("id", projectId)  
    .eq("owner_id", user.id)  
    .maybeSingle();  

  if (projectError) {  
    console.error(  
      "ASK project lookup error:",  
      projectError  
    );  
  }  

  if (data) {  
    savedProject = data;  
  }  
}  

const activeProject =  
  savedProject || project || null;  

const activePlan =  
  plan ||  
  activeProject?.build_plan ||  
  null;  

const openai =  
  new OpenAI({  
    apiKey: openaiApiKey,  
  });  

const systemPrompt = `

You are BOMBA AI, an intelligent AI assistant inside the BOMBA AI creation platform.

Your job is to understand the user's CURRENT question and answer it directly.

IMPORTANT RULES:

1. Answer the user's latest question.


2. Do not bring unrelated older requests into the answer.


3. If project context is provided, use it only when it is relevant to the current question.


4. Do not pretend that you changed files, ran commands, deployed software, or completed a build when you did not actually do so.


5. Give practical, clear and useful answers.


6. When discussing Nigerian businesses, use Nigerian context and Naira (₦) when appropriate.


7. If the user asks about their BOMBA AI project, explain what is actually known from the supplied project context.


8. Do not invent project files, features, stages, URLs, database records, or actions.


9. If the user asks a normal question unrelated to a project, simply answer the question normally.


10. Keep the response organized and easy to read on a phone.
`;

const context = {
currentUser: {
id: user.id,
},

currentQuestion:
question,

project:
activeProject
? {
id: activeProject.id,
projectName:
activeProject.project_name,
originalRequest:
activeProject.original_request,
status:
activeProject.status,
currentStage:
activeProject.current_stage,
totalStages:
activeProject.total_stages,
isPaused:
activeProject.is_paused,
isCompleted:
activeProject.is_completed,
}
: null,

plan:
activePlan || null,
};

const completion =
await openai.chat.completions.create({
model: "gpt-4o-mini",
temperature: 0.4,
messages: [
{
role: "system",
content: systemPrompt,
},
{
role: "user",
content: `
Current BOMBA AI context:



${JSON.stringify(
context,
null,
2
)}

User's latest question:

${question}

Answer the latest question directly.
`,
},
],
});

const answer =  
  completion?.choices?.[0]?.message?.content?.trim();  

if (!answer) {  
  return NextResponse.json(  
    {  
      error:  
        "BOMBA AI did not return an answer.",  
    },  
    { status: 500 }  
  );  
}  

return NextResponse.json({  
  success: true,  
  answer,  
});

} catch (error) {
console.error(
"ASK BOMBA AI route error:",
error
);

return NextResponse.json(  
  {  
    error:  
      error?.message ||  
      "Something went wrong while asking BOMBA AI.",  
  },  
  { status: 500 }  
);

}
}