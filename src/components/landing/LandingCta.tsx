import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export function LandingCta() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src="/landing/cta.jpg" alt="" className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-[#1A1D29]/68" />
      </div>
      <div className="relative mx-auto max-w-[560px] px-5 py-16 text-center sm:px-10 sm:py-20">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-white/60">WISECASH</p>
        <h2 className="font-display mt-3 text-3xl leading-tight text-white sm:text-4xl lg:text-5xl">
          {isSw ? (
            <>
              Endesha biashara yako.
              <br />
              Jua namba zako.
            </>
          ) : (
            <>
              Run your business.
              <br />
              Know your numbers.
            </>
          )}
        </h2>
        <p className="mt-4 text-[15px] text-white/70">
          {isSw ? "Kila unachohitaji, mahali pamoja." : "Everything you need, in one place."}
        </p>
        <Link to="/signup" className="btn-primary-light mt-7 inline-flex">
          {isSw ? "Anza bure" : "Start free"}
        </Link>
      </div>
    </section>
  );
}
