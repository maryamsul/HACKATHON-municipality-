import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers - required for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Define the structure of the request payload
interface BuildingReportPayload {
  title: string;
  description: string;
  reportedBy: string;
  assignedTo?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  thumbnail?: string | null;
}

console.info("Building Report Edge Function Started");

serve(async (req: Request) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[${requestId}] Request received: ${req.method} ${req.url}`);
  console.log(`[${requestId}] Headers:`, Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log(`[${requestId}] Handling CORS preflight`);
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Handle GET requests for testing connectivity
  if (req.method === "GET") {
    console.log(`[${requestId}] Health check request`);
    return new Response(
      JSON.stringify({ ok: true, message: "Building at Risk API is running", requestId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Parse the JSON payload from the request
    let payload: BuildingReportPayload;
    try {
      const rawBody = await req.text();
      console.log(`[${requestId}] Raw body:`, rawBody);
      payload = JSON.parse(rawBody);
    } catch (parseError) {
      console.error(`[${requestId}] JSON parse error:`, parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid JSON payload",
          details: "Could not parse request body as JSON",
          requestId,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { title, description, reportedBy, assignedTo, latitude, longitude, thumbnail } = payload;
    console.log(`[${requestId}] Parsed payload:`, { title, reportedBy, hasDescription: !!description });

    // Validate required fields
    if (!title?.trim()) {
      console.log(`[${requestId}] Validation failed: missing title`);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Title is required",
          details: "The building name/title field cannot be empty",
          requestId,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!description?.trim()) {
      console.log(`[${requestId}] Validation failed: missing description`);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Description is required",
          details: "Please provide a description of the building risk",
          requestId,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!reportedBy) {
      console.log(`[${requestId}] Validation failed: missing reportedBy`);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Reporter ID is required",
          details: "User must be authenticated to submit a report",
          requestId,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Initialize Supabase with service role key to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(`[${requestId}] Missing environment variables`);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error",
          details: "Missing required environment variables",
          requestId,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Map form fields to database columns
    const insertData = {
      title: title.trim(),
      description: description.trim(),
      reported_by: reportedBy,
      assigned_to: assignedTo || null,
      status: "pending",
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      thumbnail: thumbnail || null,
    };

    console.log(`[${requestId}] Inserting building report:`, insertData);

    // Insert into public.buildings_at_risk table
    const { data, error } = await supabase.from("buildings_at_risk").insert(insertData).select().single();

    if (error) {
      console.error(`[${requestId}] Database error:`, error);

      const errorDetails = [error.details, error.hint, error.code ? `Code: ${error.code}` : null]
        .filter(Boolean)
        .join(" | ");

      return new Response(
        JSON.stringify({
          success: false,
          error: error.message || "Database insertion failed",
          details: errorDetails || "Check database constraints",
          requestId,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`[${requestId}] Building report created successfully:`, data);

    return new Response(
      JSON.stringify({
        success: true,
        data,
        message: `Building report successfully created: ${title}`,
        requestId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error(`[${requestId}] Error processing request:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: "An unexpected error occurred while processing the request",
        requestId,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
