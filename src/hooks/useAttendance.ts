import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type AttendanceRecord = Tables<"attendance_records">;
export type AttendanceInsert = TablesInsert<"attendance_records">;
export type AttendanceUpdate = TablesUpdate<"attendance_records">;

export type AttendanceStatus = "present" | "absent" | "half_day" | "leave" | "holiday" | "weekend";

export const attendanceStatusConfig: Record<AttendanceStatus, { label: string; color: string }> = {
  present: { label: "Present", color: "bg-success/15 text-success" },
  absent: { label: "Absent", color: "bg-destructive/15 text-destructive" },
  half_day: { label: "Half Day", color: "bg-warning/15 text-warning" },
  leave: { label: "On Leave", color: "bg-primary/15 text-primary" },
  holiday: { label: "Holiday", color: "bg-accent/15 text-accent-foreground" },
  weekend: { label: "Weekend", color: "bg-muted text-muted-foreground" },
};

export const useAttendance = (month?: number, year?: number) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const currentMonth = month ?? new Date().getMonth() + 1;
  const currentYear = year ?? new Date().getFullYear();

  const startDate = new Date(currentYear, currentMonth - 1, 1).toISOString().split("T")[0];
  const endDate = new Date(currentYear, currentMonth, 0).toISOString().split("T")[0];

  const {
    data: attendance = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["attendance", companyId, currentMonth, currentYear],
    queryFn: async () => {
      if (!companyId) return [];

      // First get all employees in the company
      const { data: employees } = await supabase
        .from("profiles")
        .select("id")
        .eq("company_id", companyId)
        .eq("status", "active");

      if (!employees || employees.length === 0) return [];

      const employeeIds = employees.map((e) => e.id);

      const { data, error } = await supabase
        .from("attendance_records")
        .select(`
          *,
          employee:profiles!attendance_records_employee_id_fkey(
            id, first_name, last_name, employee_number, department, designation
          )
        `)
        .in("employee_id", employeeIds)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });

  const createAttendanceMutation = useMutation({
    mutationFn: async (data: AttendanceInsert) => {
      const { error } = await supabase.from("attendance_records").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", companyId] });
      toast.success("Attendance recorded successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to record attendance");
    },
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: AttendanceUpdate }) => {
      const { error } = await supabase
        .from("attendance_records")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", companyId] });
      toast.success("Attendance updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update attendance");
    },
  });

  const bulkCreateAttendanceMutation = useMutation({
    mutationFn: async (records: AttendanceInsert[]) => {
      const { error } = await supabase.from("attendance_records").upsert(records, {
        onConflict: "employee_id,date",
        ignoreDuplicates: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", companyId] });
      toast.success("Attendance records saved successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save attendance records");
    },
  });

  return {
    attendance,
    isLoading,
    error,
    createAttendance: createAttendanceMutation.mutate,
    updateAttendance: updateAttendanceMutation.mutate,
    bulkCreateAttendance: bulkCreateAttendanceMutation.mutate,
    isCreating: createAttendanceMutation.isPending,
    isUpdating: updateAttendanceMutation.isPending,
    isBulkCreating: bulkCreateAttendanceMutation.isPending,
  };
};

// Hook to get attendance summary for payroll
export const useAttendanceSummary = (employeeIds: string[], month: number, year: number) => {
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0];
  const endDate = new Date(year, month, 0).toISOString().split("T")[0];

  return useQuery({
    queryKey: ["attendance-summary", employeeIds, month, year],
    queryFn: async () => {
      if (!companyId || employeeIds.length === 0) return {};

      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .in("employee_id", employeeIds)
        .gte("date", startDate)
        .lte("date", endDate);

      if (error) throw error;

      // Calculate summary per employee
      const summary: Record<string, {
        workedDays: number;
        workedHours: number;
        presentDays: number;
        absentDays: number;
        halfDays: number;
        leaveDays: number;
      }> = {};

      employeeIds.forEach((id) => {
        summary[id] = {
          workedDays: 0,
          workedHours: 0,
          presentDays: 0,
          absentDays: 0,
          halfDays: 0,
          leaveDays: 0,
        };
      });

      data?.forEach((record) => {
        if (!summary[record.employee_id]) return;

        const hours = Number(record.worked_hours) || 0;
        summary[record.employee_id].workedHours += hours;

        switch (record.status) {
          case "present":
            summary[record.employee_id].presentDays++;
            summary[record.employee_id].workedDays++;
            break;
          case "half_day":
            summary[record.employee_id].halfDays++;
            summary[record.employee_id].workedDays += 0.5;
            break;
          case "absent":
            summary[record.employee_id].absentDays++;
            break;
          case "leave":
            summary[record.employee_id].leaveDays++;
            break;
        }
      });

      return summary;
    },
    enabled: !!companyId && employeeIds.length > 0,
  });
};
