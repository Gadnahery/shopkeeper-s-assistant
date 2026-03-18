import * as React from "react";

export const MOBILE_BREAKPOINT = 768;
export const DESKTOP_BREAKPOINT = 1280;

export type AdaptiveLayout = "mobile" | "tablet" | "desktop";

function resolveLayout(width: number): AdaptiveLayout {
  if (width < MOBILE_BREAKPOINT) return "mobile";
  if (width < DESKTOP_BREAKPOINT) return "tablet";
  return "desktop";
}

export function useAdaptiveLayout() {
  const [width, setWidth] = React.useState(() =>
    typeof window !== "undefined" ? window.innerWidth : DESKTOP_BREAKPOINT,
  );

  React.useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const layout = resolveLayout(width);

  return {
    width,
    layout,
    isMobile: layout === "mobile",
    isTablet: layout === "tablet",
    isDesktop: layout === "desktop",
  };
}
