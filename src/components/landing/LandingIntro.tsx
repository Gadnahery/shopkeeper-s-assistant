import { useLanguage } from "@/contexts/LanguageContext";

export function LandingIntro() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  return (
    <section className="bg-[#F7F7F5] px-5 py-14 sm:px-10 sm:py-18">
      <div className="mx-auto max-w-2xl text-center">
        <p className="label-micro">{isSw ? "BIASHARA YAKO, RAHISI" : "YOUR BUSINESS, SIMPLIFIED"}</p>
        <h2 className="font-display mt-3 text-3xl leading-tight text-[#1A1D29] sm:text-4xl lg:text-5xl">
          {isSw ? "Kila kitu mahali pamoja." : "Everything in one place."}
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-[#6B7280] sm:text-base">
          {isSw
            ? "Uza, simamia stoki, fuatilia wateja na uelewe faida yako — bila ugumu."
            : "Sell, manage stock, track customers and understand your profit — without the complexity."}
        </p>
      </div>
    </section>
  );
}
