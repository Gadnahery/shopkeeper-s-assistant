import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const HERO_IMG =
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=2000&q=80";

export function LandingHero() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  return (
    <section id="top" className="relative min-h-[92vh] flex flex-col">
      <div className="absolute inset-0">
        <img
          src={HERO_IMG}
          alt={isSw ? "Mmiliki wa duka akitumikia mteja" : "Shop owner serving a customer"}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#1A1D29]/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D29]/80 via-transparent to-[#1A1D29]/30" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-1 flex-col justify-end px-5 pb-16 pt-32 sm:px-10 sm:pb-20 lg:justify-center lg:pb-28 lg:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-xl"
        >
          <p className="text-[11px] font-semibold tracking-[0.18em] text-white/70">
            WISECASH
          </p>
          <h1 className="font-display mt-4 text-[2.65rem] leading-[1.05] text-white sm:text-5xl lg:text-[4.5rem]">
            {isSw ? (
              <>
                Jua biashara yako.
                <br />
                Kua kwa ujasiri.
              </>
            ) : (
              <>
                Know your business.
                <br />
                Grow with confidence.
              </>
            )}
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">
            {isSw
              ? "Zana rahisi za mauzo, stoki, wateja na faida."
              : "Simple tools for sales, stock, customers and profit."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/signup" className="btn-primary-light">
              {isSw ? "Anza bure" : "Start free"}
            </Link>
            <a
              href="#features"
              className="inline-flex h-[3.25rem] items-center justify-center rounded-[0.9rem] border border-white/40 px-6 text-[0.9375rem] font-medium text-white transition hover:bg-white/10"
            >
              {isSw ? "Chunguza WiseCash" : "Explore WiseCash"}
            </a>
          </div>
          <p className="mt-6 text-sm text-white/50">
            {isSw ? "Imeundwa kwa biashara ya kila siku." : "Built for everyday business."}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
