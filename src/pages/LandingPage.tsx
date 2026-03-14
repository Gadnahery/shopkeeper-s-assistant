import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Slideshow } from "@/components/landing/Slideshow";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Pricing } from "@/components/landing/Pricing";
import { About } from "@/components/landing/About";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.10),transparent_30%)] from-emerald-50/70 via-background to-cyan-50/60 dark:from-neutral-950 dark:via-background dark:to-neutral-900/80">
      <Navbar />
      <main>
        <Hero />
        <Slideshow />
        <Features />
        <HowItWorks />
        <Pricing />
        <About />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
