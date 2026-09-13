import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ViewOncePage({ params }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const token = params?.token;

  if (!token) {
    notFound();
  }

  const { data: link, error } = await supabase
    .from("flyer_view_once_links")
    .select("id, flyer_url, expires_at, viewed_at")
    .eq("token", token)
    .single();

  if (error || !link) {
    return <ExpiredPage />;
  }

  const expired =
    new Date(link.expires_at).getTime() <= Date.now();

  if (expired || link.viewed_at) {
    return <ExpiredPage />;
  }

  // Mark the link as viewed.
  const { data: updatedLink, error: updateError } =
    await supabase
      .from("flyer_view_once_links")
      .update({
        viewed_at: new Date().toISOString(),
      })
      .eq("id", link.id)
      .is("viewed_at", null)
      .select("id")
      .single();

  if (updateError || !updatedLink) {
    return <ExpiredPage />;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "700px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: "#FFD43B",
            fontWeight: "800",
            fontSize: "14px",
            marginBottom: "14px",
            letterSpacing: "1px",
          }}
        >
          VIEW ONCE
        </div>

        <img
          src={link.flyer_url}
          alt="Private flyer preview"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            borderRadius: "14px",
          }}
        />

        <p
          style={{
            marginTop: "16px",
            color: "#aaa",
            fontSize: "13px",
          }}
        >
          This private preview can only be viewed once.
        </p>
      </div>
    </main>
  );
}

function ExpiredPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "42px",
            marginBottom: "14px",
          }}
        >
          🔒
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "24px",
          }}
        >
          This preview has expired.
        </h1>

        <p
          style={{
            color: "#aaa",
            marginTop: "10px",
          }}
        >
          The View Once link is no longer available.
        </p>
      </div>
    </main>
  );
}