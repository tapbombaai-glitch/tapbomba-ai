import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return Response.json(
        {
          success: false,
          error: "Missing authorization.",
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!token) {
      return Response.json(
        {
          success: false,
          error: "Missing access token.",
        },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return Response.json(
        {
          success: false,
          error: "Your session is invalid or has expired.",
        },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("builder_projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Builder projects list error:", error);

      return Response.json(
        {
          success: false,
          error: error.message,
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