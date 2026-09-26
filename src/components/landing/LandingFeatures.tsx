import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    n: "01",
    titleEn: "Sell faster.",
    titleSw: "Uza haraka.",
    bodyEn: "A simple POS built for everyday sales.",
    bodySw: "POS rahisi iliyoundwa kwa mauzo ya kila siku.",
    img: "https://images.unsplash.com/photo-1556742111-a301076d9d18?auto=format&fit=crop&w=1200&q=80",
    alt: "Point of sale",
  },
  {
    n: "02",
    titleEn: "Know your stock.",
    titleSw: "Jua stoki yako.",
    bodyEn: "See what you have, what is moving and what needs attention.",
    bodySw: "Ona unachonacho, kinachotembea na kinachohitaji uangalizi.",
    img: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
    alt: "Inventory shelves",
  },
  {
    n: "03",
    titleEn: "Keep customers close.",
    titleSw: "Weka wateja karibu.",
    bodyEn: "Manage customer details, credit and payment history in one place.",
    bodySw: "Simamia maelezo ya wateja, madeni na historia ya malipo mahali pamoja.",
    img: "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1200&q=80",
    alt: "Customer service",
  },
  {
    n: "04",
    titleEn: "Know what you make.",
    titleSw: "Jua unachopata.",
    bodyEn: "See your sales, expenses and real profit clearly.",
    bodySw: "Ona mauzo, gharama na faida halisi kwa uwazi.",
    img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    alt: "Business reports",
  },
];

export function LandingFeatures() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  return (
    <section id="features" className="scroll-mt-24 bg-[#F7F7F5] px-5 pb-8 sm:px-10">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-16 max-w-xl sm:mb-20">
          <p className="label-micro">{isSw ? "UNACHOHITAJI" : "WHAT YOU NEED"}</p>
          <h2 className="font-display mt-3 text-4xl leading-tight text-[#1A1D29] sm:text-5xl lg:text-[3.5rem]">
            {isSw ? "Endesha biashara kwa uwazi." : "Run your business with clarity."}
          </h2>
        </div>

        <div className="space-y-20 sm:space-y-28">
          {FEATURES.map((f, i) => {
            const reverse = i % 2 === 1;
            return (
              <div
                key={f.n}
                className={cn(
                  "grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
                  reverse && "lg:[&>*:first-child]:order-2",
                )}
              >
                <div className={cn(reverse && "lg:pl-8")}>
                  <span className="text-sm font-medium text-[#D99A4E]">{f.n}</span>
                  <h3 className="font-display mt-3 text-3xl text-[#1A1D29] sm:text-4xl">
                    {isSw ? f.titleSw : f.titleEn}
                  </h3>
                  <p className="mt-4 max-w-md text-base leading-relaxed text-[#6B7280] sm:text-lg">
                    {isSw ? f.bodySw : f.bodyEn}
                  </p>
                </div>
                <div className="overflow-hidden rounded-[28px] border border-[#E5E7EB] bg-white shadow-[0_20px_50px_-28px_rgba(26,29,41,0.25)]">
                  <img
                    src={f.img}
                    alt={f.alt}
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
