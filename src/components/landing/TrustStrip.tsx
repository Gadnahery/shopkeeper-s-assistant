import { useLanguage } from "@/contexts/LanguageContext";
import { ShieldCheck, WifiOff, Smartphone, Store } from "lucide-react";

export function TrustStrip() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  const items = [
    {
      icon: Store,
      label: isSw ? "Imeundwa kwa duka la TZ" : "Built for TZ retail",
    },
    {
      icon: WifiOff,
      label: isSw ? "Inafanya kazi offline" : "Works offline",
    },
    {
      icon: Smartphone,
      label: isSw ? "Malipo kwa simu au mikono" : "Mobile money or manual pay",
    },
    {
      icon: ShieldCheck,
      label: isSw ? "Data yako, duka lako" : "Your data, your shop",
    },
  ];

  return (
    <section className="border-b border-border/60 bg-background">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/50 px-4 py-3.5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <item.icon className="h-4 w-4" />
              </div>
              <span className="text-xs sm:text-sm font-medium text-foreground leading-snug">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
