import { useLanguage } from "@/contexts/LanguageContext";

export function LandingIntro() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  return (
    <section className="bg-[#F7F7F5] px-5 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-2xl text-center">
        <p className="label-micro">{isSw ? "BIASHARA YAKO, RAHISI" : "YOUR BUSINESS, SIMPLIFIED"}</p>
        <h2 className="font-display mt-4 text-4xl leading-tight text-[#1A1D29] sm:text-5xl lg:text-6xl">
          {isSw ? "Kila kitu mahali pamoja." : "Everything in one place."}
        </h2>
        <p className="mt-6 text-base leading-relaxed text-[#6B7280] sm:text-lg">
          {isSw
            ? "Uza, simamia stoki, fuatilia wateja na uelewe faida yako — bila ugumu."
            : "Sell, manage stock, track customers and understand your profit — without the complexity."}
        </p>
      </div>
    </section>
  );
}
