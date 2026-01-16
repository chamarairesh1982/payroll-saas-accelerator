import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  type: "leave" | "overtime" | "payroll";
  employee_id: string;
  status: string;
  details?: Record<string, unknown>;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  let logId: string | null = null;

  try {
    const payload: NotificationPayload = await req.json();
    console.log("Received notification payload:", payload);

    // Get employee details including notification preferences
    const { data: employee, error: empError } = await supabase
      .from("profiles")
      .select("email, first_name, last_name, notification_preferences")
      .eq("id", payload.employee_id)
      .single();

    if (empError || !employee) {
      console.error("Error fetching employee:", empError);
      return new Response(
        JSON.stringify({ error: "Employee not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!employee.email) {
      console.log("Employee has no email address");
      return new Response(
        JSON.stringify({ message: "No email address configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check notification preferences
    const prefs = (employee.notification_preferences || {}) as Record<string, boolean>;
    const prefKey = `email_${payload.type}_updates`;
    
    if (prefs[prefKey] === false) {
      console.log(`Notifications disabled for ${prefKey}`);
      
      // Log skipped notification
      await supabase.from("notification_logs").insert({
        employee_id: payload.employee_id,
        notification_type: payload.type,
        status: "skipped",
        subject: `${payload.type} notification skipped - disabled by preference`,
        recipient_email: employee.email,
        details: payload.details,
      });
      
      return new Response(
        JSON.stringify({ message: "Notifications disabled by user preference" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build email content based on type
    const employeeName = `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || "Employee";
    let subject = "";
    let htmlContent = "";

    switch (payload.type) {
      case "leave":
        subject = `Leave Request ${payload.status.charAt(0).toUpperCase() + payload.status.slice(1)}`;
        htmlContent = `
          <h2>Leave Request Update</h2>
          <p>Dear ${employeeName},</p>
          <p>Your leave request has been <strong>${payload.status}</strong>.</p>
          ${payload.details?.start_date ? `<p><strong>Period:</strong> ${payload.details.start_date} to ${payload.details.end_date}</p>` : ""}
          ${payload.details?.days ? `<p><strong>Days:</strong> ${payload.details.days}</p>` : ""}
          ${payload.status === "rejected" && payload.details?.rejection_reason ? `<p><strong>Reason:</strong> ${payload.details.rejection_reason}</p>` : ""}
          <p>Please log in to the HR system for more details.</p>
          <p>Best regards,<br>HR Team</p>
        `;
        break;

      case "overtime":
        subject = `Overtime Entry ${payload.status.charAt(0).toUpperCase() + payload.status.slice(1)}`;
        htmlContent = `
          <h2>Overtime Entry Update</h2>
          <p>Dear ${employeeName},</p>
          <p>Your overtime entry has been <strong>${payload.status}</strong>.</p>
          ${payload.details?.date ? `<p><strong>Date:</strong> ${payload.details.date}</p>` : ""}
          ${payload.details?.hours ? `<p><strong>Hours:</strong> ${payload.details.hours}</p>` : ""}
          ${payload.details?.calculated_amount ? `<p><strong>Amount:</strong> LKR ${Number(payload.details.calculated_amount).toLocaleString()}</p>` : ""}
          <p>Please log in to the HR system for more details.</p>
          <p>Best regards,<br>HR Team</p>
        `;
        break;

      case "payroll":
        subject = `Payroll ${payload.status.charAt(0).toUpperCase() + payload.status.slice(1)}`;
        htmlContent = `
          <h2>Payroll Update</h2>
          <p>Dear ${employeeName},</p>
          <p>The payroll for the period has been <strong>${payload.status}</strong>.</p>
          ${payload.details?.pay_period_start ? `<p><strong>Period:</strong> ${payload.details.pay_period_start} to ${payload.details.pay_period_end}</p>` : ""}
          ${payload.details?.net_salary ? `<p><strong>Net Salary:</strong> LKR ${Number(payload.details.net_salary).toLocaleString()}</p>` : ""}
          <p>Please log in to view your payslip.</p>
          <p>Best regards,<br>HR Team</p>
        `;
        break;
    }

    // Create pending log entry
    const { data: logEntry, error: logError } = await supabase
      .from("notification_logs")
      .insert({
        employee_id: payload.employee_id,
        notification_type: payload.type,
        status: "pending",
        subject,
        recipient_email: employee.email,
        details: payload.details,
      })
      .select("id")
      .single();

    if (logError) {
      console.error("Error creating log entry:", logError);
    } else {
      logId = logEntry.id;
    }

    // Send email using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "HR System <onboarding@resend.dev>",
        to: [employee.email],
        subject,
        html: htmlContent,
      }),
    });

    const emailResult = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Failed to send email:", emailResult);
      
      // Update log with failure
      if (logId) {
        await supabase
          .from("notification_logs")
          .update({
            status: "failed",
            error_message: JSON.stringify(emailResult),
          })
          .eq("id", logId);
      }
      
      return new Response(
        JSON.stringify({ error: emailResult }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email sent successfully:", emailResult);

    // Update log with success
    if (logId) {
      await supabase
        .from("notification_logs")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", logId);
    }

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending notification email:", errorMessage);
    
    // Update log with error if we have one
    if (logId) {
      await supabase
        .from("notification_logs")
        .update({
          status: "failed",
          error_message: errorMessage,
        })
        .eq("id", logId);
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
