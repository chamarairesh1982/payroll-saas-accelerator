import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "accent";
  delay?: number;
}

const variantStyles = {
  default: {
    gradient: "before:bg-gradient-to-r before:from-primary before:to-primary/70",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  primary: {
    gradient: "before:bg-gradient-to-r before:from-primary before:to-chart-5",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  success: {
    gradient: "before:bg-gradient-to-r before:from-success before:to-accent",
    iconBg: "bg-success/10",
    iconColor: "text-success",
  },
  warning: {
    gradient: "before:bg-gradient-to-r before:from-warning before:to-warning/70",
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
  },
  accent: {
    gradient: "before:bg-gradient-to-r before:from-accent before:to-success",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
  delay = 0,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn("stat-card group", styles.gradient)}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
            {title}
          </p>
          <motion.p 
            className="metric-value text-foreground"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: delay + 0.1 }}
          >
            {value}
          </motion.p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: delay + 0.2 }}
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium",
                trend.isPositive ? "text-success" : "text-destructive"
              )}
            >
              <div className={cn(
                "flex items-center justify-center rounded-full p-0.5",
                trend.isPositive ? "bg-success/10" : "bg-destructive/10"
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
              </div>
              <span>{Math.abs(trend.value).toFixed(1)}%</span>
              <span className="text-muted-foreground font-normal text-xs">vs last month</span>
            </motion.div>
          )}
        </div>
        <motion.div 
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110",
            styles.iconBg,
            styles.iconColor
          )}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, delay: delay + 0.1, type: "spring" }}
        >
          {icon}
        </motion.div>
      </div>
      
      {/* Decorative background element */}
      <div className={cn(
        "absolute -right-6 -bottom-6 h-24 w-24 rounded-full opacity-5 transition-opacity group-hover:opacity-10",
        styles.iconColor.replace("text-", "bg-")
      )} />
    </motion.div>
  );
}
