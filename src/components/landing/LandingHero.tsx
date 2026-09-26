import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

export function LandingHero() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  return (
    <section id="top" className="relative min-h-[85vh] flex flex-col">
      <div className="absolute inset-0">
        <img
          src="/landing/checkout.jpg"
          alt={isSw ? "Mmiliki wa duka akitumikia mteja" : "Shop owner serving a customer"}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[#1A1D29]/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D29]/75 via-transparent to-[#1A1D29]/25" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1100px] flex-1 flex-col justify-end px-5 pb-14 pt-28 sm:px-10 sm:pb-16 lg:justify-center lg:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="max-w-xl"
        >
          <p className="text-[11px] font-semibold tracking-[0.18em] text-white/70">WISECASH</p>
          <h1 className="font-display mt-3 text-[2.4rem] leading-[1.06] text-white sm:text-5xl lg:text-[4rem]">
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
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/75 sm:text-base">
            {isSw
              ? "Zana rahisi za mauzo, stoki, wateja na faida."
              : "Simple tools for sales, stock, customers and profit."}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
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
          <p className="mt-5 text-sm text-white/50">
            {isSw ? "Imeundwa kwa biashara ya kila siku." : "Built for everyday business."}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
