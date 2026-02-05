import { TableCell, TableRow } from "@/components/ui/table";
import { formatLKR } from "@/lib/payroll-calculations";
import { cn } from "@/lib/utils";

interface PayrollTotalsRowProps {
  totals: {
    totalBasic: number;
    totalOT: number;
    totalGross: number;
    totalEpfEmployee: number;
    totalPaye: number;
    totalNet: number;
  };
  employeeCount: number;
}

export function PayrollTotalsRow({ totals, employeeCount }: PayrollTotalsRowProps) {
  return (
    <TableRow className="bg-muted/70 font-semibold hover:bg-muted/70">
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="text-primary">TOTALS</span>
          <span className="text-xs font-normal text-muted-foreground">
            ({employeeCount} employees)
          </span>
        </div>
      </TableCell>
      <TableCell className="text-right">{formatLKR(totals.totalBasic)}</TableCell>
      <TableCell className="text-right">
        {totals.totalOT > 0 ? formatLKR(totals.totalOT) : "-"}
      </TableCell>
      <TableCell className="text-right">{formatLKR(totals.totalGross)}</TableCell>
      <TableCell className={cn("text-right", "text-destructive")}>
        {formatLKR(totals.totalEpfEmployee)}
      </TableCell>
      <TableCell className={cn("text-right", "text-destructive")}>
        {totals.totalPaye > 0 ? formatLKR(totals.totalPaye) : "-"}
      </TableCell>
      <TableCell className="text-right text-success">{formatLKR(totals.totalNet)}</TableCell>
      <TableCell></TableCell>
    </TableRow>
  );
}
