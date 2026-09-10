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
      "WiseCash is a complete business ERP and POS management software designed specifically for Tanzanian shops and growing enterprises. It combines lightning-fast checkout, real-time inventory, customer credit ledgers, supplier purchases, production recipe batches, expenses, and automated P&L financial reports in one unified app.",
    swQuestion: "WiseCash ni nini?",
    swAnswer:
      "WiseCash ni mfumo kamili wa usimamizi wa biashara (ERP na POS) uliotengenezwa mahsusi kwa ajili ya maduka na biashara zinazokua Tanzania. Unaunganisha mauzo ya haraka ya POS, udhibiti wa stoki, madeni ya wateja, manunuzi ya wasambazaji, uzalishaji viwandani, matumizi na ripoti halisi za faida na hasara kwenye app moja.",
  },
  {
    enQuestion: "How much does WiseCash cost?",
    enAnswer:
      "WiseCash costs an affordable, flat fee of TZS 10,000 per month for your entire shop, with all modules included and zero hidden charges. Every new user starts with an automatic 14-day free trial before being prompted for any subscription payment.",
    swQuestion: "WiseCash inagharimu kiasi gani?",
    swAnswer:
      "WiseCash inagharimu ada nafuu ya TZS 10,000 tu kwa mwezi kwa duka lako zima. Moduli zote zimejumuishwa bila malipo yoyote yaliyofichwa. Kila mtumiaji mpya anaanza na siku 14 za bure kabla ya kuombwa kulipia usajili.",
  },
  {
    enQuestion: "How do I make the subscription payment?",
    enAnswer:
      "You can pay directly using local Tanzanian mobile money networks (Vodacom M-Pesa or HaloPesa). You do not need a bank card or international payment account. Once you send TZS 10,000, simply enter the transaction receipt code into the billing screen and your shop is activated immediately.",
    swQuestion: "Ninalipaje ada ya usajili wa WiseCash?",
    swAnswer:
      "Unalipa moja kwa moja kupitia mitandao ya simu za mkononi hapa Tanzania (Vodacom M-Pesa au HaloPesa). Huhitaji kadi ya benki wala akaunti ya nje. Ukishatuma TZS 10,000, unaingiza namba ya kumbukumbu ya muamala (SMS receipt code) kwenye fomu ya mfumo na akaunti yako itawashwa mara moja.",
  },
  {
    enQuestion: "Is there a free trial?",
    enAnswer:
      "Yes! Every business that joins WiseCash gets an automatic 14-day free trial immediately upon creating an account. You have full access to POS, inventory, customer credit, purchases, and profit reports without paying anything upfront. You will only be prompted to subscribe (TZS 10,000/mo) after your 14 days have elapsed.",
    swQuestion: "Je, kuna kipindi cha jaribio la bure?",
    swAnswer:
      "Ndiyo! Kila biashara inayojiunga na WiseCash inapata jaribio la bure la siku 14 mara tu inapofungua akaunti. Una uwezo wa kutumia moduli zote za POS, stoki, mikopo ya wateja, manunuzi, na ripoti za faida bila malipo yoyote ya awali. Utaombwa kulipia ada ya TZS 10,000/mwezi pale tu siku zako 14 za bure zitakapokamilika.",
  },
  {
    enQuestion: "Does WiseCash work on phones and without internet?",
    enAnswer:
      "Yes! WiseCash is fully responsive on all Android and iOS smartphones, tablets, and desktop computers. It can be installed as an offline Progressive Web App (PWA) on your home screen and continues recording sales and inventory even when mobile internet is down, automatically syncing when you reconnect.",
    swQuestion: "Je, WiseCash inafanya kazi kwenye simu na bila intaneti?",
    swAnswer:
      "Ndiyo! WiseCash inafanya kazi vizuri kwenye simu zote za mkononi (Android na iPhone), tablets, na kompyuta. Inaweza kusakinishwa moja kwa moja kwenye kioo cha simu kama app (PWA) na inafanya kazi ya kuandika mauzo na stoki hata intaneti inapokatika, kisha inajisasisha punde muunganisho unaporejea.",
  },
];

export function FAQ() {
  const { language } = useLanguage();

  return (
    <section id="faq" className="py-20 bg-background border-b border-border">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center max-w-2xl mx-auto"
        >
          <h2 className="text-3xl font-extrabold text-foreground md:text-4xl">
            {language === "sw" ? "Maswali Ya Mara Kwa Mara" : "Frequently Asked Questions"}
          </h2>
          <p className="mx-auto mt-3 text-sm text-muted-foreground sm:text-base">
            {language === "sw"
              ? "Majibu ya wazi kuhusu WiseCash, bei na usajili, na namna ya kutumia kwenye biashara yako."
              : "Clear answers about WiseCash, pricing, mobile money payment, and day-to-day operations."}
          </p>
        </motion.div>

        <div className="mx-auto max-w-3xl rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-xs">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-border/60">
                <AccordionTrigger className="text-left text-sm sm:text-base font-bold text-foreground hover:no-underline py-4">
                  {language === "sw" ? item.swQuestion : item.enQuestion}
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm leading-relaxed text-muted-foreground pb-4">
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
