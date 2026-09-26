import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const INTERVAL = 5000;

const SLIDES = [
  {
    src: "/landing/pos.jpg",
    titleEn: "Sales",
    titleSw: "Mauzo",
    bodyEn: "Make every sale simple.",
    bodySw: "Fanya kila mauzo yawe rahisi.",
  },
  {
    src: "/landing/stock.jpg",
    titleEn: "Inventory",
    titleSw: "Stoki",
    bodyEn: "Know what's in your shop.",
    bodySw: "Jua kilichopo dukani.",
  },
  {
    src: "/landing/team.jpg",
    titleEn: "Customers",
    titleSw: "Wateja",
    bodyEn: "Keep every customer organized.",
    bodySw: "Panga kila mteja vizuri.",
  },
  {
    src: "/landing/checkout.jpg",
    titleEn: "Reports",
    titleSw: "Ripoti",
    bodyEn: "Understand your numbers.",
    bodySw: "Elewa namba zako.",
  },
  {
    src: "/landing/shop-interior.jpg",
    titleEn: "Profit",
    titleSw: "Faida",
    bodyEn: "Know where your business stands.",
    bodySw: "Jua mahali biashara yako ilipo.",
  },
];

export function LandingSlideshow() {
  const { language } = useLanguage();
  const isSw = language === "sw";
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0);

  const go = useCallback((next: number) => {
    setIndex((next + SLIDES.length) % SLIDES.length);
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    if (paused) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
      setTick((t) => t + 1);
    }, INTERVAL);
    return () => window.clearInterval(id);
  }, [paused]);

  const slide = SLIDES[index];

  return (
    <section className="bg-[#F7F7F5] px-5 py-14 sm:px-10 sm:py-20">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-8 max-w-xl">
          <p className="label-micro">{isSw ? "NDANI YA WISECASH" : "INSIDE WISECASH"}</p>
          <h2 className="font-display mt-2 text-3xl text-[#1A1D29] sm:text-4xl">
            {isSw ? "Kila unachohitaji." : "Everything you need."}
          </h2>
        </div>

        <div
          className="relative overflow-hidden rounded-[24px] bg-[#EDEDE9]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative aspect-[4/5] md:aspect-[16/10]">
            {SLIDES.map((g, i) => (
              <div
                key={g.src}
                className={cn(
                  "absolute inset-0 transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  i === index ? "opacity-100" : "opacity-0 pointer-events-none",
                )}
              >
                <img src={g.src} alt={isSw ? g.titleSw : g.titleEn} className="size-full object-cover" />
              </div>
            ))}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#1A1D29]/60 to-transparent" />
            <div className="absolute bottom-14 left-5 max-w-[75%] md:bottom-16 md:left-8">
              <p className="text-xs font-semibold tracking-[0.14em] text-[#D99A4E]">
                {String(index + 1).padStart(2, "0")} · {isSw ? slide.titleSw : slide.titleEn}
              </p>
              <p className="mt-1 text-sm text-white/90 md:text-base">
                {isSw ? slide.bodySw : slide.bodyEn}
              </p>
            </div>
          </div>

          {/* Progress bars + controls — Salon style */}
          <div className="absolute inset-x-5 bottom-5 flex items-center gap-3 md:inset-x-8">
            <div className="flex flex-1 items-center gap-1.5">
              {SLIDES.map((g, i) => (
                <button
                  key={g.src + "dot"}
                  type="button"
                  aria-label={`Show slide ${i + 1}`}
                  onClick={() => go(i)}
                  className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-white/30"
                >
                  {i === index && (
                    <span
                      key={tick}
                      className={cn(
                        "absolute inset-y-0 left-0 origin-left rounded-full bg-white",
                        paused ? "" : "landing-slide-progress",
                      )}
                      style={paused ? { width: "100%" } : undefined}
                    />
                  )}
                  {i < index && <span className="absolute inset-0 rounded-full bg-white" />}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => go(index - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => go(index + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                aria-label="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
