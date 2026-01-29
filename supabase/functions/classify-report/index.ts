import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 2. Auth Check - Validate JWT using getClaims
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Create client with user's auth for claims validation
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("[classify-report] Claims validation failed:", claimsError);
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    console.log("[classify-report] Authenticated user:", userId);

    // 3. Role Check using service role client
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    
    const { data: roleRow, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "employee")
      .maybeSingle();

    console.log("[classify-report] Role check - roleRow:", roleRow, "| error:", roleError);

    if (!roleRow) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized: Employee only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Parse Payload
    const payload = await req.json();
    console.log("[classify-report] Received payload:", JSON.stringify(payload));
    
    const table = payload.type === "building" ? "buildings_at_risk" : "issues";

    // Buildings use UUID (string), Issues use ID (number)
    const queryId = payload.type === "building" ? String(payload.id) : Number(payload.id);
    console.log("[classify-report] Table:", table, "| QueryId:", queryId, "| Action:", payload.action);

    // 5. Handle Dismiss Action (delete the issue)
    if (payload.action === "dismiss") {
      console.log("[classify-report] Processing DISMISS action for", table, "id:", queryId);
      
      const { data: deletedData, error: deleteError } = await supabaseAdmin
        .from(table)
        .delete()
        .eq("id", queryId)
        .select();

      console.log("[classify-report] Delete result - data:", JSON.stringify(deletedData), "| error:", deleteError);

      if (deleteError) {
        console.error("[classify-report] Delete error:", deleteError);
        throw deleteError;
      }

      // Check if any row was actually deleted
      if (!deletedData || deletedData.length === 0) {
        console.error("[classify-report] No record found to delete with id:", queryId);
        return new Response(JSON.stringify({ success: false, error: "Record not found for deletion" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, action: "dismissed", deleted: deletedData }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Update Database (status change)
    const { data, error: dbError } = await supabaseAdmin
      .from(table)
      .update({
        status: payload.status,
        assigned_to: payload.assigned_to,
      })
      .eq("id", queryId)
      .select();

    if (dbError) throw dbError;

    if (!data || data.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "Record not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 7. SUCCESS RESPONSE
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[classify-report] Caught error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
