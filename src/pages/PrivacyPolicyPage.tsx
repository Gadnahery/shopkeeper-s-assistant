import { Link } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PrivacyPolicyPage() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto max-w-3xl px-4 py-12 sm:py-16 space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {isSw ? "Sheria ya Faragha" : "Legal"}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {isSw ? "Sera ya Faragha" : "Privacy Policy"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSw
              ? "Imesasishwa Septemba 2026. Inalingana na Sheria ya Ulinzi wa Data Binafsi ya Tanzania (2022)."
              : "Updated September 2026. Aligned with Tanzania’s Personal Data Protection Act (2022)."}
          </p>
        </div>

        <section className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-lg font-semibold text-foreground">
            {isSw ? "Tunachokusanya" : "What we collect"}
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              {isSw
                ? "Taarifa za akaunti: jina, barua pepe, namba ya simu"
                : "Account info: name, email, phone number"}
            </li>
            <li>
              {isSw
                ? "Maelezo ya duka/biashara, mauzo, stoki, na rekodi za fedha"
                : "Shop/business details, sales, inventory, and financial records"}
            </li>
            <li>
              {isSw
                ? "Namba za simu za malipo ya mobile money na picha za uthibitisho (malipo ya mikono)"
                : "Mobile-money phone numbers used for payments and payment-proof screenshots (manual billing path)"}
            </li>
          </ul>

          <h2 className="text-lg font-semibold text-foreground">
            {isSw ? "Kwa nini tunakusanya" : "Why we collect it"}
          </h2>
          <p>
            {isSw
              ? "Kuendesha huduma kuu za WiseCash (POS, stoki, ripoti) na kuchakata malipo ya usajili."
              : "To run WiseCash core features (POS, inventory, reporting) and to process subscription payments."}
          </p>

          <h2 className="text-lg font-semibold text-foreground">
            {isSw ? "Nani anashirikiwa data" : "Who we share with"}
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-foreground">Supabase</strong> —{" "}
              {isSw
                ? "hifadhidata na faili. Data inaweza kuhifadhiwa nje ya Tanzania kulingana na eneo la mwenyeji; uhamisho wa nje unadhibitiwa na PDPA."
                : "hosts database and files. Data may leave Tanzania depending on hosting region; cross-border transfers are regulated under the PDPA."}
            </li>
            <li>
              <strong className="text-foreground">Payment processors</strong> —{" "}
              {isSw
                ? "wasindikaji wa malipo walioidhinishwa. Wanapokea namba ya simu na kiasi tu — si data yako yote ya mauzo."
                : "licensed payment processors. They receive phone number and amount only — never your full sales data."}
            </li>
          </ul>

          <h2 className="text-lg font-semibold text-foreground">
            {isSw ? "Uhifadhi" : "Retention"}
          </h2>
          <p>
            {isSw
              ? "Tunahifadhi data wakati akaunti yako iko hai. Ukifunga akaunti au kutumia kipengele cha kufuta data ya duka, data husika inafutwa au inaondolewa kulingana na sera yetu ya kuhifadhi."
              : "We keep data while your account is active. If you close an account or use the shop data-reset feature, relevant data is deleted or de-identified according to our retention practices."}
          </p>

          <h2 className="text-lg font-semibold text-foreground">
            {isSw ? "Haki zako chini ya PDPA" : "Your rights under the PDPA"}
          </h2>
          <p>
            {isSw
              ? "Una haki ya kuomba kufikia, kusahihisha, au kufuta data yako. Wasiliana nasi kupitia barua pepe iliyo kwenye ukurasa wa Mawasiliano — tutajibu ndani ya muda unaokubalika kisheria."
              : "You may request access, correction, or deletion of your data. Contact us via the email on the Contact page — we will respond within legally reasonable timeframes."}
          </p>

          <h2 className="text-lg font-semibold text-foreground">
            {isSw ? "Kuhusu malipo" : "About payments"}
          </h2>
          <p>
            {isSw
              ? "WiseCash si benki. Malipo yanachakatwa na watoa huduma walioidhinishwa wa mobile money au malipo ya mikono, si na WiseCash moja kwa moja."
              : "WiseCash is not a bank. Payment processing is handled by licensed mobile-money providers or manual verification, not by WiseCash itself."}
          </p>

          <p className="pt-4 text-xs">
            {isSw
              ? "Hati hii ni sehemu ya utekelezaji wa kiufundi. Usajili kama mdhibiti wa data na ukaguzi wa kisheria unapaswa kufanywa kando."
              : "This page supports the technical/UI side of compliance. Registering as a data controller with the PDPC and a lawyer’s review of the final policy text should be done separately."}
          </p>
        </section>

        <Link to="/" className="inline-block text-sm font-medium text-primary hover:underline">
          {isSw ? "← Rudi nyumbani" : "← Back home"}
        </Link>
      </main>
      <Footer />
    </div>
  );
}
