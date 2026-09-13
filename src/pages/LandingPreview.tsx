import { Link } from "react-router-dom";
import { Sparkles, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PreviewNavbar } from "@/components/landing/preview/PreviewNavbar";
import { PreviewHero } from "@/components/landing/preview/PreviewHero";
import { PreviewTrustStrip } from "@/components/landing/preview/PreviewTrustStrip";
import { PreviewShowcase } from "@/components/landing/preview/PreviewShowcase";
import { PreviewOffline } from "@/components/landing/preview/PreviewOffline";
import { PreviewBusinessTypes } from "@/components/landing/preview/PreviewBusinessTypes";
import { PreviewPricing } from "@/components/landing/preview/PreviewPricing";
import { PreviewFAQ } from "@/components/landing/preview/PreviewFAQ";
import { PreviewCTA } from "@/components/landing/preview/PreviewCTA";
import { PreviewFooter } from "@/components/landing/preview/PreviewFooter";

export default function LandingPreview() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground selection:bg-primary/20">
      {/* Top Interactive Evaluation Banner */}
      <div className="sticky top-0 z-50 border-b border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            <span className="hidden sm:inline">
              <strong>WiseCash Redesign Preview:</strong> Simpler, product-led SaaS showcase with real UI mockups.
            </span>
            <span className="sm:hidden">
              <strong>Design Preview:</strong> Redesigned WiseCash UI.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-7 rounded-lg border-primary/30 bg-background/80 px-2.5 text-[11px] font-bold text-foreground hover:bg-muted"
            >
              <Link to="/" className="flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" />
                <span>Compare Current Live</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Landing Page Content */}
      <PreviewNavbar />
      <main className="space-y-0">
        <PreviewHero />
        <PreviewTrustStrip />
        <PreviewShowcase />
        <PreviewOffline />
        <PreviewBusinessTypes />
        <PreviewPricing />
        <PreviewFAQ />
        <PreviewCTA />
      </main>
      <PreviewFooter />
    </div>
  );
}
