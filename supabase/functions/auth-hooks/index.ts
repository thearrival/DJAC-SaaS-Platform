import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

serve(async (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { user, action } = body;

    if (!user || !action) {
      return new Response(JSON.stringify({ error: "Missing user or action" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (action === "user.created" || action === "user.updated") {
      const { error } = await supabase.from("users").upsert(
        {
          openId: user.id,
          name: user.email?.split("@")[0] ?? "User",
          email: user.email,
          loginMethod: "supabase-auth",
          preferredLocale: "en",
          role: "user",
          status: "active",
        },
        { onConflict: "openId", ignoreDuplicates: false },
      );

      if (error) {
        console.error("Failed to sync user:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      const { error: auditError } = await supabase.from("auditLogs").insert({
        category: "auth",
        action: `user.${action.split(".")[1]}`,
        entityType: "user",
        payload: JSON.stringify({ userId: user.id, email: user.email }),
        outcome: "success",
      });

      if (auditError) {
        console.error("Failed to audit auth event:", auditError);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
