import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Slideshow } from "@/components/landing/Slideshow";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Pricing } from "@/components/landing/Pricing";
import { About } from "@/components/landing/About";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/80 via-background to-slate-100/60 dark:from-neutral-950 dark:via-background dark:to-neutral-900/80">
      <Navbar />
      <main>
        <Hero />
        <Slideshow />
        <Features />
        <HowItWorks />
        <Pricing />
        <About />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
