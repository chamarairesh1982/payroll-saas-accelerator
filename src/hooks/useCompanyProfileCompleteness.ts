import { useMemo } from "react";
import { Company } from "./useCompany";

export interface ProfileCompletenessCheck {
  field: string;
  label: string;
  isComplete: boolean;
  isRequired: boolean;
}

export interface CompanyProfileCompleteness {
  checks: ProfileCompletenessCheck[];
  isPayrollReady: boolean;
  requiredMissing: ProfileCompletenessCheck[];
  recommendedMissing: ProfileCompletenessCheck[];
  completionPercentage: number;
}

export function useCompanyProfileCompleteness(company: Company | null | undefined): CompanyProfileCompleteness {
  return useMemo(() => {
    if (!company) {
      return {
        checks: [],
        isPayrollReady: false,
        requiredMissing: [],
        recommendedMissing: [],
        completionPercentage: 0,
      };
    }

    const checks: ProfileCompletenessCheck[] = [
      {
        field: "name",
        label: "Company Name",
        isComplete: !!company.name?.trim(),
        isRequired: true,
      },
      {
        field: "registration_number",
        label: "Business Registration Number",
        isComplete: !!company.registration_number?.trim(),
        isRequired: true,
      },
      {
        field: "epf_number",
        label: "EPF Registration Number",
        isComplete: !!company.epf_number?.trim(),
        isRequired: true,
      },
      {
        field: "etf_number",
        label: "ETF Registration Number",
        isComplete: !!company.etf_number?.trim(),
        isRequired: true,
      },
      {
        field: "bank_name",
        label: "Company Bank Name",
        isComplete: !!company.bank_name?.trim(),
        isRequired: true,
      },
      {
        field: "bank_account_number",
        label: "Company Bank Account",
        isComplete: !!company.bank_account_number?.trim(),
        isRequired: true,
      },
      {
        field: "address",
        label: "Company Address",
        isComplete: !!company.address?.trim(),
        isRequired: false,
      },
      {
        field: "phone",
        label: "Company Phone",
        isComplete: !!company.phone?.trim(),
        isRequired: false,
      },
      {
        field: "email",
        label: "Company Email",
        isComplete: !!company.email?.trim(),
        isRequired: false,
      },
    ];

    const requiredMissing = checks.filter((c) => c.isRequired && !c.isComplete);
    const recommendedMissing = checks.filter((c) => !c.isRequired && !c.isComplete);
    const completedCount = checks.filter((c) => c.isComplete).length;
    const completionPercentage = Math.round((completedCount / checks.length) * 100);

    return {
      checks,
      isPayrollReady: requiredMissing.length === 0,
      requiredMissing,
      recommendedMissing,
      completionPercentage,
    };
  }, [company]);
}
