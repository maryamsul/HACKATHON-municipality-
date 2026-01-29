import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface IssuePayload {
  title: string;
  description: string;
  category: string;
  latitude?: number | null;
  longitude?: number | null;
  thumbnail?: string | null;
}

console.info("[create-issue] Edge function started");

serve(async (req: Request) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`[create-issue][${requestId}] ${req.method} ${req.url}`);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed", requestId }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth Check - Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error(`[create-issue][${requestId}] Missing Authorization header`);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized", requestId }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      console.error(`[create-issue][${requestId}] Empty JWT token`);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized", requestId }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate JWT using getClaims
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      console.error(`[create-issue][${requestId}] JWT validation failed:`, claimsError);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized", requestId }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = String(claimsData.claims.sub);
    console.log(`[create-issue][${requestId}] Authenticated user:`, userId);

    // Parse payload
    const rawBody = await req.text();
    console.log(`[create-issue][${requestId}] Raw body:`, rawBody);

    let payload: IssuePayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.error(`[create-issue][${requestId}] JSON parse error`);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON payload", requestId }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required fields
    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    const description = typeof payload.description === "string" ? payload.description.trim() : "";
    const category = typeof payload.category === "string" ? payload.category.trim() : "";

    if (!title || !description || !category) {
      console.error(`[create-issue][${requestId}] Missing required fields`);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields",
          details: "title, description, and category are required",
          requestId,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate coordinates if provided
    let latitude: number | null = null;
    let longitude: number | null = null;
    
    if (payload.latitude !== undefined && payload.latitude !== null) {
      const lat = Number(payload.latitude);
      if (Number.isFinite(lat) && lat >= -90 && lat <= 90) {
        latitude = lat;
      }
    }
    
    if (payload.longitude !== undefined && payload.longitude !== null) {
      const lng = Number(payload.longitude);
      if (Number.isFinite(lng) && lng >= -180 && lng <= 180) {
        longitude = lng;
      }
    }

    // Use service role for insert (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const insertData = {
      title: title.slice(0, 200),
      description: description.slice(0, 2000),
      category: category.slice(0, 100),
      latitude,
      longitude,
      thumbnail: payload.thumbnail ? String(payload.thumbnail).slice(0, 500) : null,
      reported_by: userId,
      status: "pending",
    };

    console.log(`[create-issue][${requestId}] Inserting:`, JSON.stringify(insertData));

    const { data, error } = await supabaseAdmin
      .from("issues")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error(`[create-issue][${requestId}] DB insert error:`, error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message || "Database insertion failed",
          details: error.details || error.hint || null,
          requestId,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[create-issue][${requestId}] Successfully created issue:`, data.id);
    return new Response(
      JSON.stringify({ success: true, data, message: "Issue created successfully", requestId }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error(`[create-issue][${requestId}] Unhandled error:`, e);
    return new Response(
      JSON.stringify({
        success: false,
        error: e instanceof Error ? e.message : "Unknown error",
        requestId,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
