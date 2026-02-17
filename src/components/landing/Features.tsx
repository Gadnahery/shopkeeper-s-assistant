import { motion } from "framer-motion";
import {
  ShoppingCart,
  Package,
  BarChart3,
  Users,
  Smartphone,
  Cloud,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const features = [
  {
    icon: ShoppingCart,
    titleEn: "POS",
    titleSw: "POS",
    descEn: "Fast checkout and sales",
    descSw: "Malipo ya haraka na mauzo",
  },
  {
    icon: Package,
    titleEn: "Stock Management",
    titleSw: "Udhibiti wa Stoki",
    descEn: "Track inventory in real time",
    descSw: "Fuata stoki kwa wakati halisi",
  },
  {
    icon: BarChart3,
    titleEn: "Reports",
    titleSw: "Ripoti",
    descEn: "Detailed analytics",
    descSw: "Uchambuzi wa kina",
  },
  {
    icon: Users,
    titleEn: "Customer Management",
    titleSw: "Usimamizi wa Wateja",
    descEn: "Manage loyalty and credit",
    descSw: "Simamia uaminifu na mkopo",
  },
  {
    icon: Smartphone,
    titleEn: "Mobile Friendly",
    titleSw: "Inafaa Simu",
    descEn: "Works on any device",
    descSw: "Inafanya kazi kwenye kifaa chochote",
  },
  {
    icon: Cloud,
    titleEn: "Cloud Based",
    titleSw: "Inatumia Wingu",
    descEn: "Sync across locations",
    descSw: "Sawazisha mahali popote",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function Features() {
  const { language } = useLanguage();

  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            {language === "sw" ? "Vipengele Vyote Unavyohitaji" : "All the Features You Need"}
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            {language === "sw"
              ? "Kila kitu kwa kusimamia biashara yako kwa ufanisi."
              : "Everything you need to run your business efficiently."}
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.titleEn}
              variants={item}
              whileHover={{ scale: 1.03, boxShadow: "0 20px 40px -12px rgba(20, 184, 166, 0.2)" }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-teal-500/30 hover:shadow-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-blue-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 text-white shadow-lg shadow-teal-500/25">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {language === "sw" ? f.titleSw : f.titleEn}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {language === "sw" ? f.descSw : f.descEn}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
