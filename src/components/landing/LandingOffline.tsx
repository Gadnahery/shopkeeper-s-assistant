import { useLanguage } from "@/contexts/LanguageContext";

export function LandingOffline() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src="/landing/offline.jpg" alt="" className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-[#1A1D29]/72" />
      </div>
      <div className="relative mx-auto max-w-[1100px] px-5 py-16 sm:px-10 sm:py-20">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#D99A4E]">
          {isSw ? "IMEUNDWA KWA BIASHARA HALISI" : "BUILT FOR REAL BUSINESS"}
        </p>
        <h2 className="font-display mt-3 max-w-lg text-3xl leading-tight text-white sm:text-4xl lg:text-5xl">
          {isSw ? "Endelea kuuza." : "Keep selling."}
        </h2>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/75">
          {isSw ? (
            <>Hakuna mtandao? Endelea kufanya kazi. WiseCash inasawazisha ukirudi mtandaoni.</>
          ) : (
            <>No connection? Keep working. WiseCash syncs when you&apos;re back online.</>
          )}
        </p>
      </div>
    </section>
  );
}
