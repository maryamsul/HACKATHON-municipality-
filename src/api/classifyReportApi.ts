import { serve } from "https://deno.land/std@0.193.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Use service role client (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

serve(async (req) => {
  try {
    const body = await req.json();
    const { type, id, status, assigned_to = null } = body;

    if (!type || !id || !status) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let updateResult;
    if (type === "issue") {
      if (isNaN(Number(id))) {
        return new Response(JSON.stringify({ success: false, error: "Issue ID must be numeric" }), { status: 400 });
      }
      updateResult = await supabaseAdmin
        .from("issues")
        .update({ status, assigned_to })
        .eq("id", Number(id))
        .select("*")
        .single();
    } else if (type === "building") {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(String(id))) {
        return new Response(JSON.stringify({ success: false, error: "Building ID must be UUID" }), { status: 400 });
      }
      updateResult = await supabaseAdmin
        .from("buildings_at_risk")
        .update({ status, assigned_to })
        .eq("id", String(id))
        .select("*")
        .single();
    } else {
      return new Response(JSON.stringify({ success: false, error: "Invalid type" }), { status: 400 });
    }

    if (updateResult.error) {
      return new Response(JSON.stringify({ success: false, error: updateResult.error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, data: updateResult.data }), { status: 200 });
  } catch (error) {
    console.error("[classify-report] Error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
});
