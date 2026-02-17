import { motion } from "framer-motion";
import { UserPlus, Package, ShoppingBag } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const steps = [
  {
    icon: UserPlus,
    titleEn: "Create Account",
    titleSw: "Fungua Akaunti",
    descEn: "Sign up in minutes",
    descSw: "Jisajili kwa dakika",
  },
  {
    icon: Package,
    titleEn: "Add Products",
    titleSw: "Ongeza Bidhaa",
    descEn: "Import your inventory",
    descSw: "Ingiza hesabu yako",
  },
  {
    icon: ShoppingBag,
    titleEn: "Start Selling",
    titleSw: "Anza Kuuza",
    descEn: "Go live immediately",
    descSw: "Anza mara moja",
  },
];

export function HowItWorks() {
  const { language } = useLanguage();

  return (
    <section id="how-it-works" className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 to-transparent" />
      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            {language === "sw" ? "Jinsi Inavyofanya Kazi" : "How It Works"}
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            {language === "sw"
              ? "Anza kwa hatua tatu rahisi."
              : "Get started in three simple steps."}
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          {/* Step line */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2 }}
            className="absolute left-1/2 top-12 hidden h-0.5 w-full -translate-x-1/2 origin-center bg-gradient-to-r from-teal-500 via-blue-500 to-violet-500 md:block"
          />

          <div className="grid gap-12 md:grid-cols-3 md:gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.titleEn}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative flex flex-col items-center text-center"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="relative z-10 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 text-white shadow-xl shadow-teal-500/25"
                >
                  <step.icon className="h-12 w-12" />
                </motion.div>
                <h3 className="mt-6 text-xl font-semibold text-foreground">
                  {language === "sw" ? step.titleSw : step.titleEn}
                </h3>
                <p className="mt-2 text-muted-foreground">
                  {language === "sw" ? step.descSw : step.descEn}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
