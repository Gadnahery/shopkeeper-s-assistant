import { useLanguage } from "@/contexts/LanguageContext";

const IMG =
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1800&q=80";

export function LandingOffline() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={IMG} alt="" className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-[#1A1D29]/75" />
      </div>
      <div className="relative mx-auto max-w-[1280px] px-5 py-28 sm:px-10 sm:py-36">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#D99A4E]">
          {isSw ? "IMEUNDWA KWA BIASHARA HALISI" : "BUILT FOR REAL BUSINESS"}
        </p>
        <h2 className="font-display mt-4 max-w-lg text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
          {isSw ? "Endelea kuuza." : "Keep selling."}
        </h2>
        <p className="mt-6 max-w-md text-base leading-relaxed text-white/75 sm:text-lg">
          {isSw ? (
            <>
              Hakuna mtandao?
              <br />
              Endelea kufanya kazi.
              <br />
              WiseCash inasawazisha ukirudi mtandaoni.
            </>
          ) : (
            <>
              No connection?
              <br />
              Keep working.
              <br />
              WiseCash syncs when you&apos;re back online.
            </>
          )}
        </p>
      </div>
    </section>
  );
}
