import { Link } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { useLanguage } from "@/contexts/LanguageContext";

export default function TermsOfServicePage() {
  const { language } = useLanguage();
  const isSw = language === "sw";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto max-w-3xl px-4 py-12 sm:py-16 space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {isSw ? "Sheria" : "Legal"}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {isSw ? "Masharti ya Huduma" : "Terms of Service"}
          </h1>
          <p className="mt-2 text-[13px] sm:text-sm text-muted-foreground">
            {isSw ? "Imesasishwa Septemba 2026." : "Updated September 2026."}
          </p>
        </div>

        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-lg font-semibold text-foreground">
            {isSw ? "Nani anaweza kutumia" : "Who can use WiseCash"}
          </h2>
          <p>
            {isSw
              ? "Lazima uwe na uwezo wa kisheria wa kuendesha biashara nchini Tanzania (au nchi unayochagua wakati wa usajili)."
              : "You must be legally able to operate a business in Tanzania (or the country you select at signup)."}
          </p>

          <h2 className="text-lg font-semibold text-foreground">
            {isSw ? "Usajili (subscription)" : "Subscription terms"}
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              {isSw
                ? "Bei ya mwezi: TZS 25,000 (inaweza kujumuisha viti vya ziada au punguzo la rufaa kulingana na mipango iliyojengwa)."
                : "Monthly price: TZS 25,000 (may include extra seats or referral discounts per the in-app plan)."}
            </li>
            <li>
              {isSw
                ? "Upyaji, muda wa kuisha, na kipindi cha neema vinafuata mantiki iliyojengwa kwenye app."
                : "Renewal, expiry, and grace periods follow the logic already built into the app."}
            </li>
            <li>
              {isSw
                ? "Jaribio la bure la siku 14 linapatikana kwa akaunti mpya zinazostahili."
                : "A 14-day free trial is available for eligible new accounts."}
            </li>
          </ul>

          <h2 className="text-lg font-semibold text-foreground">
            {isSw ? "Matumizi yanayokubalika" : "Acceptable use"}
          </h2>
          <p>
            {isSw
              ? "Usitumie WiseCash kwa bidhaa haramu, udanganyifu, au shughuli zinazokiuka sheria za Tanzania."
              : "Do not use WiseCash for illegal goods, fraud, or any activity that violates Tanzanian law."}
          </p>

          <h2 className="text-lg font-semibold text-foreground">
            {isSw ? "Kikomo cha dhima" : "Limitation of liability"}
          </h2>
          <p>
            {isSw
              ? "WiseCash haiwajibiki kwa kushindwa kwa watoa huduma wa malipo wa tatu, upotevu wa data kutokana na kufuta data uliyochochea wewe, au usumbufu wa mtandao nje ya udhibiti wetu."
              : "WiseCash is not liable for third-party payment provider outages, data loss from user-initiated resets, or network disruptions outside our control."}
          </p>

          <h2 className="text-lg font-semibold text-foreground">
            {isSw ? "Kusitisha akaunti" : "Account termination"}
          </h2>
          <p>
            {isSw
              ? "Tunaweza kusitisha akaunti inayokiuka masharti haya au inayotumiwa kwa udanganyifu. Unaweza pia kufunga akaunti yako kwa kuwasiliana nasi."
              : "We may terminate accounts that violate these terms or are used fraudulently. You may also close your account by contacting us."}
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
