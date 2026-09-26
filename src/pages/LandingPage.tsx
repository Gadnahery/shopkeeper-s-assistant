import "@/styles/landing.css";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingIntro } from "@/components/landing/LandingIntro";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingSlideshow } from "@/components/landing/LandingSlideshow";
import { LandingOffline } from "@/components/landing/LandingOffline";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingBusinessTypes } from "@/components/landing/LandingBusinessTypes";
import { LandingWhy } from "@/components/landing/LandingWhy";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingCta } from "@/components/landing/LandingCta";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="landing min-h-screen overflow-x-hidden selection:bg-[#D99A4E]/25">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingIntro />
        <LandingFeatures />
        <LandingSlideshow />
        <LandingOffline />
        <LandingHowItWorks />
        <LandingBusinessTypes />
        <LandingWhy />
        <LandingPricing />
        <LandingFaq />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
