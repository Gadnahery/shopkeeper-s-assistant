type LogLevel = "info" | "warn" | "error";

const endpoint = import.meta.env.VITE_MONITORING_ENDPOINT as string | undefined;

type MonitoringPayload = {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  path?: string;
  userAgent?: string;
  timestamp: string;
};

function send(payload: MonitoringPayload) {
  if (!endpoint || typeof navigator === "undefined") {
    return;
  }

  const body = JSON.stringify(payload);
  navigator.sendBeacon?.(endpoint, body);
}

export function trackClientEvent(level: LogLevel, message: string, context?: Record<string, unknown>) {
  send({
    level,
    message,
    context,
    path: typeof window !== "undefined" ? window.location.pathname : undefined,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    timestamp: new Date().toISOString(),
  });
}

export function trackClientError(error: unknown, context?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  trackClientEvent("error", message, {
    ...context,
    stack: error instanceof Error ? error.stack : undefined,
  });
}
