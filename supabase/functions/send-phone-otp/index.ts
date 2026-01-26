import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import twilio from "npm:twilio";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const client = twilio(Deno.env.get("TWILIO_ACCOUNT_SID")!, Deno.env.get("TWILIO_AUTH_TOKEN")!);

const TWILIO_SERVICE_SID = Deno.env.get("TWILIO_SERVICE_SID")!;

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

    return new Response(JSON.stringify({ success: true, sid: verification.sid }));
  } catch (error) {
    console.error("Error sending OTP:", error);
    return new Response(JSON.stringify({ error: "Failed to send OTP" }), { status: 500 });
  }
}
