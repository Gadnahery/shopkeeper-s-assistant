import { ShieldCheck, WifiOff, Smartphone, Wallet, Coins } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function PreviewTrustStrip() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  const trustItems = [
    {
      icon: ShieldCheck,
      text: isSw ? "Siku 14 za Bure Kabisa" : "14-Day Free Trial",
    },
    {
      icon: WifiOff,
      text: isSw ? "Inafanya Kazi Bila Mtandao" : "Works 100% Offline (PWA)",
    },
    {
      icon: Smartphone,
      text: isSw ? "Simu na Kompyuta" : "Phone + Laptop Access",
    },
    {
      icon: Wallet,
      text: isSw ? "M-Pesa na HaloPesa" : "M-Pesa & Mobile Payments",
    },
    {
      icon: Coins,
      text: isSw ? "TZS 25,000 tu kwa Mwezi" : "TZS 25,000 / Month Flat",
    },
  ];

  return (
    <section className="border-b border-border/60 bg-muted/20 py-4 sm:py-5">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-muted-foreground">
          {trustItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <item.icon className="h-4 w-4 text-primary shrink-0" />
              <span className="text-foreground/90">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
