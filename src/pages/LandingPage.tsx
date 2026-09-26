import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { TrustStrip } from "@/components/landing/TrustStrip";
import { ShowcaseSlideshow } from "@/components/landing/ShowcaseSlideshow";
import { ServicesGrid } from "@/components/landing/ServicesGrid";
import { OfflineSection } from "@/components/landing/OfflineSection";
import { BusinessTypes } from "@/components/landing/BusinessTypes";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground selection:bg-emerald-500/20">
      <Navbar />
      <main>
        <Hero />
        <TrustStrip />
        <ShowcaseSlideshow />
        <ServicesGrid />
        <OfflineSection />
        <BusinessTypes />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
