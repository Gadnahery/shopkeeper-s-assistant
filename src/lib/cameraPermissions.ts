export type CameraPermissionState = PermissionState | "unsupported" | "insecure" | "unavailable" | "unknown";

export type CameraPermissionResult = {
  state: CameraPermissionState;
  errorName?: string;
};

type NavigatorWithPermissions = Navigator & {
  permissions?: {
    query: (descriptor: PermissionDescriptor) => Promise<PermissionStatus>;
  };
};

function getPermissionErrorName(error: unknown) {
  if (error instanceof DOMException) {
    return error.name;
  }

  if (typeof error === "object" && error && "name" in error) {
    const name = (error as { name?: unknown }).name;
    return typeof name === "string" ? name : undefined;
  }

  return undefined;
}

export function mapCameraPermissionError(error: unknown): CameraPermissionResult {
  const errorName = getPermissionErrorName(error);

  switch (errorName) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return { state: "denied", errorName };
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return { state: "unavailable", errorName };
    default:
      return { state: "unknown", errorName };
  }
}

export async function getCameraPermissionState(): Promise<CameraPermissionResult> {
  if (typeof window === "undefined") {
    return { state: "unknown" };
  }

  if (!window.isSecureContext) {
    return { state: "insecure" };
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return { state: "unsupported" };
  }

  const permissions = (navigator as NavigatorWithPermissions).permissions;
  if (!permissions?.query) {
    return { state: "unknown" };
  }

  try {
    const status = await permissions.query({ name: "camera" as PermissionName });
    return { state: status.state };
  } catch {
    return { state: "unknown" };
  }
}

export async function requestCameraPermission(): Promise<CameraPermissionResult> {
  if (typeof window === "undefined") {
    return { state: "unknown" };
  }

  if (!window.isSecureContext) {
    return { state: "insecure" };
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return { state: "unsupported" };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: "environment" },
      },
    });

    stream.getTracks().forEach((track) => track.stop());

    const permission = await getCameraPermissionState();
    return {
      ...permission,
      state: permission.state === "unknown" ? "granted" : permission.state,
    };
  } catch (error) {
    return mapCameraPermissionError(error);
  }
}
