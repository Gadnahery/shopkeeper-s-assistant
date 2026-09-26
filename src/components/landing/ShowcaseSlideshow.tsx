import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    src: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1400&q=80",
    alt: "Shop owner at checkout",
    titleEn: "Sell faster at the counter",
    titleSw: "Uza haraka kwenye kaunta",
    bodyEn: "POS built for busy shops — barcodes, cash, mobile money, and receipts in seconds.",
    bodySw: "POS kwa maduka yenye shughuli nyingi — barcode, fedha, mobile money, na risiti kwa sekunde.",
  },
  {
    src: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1400&q=80",
    alt: "Warehouse inventory",
    titleEn: "Know every item in stock",
    titleSw: "Jua kila bidhaa iliyo stoki",
    bodyEn: "Low-stock alerts, receive stock, and track every movement without a paper ledger.",
    bodySw: "Tahadhari za stoki chini, pokea bidhaa, na fuatilia kila mwendo bila daftari la karatasi.",
  },
  {
    src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80",
    alt: "Business analytics",
    titleEn: "Real profit, every day",
    titleSw: "Faida halisi, kila siku",
    bodyEn: "Sales, costs, and margins in one clear view — stop guessing at close of day.",
    bodySw: "Mauzo, gharama, na faida katika mwonekano mmoja — acha kubahatisha mwisho wa siku.",
  },
  {
    src: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1400&q=80",
    alt: "Team collaboration",
    titleEn: "Your whole team, one system",
    titleSw: "Timu yako yote, mfumo mmoja",
    bodyEn: "Owners, managers, and staff with the right roles — work continues even offline.",
    bodySw: "Wamiliki, wasimamizi, na wafanyakazi wenye majukumu sahihi — kazi inaendelea hata bila mtandao.",
  },
];

export function ShowcaseSlideshow() {
  const { language } = useLanguage();
  const isSw = language === "sw";
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setIndex((i) => (i + 1) % SLIDES.length), []);
  const prev = useCallback(() => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 5500);
    return () => clearInterval(t);
  }, [paused, next]);

  const slide = SLIDES[index];

  return (
    <section id="showcase" className="border-b border-border/60 bg-background py-16 sm:py-24">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 sm:mb-12 max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
            {isSw ? "Jinsi inavyofanya kazi" : "How it works"}
          </p>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground leading-tight">
            {isSw ? "Duka lako, wazi kila siku." : "Your shop, clear every day."}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            {isSw
              ? "Kutoka kaunta hadi ripoti — kila kitu mahali pamoja."
              : "From the counter to the report — everything in one place."}
          </p>
        </div>

        <div
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/70 bg-card shadow-xl"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative aspect-[16/10] sm:aspect-[21/9] bg-muted">
            <AnimatePresence mode="wait">
              <motion.img
                key={slide.src}
                src={slide.src}
                alt={slide.alt}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 md:p-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4 }}
                  className="max-w-lg"
                >
                  <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-medium text-white tracking-tight">
                    {isSw ? slide.titleSw : slide.titleEn}
                  </h3>
                  <p className="mt-2 text-sm sm:text-base text-white/75 leading-relaxed">
                    {isSw ? slide.bodySw : slide.bodyEn}
                  </p>
                </motion.div>
              </AnimatePresence>

              <div className="mt-5 flex items-center justify-between gap-4">
                <div className="flex gap-1.5">
                  {SLIDES.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Slide ${i + 1}`}
                      onClick={() => setIndex(i)}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        i === index ? "w-7 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70",
                      )}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={prev}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                    aria-label="Next"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
