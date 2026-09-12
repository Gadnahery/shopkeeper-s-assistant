import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfWeek, addDays, parseISO } from "date-fns";
import { TrendingUp, ShoppingBag, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { toLocalDayString } from "@/lib/dateUtils";
import { calculatePnL } from "@/lib/financials";
import type { DashboardPeriod } from "./DashboardGreeting";

type ChartMetric = "sales" | "profit" | "orders";

interface SalesPerformanceChartProps {
  period: DashboardPeriod;
  language: "en" | "sw";
  formatMoney: (val: number) => string;
  allSales: any[];
  expensesList: any[];
  otherIncomeList: any[];
  periodSales: any[];
  periodStart: string;
  periodEnd: string;
  isLoading?: boolean;
}

export function SalesPerformanceChart({
  period,
  language,
  formatMoney,
  allSales,
  expensesList,
  otherIncomeList,
  periodSales,
  periodStart,
  periodEnd,
  isLoading,
}: SalesPerformanceChartProps) {
  const [metric, setMetric] = useState<ChartMetric>("sales");

  // Chart data aggregation respecting the selected period
  const chartData = useMemo(() => {
    if (period === "today") {
      // 2-hour interval time buckets for today
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const hours = [6, 9, 12, 15, 18, 21];

      const salesToday = (allSales || []).filter(
        (s) => s.status === "completed" && toLocalDayString(s.created_at) === todayStr
      );

      return hours.map((hour) => {
        const nextHour = hour + 3;
        const bucketSales = salesToday.filter((s) => {
          const d = new Date(s.created_at);
          const h = d.getHours();
          return h >= hour && h < nextHour;
        });

        const pnl = calculatePnL(bucketSales, [], []);
        const hourLabel = `${String(hour).padStart(2, "0")}:00`;

        return {
          name: hourLabel,
          sales: pnl.grossSales,
          profit: pnl.netProfit,
          orders: bucketSales.length,
        };
      });
    }

    if (period === "week") {
      // 7 days of this week
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const days = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(weekStart, i));

      return days.map((dateObj) => {
        const dayStr = format(dateObj, "yyyy-MM-dd");
        const daySales = (allSales || []).filter(
          (s) => s.status === "completed" && toLocalDayString(s.created_at) === dayStr
        );
        const dayExpenses = (expensesList || []).filter(
          (e) => toLocalDayString(e.date || e.created_at) === dayStr
        );
        const dayIncome = (otherIncomeList || []).filter(
          (i) => toLocalDayString(i.date || i.created_at) === dayStr
        );

        const pnl = calculatePnL(daySales, dayExpenses, dayIncome);

        return {
          name: format(dateObj, "EEE"),
          date: dayStr,
          sales: pnl.grossSales,
          profit: pnl.netProfit,
          orders: daySales.length,
        };
      });
    }

    if (period === "year") {
      // 12 months of current year
      const currentYear = new Date().getFullYear();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      return monthNames.map((mName, idx) => {
        const monthNum = idx + 1;
        const monthPrefix = `${currentYear}-${String(monthNum).padStart(2, "0")}`;

        const monthSales = (allSales || []).filter(
          (s) => s.status === "completed" && (s.created_at || "").startsWith(monthPrefix)
        );
        const monthExpenses = (expensesList || []).filter((e) => {
          const raw = e.date || e.created_at || "";
          return raw.startsWith(monthPrefix);
        });
        const monthIncome = (otherIncomeList || []).filter((i) => {
          const raw = i.date || i.created_at || "";
          return raw.startsWith(monthPrefix);
        });

        const pnl = calculatePnL(monthSales, monthExpenses, monthIncome);

        return {
          name: mName,
          sales: pnl.grossSales,
          profit: pnl.netProfit,
          orders: monthSales.length,
        };
      });
    }

    // Default (Month, All time, or Custom): past 7–14 days window up to periodEnd
    const daysBack = [6, 5, 4, 3, 2, 1, 0].map((d) => subDays(new Date(), d));
    return daysBack.map((dateObj) => {
      const dayStr = format(dateObj, "yyyy-MM-dd");
      const daySales = (allSales || []).filter(
        (s) => s.status === "completed" && toLocalDayString(s.created_at) === dayStr
      );
      const dayExpenses = (expensesList || []).filter(
        (e) => toLocalDayString(e.date || e.created_at) === dayStr
      );
      const dayIncome = (otherIncomeList || []).filter(
        (i) => toLocalDayString(i.date || i.created_at) === dayStr
      );

      const pnl = calculatePnL(daySales, dayExpenses, dayIncome);

      return {
        name: format(dateObj, "dd MMM"),
        date: dayStr,
        sales: pnl.grossSales,
        profit: pnl.netProfit,
        orders: daySales.length,
      };
    });
  }, [period, allSales, expensesList, otherIncomeList]);

  // Metric metadata
  const metricConfig = {
    sales: {
      label: language === "sw" ? "Mauzo" : "Sales",
      stroke: "#2563eb",
      fill: "rgba(37, 99, 235, 0.12)",
      icon: ShoppingBag,
      formatter: (val: number) => formatMoney(val),
    },
    profit: {
      label: language === "sw" ? "Faida" : "Profit",
      stroke: "#059669",
      fill: "rgba(5, 150, 105, 0.12)",
      icon: TrendingUp,
      formatter: (val: number) => formatMoney(val),
    },
    orders: {
      label: language === "sw" ? "Miamala" : "Orders",
      stroke: "#d97706",
      fill: "rgba(217, 119, 6, 0.12)",
      icon: Hash,
      formatter: (val: number) => `${val} ${language === "sw" ? "miamala" : "orders"}`,
    },
  }[metric];

  const totalCurrentMetric = useMemo(() => {
    return chartData.reduce((sum, item) => sum + (Number(item[metric]) || 0), 0);
  }, [chartData, metric]);

  const hasData = totalCurrentMetric > 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-2xs space-y-2.5 flex flex-col justify-between h-full">
      {/* Chart Header & Metric Switcher */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-2">
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-foreground">
            {language === "sw" ? "Mwenendo wa Mauzo" : "Sales Performance"}
          </h2>
          <p className="text-[11px] text-muted-foreground">
            {metricConfig.label}:{" "}
            <span className="font-bold text-foreground">
              {metric === "orders" ? `${totalCurrentMetric} orders` : formatMoney(totalCurrentMetric)}
            </span>
          </p>
        </div>

        {/* Metric Switcher Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/40 p-0.5 self-start sm:self-auto">
          {(["sales", "profit", "orders"] as ChartMetric[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              className={cn(
                "rounded-lg px-2 py-0.5 text-[11px] font-semibold capitalize transition-all",
                metric === m
                  ? "bg-card text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m === "sales"
                ? language === "sw"
                  ? "Mauzo"
                  : "Sales"
                : m === "profit"
                ? language === "sw"
                  ? "Faida"
                  : "Profit"
                : language === "sw"
                ? "Miamala"
                : "Orders"}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-44 sm:h-48 w-full">
        {!hasData ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-4 text-muted-foreground space-y-1.5">
            <metricConfig.icon className="h-7 w-7 text-muted-foreground/40" />
            <p className="text-xs font-medium">
              {language === "sw"
                ? "Hakuna takwimu za mwenendo kwa kipindi hiki bado."
                : "No performance data recorded for this period yet."}
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              {language === "sw"
                ? "Kamilisha mauzo ili kuona grafu ya mwenendo hapa."
                : "Complete transactions to see your performance visualized here."}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -15 }}>
              <defs>
                <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metricConfig.stroke} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={metricConfig.stroke} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                dy={6}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(val) =>
                  metric === "orders"
                    ? `${val}`
                    : val >= 1000000
                    ? `${(val / 1000000).toFixed(1)}M`
                    : val >= 1000
                    ? `${(val / 1000).toFixed(0)}k`
                    : `${val}`
                }
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderRadius: 12,
                  border: "1px solid hsl(var(--border))",
                  fontSize: 12,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
                formatter={(val: unknown) => [metricConfig.formatter(Number(val) || 0), metricConfig.label]}
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke={metricConfig.stroke}
                strokeWidth={2.5}
                fill={`url(#gradient-${metric})`}
                dot={{ r: 3, fill: metricConfig.stroke }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
