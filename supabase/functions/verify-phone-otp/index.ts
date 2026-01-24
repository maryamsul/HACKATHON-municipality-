import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Format phone number to international format
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) {
    if (cleaned.startsWith("961")) {
      cleaned = "+" + cleaned;
    } else if (cleaned.length <= 10) {
      cleaned = "+961" + cleaned;
    } else {
      cleaned = "+" + cleaned;
    }
  }
  return cleaned;
}

console.info("verify-phone-otp function started");

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, otp, full_name, role } = await req.json();

    if (!phone || !otp) {
      return new Response(
        JSON.stringify({ error: "Phone number and OTP are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);
    console.log(`Verifying OTP for: ${formattedPhone}`);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the OTP record
    const { data: otpRecord, error: otpError } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("phone", formattedPhone)
      .eq("otp", otp)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError) {
      console.error("Error fetching OTP:", otpError);
      return new Response(
        JSON.stringify({ error: "Failed to verify OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate OTP exists
    if (!otpRecord) {
      console.log("OTP not found or already used");
      return new Response(
        JSON.stringify({ error: "Invalid verification code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if OTP is expired
    const expiresAt = new Date(otpRecord.expires_at);
    if (expiresAt < new Date()) {
      console.log("OTP expired");
      await supabase
        .from("otp_codes")
        .update({ used: true })
        .eq("id", otpRecord.id);

      return new Response(
        JSON.stringify({ error: "Verification code has expired. Please request a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark OTP as used
    await supabase
      .from("otp_codes")
      .update({ used: true })
      .eq("id", otpRecord.id);

    // Get or create phone user
    let { data: phoneUser, error: userError } = await supabase
      .from("phone_users")
      .select("*")
      .eq("phone", formattedPhone)
      .maybeSingle();

    if (userError) {
      console.error("Error fetching phone user:", userError);
    }

    // Create new phone user if doesn't exist
    if (!phoneUser) {
      const { data: newUser, error: createError } = await supabase
        .from("phone_users")
        .insert({
          phone: formattedPhone,
          full_name: full_name || null,
          role: role || "citizen",
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating phone user:", createError);
        return new Response(
          JSON.stringify({ error: "Failed to create user account" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      phoneUser = newUser;
      console.log("Created new phone user:", phoneUser.id);
    } else if (full_name && !phoneUser.full_name) {
      await supabase
        .from("phone_users")
        .update({ 
          full_name: full_name,
          role: role || phoneUser.role,
          updated_at: new Date().toISOString()
        })
        .eq("id", phoneUser.id);
      
      phoneUser.full_name = full_name;
    }

    // Create session data
    const expiresAtSession = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    console.log(`Phone user verified successfully: ${phoneUser.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Phone verified successfully",
        user: {
          id: phoneUser.id,
          phone: phoneUser.phone,
          full_name: phoneUser.full_name,
          role: phoneUser.role,
          auth_type: "phone",
        },
        session: {
          access_token: phoneUser.id, // Simple token for now
          expires_at: expiresAtSession,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in verify-phone-otp:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
