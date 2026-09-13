import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";

export function PreviewFAQ() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  const faqItems = [
    {
      id: "faq-1",
      enQ: "What is WiseCash and what problems does it solve?",
      swQ: "WiseCash ni nini na inatatua changamoto gani?",
      enA: "WiseCash is an all-in-one business management and Point of Sale (POS) software built for Tanzanian merchants. It replaces messy notebooks and manual bookkeeping by tracking live stock, recording cash and mobile sales, tracking customer credit debts, and calculating your true daily net profit automatically.",
      swA: "WiseCash ni mfumo kamili wa kusimamia biashara na mauzo (POS) uliotengenezwa kwa ajili ya maduka na wajasiriamali wa Tanzania. Unaondoa madaftari na kubahatisha kwa kuandika mauzo ya taslimu na M-Pesa, kufuatilia stoki inayobaki, kudhibiti madeni ya wateja, na kutoa hesabu halisi ya faida kila jioni.",
    },
    {
      id: "faq-2",
      enQ: "How much does WiseCash cost after the trial?",
      swQ: "WiseCash inagharimu kiasi gani baada ya siku 14 za majaribio?",
      enA: "WiseCash costs a flat TZS 25,000 per month for your entire shop. There are zero hidden setup fees, and all features (POS, inventory, credit ledger, financial reports, offline mode) are fully included.",
      swA: "WiseCash inagharimu ada nafuu ya TZS 25,000 tu kwa mwezi kwa duka lako zima. Hakuna malipo mengine yaliyofichwa, na moduli zote (POS, stoki, madeni ya wateja, ripoti za faida na hali ya bila mtandao) zimejumuishwa kikamilifu.",
    },
    {
      id: "faq-3",
      enQ: "How do I pay for my subscription?",
      swQ: "Ninalipaje ada ya mwezi ya WiseCash?",
      enA: "You pay directly via local Tanzanian mobile money networks (Vodacom M-Pesa or HaloPesa). You do not need a bank debit/credit card. Once you transfer the subscription fee, simply input your SMS transaction code and your account renews instantly.",
      swA: "Unalipa moja kwa moja kupitia mitandao ya simu za mkononi nchini Tanzania (Vodacom M-Pesa au HaloPesa). Huhitaji kadi ya benki. Ukishatuma ada ya mwezi, unaingiza namba ya kumbukumbu ya muamala (SMS receipt code) kwenye mfumo na duka lako linaendelea kutumika papo hapo.",
    },
    {
      id: "faq-4",
      enQ: "Can I use WiseCash on my smartphone and without internet?",
      swQ: "Je, naweza kutumia WiseCash kwenye simu yangu na hata bila mtandao?",
      enA: "Yes! WiseCash is fully optimized for any smartphone (Android and iPhone), tablet, or computer. You can install it on your home screen as an offline Progressive Web App (PWA). It records sales and updates inventory even during power or network cuts, then automatically syncs to the cloud when internet returns.",
      swA: "Ndiyo! WiseCash inafanya kazi vizuri sana kwenye simu zote (Android na iPhone), tablets, na kompyuta. Unaweza kuiweka kwenye skrini ya simu yako kama app (PWA). Inarekodi mauzo hata mtandao ukikata, kisha inajisawazisha mtandao ukirudi.",
    },
    {
      id: "faq-5",
      enQ: "Is there a free trial and do I need to enter credit card details?",
      swQ: "Je, kuna jaribio la bure na je, nahitaji kuweka kadi ya benki?",
      enA: "Yes, every new business receives 14 full days of free access immediately upon creating an account. No payment or credit card is required to get started.",
      swA: "Ndiyo, kila akaunti mpya inapata siku 14 za bure kutumia mfumo mzima pindi inapojisajili. Hakuna kadi ya benki wala malipo yanayohitajika kuanza.",
    },
  ];

  return (
    <section id="faq" className="py-20 sm:py-24 bg-background border-b border-border/70 scroll-mt-12">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <div className="text-center space-y-4 mb-12">
          <span className="inline-block rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isSw ? "Maswali ya Mara kwa Mara" : "Frequently Asked Questions"}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            {isSw ? "Maswali Yanayoulizwa Sana" : "Everything You Need to Know"}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isSw
              ? "Majibu ya wazi kuhusu WiseCash, malipo na namna inavyosaidia biashara yako."
              : "Clear, straightforward answers about WiseCash features, pricing, and mobile money support."}
          </p>
        </div>

        {/* Accordion */}
        <Accordion type="single" collapsible className="w-full space-y-3">
          {faqItems.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="rounded-2xl border border-border/70 bg-card px-5 shadow-xs transition-colors data-[state=open]:border-primary/50"
            >
              <AccordionTrigger className="text-left text-sm sm:text-base font-bold text-foreground py-4 hover:no-underline">
                {isSw ? item.swQ : item.enQ}
              </AccordionTrigger>
              <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pb-4">
                {isSw ? item.swA : item.enA}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
