import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  firstName: string;
  lastName: string;
  companyId: string;
  companyName: string;
  department?: string;
  designation?: string;
  basicSalary?: number;
  employmentType?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-employee-invitation function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const {
      email,
      firstName,
      lastName,
      companyId,
      companyName,
      department,
      designation,
      basicSalary,
      employmentType,
    }: InvitationRequest = await req.json();

    console.log("Creating invitation for:", email);

    // Generate a unique token
    const invitationToken = crypto.randomUUID();
    
    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create the invitation record
    const { data: invitation, error: insertError } = await supabase
      .from("employee_invitations")
      .insert({
        email,
        first_name: firstName,
        last_name: lastName,
        company_id: companyId,
        department,
        designation,
        basic_salary: basicSalary,
        employment_type: employmentType || "permanent",
        token: invitationToken,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Invitation created:", invitation.id);

    // Get the app URL from the request origin or use a default
    const origin = req.headers.get("origin") || "https://jteynnxrmnqutacsdvat.lovableproject.com";
    const invitationLink = `${origin}/accept-invitation?token=${invitationToken}`;

    // Send the invitation email using Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "HR System <onboarding@resend.dev>",
        to: [email],
        subject: `You're invited to join ${companyName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to ${companyName}!</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hello ${firstName},</p>
              <p style="font-size: 16px; margin-bottom: 20px;">
                You've been invited to join <strong>${companyName}</strong>${designation ? ` as a <strong>${designation}</strong>` : ""}${department ? ` in the <strong>${department}</strong> department` : ""}.
              </p>
              <p style="font-size: 16px; margin-bottom: 30px;">
                Click the button below to accept your invitation and create your account:
              </p>
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${invitationLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Accept Invitation
                </a>
              </div>
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="font-size: 14px; color: #667eea; word-break: break-all; background: #f3f4f6; padding: 10px; border-radius: 6px;">
                ${invitationLink}
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="font-size: 12px; color: #9ca3af;">
                This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailResult = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Email send error:", emailResult);
      throw new Error(emailResult.message || "Failed to send email");
    }

    console.log("Email sent:", emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitationId: invitation.id,
        message: "Invitation sent successfully" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-employee-invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
