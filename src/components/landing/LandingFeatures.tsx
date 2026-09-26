import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    n: "01",
    titleEn: "Sell faster.",
    titleSw: "Uza haraka.",
    bodyEn: "A simple POS built for everyday sales.",
    bodySw: "POS rahisi iliyoundwa kwa mauzo ya kila siku.",
    img: "/landing/pos.jpg",
  },
  {
    n: "02",
    titleEn: "Know your stock.",
    titleSw: "Jua stoki yako.",
    bodyEn: "See what you have, what is moving and what needs attention.",
    bodySw: "Ona unachonacho, kinachotembea na kinachohitaji uangalizi.",
    img: "/landing/stock.jpg",
  },
  {
    n: "03",
    titleEn: "Keep customers close.",
    titleSw: "Weka wateja karibu.",
    bodyEn: "Manage customer details, credit and payment history in one place.",
    bodySw: "Simamia maelezo ya wateja, madeni na historia ya malipo mahali pamoja.",
    img: "/landing/team.jpg",
  },
  {
    n: "04",
    titleEn: "Know what you make.",
    titleSw: "Jua unachopata.",
    bodyEn: "See your sales, expenses and real profit clearly.",
    bodySw: "Ona mauzo, gharama na faida halisi kwa uwazi.",
    img: "/landing/shop-interior.jpg",
  },
];

export function LandingFeatures() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  return (
    <section id="features" className="scroll-mt-24 bg-[#F7F7F5] px-5 pb-6 sm:px-10">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-10 max-w-xl sm:mb-12">
          <p className="label-micro">{isSw ? "UNACHOHITAJI" : "WHAT YOU NEED"}</p>
          <h2 className="font-display mt-2 text-3xl leading-tight text-[#1A1D29] sm:text-4xl">
            {isSw ? "Endesha biashara kwa uwazi." : "Run your business with clarity."}
          </h2>
        </div>

        <div className="space-y-12 sm:space-y-16">
          {FEATURES.map((f, i) => {
            const reverse = i % 2 === 1;
            return (
              <div
                key={f.n}
                className={cn(
                  "grid items-center gap-6 lg:grid-cols-2 lg:gap-12",
                  reverse && "lg:[&>*:first-child]:order-2",
                )}
              >
                <div>
                  <span className="text-sm font-medium text-[#D99A4E]">{f.n}</span>
                  <h3 className="font-display mt-2 text-2xl text-[#1A1D29] sm:text-3xl">
                    {isSw ? f.titleSw : f.titleEn}
                  </h3>
                  <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#6B7280]">
                    {isSw ? f.bodySw : f.bodyEn}
                  </p>
                </div>
                <div className="overflow-hidden rounded-[24px] border border-[#E5E7EB] bg-white shadow-[0_16px_40px_-24px_rgba(26,29,41,0.28)]">
                  <img
                    src={f.img}
                    alt={isSw ? f.titleSw : f.titleEn}
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
