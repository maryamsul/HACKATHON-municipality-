import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

// Initialize Supabase client (service role key required for insert)
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

// Initialize Twilio client
const twilioClient = twilio(Deno.env.get("TWILIO_ACCOUNT_SID")!, Deno.env.get("TWILIO_AUTH_TOKEN")!);

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) {
    if (cleaned.startsWith("961")) cleaned = "+" + cleaned;
    else if (cleaned.length <= 10) cleaned = "+961" + cleaned;
    else cleaned = "+" + cleaned;
  }
  return cleaned;
}

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST")
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });

  try {
    const { phone } = await req.json();
    if (!phone)
      return new Response(JSON.stringify({ success: false, error: "Phone number is required" }), {
        status: 400,
        headers: corsHeaders,
      });

    const formattedPhone = formatPhoneNumber(phone);

    // Send verification code via Twilio Verify
    const verification = await twilioClient.verify.v2
      .services(Deno.env.get("TWILIO_SERVICE_SID")!)
      .verifications.create({
        to: formattedPhone,
        channel: "sms",
      });

    if (!verification.sid) throw new Error("Failed to send OTP");

    // Optional: store a record in your Supabase table
    await supabase.from("otp_codes").insert({
      phone: formattedPhone,
      created_at: new Date().toISOString(),
      used: false,
    });

    return new Response(JSON.stringify({ success: true, message: "OTP sent" }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("Error sending OTP:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
