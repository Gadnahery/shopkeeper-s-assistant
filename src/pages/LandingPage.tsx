import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Slideshow } from "@/components/landing/Slideshow";
import { BusinessTypes } from "@/components/landing/BusinessTypes";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Pricing } from "@/components/landing/Pricing";
import { About } from "@/components/landing/About";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Navbar />
      <main>
        <Hero />
        <Slideshow />
        <BusinessTypes />
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
