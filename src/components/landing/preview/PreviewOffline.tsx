import { motion } from "framer-motion";
import { WifiOff, ShoppingBag, Wifi, RefreshCw, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function PreviewOffline() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  const steps = [
    {
      step: 1,
      icon: WifiOff,
      color: "text-amber-500",
      bg: "bg-amber-500/10 border-amber-500/20",
      titleEn: "Network Drops",
      titleSw: "Intaneti Inakatika",
      descEn: "Power cut or poor mobile signal. WiseCash stays completely active.",
      descSw: "Umeme au mtandao ukikata, mfumo haufungi wala kukwama.",
    },
    {
      step: 2,
      icon: ShoppingBag,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
      titleEn: "Sale Recorded",
      titleSw: "Mauzo Yanafanyika",
      descEn: "Cashier scans items, takes payment, and prints or sends receipts locally.",
      descSw: "Keshia anauza, anachapisha risiti na stoki inapungua kawaida.",
    },
    {
      step: 3,
      icon: Wifi,
      color: "text-blue-500",
      bg: "bg-blue-500/10 border-blue-500/20",
      titleEn: "Signal Restored",
      titleSw: "Mtandao Unarudi",
      descEn: "Connection returns automatically in the background.",
      descSw: "Simu au kompyuta ikipata mtandao tena bila kuifungua upya.",
    },
    {
      step: 4,
      icon: RefreshCw,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      titleEn: "Auto-Synchronized",
      titleSw: "Inajisawazisha Yenyewe",
      descEn: "All offline sales, stock counts, and profits sync to the cloud safely.",
      descSw: "Mauzo yote yaliyofanyika nje ya mtandao yanatumwa seva moja kwa moja.",
    },
  ];

  return (
    <section id="offline" className="py-20 sm:py-24 bg-muted/20 border-b border-border/70 scroll-mt-12">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-14">
          <span className="inline-block rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isSw ? "Uthabiti Bila Intaneti" : "Offline PWA Technology"}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            {isSw ? "Endelea Kuuza, Hata Intaneti Inapokata." : "Keep Selling, Even When The Internet Doesn't."}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isSw
              ? "WiseCash inahifadhi mauzo yako yote kwenye simu au kompyuta hata mtandao ukiwa haupatikani, kisha inajisawazisha mtandao ukirudi."
              : "WiseCash keeps essential business checkout available offline and synchronizes your sales and stock the moment you reconnect."}
          </p>
        </div>

        {/* 4-Step Visual Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {steps.map((item, idx) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="relative rounded-2xl border border-border/80 bg-card p-5 space-y-3 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${item.bg}`}>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <span className="font-mono text-xs font-bold text-muted-foreground/60">0{item.step}</span>
                </div>
                <h3 className="text-base font-bold text-foreground">
                  {isSw ? item.titleSw : item.titleEn}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isSw ? item.descSw : item.descEn}
                </p>
              </div>

              {idx < 3 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
