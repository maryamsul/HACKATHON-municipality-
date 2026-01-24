import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
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

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, full_name, role } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
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
        JSON.stringify({ error: "Failed to generate OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store user info temporarily if provided (for new registrations)
    if (full_name || role) {
      // Check if phone user exists
      const { data: existingUser } = await supabase
        .from("phone_users")
        .select("id")
        .eq("phone", formattedPhone)
        .maybeSingle();

      if (!existingUser && full_name) {
        // Pre-create user record (will be fully activated after OTP verification)
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
      return new Response(
        JSON.stringify({ error: "SMS service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const smsMessage = `Your verification code is: ${otp}. It expires in 5 minutes. Do not share this code.`;

    // smsmode API call - using their REST API
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

    // Check if SMS was sent successfully (smsmode returns "0 | Accepted" on success)
    if (!smsResult.includes("0") && !smsResult.toLowerCase().includes("accepted")) {
      console.error("SMS sending failed:", smsResult);
      
      // Clean up the OTP since SMS failed
      await supabase
        .from("otp_codes")
        .delete()
        .eq("phone", formattedPhone)
        .eq("otp", otp);

      return new Response(
        JSON.stringify({ error: "Failed to send SMS. Please try again." }),
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
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
