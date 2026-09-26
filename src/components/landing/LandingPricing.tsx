import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

/** Marketing price — always TZS 25,000/month (matches product billing). */
const MONTHLY_PRICE_TZS = 25_000;

export function LandingPricing() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  return (
    <section id="pricing" className="scroll-mt-24 bg-[#F7F7F5] px-5 py-14 sm:px-10 sm:py-18">
      <div className="mx-auto max-w-[1100px]">
        <p className="label-micro">{isSw ? "BEI" : "PRICING"}</p>
        <h2 className="font-display mt-2 text-3xl text-[#1A1D29] sm:text-4xl">
          {isSw ? "Bei rahisi." : "Simple pricing."}
        </h2>

        <div className="mt-8 max-w-md rounded-[20px] border border-[#E5E7EB] bg-white p-7 sm:p-8">
          <p className="font-display text-4xl text-[#1A1D29] sm:text-5xl">
            TZS {MONTHLY_PRICE_TZS.toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-[#6B7280]">{isSw ? "/mwezi" : "/month"}</p>
          <p className="mt-5 text-[15px] leading-relaxed text-[#6B7280]">
            {isSw
              ? "Kila unachohitaji kuendesha biashara yako. Jaribio la siku 14 bure."
              : "Everything you need to run your business. 14-day free trial."}
          </p>
          <Link to="/signup" className="btn-primary mt-6 inline-flex">
            {isSw ? "Anza bure" : "Start free"}
          </Link>
        </div>
      </div>
    </section>
  );
}
