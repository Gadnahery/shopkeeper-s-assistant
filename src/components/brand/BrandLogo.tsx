import React from "react";
import { cn } from "@/lib/utils";

/**
 * Core WiseCash Brand Glyph
 * Continuous "W" line with a dot coin above center peak.
 */
export function BrandGlyph({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-5 w-5", className)}
      {...props}
    >
      <path
        d="M4 8 L8.5 17 L12 9.5 L15.5 17 L20 8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="12" cy="4.8" r="1.6" fill="currentColor" />
    </svg>
  );
}

/**
 * Variant A: In-App Sidebar / Header Brand Mark
 * Glyph in --accent inside 32x32 rounded container with background tint, next to wordmark.
 */
export function BrandLogo({
  showWordmark = true,
  className,
  size = "md",
}: {
  showWordmark?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const containerSizes = {
    sm: "h-7 w-7 rounded-md",
    md: "h-8 w-8 rounded-lg",
    lg: "h-10 w-10 rounded-xl",
  };

  const glyphSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex items-center justify-center bg-accent/15 text-accent shadow-xs",
          containerSizes[size],
        )}
      >
        <BrandGlyph className={glyphSizes[size]} />
      </div>
      {showWordmark && (
        <span className={cn("font-bold tracking-tight text-foreground font-sans", textSizes[size])}>
          WiseCash
        </span>
      )}
    </div>
  );
}

/**
 * Variant B: Standalone App Icon
 * Dark rounded square (#1a1d29) with warm amber (#d99a4e) glyph
 */
export function BrandAppIcon({ className, size = 48 }: { className?: string; size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        "flex items-center justify-center rounded-2xl bg-[#1a1d29] text-[#d99a4e] shadow-md",
        className,
      )}
    >
      <BrandGlyph style={{ width: size * 0.55, height: size * 0.55 }} />
    </div>
  );
}
