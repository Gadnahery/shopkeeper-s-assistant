import { useLanguage } from "@/contexts/LanguageContext";

const POINTS = [
  { en: "Fast", sw: "Haraka", bodyEn: "Get things done without unnecessary steps.", bodySw: "Fanya kazi bila hatua zisizohitajika." },
  { en: "Clear", sw: "Wazi", bodyEn: "Know what's happening in your business.", bodySw: "Jua kinachoendelea katika biashara yako." },
  { en: "Connected", sw: "Imeunganishwa", bodyEn: "Sales, stock and customers work together.", bodySw: "Mauzo, stoki na wateja hufanya kazi pamoja." },
  { en: "Offline", sw: "Bila mtandao", bodyEn: "Keep working when the internet doesn't.", bodySw: "Endelea kufanya kazi mtandao ukikatika." },
];

export function LandingWhy() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  return (
    <section className="bg-[#F7F7F5] px-5 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-[1280px]">
        <p className="label-micro">{isSw ? "KWA NINI WISECASH" : "WHY WISECASH"}</p>
        <h2 className="font-display mt-3 text-4xl text-[#1A1D29] sm:text-5xl">
          {isSw ? "Rahisi kwa muundo." : "Simple by design."}
        </h2>
        <div className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {POINTS.map((p) => (
            <div key={p.en}>
              <h3 className="font-display text-3xl text-[#1A1D29]">{isSw ? p.sw : p.en}</h3>
              <p className="mt-3 text-base leading-relaxed text-[#6B7280]">
                {isSw ? p.bodySw : p.bodyEn}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
