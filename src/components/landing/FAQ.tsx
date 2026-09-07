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
      "WiseCash costs a simple, flat fee of TZS 25,000 per month for your entire shop, with all 10 modules included and zero hidden charges. You can renew monthly on your own terms with no long-term contracts.",
    swQuestion: "WiseCash inagharimu kiasi gani?",
    swAnswer:
      "WiseCash inagharimu ada nafuu ya TZS 25,000 tu kwa mwezi kwa duka lako zima. Moduli zote 10 zimejumuishwa bila malipo yoyote yaliyofichwa, na unaweza kulipia mwezi kwa mwezi upendavyo bila mkataba wa lazima.",
  },
  {
    enQuestion: "How do I make the subscription payment?",
    enAnswer:
      "You can pay directly using local Tanzanian mobile money networks (Vodacom M-Pesa or HaloPesa). You do not need a bank card or international payment account. Once you send the money, simply enter the transaction receipt code into the billing screen and your shop is activated.",
    swQuestion: "Ninalipaje ada ya usajili wa WiseCash?",
    swAnswer:
      "Unalipa moja kwa moja kupitia mitandao ya simu za mkononi hapa Tanzania (Vodacom M-Pesa au HaloPesa). Huhitaji kadi ya benki wala akaunti ya nje. Ukishatuma pesa, unaingiza namba ya kumbukumbu ya muamala (SMS receipt code) kwenye fomu ya mfumo na akaunti yako itawashwa.",
  },
  {
    enQuestion: "Is there a free trial?",
    enAnswer:
      "No, WiseCash does not have a free trial. You activate your shop directly with an affordable monthly payment of TZS 25,000 via mobile money. This grants you immediate, unrestricted access to every feature with no commitments, and existing active shops are protected with a 14-day grace period.",
    swQuestion: "Je, kuna kipindi cha jaribio la bure?",
    swAnswer:
      "Hapana, WiseCash haina kipindi cha jaribio la bure. Unaamsha duka lako moja kwa moja kwa malipo ya mwezi ya TZS 25,000 kupitia M-Pesa au Halotel. Hii inakupa ufikiaji kamili wa moduli zote mara moja bila vikwazo.",
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
