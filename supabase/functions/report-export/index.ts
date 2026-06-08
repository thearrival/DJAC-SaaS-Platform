import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const ExportInput = z.object({
  reportId: z.number(),
  format: z.enum(["json", "csv", "pdf"]).default("json"),
});

serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const parsed = ExportInput.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { reportId, format } = parsed.data;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: report, error: fetchError } = await supabase
      .from("complianceReports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (fetchError || !report) {
      return new Response(JSON.stringify({ error: "Report not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let exportData: string;
    let contentType: string;
    const filename = `report-${report.id}-${Date.now()}`;

    if (format === "json") {
      exportData = JSON.stringify(report, null, 2);
      contentType = "application/json";
    } else if (format === "csv") {
      const headers = Object.keys(report).join(",");
      const values = Object.values(report)
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",");
      exportData = `${headers}\n${values}`;
      contentType = "text/csv";
    } else {
      exportData = JSON.stringify(report);
      contentType = "application/pdf";
    }

    return new Response(exportData, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}.${format}"`,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
