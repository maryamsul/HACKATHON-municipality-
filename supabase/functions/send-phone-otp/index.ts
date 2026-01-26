// index.ts (Supabase Edge Function)

import { createClient } from "npm:@supabase/supabase-js"; // Use npm: prefix for Edge Functions
import twilio from "npm:twilio";

// Get environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const TWILIO_SERVICE_SID = Deno.env.get("TWILIO_SERVICE_SID")!;

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Format phone number to international format
function formatPhoneNumber(phone: string) {
  let cleaned = phone.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) {
    if (cleaned.startsWith("961")) cleaned = "+" + cleaned;
    else if (cleaned.length <= 10) cleaned = "+961" + cleaned;
    else cleaned = "+" + cleaned;
  }
  return cleaned;
}

// Edge function handler
export default async function handler(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const { phone } = await req.json();
    if (!phone) return new Response(JSON.stringify({ error: "Phone is required" }), { status: 400 });

    const formattedPhone = formatPhoneNumber(phone);

    // Send OTP via Twilio Verify
    const verification = await client.verify.v2.services(TWILIO_SERVICE_SID).verifications.create({
      to: formattedPhone,
      channel: "sms",
    });

    return new Response(JSON.stringify({ success: true, sid: verification.sid }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return new Response(JSON.stringify({ error: "Failed to send OTP", details: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
