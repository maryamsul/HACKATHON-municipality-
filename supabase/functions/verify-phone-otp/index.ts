import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --------------------
// Helpers
// --------------------

function formatPhone(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) {
    cleaned = cleaned.startsWith("961") ? "+" + cleaned : "+961" + cleaned;
  }
  return cleaned;
}

async function hashOtp(otp: string): Promise<string> {
  const data = new TextEncoder().encode(
    otp + Deno.env.get("OTP_SECRET")
  );
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function genericOtpError() {
  return new Response(
    JSON.stringify({
      success: false,
      error: "Invalid or expired verification code",
    }),
    {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// --------------------
// Edge Function
// --------------------

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const { phone, otp, full_name, role } = await req.json();

    if (!phone || !otp) {
      return genericOtpError();
    }

    const formattedPhone = formatPhone(phone);
    const otpHash = await hashOtp(otp);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // --------------------
    // Fetch latest unused OTP
    // --------------------
    const { data: otpRecord } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("phone", formattedPhone)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRecord) return genericOtpError();

    // Max attempts
    if (otpRecord.attempts >= 5) return genericOtpError();

    // Expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      await supabase
        .from("otp_codes")
        .update({ used: true })
        .eq("id", otpRecord.id);

      return genericOtpError();
    }

    // Wrong OTP
    if (otpRecord.otp_hash !== otpHash) {
      await supabase
        .from("otp_codes")
        .update({ attempts: otpRecord.attempts + 1 })
        .eq("id", otpRecord.id);

      return genericOtpError();
    }

    // --------------------
    // OTP is valid
    // --------------------
    await supabase
      .from("otp_codes")
      .update({ used: true })
      .eq("id", otpRecord.id);

    // --------------------
    // Get or create user
    // --------------------
    let { data: user } = await supabase
      .from("phone_users")
      .select("*")
      .eq("phone", formattedPhone)
      .maybeSingle();

    const allowedRoles = ["citizen", "employee"] as const;
    const safeRole = allowedRoles.includes(role) ? role : "citizen";

    if (!user) {
      const { data: newUser, error } = await supabase
        .from("phone_users")
        .insert({
          phone: formattedPhone,
          full_name: full_name || null,
          role: safeRole,
        })
        .select()
        .single();

      if (error) throw error;
      user = newUser;
    } else if (full_name && !user.full_name) {
      await supabase
        .from("phone_users")
        .update({
          full_name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      user.full_name = full_name;
    }

    // --------------------
    // Create session (
