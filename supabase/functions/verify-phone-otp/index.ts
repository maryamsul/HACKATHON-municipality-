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
    const { phone, code } = await req.json();
    if (!phone || !code) return new Response(JSON.stringify({ error: "Phone and code are required" }), { status: 400 });

    const formattedPhone = formatPhoneNumber(phone);

    const verificationCheck = await client.verify.v2.services(TWILIO_SERVICE_SID).verificationChecks.create({
      to: formattedPhone,
      code,
    });

    if (verificationCheck.status !== "approved") {
      return new Response(JSON.stringify({ success: false, error: "Invalid code" }), { status: 400 });
    }

    let { data: user, error: userError } = await supabase
      .from("phone_users")
      .select("*")
      .eq("phone", formattedPhone)
      .maybeSingle();

    if (userError) return new Response(JSON.stringify({ error: "Failed to fetch user" }), { status: 500 });

    if (!user) {
      const { data: newUser, error: createError } = await supabase
        .from("phone_users")
        .insert({ phone: formattedPhone, role: "citizen" })
        .select()
        .single();

      if (createError) return new Response(JSON.stringify({ error: "Failed to create user" }), { status: 500 });

      user = newUser;
    }

    return new Response(JSON.stringify({ success: true, user }));
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return new Response(JSON.stringify({ error: "Failed to verify OTP" }), { status: 500 });
  }
}
