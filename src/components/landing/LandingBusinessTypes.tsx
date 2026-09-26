import { useLanguage } from "@/contexts/LanguageContext";

const TYPES = [
  { en: "Retail", sw: "Rejareja", img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80" },
  { en: "Mini Markets", sw: "Mini market", img: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80" },
  { en: "Cosmetics", sw: "Vipodozi", img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80" },
  { en: "Hardware", sw: "Vifaa", img: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80" },
  { en: "Electronics", sw: "Elektroniki", img: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80" },
  { en: "Spare Parts", sw: "Spare parts", img: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80" },
];

export function LandingBusinessTypes() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  return (
    <section className="bg-[#F7F7F5] px-5 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-[1280px]">
        <p className="label-micro">{isSw ? "IMEUNDWA KWA BIASHARA" : "MADE FOR BUSINESS"}</p>
        <h2 className="font-display mt-3 max-w-lg text-4xl text-[#1A1D29] sm:text-5xl">
          {isSw ? "Imejengwa kulingana na jinsi unavyofanya kazi." : "Built around the way you work."}
        </h2>

        <div className="mt-14 flex gap-4 overflow-x-auto pb-4 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-6">
          {TYPES.map((t) => (
            <div
              key={t.en}
              className="group relative h-48 w-[70vw] shrink-0 overflow-hidden rounded-[24px] sm:h-56 sm:w-auto"
            >
              <img
                src={t.img}
                alt={isSw ? t.sw : t.en}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1D29]/80 to-transparent" />
              <p className="absolute bottom-4 left-4 font-display text-xl text-white">
                {isSw ? t.sw : t.en}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-[#6B7280]">
          {isSw ? "Na zaidi." : "And more."}
        </p>
      </div>
    </section>
  );
}
