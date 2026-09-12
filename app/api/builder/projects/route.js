import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req) {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          error: "Supabase environment variables are not configured.",
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

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey
    );

    /*
      For this first connection test we create the project
      without requiring login yet.

      Authentication will be connected separately so every
      project can belong securely to its owner.
    */
    const { data, error } = await supabase
      .from("builder_projects")
      .insert({
        original_request: originalRequest,
        project_name: "New BOMBA Project",
        build_plan: [],
        project_files: [],
        current_stage: 0,
        total_stages: 0,
        status: "draft",
        is_paused: false,
        is_completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Builder project error:", error);

      return NextResponse.json(
        {
          error:
            error.message ||
            "Could not save the builder project.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      project: data,
    });
  } catch (error) {
    console.error("Builder API error:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Something went wrong while creating the project.",
      },
      { status: 500 }
    );
  }
}