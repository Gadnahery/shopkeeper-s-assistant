import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";

const faqItems = [
  {
    enQuestion: "What is WiseCash?",
    enAnswer:
      "WiseCash is business management software for shops and growing businesses. It combines POS, inventory management, sales tracking, reports, and staff tools in one web app.",
    swQuestion: "WiseCash ni nini?",
    swAnswer:
      "WiseCash ni mfumo wa usimamizi wa biashara kwa maduka na biashara zinazokua. Unaunganisha POS, stoki, mauzo, ripoti, wafanyakazi, na usajili kwenye web app moja.",
  },
  {
    enQuestion: "Who should use WiseCash?",
    enAnswer:
      "WiseCash is built for shop owners, wholesalers, retailers, hardware stores, pharmacies, salons, and small businesses that need better sales and stock control.",
    swQuestion: "Ni nani anapaswa kutumia WiseCash?",
    swAnswer:
      "WiseCash imejengwa kwa wamiliki wa maduka, wauzaji wa jumla, rejareja, maduka ya vifaa, maduka ya dawa, saluni, na biashara ndogo zinazohitaji udhibiti bora wa mauzo na stoki.",
  },
  {
    enQuestion: "Does WiseCash work on phones and laptops?",
    enAnswer:
      "Yes. WiseCash works on phones, tablets, and laptops, and it can also be installed as a PWA app for easier daily use.",
    swQuestion: "WiseCash inafanya kazi kwenye simu na laptop?",
    swAnswer:
      "Ndiyo. WiseCash inafanya kazi kwenye simu, tablet, na laptop, na inaweza pia kusakinishwa kama app ya PWA kwa matumizi ya kila siku.",
  },
  {
    enQuestion: "How much does WiseCash cost?",
    enAnswer:
      "WiseCash is currently open for use while worldwide billing is being prepared. Official global pricing will be announced later.",
    swQuestion: "WiseCash inagharimu kiasi gani?",
    swAnswer:
      "Kwa sasa WiseCash iko wazi kutumika wakati billing ya kimataifa inaandaliwa. Bei rasmi ya global itatangazwa baadaye.",
  },
];

export function FAQ() {
  const { language } = useLanguage();

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            {language === "sw" ? "Maswali Ya Mara Kwa Mara" : "Frequently Asked Questions"}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {language === "sw"
              ? "Majibu ya haraka kuhusu WiseCash, matumizi ya mfumo, na hatua za global launch."
              : "Quick answers about WiseCash, how the platform works, and the global launch setup."}
          </p>
        </motion.div>

        <div className="mx-auto max-w-3xl rounded-[2rem] border border-border/70 bg-card/75 p-4 shadow-sm md:p-6">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-base font-semibold">
                  {language === "sw" ? item.swQuestion : item.enQuestion}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-7 text-muted-foreground">
                  {language === "sw" ? item.swAnswer : item.enAnswer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
