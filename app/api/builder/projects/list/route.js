import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request) {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return Response.json(
        {
          success: false,
          error: "Supabase environment variables are not configured.",
        },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return Response.json(
        {
          success: false,
          error: "Please log in before viewing your projects.",
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
      return Response.json(
        {
          success: false,
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
      console.error("Builder projects list error:", error);

      return Response.json(
        {
          success: false,
          error:
            error.message ||
            "Could not load your projects.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      projects: data || [],
    });
  } catch (error) {
    console.error("Builder projects list API error:", error);

    return Response.json(
      {
        success: false,
        error:
          error?.message ||
          "Could not load your projects.",
      },
      { status: 500 }
    );
  }
}