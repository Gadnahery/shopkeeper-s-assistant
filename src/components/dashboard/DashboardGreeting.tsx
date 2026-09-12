import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export type DashboardPeriod = "today" | "week" | "month" | "year" | "all" | "custom";

export const DASHBOARD_PERIOD_LABELS: Record<DashboardPeriod, Record<"en" | "sw", string>> = {
  today: { en: "Today", sw: "Leo" },
  week: { en: "This week", sw: "Wiki hii" },
  month: { en: "This month", sw: "Mwezi huu" },
  year: { en: "This year", sw: "Mwaka huu" },
  all: { en: "All time", sw: "Muda wote" },
  custom: { en: "Custom date", sw: "Tarehe maalum" },
};

interface DashboardGreetingProps {
  userName?: string;
  shopName: string;
  language: "en" | "sw";
  period: DashboardPeriod;
  onPeriodChange: (p: DashboardPeriod) => void;
  customRange: { from?: Date; to?: Date };
  onCustomRangeChange: (range: { from?: Date; to?: Date }) => void;
}

function getTimeOfDayGreeting(lang: "en" | "sw"): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return lang === "sw" ? "Habari za asubuhi" : "Good morning";
  }
  if (hour < 17) {
    return lang === "sw" ? "Habari za mchana" : "Good afternoon";
  }
  return lang === "sw" ? "Habari za jioni" : "Good evening";
}

export function DashboardGreeting({
  userName,
  shopName,
  language,
  period,
  onPeriodChange,
  customRange,
  onCustomRangeChange,
}: DashboardGreetingProps) {
  const navigate = useNavigate();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const greetingWord = getTimeOfDayGreeting(language);
  const firstName = userName ? userName.trim().split(" ")[0] : "";
  const greetingText = firstName ? `${greetingWord}, ${firstName} 👋` : `${greetingWord} 👋`;

  const periodSubtitle =
    period === "today"
      ? language === "sw"
        ? `Haya ndiyo yanayojiri ${shopName} leo.`
        : `Here's what's happening in ${shopName} today.`
      : language === "sw"
      ? `Muhtasari wa utendaji wa ${shopName} kwa kipindi ulichochagua.`
      : `Performance overview for ${shopName} for the selected period.`;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      {/* Greeting & Shop Context */}
      <div className="min-w-0 flex-1">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground truncate">
          {greetingText}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          {periodSubtitle}
        </p>
      </div>

      {/* Actions: Period Selector + New Sale on the same row */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap shrink-0">
        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-2xs overflow-x-auto">
          {(["today", "week", "month", "year", "all"] as Exclude<DashboardPeriod, "custom">[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPeriodChange(p)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap",
                period === p
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {DASHBOARD_PERIOD_LABELS[p][language]}
            </button>
          ))}

          {/* Custom Date Popover */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={() => {
                  onPeriodChange("custom");
                  setCalendarOpen(true);
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap",
                  period === "custom"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <CalendarDays className="h-3 w-3" />
                <span>
                  {period === "custom" && customRange.from
                    ? customRange.to
                      ? `${format(customRange.from, "dd MMM")} – ${format(customRange.to, "dd MMM")}`
                      : format(customRange.from, "dd MMM")
                    : language === "sw"
                    ? "Maalum"
                    : "Custom"}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border border-border" align="end">
              <Calendar
                mode="range"
                selected={{ from: customRange.from, to: customRange.to }}
                onSelect={(range) => {
                  onCustomRangeChange({ from: range?.from, to: range?.to });
                  if (range?.from && range?.to) {
                    onPeriodChange("custom");
                    setCalendarOpen(false);
                  }
                }}
                numberOfMonths={1}
                disabled={{ after: new Date() }}
                className="p-3"
              />
              {period === "custom" && customRange.from && (
                <div className="border-t border-border p-2 flex justify-between items-center">
                  <span className="text-[11px] text-muted-foreground px-2">
                    {customRange.to
                      ? `${format(customRange.from, "MMM dd")} → ${format(customRange.to, "MMM dd, yyyy")}`
                      : language === "sw"
                      ? "Chagua tarehe ya mwisho"
                      : "Pick end date"}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      onCustomRangeChange({});
                      onPeriodChange("today");
                    }}
                    className="h-7 text-xs text-muted-foreground"
                  >
                    {language === "sw" ? "Futa" : "Clear"}
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Primary New Sale Button */}
        <Button
          size="sm"
          onClick={() => navigate("/sales?view=new")}
          className="h-8 sm:h-9 rounded-xl px-3.5 sm:px-4 text-xs font-bold gap-1.5 shadow-2xs bg-primary text-primary-foreground hover:opacity-90 shrink-0 whitespace-nowrap"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{language === "sw" ? "Uza Sasa" : "New Sale"}</span>
        </Button>
      </div>
    </div>
  );
}
