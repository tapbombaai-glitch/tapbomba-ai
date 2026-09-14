import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Please log in before building." },
        { status: 401 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      { global: { headers: { Authorization: authHeader } } }
    );

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

    const { projectId, originalRequest, plan } = await req.json();

    if (!projectId || !originalRequest || !plan) {
      return NextResponse.json(
        { error: "Missing build data." },
        { status: 400 }
      );
    }

    const { data: project, error } = await supabase
      .from("builder_projects")
      .select("*")
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .single();

    if (error || !project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    const stages = plan.buildStages || [];
    const nextStage = Number(project.current_stage || 0) + 1;
    const stage = stages[nextStage - 1];

    if (!stage) {
      return NextResponse.json({
        success: true,
        project,
        stage: nextStage,
        files: project.project_files || [],
        completed: true,
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            'Build one real browser-app stage. Return JSON only: {"files":[{"path":"index.html","content":"..."}],"summary":"..."}. Use self-contained HTML, CSS and JavaScript.',
        },
        {
          role: "user",
          content:
            `App: ${originalRequest}\nStage ${nextStage}: ${stage.name}\n${stage.description}`,
        },
      ],
    });

    const result = JSON.parse(
      response.choices?.[0]?.message?.content || "{}"
    );

    const oldFiles = Array.isArray(project.project_files)
      ? project.project_files
      : [];

    const newFiles = Array.isArray(result.files)
      ? result.files
      : [];

    const files = [...oldFiles];

    for (const file of newFiles) {
      const index = files.findIndex(
        (item) => item.path === file.path
      );

      if (index >= 0) {
        files[index] = file;
      } else {
        files.push(file);
      }
    }

    const completed = nextStage >= stages.length;

    const { data: updated, error: updateError } = await supabase
      .from("builder_projects")
      .update({
        project_name: plan.projectName || project.project_name,
        build_plan: plan,
        project_files: files,
        current_stage: nextStage,
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
      stage: nextStage,
      files: newFiles,
      completed,
    });
  } catch (error) {
    console.error("Builder build error:", error);

    return NextResponse.json(
      { error: error?.message || "Build failed." },
      { status: 500 }
    );
  }
}