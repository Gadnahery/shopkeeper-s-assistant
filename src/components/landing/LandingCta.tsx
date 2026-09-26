import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const IMG =
  "https://images.unsplash.com/photo-1556742031-c6968b6b5f6f?auto=format&fit=crop&w=1800&q=80";

export function LandingCta() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={IMG} alt="" className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-[#1A1D29]/70" />
      </div>
      <div className="relative mx-auto max-w-[640px] px-5 py-28 text-center sm:px-10 sm:py-36">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-white/60">WISECASH</p>
        <h2 className="font-display mt-4 text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
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
        <p className="mt-5 text-base text-white/70">
          {isSw ? "Kila unachohitaji, mahali pamoja." : "Everything you need, in one place."}
        </p>
        <Link to="/signup" className="btn-primary-light mt-8 inline-flex">
          {isSw ? "Anza bure" : "Start free"}
        </Link>
      </div>
    </section>
  );
}
