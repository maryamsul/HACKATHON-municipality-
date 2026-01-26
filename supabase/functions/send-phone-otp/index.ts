import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Utility: generate 6-digit OTP
const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Hash OTP securely using a secret
const hashOtp = (otp: string, secret: string) => {
  return hmac("sha256", secret, otp);
};

// Format phone number to international format
const formatPhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) {
    if (cleaned.startsWith("961")) cleaned = "+" + cleaned;
    else if (cleaned.length <= 10) cleaned = "+961" + cleaned;
    else cleaned = "+" + cleaned;
  }
  return cleaned;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { phone, full_name, role } = await req.json();

    if (!phone) {
      return new Response(JSON.stringify({ success: false, error: "Phone number is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formattedPhone = formatPhoneNumber(phone);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate OTP
    const otp = generateOtp();
    const otpSecret = Deno.env.get("OTP_SECRET")!;
    const otpHash = hashOtp(otp, otpSecret);

    // Expiry in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Store OTP in Supabase
    const { error: otpError } = await supabase.from("otp_codes").insert({
      phone: formattedPhone,
      otp: otpHash,
      used: false,
      expires_at: expiresAt,
      attempts: 0,
    });

    if (otpError) {
      console.error("Error storing OTP:", otpError);
      return new Response(JSON.stringify({ success: false, error: "Failed to generate OTP" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send SMS using SMSMODE
    const smsApiKey = Deno.env.get("SMSMODE_API_KEY")!;
    const smsBody = `Your verification code is: ${otp}`;
    const smsRes = await fetch("https://ui.smsmode.com/api/v1/sms/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${smsApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: formattedPhone,
        message: smsBody,
      }),
    });

    if (!smsRes.ok) {
      console.error("Failed to send SMS", await smsRes.text());
      return new Response(JSON.stringify({ success: false, error: "Failed to send SMS" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, message: "OTP sent successfully" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Exception in send-phone-otp:", err);
    return new Response(JSON.stringify({ success: false, error: "Internal server error", details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
