serve(async (req) => {
  // 1. Handle the CORS Pre-flight (This is likely why it's failing)
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as {
      type: ReportType;
      id: string | number;
      status: BuildingStatus | IssueStatus;
      assigned_to?: string | null;
    };

    const { type, id, status, assigned_to = null } = body;

    if (!type || !id || !status) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let updateResult;

    if (type === "issue") {
      if (isNaN(Number(id)) || Number(id) <= 0) {
        return new Response(JSON.stringify({ success: false, error: "Issue ID must be a positive number" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!isAllowedIssueStatus(status)) {
        return new Response(JSON.stringify({ success: false, error: "Invalid issue status" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      updateResult = await supabaseAdmin
        .from("issues")
        .update({ status, assigned_to })
        .eq("id", Number(id))
        .select("*")
        .single();
    } else if (type === "building") {
      if (!isValidUUID(String(id))) {
        return new Response(JSON.stringify({ success: false, error: "Building ID must be a UUID" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!isAllowedBuildingStatus(status)) {
        return new Response(JSON.stringify({ success: false, error: "Invalid building status" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      updateResult = await supabaseAdmin
        .from("buildings_at_risk")
        .update({ status, assigned_to })
        .eq("id", String(id))
        .select("*")
        .single();
    } else {
      return new Response(JSON.stringify({ success: false, error: "Invalid report type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (updateResult.error) {
      return new Response(JSON.stringify({ success: false, error: updateResult.error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Success response with CORS headers
    return new Response(JSON.stringify({ success: true, data: updateResult.data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[classify-report] Error:", error);
    // 3. Catch-all error with CORS headers
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
