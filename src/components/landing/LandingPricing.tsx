import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { DEFAULT_SUBSCRIPTION_MONTHLY_PRICE_TZS } from "@/lib/subscription";

export function LandingPricing() {
  const { language } = useLanguage();
  const isSw = language === "sw";
  const price = DEFAULT_SUBSCRIPTION_MONTHLY_PRICE_TZS;

  return (
    <section id="pricing" className="scroll-mt-24 bg-[#F7F7F5] px-5 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-[1280px]">
        <p className="label-micro">{isSw ? "BEI" : "PRICING"}</p>
        <h2 className="font-display mt-3 text-4xl text-[#1A1D29] sm:text-5xl">
          {isSw ? "Bei rahisi." : "Simple pricing."}
        </h2>

        <div className="mt-14 max-w-md rounded-[24px] border border-[#E5E7EB] bg-white p-8 sm:p-10">
          <p className="font-display text-5xl text-[#1A1D29] sm:text-6xl">
            TSh {price.toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-[#6B7280]">
            {isSw ? "/mwezi" : "/month"}
          </p>
          <p className="mt-6 text-base leading-relaxed text-[#6B7280]">
            {isSw
              ? "Kila unachohitaji kuendesha biashara yako. Jaribio la siku 14 bure."
              : "Everything you need to run your business. 14-day free trial."}
          </p>
          <Link to="/signup" className="btn-primary mt-8 w-full sm:w-auto">
            {isSw ? "Anza bure" : "Start free"}
          </Link>
        </div>
      </div>
    </section>
  );
}
