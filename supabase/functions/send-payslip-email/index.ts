import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PayslipEmailRequest {
  payroll_run_id: string;
  employee_ids?: string[]; // If not provided, send to all employees in the payroll run
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { payroll_run_id, employee_ids }: PayslipEmailRequest = await req.json();
    console.log("Sending payslip emails for payroll run:", payroll_run_id);

    if (!payroll_run_id) {
      return new Response(
        JSON.stringify({ error: "payroll_run_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get payroll run details
    const { data: payrollRun, error: runError } = await supabase
      .from("payroll_runs")
      .select(`
        id, pay_period_start, pay_period_end, pay_date, status,
        company:companies!payroll_runs_company_id_fkey(name)
      `)
      .eq("id", payroll_run_id)
      .single();

    if (runError || !payrollRun) {
      console.error("Error fetching payroll run:", runError);
      return new Response(
        JSON.stringify({ error: "Payroll run not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get payslips with employee details
    let payslipsQuery = supabase
      .from("payslips")
      .select(`
        id, basic_salary, gross_salary, net_salary, epf_employee, epf_employer,
        etf_employer, paye_tax, ot_hours, ot_amount, worked_days, working_days,
        allowances, deductions,
        employee:profiles!payslips_employee_id_fkey(
          id, email, first_name, last_name, employee_number, department, 
          designation, epf_number, bank_name, bank_account_number, notification_preferences
        )
      `)
      .eq("payroll_run_id", payroll_run_id);

    if (employee_ids && employee_ids.length > 0) {
      payslipsQuery = payslipsQuery.in("employee_id", employee_ids);
    }

    const { data: payslips, error: payslipsError } = await payslipsQuery;

    if (payslipsError) {
      console.error("Error fetching payslips:", payslipsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch payslips" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!payslips || payslips.length === 0) {
      return new Response(
        JSON.stringify({ message: "No payslips to send" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formatLKR = (value: number) => {
      return `LKR ${value.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const payPeriod = new Date(payrollRun.pay_period_start).toLocaleDateString("en-LK", {
      month: "long",
      year: "numeric",
    });

    const companyName = (payrollRun.company as any)?.name || "Your Company";
    const results: { email: string; status: string; error?: string }[] = [];

    // Send email to each employee
    for (const payslip of payslips) {
      const employee = payslip.employee as any;
      
      if (!employee?.email) {
        results.push({ email: "unknown", status: "skipped", error: "No email address" });
        continue;
      }

      // Check notification preferences
      const prefs = (employee.notification_preferences || {}) as Record<string, boolean>;
      if (prefs.email_payroll_updates === false) {
        results.push({ email: employee.email, status: "skipped", error: "Notifications disabled" });
        continue;
      }

      const employeeName = `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || "Employee";

      // Build HTML email
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; padding: 20px; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: #2563eb; color: white; padding: 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">${companyName}</h1>
              <p style="margin: 8px 0 0; opacity: 0.9;">Payslip for ${payPeriod}</p>
            </div>
            
            <!-- Greeting -->
            <div style="padding: 24px;">
              <p style="margin: 0 0 16px; font-size: 16px;">Dear ${employeeName},</p>
              <p style="margin: 0 0 24px; color: #666;">Your payslip for <strong>${payPeriod}</strong> is now available. Please find the summary below.</p>
              
              <!-- Employee Details -->
              <div style="background: #f8fafc; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px; font-size: 14px; color: #64748b; text-transform: uppercase;">Employee Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 4px 0; color: #666;">Employee No:</td>
                    <td style="padding: 4px 0; font-weight: 600;">${employee.employee_number || "-"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #666;">Department:</td>
                    <td style="padding: 4px 0; font-weight: 600;">${employee.department || "-"}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #666;">EPF No:</td>
                    <td style="padding: 4px 0; font-weight: 600;">${employee.epf_number || "-"}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Earnings & Deductions -->
              <div style="display: flex; gap: 16px; margin-bottom: 24px;">
                <!-- Earnings -->
                <div style="flex: 1; background: #f0fdf4; border-radius: 6px; padding: 16px;">
                  <h3 style="margin: 0 0 12px; font-size: 14px; color: #16a34a; text-transform: uppercase;">Earnings</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 4px 0; color: #666;">Basic Salary</td>
                      <td style="padding: 4px 0; text-align: right; font-weight: 600;">${formatLKR(payslip.basic_salary)}</td>
                    </tr>
                    ${payslip.ot_amount > 0 ? `
                    <tr>
                      <td style="padding: 4px 0; color: #666;">Overtime (${payslip.ot_hours} hrs)</td>
                      <td style="padding: 4px 0; text-align: right; font-weight: 600;">${formatLKR(payslip.ot_amount)}</td>
                    </tr>
                    ` : ""}
                    <tr style="border-top: 1px solid #bbf7d0; margin-top: 8px;">
                      <td style="padding: 8px 0 4px; font-weight: 600;">Gross Salary</td>
                      <td style="padding: 8px 0 4px; text-align: right; font-weight: 700; color: #16a34a;">${formatLKR(payslip.gross_salary)}</td>
                    </tr>
                  </table>
                </div>
                
                <!-- Deductions -->
                <div style="flex: 1; background: #fef2f2; border-radius: 6px; padding: 16px;">
                  <h3 style="margin: 0 0 12px; font-size: 14px; color: #dc2626; text-transform: uppercase;">Deductions</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 4px 0; color: #666;">EPF (8%)</td>
                      <td style="padding: 4px 0; text-align: right; font-weight: 600;">${formatLKR(payslip.epf_employee)}</td>
                    </tr>
                    ${payslip.paye_tax > 0 ? `
                    <tr>
                      <td style="padding: 4px 0; color: #666;">PAYE Tax</td>
                      <td style="padding: 4px 0; text-align: right; font-weight: 600;">${formatLKR(payslip.paye_tax)}</td>
                    </tr>
                    ` : ""}
                    <tr style="border-top: 1px solid #fecaca; margin-top: 8px;">
                      <td style="padding: 8px 0 4px; font-weight: 600;">Total Deductions</td>
                      <td style="padding: 8px 0 4px; text-align: right; font-weight: 700; color: #dc2626;">${formatLKR(payslip.epf_employee + payslip.paye_tax)}</td>
                    </tr>
                  </table>
                </div>
              </div>
              
              <!-- Net Salary -->
              <div style="background: #2563eb; color: white; border-radius: 6px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <p style="margin: 0 0 4px; font-size: 14px; opacity: 0.9;">NET SALARY</p>
                <p style="margin: 0; font-size: 28px; font-weight: 700;">${formatLKR(payslip.net_salary)}</p>
              </div>
              
              <!-- Employer Contributions -->
              <div style="background: #f8fafc; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 8px; font-size: 12px; color: #64748b; text-transform: uppercase;">Employer Contributions (Not deducted from salary)</h3>
                <p style="margin: 0; color: #666;">EPF Employer (12%): ${formatLKR(payslip.epf_employer)} | ETF (3%): ${formatLKR(payslip.etf_employer)}</p>
              </div>
              
              <!-- Footer -->
              <p style="margin: 0; color: #999; font-size: 12px; text-align: center;">
                This is an automated email. Please log in to the HR system to download your full payslip.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Payroll <onboarding@resend.dev>",
            to: [employee.email],
            subject: `Your Payslip for ${payPeriod} - ${companyName}`,
            html: htmlContent,
          }),
        });

        const emailResult = await emailResponse.json();

        if (!emailResponse.ok) {
          console.error(`Failed to send email to ${employee.email}:`, emailResult);
          results.push({ email: employee.email, status: "failed", error: emailResult.message || "Send failed" });

          // Log failure
          await supabase.from("notification_logs").insert({
            employee_id: employee.id,
            notification_type: "payroll",
            status: "failed",
            subject: `Payslip for ${payPeriod}`,
            recipient_email: employee.email,
            error_message: JSON.stringify(emailResult),
            details: { payroll_run_id, net_salary: payslip.net_salary },
          });
        } else {
          console.log(`Payslip email sent to ${employee.email}`);
          results.push({ email: employee.email, status: "sent" });

          // Log success
          await supabase.from("notification_logs").insert({
            employee_id: employee.id,
            notification_type: "payroll",
            status: "sent",
            subject: `Payslip for ${payPeriod}`,
            recipient_email: employee.email,
            sent_at: new Date().toISOString(),
            details: { payroll_run_id, net_salary: payslip.net_salary },
          });
        }
      } catch (emailError: unknown) {
        const errorMsg = emailError instanceof Error ? emailError.message : "Unknown error";
        console.error(`Error sending to ${employee.email}:`, errorMsg);
        results.push({ email: employee.email, status: "failed", error: errorMsg });
      }
    }

    const sentCount = results.filter((r) => r.status === "sent").length;
    const failedCount = results.filter((r) => r.status === "failed").length;
    const skippedCount = results.filter((r) => r.status === "skipped").length;

    console.log(`Payslip emails: ${sentCount} sent, ${failedCount} failed, ${skippedCount} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        failed: failedCount,
        skipped: skippedCount,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending payslip emails:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});