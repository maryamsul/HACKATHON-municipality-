import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate a secure 6-digit OTP
function generateOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, "0");
}

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

console.info("send-phone-otp function started");

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { phone, full_name, role } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ success: false, error: "Phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);
    console.log(`Sending OTP to: ${formattedPhone}`);

    // Initialize Supabase client with service role for database operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Invalidate any existing unused OTPs for this phone
    const { error: invalidateError } = await supabase
      .from("otp_codes")
      .update({ used: true })
      .eq("phone", formattedPhone)
      .eq("used", false);

    if (invalidateError) {
      console.error("Error invalidating old OTPs:", invalidateError);
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    console.log(`Generated OTP: ${otp}, expires at: ${expiresAt.toISOString()}`);

    // Save OTP to database
    const { error: insertError } = await supabase.from("otp_codes").insert({
      phone: formattedPhone,
      otp: otp,
      expires_at: expiresAt.toISOString(),
      used: false,
    });

    if (insertError) {
      console.error("Error saving OTP:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to generate OTP", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store user info temporarily if provided (for new registrations)
    if (full_name || role) {
      const { data: existingUser } = await supabase
        .from("phone_users")
        .select("id")
        .eq("phone", formattedPhone)
        .maybeSingle();

      if (!existingUser && full_name) {
        await supabase.from("phone_users").insert({
          phone: formattedPhone,
          full_name: full_name,
          role: role || "citizen",
        });
      }
    }

    // Send SMS via smsmode
    const smsmodeApiKey = Deno.env.get("SMSMODE_API_KEY");
    
    if (!smsmodeApiKey) {
      console.error("SMSMODE_API_KEY not configured");
      // For testing, return success with OTP in dev mode
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "OTP generated (SMS service not configured)",
          phone: formattedPhone,
          // Only for testing - remove in production
          debug_otp: otp
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const smsMessage = `Your verification code is: ${otp}. It expires in 5 minutes. Do not share this code.`;

    // smsmode API call
    const smsResponse = await fetch("https://api.smsmode.com/http/1.6/sendSMS.do", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        accessToken: smsmodeApiKey,
        numero: formattedPhone.replace("+", ""),
        message: smsMessage,
        emetteur: "BaladiyatLB",
      }).toString(),
    });

    const smsResult = await smsResponse.text();
    console.log("SMS API response:", smsResult);

    // Check if SMS was sent successfully
    if (!smsResult.includes("0") && !smsResult.toLowerCase().includes("accepted")) {
      console.error("SMS sending failed:", smsResult);
      
      await supabase
        .from("otp_codes")
        .delete()
        .eq("phone", formattedPhone)
        .eq("otp", otp);

      return new Response(
        JSON.stringify({ success: false, error: "Failed to send SMS. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`OTP sent successfully to ${formattedPhone}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent successfully",
        phone: formattedPhone 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-phone-otp:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
