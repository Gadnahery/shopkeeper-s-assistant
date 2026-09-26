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
    <section id="how-it-works" className="scroll-mt-24 bg-[#F7F7F5] px-5 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-[1280px]">
        <p className="label-micro">{isSw ? "JINSI INAVYOFANYA" : "HOW IT WORKS"}</p>
        <h2 className="font-display mt-3 text-4xl text-[#1A1D29] sm:text-5xl">
          {isSw ? "Kutoka mauzo hadi uelewa." : "From sale to insight."}
        </h2>

        <div className="mt-16 grid gap-12 sm:grid-cols-3 sm:gap-8">
          {STEPS.map((s, i) => (
            <div key={s.n} className="relative">
              {i < STEPS.length - 1 && (
                <div className="absolute left-[calc(100%+0.5rem)] top-8 hidden h-px w-[calc(100%-1rem)] bg-[#E5E7EB] sm:block" />
              )}
              <span className="text-sm font-medium text-[#D99A4E]">{s.n}</span>
              <h3 className="font-display mt-3 text-3xl text-[#1A1D29] sm:text-4xl">
                {isSw ? s.sw : s.en}
              </h3>
              <p className="mt-3 text-base text-[#6B7280]">
                {isSw ? s.bodySw : s.bodyEn}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
