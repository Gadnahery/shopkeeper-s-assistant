import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    qEn: "What is WiseCash?",
    qSw: "WiseCash ni nini?",
    aEn: "WiseCash is a simple system for sales, stock, customers and profit — built for everyday business.",
    aSw: "WiseCash ni mfumo rahisi wa mauzo, stoki, wateja na faida — umeundwa kwa biashara ya kila siku.",
  },
  {
    qEn: "Does WiseCash work offline?",
    qSw: "Je, WiseCash inafanya kazi bila mtandao?",
    aEn: "Yes. Keep selling when the connection drops. Changes sync when you're back online.",
    aSw: "Ndiyo. Endelea kuuza mtandao ukikatika. Mabadiliko yanasawazishwa ukirudi mtandaoni.",
  },
  {
    qEn: "Can I use it on my phone?",
    qSw: "Naweza kuitumia kwenye simu?",
    aEn: "Yes. WiseCash works in the browser on phone, tablet and computer.",
    aSw: "Ndiyo. WiseCash inafanya kazi kwenye kivinjari cha simu, tablet na kompyuta.",
  },
  {
    qEn: "Can my staff use it?",
    qSw: "Je, wafanyakazi wangu wanaweza kuitumia?",
    aEn: "Yes. Invite staff with the right roles so each person only sees what they need.",
    aSw: "Ndiyo. Alika wafanyakazi wenye majukumu sahihi ili kila mmoja aone anachohitaji tu.",
  },
  {
    qEn: "Can I track customer credit?",
    qSw: "Naweza kufuatilia madeni ya wateja?",
    aEn: "Yes. Record credit sales and payment history for each customer.",
    aSw: "Ndiyo. Rekodi mauzo ya mkopo na historia ya malipo kwa kila mteja.",
  },
  {
    qEn: "How does the free trial work?",
    qSw: "Jaribio bure linafanyaje kazi?",
    aEn: "New shops get 14 days of full access. No payment required to start.",
    aSw: "Maduka mapya yanapata siku 14 za ufikiaji kamili. Hakuna malipo ya kuanza.",
  },
];

export function LandingFaq() {
  const { language } = useLanguage();
  const isSw = language === "sw";
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 bg-[#F7F7F5] px-5 py-24 sm:px-10 sm:py-32">
      <div className="mx-auto max-w-[720px]">
        <h2 className="font-display text-4xl text-[#1A1D29] sm:text-5xl">
          {isSw ? "Maswali, majibu." : "Questions, answered."}
        </h2>

        <div className="mt-12 divide-y divide-[#E5E7EB] border-t border-[#E5E7EB]">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.qEn}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-[15px] font-medium text-[#1A1D29] sm:text-base">
                    {isSw ? f.qSw : f.qEn}
                  </span>
                  {isOpen ? (
                    <Minus className="h-4 w-4 shrink-0 text-[#6B7280]" />
                  ) : (
                    <Plus className="h-4 w-4 shrink-0 text-[#6B7280]" />
                  )}
                </button>
                <div
                  className={cn(
                    "overflow-hidden transition-all",
                    isOpen ? "max-h-40 pb-5" : "max-h-0",
                  )}
                >
                  <p className="text-sm leading-relaxed text-[#6B7280] sm:text-[15px]">
                    {isSw ? f.aSw : f.aEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
