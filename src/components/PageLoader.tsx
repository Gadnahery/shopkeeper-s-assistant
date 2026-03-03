import { Loader2 } from "lucide-react";

type PageLoaderProps = {
  message?: string;
  messageSw?: string;
  language?: string;
};

export function PageLoader({
  message = "Loading...",
  messageSw = "Inapakia...",
  language = "en",
}: PageLoaderProps) {
  return (
    <div className="flex min-h-[280px] items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-sm">{language === "sw" ? messageSw : message}</span>
      </div>
    </div>
  );
}
