import { useLanguage } from "@/contexts/LanguageContext";

const STEPS = [
  { n: "01", en: "Sell", sw: "Uza", bodyEn: "Make the sale.", bodySw: "Fanya mauzo." },
  { n: "02", en: "Track", sw: "Fuatilia", bodyEn: "Keep everything recorded.", bodySw: "Rekodi kila kitu." },
  { n: "03", en: "Understand", sw: "Elewa", bodyEn: "See where your business stands.", bodySw: "Ona mahali biashara yako ilipo." },
];

export function LandingHowItWorks() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  return (
    <section id="how-it-works" className="scroll-mt-24 bg-[#F7F7F5] px-5 py-14 sm:px-10 sm:py-18">
      <div className="mx-auto max-w-[1100px]">
        <p className="label-micro">{isSw ? "JINSI INAVYOFANYA" : "HOW IT WORKS"}</p>
        <h2 className="font-display mt-2 text-3xl text-[#1A1D29] sm:text-4xl">
          {isSw ? "Kutoka mauzo hadi uelewa." : "From sale to insight."}
        </h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
          {STEPS.map((s) => (
            <div key={s.n}>
              <span className="text-sm font-medium text-[#D99A4E]">{s.n}</span>
              <h3 className="font-display mt-2 text-2xl text-[#1A1D29] sm:text-3xl">
                {isSw ? s.sw : s.en}
              </h3>
              <p className="mt-2 text-[15px] text-[#6B7280]">{isSw ? s.bodySw : s.bodyEn}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
