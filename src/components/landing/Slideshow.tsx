import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Package, BarChart3, Smartphone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const slides = [
  {
    icon: ShoppingCart,
    titleEn: "Fast Sales",
    titleSw: "Fanya Mauzo kwa Haraka",
    descEn: "Complete transactions in seconds",
    descSw: "Kamilisha mauzo kwa sekunde",
    gradient: "from-teal-500 to-teal-700",
  },
  {
    icon: Package,
    titleEn: "Easy Stock Management",
    titleSw: "Simamia Stoki Kiurahisi",
    descEn: "Track inventory in real time",
    descSw: "Fuata stoki kwa wakati halisi",
    gradient: "from-blue-500 to-blue-700",
  },
  {
    icon: BarChart3,
    titleEn: "Detailed Reports",
    titleSw: "Pata Ripoti za Kina",
    descEn: "Understand your business performance",
    descSw: "Fahamu utendaji wa biashara yako",
    gradient: "from-violet-500 to-violet-700",
  },
  {
    icon: Smartphone,
    titleEn: "Work Anywhere",
    titleSw: "Fanya kazi popote",
    descEn: "Cloud-based, works offline",
    descSw: "Inatumia wingu, inafanya kazi nje ya mtandao",
    gradient: "from-cyan-500 to-cyan-700",
  },
];

export function Slideshow() {
  const [index, setIndex] = useState(0);
  const { language } = useLanguage();

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const slide = slides[index];
  const Icon = slide.icon;

  return (
    <section id="slideshow" className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />
      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            {language === "sw" ? "Kwa Nini Smart Money?" : "Why Smart Money?"}
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            {language === "sw"
              ? "Mfumo unaofanya biashara yako kuwa rahisi na yenye ufanisi."
              : "The system that makes your business simple and efficient."}
          </p>
        </motion.div>

        <div className="relative max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -80 }}
              transition={{ duration: 0.5 }}
              className={`rounded-3xl border border-white/20 bg-gradient-to-br ${slide.gradient} p-10 text-white shadow-2xl`}
            >
              <div className="flex flex-col items-center gap-6 md:flex-row md:gap-10">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm"
                >
                  <Icon className="h-12 w-12" />
                </motion.div>
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold md:text-3xl">
                    {language === "sw" ? slide.titleSw : slide.titleEn}
                  </h3>
                  <p className="mt-2 text-white/90">
                    {language === "sw" ? slide.descSw : slide.descEn}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-8 bg-teal-500" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
