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
    descEn: "Fast retail checkout for shops, kiosks, and daily sales",
    descSw: "Malipo ya haraka kwa maduka, vibanda, na mauzo ya kila siku",
  },
  {
    icon: Package,
    titleEn: "Stock Management",
    titleSw: "Udhibiti wa Stoki",
    descEn: "Track inventory, stock movement, and low-stock alerts in real time",
    descSw: "Fuatilia stoki, mabadiliko ya bidhaa, na tahadhari za stoki kwa wakati halisi",
  },
  {
    icon: BarChart3,
    titleEn: "Reports",
    titleSw: "Ripoti",
    descEn: "View sales trends, profit insights, and business performance reports",
    descSw: "Angalia mwenendo wa mauzo, faida, na ripoti za utendaji wa biashara",
  },
  {
    icon: Users,
    titleEn: "Customer Management",
    titleSw: "Usimamizi wa Wateja",
    descEn: "Manage customer history, loyalty, and shop credit records",
    descSw: "Simamia historia ya wateja, uaminifu, na kumbukumbu za mikopo",
  },
  {
    icon: Smartphone,
    titleEn: "Mobile Friendly",
    titleSw: "Inafaa Simu",
    descEn: "Works on phone, tablet, laptop, and installed PWA app",
    descSw: "Inafanya kazi kwenye simu, tablet, laptop, na app iliyowekwa",
  },
  {
    icon: Cloud,
    titleEn: "Cloud Based",
    titleSw: "Inatumia Wingu",
    descEn: "Access your retail software anywhere with cloud sync",
    descSw: "Tumia mfumo wako wa biashara popote kwa usawazishaji wa wingu",
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
              ? "Vipengele muhimu kwa POS, usimamizi wa stoki, ripoti za mauzo, na uendeshaji wa biashara kwenye mfumo mmoja."
              : "Core features for POS, inventory management, sales reports, and day-to-day retail operations in one platform."}
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
              whileHover={{ scale: 1.03, boxShadow: "0 20px 40px -12px rgba(16, 185, 129, 0.2)" }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-teal-500/30 hover:shadow-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 text-white shadow-lg shadow-emerald-500/25">
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
