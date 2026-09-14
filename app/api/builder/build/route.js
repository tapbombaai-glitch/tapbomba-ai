import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const auth = req.headers.get("authorization");
    const token = auth?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData?.user;

    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { projectId, originalRequest, plan } = await req.json();

    const { data: project, error } = await supabase
      .from("builder_projects")
      .select("*")
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const stageNumber = Number(project.current_stage || 0) + 1;
    const stages = plan?.buildStages || [];
    const stage = stages.find((s) => Number(s.stage) === stageNumber);

    if (!stage) {
      return NextResponse.json({
        success: true,
        project,
        completed: true,
      });
    }

    const ai = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are BOMBA AI. Build one real browser app stage. Return JSON only: {summary:string,files:[{path:string,content:string}]}",
        },
        {
          role: "user",
          content: `App: ${originalRequest}\nStage: ${stage.name}\n${stage.description}`,
        },
      ],
    });

    const result = JSON.parse(ai.choices[0].message.content);
    const oldFiles = project.project_files || {};
    const files = { ...oldFiles };

    for (const file of result.files || []) {
      files[file.path] = file.content;
    }

    const completed = stageNumber >= stages.length;

    const { data: updated, error: updateError } = await supabase
      .from("builder_projects")
      .update({
        project_name: plan.projectName,
        build_plan: plan,
        project_files: files,
        current_stage: stageNumber,
        total_stages: stages.length,
        status: completed ? "completed" : "building",
        is_completed: completed,
        is_paused: false,
      })
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      project: updated,
      stage: {
        number: stageNumber,
        name: stage.name,
        summary: result.summary,
      },
      files: result.files || [],
      completed,
    });
  } catch (error) {
    console.error("Builder build error:", error);
    return NextResponse.json(
      { error: error.message || "Build failed" },
      { status: 500 }
    );
  }
}