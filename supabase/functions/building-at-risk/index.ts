import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers - required for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Parse the JSON payload from the request
    const payload: BuildingReportPayload = await req.json();
    const { title, description, reportedBy, assignedTo, latitude, longitude, thumbnail } = payload;

    console.log("Received building report:", { title, reportedBy });

    // Validate required fields
    if (!title?.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Title is required",
          details: "The building name/title field cannot be empty",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!description?.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Description is required",
          details: "Please provide a description of the building risk",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!reportedBy) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Reporter ID is required",
          details: "User must be authenticated to submit a report",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Initialize Supabase with service role key to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    console.log("Inserting building report:", insertData);

    // Insert into public.buildings_at_risk table
    const { data, error } = await supabase.from("buildings_at_risk").insert(insertData).select().single();

    if (error) {
      console.error("Database error:", error);

      const errorDetails = [error.details, error.hint, error.code ? `Code: ${error.code}` : null]
        .filter(Boolean)
        .join(" | ");

      return new Response(
        JSON.stringify({
          success: false,
          error: error.message || "Database insertion failed",
          details: errorDetails || "Check database constraints",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("Building report created successfully:", data);

    return new Response(
      JSON.stringify({
        success: true,
        data,
        message: `Building report successfully created: ${title}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: "An unexpected error occurred while processing the request",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
