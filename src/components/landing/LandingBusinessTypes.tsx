import { useLanguage } from "@/contexts/LanguageContext";

const TYPES = [
  { en: "Retail", sw: "Rejareja", img: "/landing/retail.jpg" },
  { en: "Mini Markets", sw: "Mini market", img: "/landing/shop-interior.jpg" },
  { en: "Cosmetics", sw: "Vipodozi", img: "/landing/cosmetics.jpg" },
  { en: "Hardware", sw: "Vifaa", img: "/landing/hardware.jpg" },
  { en: "Electronics", sw: "Elektroniki", img: "/landing/electronics.jpg" },
  { en: "Spare Parts", sw: "Spare parts", img: "/landing/spare.jpg" },
];

export function LandingBusinessTypes() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  return (
    <section className="bg-[#F7F7F5] px-5 py-14 sm:px-10 sm:py-18">
      <div className="mx-auto max-w-[1100px]">
        <p className="label-micro">{isSw ? "IMEUNDWA KWA BIASHARA" : "MADE FOR BUSINESS"}</p>
        <h2 className="font-display mt-2 max-w-lg text-3xl text-[#1A1D29] sm:text-4xl">
          {isSw ? "Imejengwa kulingana na jinsi unavyofanya kazi." : "Built around the way you work."}
        </h2>
        <div className="mt-8 flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-6">
          {TYPES.map((t) => (
            <div
              key={t.en}
              className="group relative h-40 w-[58vw] shrink-0 overflow-hidden rounded-[20px] sm:h-44 sm:w-auto"
            >
              <img
                src={t.img}
                alt={isSw ? t.sw : t.en}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D29]/75 to-transparent" />
              <p className="absolute bottom-3 left-3 font-display text-lg text-white">
                {isSw ? t.sw : t.en}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-[#6B7280]">{isSw ? "Na zaidi." : "And more."}</p>
      </div>
    </section>
  );
}
