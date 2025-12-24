import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const testEmployees = [
  { first_name: "John", last_name: "Smith", department: "Engineering", designation: "Software Developer", salary: 75000 },
  { first_name: "Jane", last_name: "Johnson", department: "Finance", designation: "Accountant", salary: 65000 },
  { first_name: "Michael", last_name: "Williams", department: "HR", designation: "HR Executive", salary: 55000 },
  { first_name: "Emily", last_name: "Brown", department: "Marketing", designation: "Marketing Executive", salary: 60000 },
  { first_name: "David", last_name: "Jones", department: "Operations", designation: "Operations Coordinator", salary: 50000 },
  { first_name: "Sarah", last_name: "Garcia", department: "Sales", designation: "Sales Executive", salary: 58000 },
  { first_name: "Robert", last_name: "Miller", department: "Engineering", designation: "Senior Software Developer", salary: 95000 },
  { first_name: "Lisa", last_name: "Davis", department: "Finance", designation: "Senior Accountant", salary: 78000 },
  { first_name: "William", last_name: "Rodriguez", department: "Engineering", designation: "Tech Lead", salary: 110000 },
  { first_name: "Amanda", last_name: "Martinez", department: "HR", designation: "HR Manager", salary: 85000 },
];

const handler = async (req: Request): Promise<Response> => {
  console.log("seed-test-employees function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get or create demo company
    let companyId = "11111111-1111-1111-1111-111111111111";
    
    const { data: existingCompany } = await supabase
      .from("companies")
      .select("id")
      .eq("id", companyId)
      .single();

    if (!existingCompany) {
      const { error: companyError } = await supabase
        .from("companies")
        .insert({
          id: companyId,
          name: "Demo Company",
          email: "demo@example.com",
          phone: "+94771234567",
          address: "123 Demo Street, Colombo",
          is_active: true,
        });
      
      if (companyError) {
        console.error("Company creation error:", companyError);
      }
    }

    // Get last employee number
    const { data: lastEmployees } = await supabase
      .from("profiles")
      .select("employee_number")
      .eq("company_id", companyId)
      .not("employee_number", "is", null)
      .order("employee_number", { ascending: false })
      .limit(1);

    let lastNumber = 0;
    const lastNumberRaw = lastEmployees?.[0]?.employee_number ?? null;
    if (lastNumberRaw && /^EMP\d{3,}$/.test(lastNumberRaw)) {
      lastNumber = Number.parseInt(lastNumberRaw.replace("EMP", ""), 10);
    }

    const createdEmployees: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < testEmployees.length; i++) {
      const emp = testEmployees[i];
      const email = `${emp.first_name.toLowerCase()}.${emp.last_name.toLowerCase()}@demo.com`;
      const employeeNumber = `EMP${String(lastNumber + i + 1).padStart(3, "0")}`;

      try {
        // Check if user exists
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === email);

        if (existingUser) {
          console.log(`User ${email} already exists, skipping`);
          continue;
        }

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: email,
          password: "TestPass123!",
          email_confirm: true,
          user_metadata: {
            first_name: emp.first_name,
            last_name: emp.last_name,
          },
        });

        if (authError || !authData.user) {
          errors.push(`Failed to create ${email}: ${authError?.message}`);
          continue;
        }

        // Update profile
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: authData.user.id,
            email: email,
            first_name: emp.first_name,
            last_name: emp.last_name,
            company_id: companyId,
            employee_number: employeeNumber,
            department: emp.department,
            designation: emp.designation,
            employment_type: "permanent",
            basic_salary: emp.salary,
            status: "active",
            date_of_joining: new Date().toISOString().split("T")[0],
          }, { onConflict: "id" });

        if (profileError) {
          errors.push(`Profile error for ${email}: ${profileError.message}`);
          continue;
        }

        // Create role
        await supabase.from("user_roles").delete().eq("user_id", authData.user.id);
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: authData.user.id,
          company_id: companyId,
          role: "employee",
        });

        if (roleError) {
          errors.push(`Role error for ${email}: ${roleError.message}`);
        }

        createdEmployees.push(`${emp.first_name} ${emp.last_name} (${email})`);
        console.log(`Created employee: ${email}`);

      } catch (err: any) {
        errors.push(`Error for ${email}: ${err.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        created: createdEmployees.length,
        employees: createdEmployees,
        errors: errors,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in seed-test-employees:", error);
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
