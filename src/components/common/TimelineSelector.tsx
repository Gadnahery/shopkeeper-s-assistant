import { useState } from "react";
import { format, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TimelinePeriod = "today" | "week" | "month" | "year" | "all" | "custom";

export const TIMELINE_PERIOD_LABELS: Record<TimelinePeriod, Record<"en" | "sw", string>> = {
  today: { en: "Today", sw: "Leo" },
  week: { en: "This week", sw: "Wiki hii" },
  month: { en: "This month", sw: "Mwezi huu" },
  year: { en: "This year", sw: "Mwaka huu" },
  all: { en: "All time", sw: "Muda wote" },
  custom: { en: "Custom date", sw: "Tarehe maalum" },
};

/**
 * Returns the start and end local date strings (YYYY-MM-DD) for a given timeline period.
 */
export function getTimelinePeriodDates(
  period: TimelinePeriod,
  customRange?: { from?: Date; to?: Date }
): { start: string; end: string } {
  const now = new Date();
  const end = format(now, "yyyy-MM-dd");
  if (period === "custom") {
    const s = customRange?.from ? format(customRange.from, "yyyy-MM-dd") : "1970-01-01";
    const e = customRange?.to ? format(customRange.to, "yyyy-MM-dd") : end;
    return { start: s, end: e };
  }
  switch (period) {
    case "today":
      return { start: end, end };
    case "week":
      return { start: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"), end };
    case "month":
      return { start: format(startOfMonth(now), "yyyy-MM-dd"), end };
    case "year":
      return { start: format(startOfYear(now), "yyyy-MM-dd"), end };
    case "all":
      return { start: "1970-01-01", end };
  }
}

export interface TimelineSelectorProps {
  period: TimelinePeriod;
  onPeriodChange: (p: TimelinePeriod) => void;
  customRange?: { from?: Date; to?: Date };
  onCustomRangeChange?: (range: { from?: Date; to?: Date }) => void;
  language?: "en" | "sw";
  className?: string;
}

export function TimelineSelector({
  period,
  onPeriodChange,
  customRange = {},
  onCustomRangeChange,
  language = "en",
  className,
}: TimelineSelectorProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-xl border border-border bg-card p-0.5 shadow-2xs overflow-x-auto shrink-0",
        className
      )}
    >
      {(["today", "week", "month", "year", "all"] as Exclude<TimelinePeriod, "custom">[]).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPeriodChange(p)}
          className={cn(
            "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all whitespace-nowrap",
            period === p
              ? "bg-primary text-primary-foreground shadow-2xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          {TIMELINE_PERIOD_LABELS[p][language]}
        </button>
      ))}

      {/* Custom Date Popover */}
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={TIMELINE_PERIOD_LABELS.custom[language]}
            onClick={() => {
              onPeriodChange("custom");
              setCalendarOpen(true);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all whitespace-nowrap",
              period === "custom"
                ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
              onCustomRangeChange?.({ from: range?.from, to: range?.to });
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
                  ? `${format(customRange.from, "PP")} - ${format(customRange.to, "PP")}`
                  : format(customRange.from, "PP")}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => {
                  onCustomRangeChange?.({});
                  onPeriodChange("today");
                  setCalendarOpen(false);
                }}
              >
                {language === "sw" ? "Weka upya" : "Reset"}
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
