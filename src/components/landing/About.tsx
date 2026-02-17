import { motion } from "framer-motion";
import { Store } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function About() {
  const { language } = useLanguage();

  return (
    <section id="about" className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            {language === "sw" ? "Kuhusu Smart Money" : "About Smart Money"}
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            {language === "sw"
              ? "Smart Money ni mfumo wa kusimamia biashara uliojengwa kwa dukani na wafanyi biashara wadogo. Tunasaidia wamiliki wa duka kuendesha biashara zao kwa urahisi na ufanisi zaidi — POS, hesabu ya stoki, ripoti, na mengine."
              : "Smart Money is a business management system built for shops and small businesses. We help shop owners run their businesses more easily and efficiently—POS, inventory, reports, and more."}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
