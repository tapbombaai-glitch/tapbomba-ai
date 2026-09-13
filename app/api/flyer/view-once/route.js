import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase is not configured." },
        { status: 500 }
      );
    }

    const authHeader =
      req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Please log in first." },
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
        { error: "Your login session could not be verified." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const flyerUrl =
      typeof body?.flyerUrl === "string"
        ? body.flyerUrl.trim()
        : "";

    if (!flyerUrl) {
      return NextResponse.json(
        { error: "Flyer URL is required." },
        { status: 400 }
      );
    }

    const token = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    ).toISOString();

    const { data, error } = await supabase
      .from("flyer_view_once_links")
      .insert({
        owner_id: user.id,
        flyer_url: flyerUrl,
        token,
        expires_at: expiresAt,
      })
      .select("id, token, expires_at")
      .single();

    if (error) {
      console.error(
        "View Once creation error:",
        error
      );

      return NextResponse.json(
        { error: "Could not create View Once link." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: data.id,
      token: data.token,
      expiresAt: data.expires_at,
      viewUrl: `/flyer/view-once/${data.token}`,
    });
  } catch (error) {
    console.error(
      "View Once API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Something went wrong.",
      },
      { status: 500 }
    );
  }
}