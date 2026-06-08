import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const WebhookInput = z.object({
  event: z.enum([
    "incident.reported",
    "assessment.completed",
    "vendor.updated",
    "deadline.approaching",
    "policy.expiring",
  ]),
  organizationId: z.number(),
  payload: z.record(z.unknown()),
});

serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const authHeader = req.headers.get("Authorization");
    const webhookSecret = Deno.env.get("COMPLIANCE_WEBHOOK_SECRET");
    if (authHeader !== `Bearer ${webhookSecret}`) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const parsed = WebhookInput.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { event, organizationId, payload } = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: logError } = await supabase.from("auditLogs").insert({
      organizationId,
      category: "system",
      action: `webhook.${event}`,
      entityType: "webhook_event",
      payload: JSON.stringify({ event, payload }),
      outcome: "success",
    });

    if (logError) {
      console.error("Failed to log webhook event:", logError);
    }

    return new Response(JSON.stringify({
      success: true,
      received: { event, organizationId, timestamp: new Date().toISOString() },
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
