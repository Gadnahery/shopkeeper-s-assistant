import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    titleEn: "Sales",
    titleSw: "Mauzo",
    bodyEn: "Make every sale simple.",
    bodySw: "Fanya kila mauzo yawe rahisi.",
    img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=80",
  },
  {
    titleEn: "Inventory",
    titleSw: "Stoki",
    bodyEn: "Know what's in your shop.",
    bodySw: "Jua kilichopo dukani.",
    img: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80",
  },
  {
    titleEn: "Customers",
    titleSw: "Wateja",
    bodyEn: "Keep every customer organized.",
    bodySw: "Panga kila mteja vizuri.",
    img: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1600&q=80",
  },
  {
    titleEn: "Reports",
    titleSw: "Ripoti",
    bodyEn: "Understand your numbers.",
    bodySw: "Elewa namba zako.",
    img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80",
  },
  {
    titleEn: "Profit",
    titleSw: "Faida",
    bodyEn: "Know where your business stands.",
    bodySw: "Jua mahali biashara yako ilipo.",
    img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80",
  },
];

export function LandingSlideshow() {
  const { language } = useLanguage();
  const isSw = language === "sw";
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setIndex((i) => (i + 1) % SLIDES.length), []);
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length),
    [],
  );

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [paused, next]);

  const slide = SLIDES[index];

  return (
    <section className="bg-[#F7F7F5] px-5 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-12 max-w-xl">
          <p className="label-micro">{isSw ? "NDANI YA WISECASH" : "INSIDE WISECASH"}</p>
          <h2 className="font-display mt-3 text-4xl text-[#1A1D29] sm:text-5xl">
            {isSw ? "Kila unachohitaji." : "Everything you need."}
          </h2>
        </div>

        <div
          className="overflow-hidden rounded-[28px] border border-[#E5E7EB] bg-white shadow-[0_24px_60px_-32px_rgba(26,29,41,0.3)]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative aspect-[16/10] bg-[#F7F7F5] sm:aspect-[21/9]">
            <AnimatePresence mode="wait">
              <motion.img
                key={slide.img}
                src={slide.img}
                alt={isSw ? slide.titleSw : slide.titleEn}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D29]/70 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10">
              <p className="text-xs font-semibold tracking-[0.14em] text-[#D99A4E]">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="font-display mt-2 text-2xl text-white sm:text-3xl">
                {isSw ? slide.titleSw : slide.titleEn}
              </h3>
              <p className="mt-1 text-sm text-white/70 sm:text-base">
                {isSw ? slide.bodySw : slide.bodyEn}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#E5E7EB] px-5 py-4 sm:px-8">
            <div className="flex gap-1.5">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === index ? "w-7 bg-[#1A1D29]" : "w-1.5 bg-[#E5E7EB] hover:bg-[#D99A4E]",
                  )}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={prev}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] text-[#1A1D29] hover:bg-[#F7F7F5]"
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={next}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] text-[#1A1D29] hover:bg-[#F7F7F5]"
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
