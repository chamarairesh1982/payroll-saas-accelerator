import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AcceptInvitationRequest {
  token: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("accept-invitation function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token, password }: AcceptInvitationRequest = await req.json();

    // Server-side password validation
    if (!password || typeof password !== "string") {
      console.error("Password is required");
      return new Response(
        JSON.stringify({ error: "Password is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (password.length < 8) {
      console.error("Password too short");
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Require at least one uppercase, one lowercase, and one number
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      console.error("Password does not meet complexity requirements");
      return new Response(
        JSON.stringify({ error: "Password must contain at least one uppercase letter, one lowercase letter, and one number" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Looking up invitation with token");

    // Find the invitation
    const { data: invitation, error: findError } = await supabase
      .from("employee_invitations")
      .select("*")
      .eq("token", token)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .single();

    if (findError || !invitation) {
      console.error("Invitation not found:", findError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired invitation" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Found invitation for:", invitation.email);

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === invitation.email);

    if (existingUser) {
      console.error("User already exists:", invitation.email);
      return new Response(
        JSON.stringify({ error: "An account with this email already exists" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get the next employee number
    const { data: employees } = await supabase
      .from("profiles")
      .select("employee_number")
      .eq("company_id", invitation.company_id)
      .not("employee_number", "is", null)
      .order("employee_number", { ascending: false })
      .limit(1);

    let nextEmployeeNumber = "EMP001";
    if (employees && employees.length > 0 && employees[0].employee_number) {
      const lastNumber = parseInt(employees[0].employee_number.replace("EMP", ""));
      nextEmployeeNumber = `EMP${String(lastNumber + 1).padStart(3, "0")}`;
    }

    console.log("Next employee number:", nextEmployeeNumber);

    // Create the user account
    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email: invitation.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: invitation.first_name,
        last_name: invitation.last_name,
      },
    });

    if (signUpError || !authData.user) {
      console.error("Sign up error:", signUpError);
      return new Response(
        JSON.stringify({ error: signUpError?.message || "Failed to create account" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("User created:", authData.user.id);

    // Update the profile with employee details
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        company_id: invitation.company_id,
        first_name: invitation.first_name,
        last_name: invitation.last_name,
        department: invitation.department,
        designation: invitation.designation,
        basic_salary: invitation.basic_salary,
        employment_type: invitation.employment_type,
        employee_number: nextEmployeeNumber,
        status: "active",
        date_of_joining: new Date().toISOString().split("T")[0],
      })
      .eq("id", authData.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    // Create the user role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: authData.user.id,
        company_id: invitation.company_id,
        role: "employee",
      });

    if (roleError) {
      console.error("Role creation error:", roleError);
    }

    // Mark the invitation as accepted
    const { error: updateError } = await supabase
      .from("employee_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitation.id);

    if (updateError) {
      console.error("Invitation update error:", updateError);
    }

    console.log("Invitation accepted successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Account created successfully",
        email: invitation.email,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in accept-invitation:", error);
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
