import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ReportType = "building" | "issue";

// Database status values - EXACT match to DB constraints
// Buildings: pending | critical | under_maintenance | resolved
// Issues: pending | under_review | under_maintenance | resolved
type BuildingStatus = "pending" | "critical" | "under_maintenance" | "resolved";
type IssueStatus = "pending" | "under_review" | "under_maintenance" | "resolved";

interface Payload {
  type: ReportType;
  id: string | number;
  status: string;
  assigned_to?: string | null;
}

// Validate building status matches exact DB enum
function isAllowedBuildingStatus(s: string): s is BuildingStatus {
  return s === "pending" || s === "critical" || s === "under_maintenance" || s === "resolved";
}

// Validate issue status matches exact DB enum
function isAllowedIssueStatus(s: string): s is IssueStatus {
  return s === "pending" || s === "under_review" || s === "under_maintenance" || s === "resolved";
}
// ... (Your imports and types stay the same)

serve(async (req: Request) => {
  const requestId = crypto.randomUUID().slice(0, 8);

  // 1. ALWAYS handle OPTIONS first for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // 2. Setup Auth Check
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace("Bearer ", "").trim();

    // Verify the user is who they say they are
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    // 3. Role Check
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "employee")
      .maybeSingle();

    if (!roleRow) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden: Employees only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Parse Payload
    const payload: Payload = await req.json();
    const table = payload.type === "building" ? "buildings_at_risk" : "issues";

    // Auto-detect if ID should be Number or String
    const isNumeric = !isNaN(Number(payload.id)) && payload.type === "issue";
    const queryId = isNumeric ? Number(payload.id) : String(payload.id);

    // 5. Execute Update
    const { data, error } = await supabaseAdmin
      .from(table)
      .update({
        status: payload.status,
        assigned_to: payload.assigned_to,
      })
      .eq("id", queryId)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "Record not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Success Response
    return new Response(JSON.stringify({ success: true, data: data[0] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    // CRITICAL: Even errors must return CORS headers so the frontend can read them
    console.error(`[${requestId}] Error:`, e.message);
    return new Response(JSON.stringify({ success: false, error: e.message, requestId }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
