import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AuthEmailRequest {
  email: string;
  type: "security_alert" | "welcome";
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type, name }: AuthEmailRequest = await req.json();

    console.log(`Sending ${type} email to ${email}`);

    let subject: string;
    let html: string;

    if (type === "security_alert") {
      subject = "⚠️ Security Alert - Sign Up Attempt";
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc2626;">Security Alert</h1>
          <p>Hello,</p>
          <p>Someone tried to create a new account using your email address: <strong>${email}</strong></p>
          <p>If this was you, you already have an account. Please <a href="${Deno.env.get("SITE_URL") || "https://e1436f2c-8e37-4c17-9e99-8592673ebfa7.lovableproject.com"}/auth">sign in</a> instead.</p>
          <p>If this wasn't you, your account is still secure. No action is needed.</p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">This is an automated security notification from CityConnect.</p>
        </div>
      `;
    } else {
      subject = "🎉 Welcome to CityConnect!";
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #059669;">Welcome to CityConnect!</h1>
          <p>Hello ${name || "there"},</p>
          <p>Thank you for creating your account. You're now part of our community dedicated to making our city better!</p>
          <p>With CityConnect, you can:</p>
          <ul>
            <li>Report city issues like potholes, broken lights, and more</li>
            <li>Track the status of your reports</li>
            <li>Stay updated on city improvements</li>
          </ul>
          <p><a href="${Deno.env.get("SITE_URL") || "https://e1436f2c-8e37-4c17-9e99-8592673ebfa7.lovableproject.com"}/" style="display: inline-block; background-color: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Get Started</a></p>
          <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">This is an automated message from CityConnect.</p>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "CityConnect <onboarding@resend.dev>",
      to: [email],
      subject: subject,
      html: html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-auth-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

Deno.serve(handler);
