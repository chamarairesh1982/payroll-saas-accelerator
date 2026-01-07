import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface PayrollTrendData {
  month: string;
  gross: number;
  net: number;
  epf: number;
  etf: number;
}

interface PayrollChartProps {
  data?: PayrollTrendData[];
  isLoading?: boolean;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
};

// Fallback demo data when no real data exists
const demoData: PayrollTrendData[] = [
  { month: "Jul", gross: 4500000, net: 3800000, epf: 540000, etf: 135000 },
  { month: "Aug", gross: 4650000, net: 3920000, epf: 558000, etf: 139500 },
  { month: "Sep", gross: 4580000, net: 3860000, epf: 549600, etf: 137400 },
  { month: "Oct", gross: 4720000, net: 3980000, epf: 566400, etf: 141600 },
  { month: "Nov", gross: 4890000, net: 4120000, epf: 586800, etf: 146700 },
  { month: "Dec", gross: 5200000, net: 4380000, epf: 624000, etf: 156000 },
];

export function PayrollChart({ data, isLoading }: PayrollChartProps) {
  const chartData = data && data.length > 0 ? data : demoData;
  const isUsingDemoData = !data || data.length === 0;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="rounded-xl bg-card p-6 shadow-md"
      >
        <div className="mb-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <Skeleton className="h-[300px] w-full" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-xl bg-card p-6 shadow-md"
    >
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">Payroll Trend</h3>
          <p className="text-sm text-muted-foreground">
            {isUsingDemoData ? "Sample data — run payroll to see real trends" : "Last 6 months overview"}
          </p>
        </div>
        {isUsingDemoData && (
          <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
            Demo Data
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickFormatter={formatCurrency}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              boxShadow: "var(--shadow-lg)",
            }}
            formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, ""]}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="gross"
            name="Gross Salary"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorGross)"
          />
          <Area
            type="monotone"
            dataKey="net"
            name="Net Salary"
            stroke="hsl(var(--success))"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorNet)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
