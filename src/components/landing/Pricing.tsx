import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const features = [
  { en: "Unlimited products", sw: "Bidhaa zisizo na kikomo" },
  { en: "POS & sales", sw: "POS na mauzo" },
  { en: "Stock management", sw: "Udhibiti wa stoki" },
  { en: "Reports & analytics", sw: "Ripoti na uchambuzi" },
  { en: "Offline support", sw: "Msaada nje ya mtandao" },
];

export function Pricing() {
  const { language } = useLanguage();

  return (
    <section id="pricing" className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            {language === "sw" ? "Bei Rahisi" : "Simple Pricing"}
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            {language === "sw"
              ? "Anza kutumia WiseCash sasa. Billing ya kimataifa itawekwa rasmi baadaye, kwa hiyo timu yako inaweza kuanza bila vikwazo vya malipo kwa sasa."
              : "Start using WiseCash now. Global billing will be finalized later, so your team can get started without payment restrictions for now."}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 shadow-lg"
        >
          <h3 className="text-2xl font-bold text-foreground">
            {language === "sw" ? "Mpango wa Global Launch" : "Global Launch Access"}
          </h3>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-4xl font-bold">{language === "sw" ? "Bure kwa sasa" : "Free for now"}</span>
            <span className="text-muted-foreground">
              {language === "sw" ? "wakati wa maandalizi ya billing" : "while billing is being prepared"}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {language === "sw"
              ? "Tunafungua WiseCash kwa matumizi mapana kwanza. Bei ya kimataifa na njia rasmi za malipo zitatangazwa baada ya global setup kukamilika."
              : "We are opening WiseCash for broader use first. Global pricing and official billing options will be announced after the worldwide setup is complete."}
          </p>
          <ul className="mt-6 space-y-3">
            {features.map((f) => (
              <li key={f.en} className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-5 w-5 shrink-0 text-teal-500" />
                <span>{language === "sw" ? f.sw : f.en}</span>
              </li>
            ))}
          </ul>
          <Button asChild className="mt-8 h-12 w-full rounded-xl bg-gradient-to-r from-teal-500 to-blue-600">
            <Link to="/signup">
              {language === "sw" ? "Anza Sasa" : "Get Started"}
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
