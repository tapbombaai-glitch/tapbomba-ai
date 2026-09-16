import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(req) {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          error: "Supabase environment variables are not configured.",
        },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        {
          error: "Please log in to view your projects.",
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
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Projects list error:", error);

      return NextResponse.json(
        {
          error:
            error.message ||
            "BOMBA AI could not load your projects.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      projects: data || [],
    });
  } catch (error) {
    console.error("Projects API error:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Something went wrong while loading your projects.",
      },
      { status: 500 }
    );
  }
}