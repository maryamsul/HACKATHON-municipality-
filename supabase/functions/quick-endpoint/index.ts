import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers - required for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BuildingReportPayload {
  title: string;
  description: string;
  reportedBy: string;
  assignedTo?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  thumbnail?: string | null;
}

console.info("quick-endpoint started");

serve(async (req: Request) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[${requestId}] ${req.method} ${req.url}`);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method === "GET") {
    return new Response(JSON.stringify({ ok: true, requestId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed", requestId }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const rawBody = await req.text();
    console.log(`[${requestId}] Raw body:`, rawBody);

    let payload: BuildingReportPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      console.error(`[${requestId}] JSON parse error:`, e);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON payload", requestId }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    const description = typeof payload.description === "string" ? payload.description.trim() : "";
    const reportedBy = typeof payload.reportedBy === "string" ? payload.reportedBy : "";

    if (!title || !description || !reportedBy) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields",
          details: "title, description, and reportedBy are required",
          requestId,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(`[${requestId}] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY`);
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error", requestId }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const insertData = {
      title,
      description,
      reported_by: reportedBy,
      assigned_to: payload.assignedTo ?? null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      thumbnail: payload.thumbnail ?? null,
      status: "pending",
    };

    console.log(`[${requestId}] Insert:`, insertData);

    const { data, error } = await supabase
      .from("buildings_at_risk")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error(`[${requestId}] DB error:`, error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message || "Database insertion failed",
          details: [error.details, error.hint].filter(Boolean).join(" | ") || null,
          requestId,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ success: true, data, requestId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(`[${requestId}] Unhandled error:`, e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error", requestId }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
