import { useEffect } from "react";
import { trackClientError, trackClientEvent } from "@/lib/monitoring";

export function AppTelemetry() {
  useEffect(() => {
    trackClientEvent("info", "app_loaded");

    const handleError = (event: ErrorEvent) => {
      trackClientError(event.error ?? event.message, { source: "window.error" });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      trackClientError(event.reason, { source: "window.unhandledrejection" });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
