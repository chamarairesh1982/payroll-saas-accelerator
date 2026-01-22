export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attendance_records: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          notes: string | null
          status: string
          updated_at: string
          worked_hours: number | null
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date: string
          employee_id: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          worked_hours?: number | null
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          worked_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          bank_account_number: string | null
          bank_branch: string | null
          bank_name: string | null
          created_at: string
          email: string | null
          epf_number: string | null
          etf_number: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          max_employees: number | null
          name: string
          phone: string | null
          registration_number: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_ends_at: string | null
          subscription_plan:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_started_at: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          created_at?: string
          email?: string | null
          epf_number?: string | null
          etf_number?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          max_employees?: number | null
          name: string
          phone?: string | null
          registration_number?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_started_at?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          created_at?: string
          email?: string | null
          epf_number?: string | null
          etf_number?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          max_employees?: number | null
          name?: string
          phone?: string | null
          registration_number?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          subscription_plan?:
            | Database["public"]["Enums"]["subscription_plan"]
            | null
          subscription_started_at?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          updated_at?: string
        }
        Relationships: []
      }
      employee_documents: {
        Row: {
          created_at: string
          description: string | null
          document_type: string
          employee_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_type: string
          employee_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_type?: string
          employee_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_invitations: {
        Row: {
          accepted_at: string | null
          basic_salary: number | null
          company_id: string
          created_at: string
          department: string | null
          designation: string | null
          email: string
          employment_type: string | null
          expires_at: string
          first_name: string
          id: string
          invited_by: string
          last_name: string
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          basic_salary?: number | null
          company_id: string
          created_at?: string
          department?: string | null
          designation?: string | null
          email: string
          employment_type?: string | null
          expires_at: string
          first_name: string
          id?: string
          invited_by: string
          last_name: string
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          basic_salary?: number | null
          company_id?: string
          created_at?: string
          department?: string | null
          designation?: string | null
          email?: string
          employment_type?: string | null
          expires_at?: string
          first_name?: string
          id?: string
          invited_by?: string
          last_name?: string
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          days: number
          employee_id: string
          end_date: string
          id: string
          leave_type_id: string
          reason: string | null
          rejection_reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          days: number
          employee_id: string
          end_date: string
          id?: string
          leave_type_id: string
          reason?: string | null
          rejection_reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          days?: number
          employee_id?: string
          end_date?: string
          id?: string
          leave_type_id?: string
          reason?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          code: string
          company_id: string
          created_at: string
          days_per_year: number
          id: string
          is_active: boolean
          is_carry_forward: boolean
          is_paid: boolean
          max_carry_forward: number
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          days_per_year?: number
          id?: string
          is_active?: boolean
          is_carry_forward?: boolean
          is_paid?: boolean
          max_carry_forward?: number
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          days_per_year?: number
          id?: string
          is_active?: boolean
          is_carry_forward?: boolean
          is_paid?: boolean
          max_carry_forward?: number
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_recovery_schedules: {
        Row: {
          created_at: string
          due_date: string
          id: string
          installment_number: number
          interest_amount: number
          loan_id: string
          paid_amount: number
          paid_date: string | null
          principal_amount: number
          status: Database["public"]["Enums"]["recovery_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date: string
          id?: string
          installment_number: number
          interest_amount?: number
          loan_id: string
          paid_amount?: number
          paid_date?: string | null
          principal_amount: number
          status?: Database["public"]["Enums"]["recovery_status"]
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string
          id?: string
          installment_number?: number
          interest_amount?: number
          loan_id?: string
          paid_amount?: number
          paid_date?: string | null
          principal_amount?: number
          status?: Database["public"]["Enums"]["recovery_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_recovery_schedules_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          employee_id: string
          expected_end_date: string
          id: string
          interest_rate: number
          loan_type: Database["public"]["Enums"]["loan_type"]
          monthly_deduction: number
          outstanding_amount: number
          principal_amount: number
          rejection_reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["loan_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id: string
          expected_end_date: string
          id?: string
          interest_rate?: number
          loan_type: Database["public"]["Enums"]["loan_type"]
          monthly_deduction: number
          outstanding_amount: number
          principal_amount: number
          rejection_reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["loan_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id?: string
          expected_end_date?: string
          id?: string
          interest_rate?: number
          loan_type?: Database["public"]["Enums"]["loan_type"]
          monthly_deduction?: number
          outstanding_amount?: number
          principal_amount?: number
          rejection_reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["loan_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          created_at: string
          details: Json | null
          employee_id: string
          error_message: string | null
          id: string
          notification_type: string
          recipient_email: string
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          employee_id: string
          error_message?: string | null
          id?: string
          notification_type: string
          recipient_email: string
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          employee_id?: string
          error_message?: string | null
          id?: string
          notification_type?: string
          recipient_email?: string
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      overtime_entries: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          calculated_amount: number
          created_at: string
          date: string
          employee_id: string
          hours: number
          id: string
          overtime_rate_id: string
          status: Database["public"]["Enums"]["approval_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          calculated_amount?: number
          created_at?: string
          date: string
          employee_id: string
          hours: number
          id?: string
          overtime_rate_id: string
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          calculated_amount?: number
          created_at?: string
          date?: string
          employee_id?: string
          hours?: number
          id?: string
          overtime_rate_id?: string
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "overtime_entries_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overtime_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overtime_entries_overtime_rate_id_fkey"
            columns: ["overtime_rate_id"]
            isOneToOne: false
            referencedRelation: "overtime_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      overtime_rates: {
        Row: {
          company_id: string
          created_at: string
          day_type: Database["public"]["Enums"]["overtime_day_type"]
          id: string
          is_active: boolean
          multiplier: number
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          day_type: Database["public"]["Enums"]["overtime_day_type"]
          id?: string
          is_active?: boolean
          multiplier?: number
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          day_type?: Database["public"]["Enums"]["overtime_day_type"]
          id?: string
          is_active?: boolean
          multiplier?: number
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "overtime_rates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          created_by: string
          employee_count: number
          id: string
          pay_date: string
          pay_period_end: string
          pay_period_start: string
          status: Database["public"]["Enums"]["payroll_status"]
          total_epf_employee: number
          total_epf_employer: number
          total_etf: number
          total_gross_salary: number
          total_net_salary: number
          total_paye: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          created_by: string
          employee_count?: number
          id?: string
          pay_date: string
          pay_period_end: string
          pay_period_start: string
          status?: Database["public"]["Enums"]["payroll_status"]
          total_epf_employee?: number
          total_epf_employer?: number
          total_etf?: number
          total_gross_salary?: number
          total_net_salary?: number
          total_paye?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          employee_count?: number
          id?: string
          pay_date?: string
          pay_period_end?: string
          pay_period_start?: string
          status?: Database["public"]["Enums"]["payroll_status"]
          total_epf_employee?: number
          total_epf_employer?: number
          total_etf?: number
          total_gross_salary?: number
          total_net_salary?: number
          total_paye?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_runs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payslips: {
        Row: {
          allowances: Json
          basic_salary: number
          created_at: string
          deductions: Json
          employee_id: string
          epf_employee: number
          epf_employer: number
          etf_employer: number
          gross_salary: number
          id: string
          net_salary: number
          ot_amount: number
          ot_hours: number
          paye_tax: number
          payroll_run_id: string
          taxable_income: number
          worked_days: number
          working_days: number
        }
        Insert: {
          allowances?: Json
          basic_salary: number
          created_at?: string
          deductions?: Json
          employee_id: string
          epf_employee?: number
          epf_employer?: number
          etf_employer?: number
          gross_salary: number
          id?: string
          net_salary: number
          ot_amount?: number
          ot_hours?: number
          paye_tax?: number
          payroll_run_id: string
          taxable_income?: number
          worked_days?: number
          working_days?: number
        }
        Update: {
          allowances?: Json
          basic_salary?: number
          created_at?: string
          deductions?: Json
          employee_id?: string
          epf_employee?: number
          epf_employer?: number
          etf_employer?: number
          gross_salary?: number
          id?: string
          net_salary?: number
          ot_amount?: number
          ot_hours?: number
          paye_tax?: number
          payroll_run_id?: string
          taxable_income?: number
          worked_days?: number
          working_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "payslips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_payroll_run_id_fkey"
            columns: ["payroll_run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_stats: {
        Row: {
          active_companies: number | null
          created_at: string | null
          id: string
          mrr: number | null
          stat_date: string
          total_companies: number | null
          total_employees: number | null
          total_users: number | null
        }
        Insert: {
          active_companies?: number | null
          created_at?: string | null
          id?: string
          mrr?: number | null
          stat_date?: string
          total_companies?: number | null
          total_employees?: number | null
          total_users?: number | null
        }
        Update: {
          active_companies?: number | null
          created_at?: string | null
          id?: string
          mrr?: number | null
          stat_date?: string
          total_companies?: number | null
          total_employees?: number | null
          total_users?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bank_account_number: string | null
          bank_branch: string | null
          bank_name: string | null
          basic_salary: number | null
          company_id: string | null
          created_at: string
          date_of_birth: string | null
          date_of_joining: string | null
          department: string | null
          designation: string | null
          email: string | null
          employee_number: string | null
          employment_type: string | null
          epf_number: string | null
          first_name: string | null
          id: string
          last_name: string | null
          nic: string | null
          notification_preferences: Json | null
          phone: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          basic_salary?: number | null
          company_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          date_of_joining?: string | null
          department?: string | null
          designation?: string | null
          email?: string | null
          employee_number?: string | null
          employment_type?: string | null
          epf_number?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          nic?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          basic_salary?: number | null
          company_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          date_of_joining?: string | null
          department?: string | null
          designation?: string | null
          email?: string | null
          employee_number?: string | null
          employment_type?: string | null
          epf_number?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          nic?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_components: {
        Row: {
          calculation_type: Database["public"]["Enums"]["calculation_type"]
          category: Database["public"]["Enums"]["component_category"]
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          is_epf_applicable: boolean
          is_taxable: boolean
          name: string
          type: Database["public"]["Enums"]["component_type"]
          updated_at: string
          value: number
        }
        Insert: {
          calculation_type?: Database["public"]["Enums"]["calculation_type"]
          category: Database["public"]["Enums"]["component_category"]
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_epf_applicable?: boolean
          is_taxable?: boolean
          name: string
          type: Database["public"]["Enums"]["component_type"]
          updated_at?: string
          value?: number
        }
        Update: {
          calculation_type?: Database["public"]["Enums"]["calculation_type"]
          category?: Database["public"]["Enums"]["component_category"]
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_epf_applicable?: boolean
          is_taxable?: boolean
          name?: string
          type?: Database["public"]["Enums"]["component_type"]
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "salary_components_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_employees: number
          name: string
          plan_type: Database["public"]["Enums"]["subscription_plan"]
          price_monthly: number
          price_yearly: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_employees?: number
          name: string
          plan_type: Database["public"]["Enums"]["subscription_plan"]
          price_monthly?: number
          price_yearly?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_employees?: number
          name?: string
          plan_type?: Database["public"]["Enums"]["subscription_plan"]
          price_monthly?: number
          price_yearly?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      tax_slabs: {
        Row: {
          company_id: string
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          is_active: boolean
          max_income: number
          min_income: number
          rate: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          effective_from: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          max_income: number
          min_income: number
          rate: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean
          max_income?: number
          min_income?: number
          rate?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_slabs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_add_employee: { Args: { p_company_id: string }; Returns: boolean }
      get_user_company_id: { Args: { p_user_id: string }; Returns: string }
      get_user_company_id_safe: { Args: { p_user_id: string }; Returns: string }
      get_user_role: {
        Args: { p_company_id: string; p_user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { p_user_id: string }; Returns: boolean }
      user_has_company: { Args: { p_user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "hr" | "manager" | "employee"
      approval_status: "pending" | "approved" | "rejected"
      calculation_type: "basic" | "gross" | "fixed"
      component_category: "fixed" | "percentage" | "variable"
      component_type: "allowance" | "deduction"
      employee_status: "active" | "inactive" | "terminated"
      employment_type: "permanent" | "contract" | "probation" | "intern"
      leave_status: "pending" | "approved" | "rejected" | "cancelled"
      loan_status: "pending" | "active" | "completed" | "defaulted" | "rejected"
      loan_type: "salary_advance" | "personal_loan" | "emergency_loan"
      overtime_day_type: "weekday" | "saturday" | "sunday" | "holiday"
      payroll_status:
        | "draft"
        | "processing"
        | "pending_approval"
        | "approved"
        | "paid"
      recovery_status: "pending" | "paid" | "partial" | "overdue"
      subscription_plan: "free" | "pro" | "enterprise"
      subscription_status: "active" | "canceled" | "past_due" | "trialing"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "admin", "hr", "manager", "employee"],
      approval_status: ["pending", "approved", "rejected"],
      calculation_type: ["basic", "gross", "fixed"],
      component_category: ["fixed", "percentage", "variable"],
      component_type: ["allowance", "deduction"],
      employee_status: ["active", "inactive", "terminated"],
      employment_type: ["permanent", "contract", "probation", "intern"],
      leave_status: ["pending", "approved", "rejected", "cancelled"],
      loan_status: ["pending", "active", "completed", "defaulted", "rejected"],
      loan_type: ["salary_advance", "personal_loan", "emergency_loan"],
      overtime_day_type: ["weekday", "saturday", "sunday", "holiday"],
      payroll_status: [
        "draft",
        "processing",
        "pending_approval",
        "approved",
        "paid",
      ],
      recovery_status: ["pending", "paid", "partial", "overdue"],
      subscription_plan: ["free", "pro", "enterprise"],
      subscription_status: ["active", "canceled", "past_due", "trialing"],
    },
  },
} as const
