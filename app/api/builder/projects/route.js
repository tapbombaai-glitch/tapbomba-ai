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

    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          error: "Please log in before starting a project.",
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
          error: "Your login session could not be verified.",
        },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("builder_projects")
      .insert({
        owner_id: user.id,
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