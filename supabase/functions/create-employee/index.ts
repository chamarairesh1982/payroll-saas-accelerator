import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "npm:zod@3.25.76";
import { isRateLimited, rateLimitResponse, getRateLimitHeaders } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const allowedCreatorRoles = ["admin", "hr", "super_admin"] as const;

type AllowedCreatorRole = (typeof allowedCreatorRoles)[number];

type AppRole =
  | "super_admin"
  | "admin"
  | "hr"
  | "manager"
  | "employee";

// Password must be 8+ chars with uppercase, lowercase, and number
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72)
  .refine((p) => /[A-Z]/.test(p), "Password must contain an uppercase letter")
  .refine((p) => /[a-z]/.test(p), "Password must contain a lowercase letter")
  .refine((p) => /[0-9]/.test(p), "Password must contain a number");

const createEmployeeSchema = z
  .object({
    email: z.string().trim().email().max(255),
    password: passwordSchema,
    first_name: z.string().trim().min(1).max(100),
    last_name: z.string().trim().min(1).max(100),

    phone: z.string().trim().max(30).optional(),
    nic: z.string().trim().max(30).optional(),
    date_of_birth: z.string().trim().max(10).optional(),
    date_of_joining: z.string().trim().max(10).optional(),

    department: z.string().trim().max(100).optional(),
    designation: z.string().trim().max(100).optional(),
    employment_type: z.string().trim().max(30).optional(),

    bank_name: z.string().trim().max(100).optional(),
    bank_branch: z.string().trim().max(100).optional(),
    bank_account_number: z.string().trim().max(50).optional(),
    epf_number: z.string().trim().max(50).optional(),

    basic_salary: z.coerce.number().min(0).optional(),
  })
  .strict();

const emptyToNull = (value?: string | null) => {
  const v = value?.trim();
  return v ? v : null;
};

const isAllowedCreatorRole = (role: AppRole | null): role is AllowedCreatorRole =>
  !!role && (allowedCreatorRoles as readonly string[]).includes(role);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Rate limiting: 10 employee creations per minute per IP
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const rateLimitResult = isRateLimited(`create-employee:${clientIP}`, { windowMs: 60000, maxRequests: 10 });
    
    if (rateLimitResult.limited) {
      return rateLimitResponse(rateLimitResult.resetAt);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - missing bearer token" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders, ...getRateLimitHeaders(rateLimitResult) },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate user using getUser() with the token
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser();

    if (userError || !userData?.user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userId = userData.user.id;

    // Use service role for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = createEmployeeSchema.parse(await req.json());

    const { data: companyId, error: companyError } = await supabase.rpc(
      "get_user_company_id",
      {
          p_user_id: userId,
      }
    );

    if (companyError || !companyId) {
      return new Response(JSON.stringify({ error: "No company found" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: creatorRole, error: roleError } = await supabase.rpc(
      "get_user_role",
      {
        p_user_id: userId,
        p_company_id: companyId,
      }
    );

    if (roleError || !isAllowedCreatorRole((creatorRole ?? null) as AppRole | null)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Next employee number
    const { data: lastEmployees, error: lastEmployeeError } = await supabase
      .from("profiles")
      .select("employee_number")
      .eq("company_id", companyId)
      .not("employee_number", "is", null)
      .order("employee_number", { ascending: false })
      .limit(1);

    if (lastEmployeeError) throw lastEmployeeError;

    let nextEmployeeNumber = "EMP001";
    const lastNumberRaw = lastEmployees?.[0]?.employee_number ?? null;
    if (lastNumberRaw && /^EMP\d{3,}$/.test(lastNumberRaw)) {
      const lastNumber = Number.parseInt(lastNumberRaw.replace("EMP", ""), 10);
      if (!Number.isNaN(lastNumber)) {
        nextEmployeeNumber = `EMP${String(lastNumber + 1).padStart(3, "0")}`;
      }
    }

    // Create auth user without impacting the caller session
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        first_name: payload.first_name,
        last_name: payload.last_name,
      },
    });

    if (createError || !created.user) {
      return new Response(
        JSON.stringify({ error: createError?.message || "Failed to create user" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Ensure profile exists + assign to company
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: created.user.id,
          email: payload.email,
          first_name: payload.first_name,
          last_name: payload.last_name,
          company_id: companyId,
          employee_number: nextEmployeeNumber,
          phone: emptyToNull(payload.phone),
          nic: emptyToNull(payload.nic),
          date_of_birth: emptyToNull(payload.date_of_birth),
          date_of_joining: emptyToNull(payload.date_of_joining),
          department: emptyToNull(payload.department),
          designation: emptyToNull(payload.designation),
          employment_type: emptyToNull(payload.employment_type) ?? "permanent",
          bank_name: emptyToNull(payload.bank_name),
          bank_branch: emptyToNull(payload.bank_branch),
          bank_account_number: emptyToNull(payload.bank_account_number),
          epf_number: emptyToNull(payload.epf_number),
          basic_salary: payload.basic_salary ?? 0,
          status: "active",
        },
        { onConflict: "id" }
      );

    if (profileError) throw profileError;

    // Ensure role row exists
    const { error: cleanupRoleError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", created.user.id)
      .eq("company_id", companyId);

    if (cleanupRoleError) throw cleanupRoleError;

    const { error: roleInsertError } = await supabase.from("user_roles").insert({
      user_id: created.user.id,
      company_id: companyId,
      role: "employee",
    });

    if (roleInsertError) throw roleInsertError;

    return new Response(
      JSON.stringify({
        success: true,
        employeeId: created.user.id,
        employeeNumber: nextEmployeeNumber,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    const message = error?.message || "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
