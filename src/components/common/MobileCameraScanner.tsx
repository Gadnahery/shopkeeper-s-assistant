import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Camera, Loader2, ScanLine, Upload, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  type CameraPermissionState,
  mapCameraPermissionError,
  requestCameraPermission,
} from "@/lib/cameraPermissions";

type MobileCameraScannerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetected: (value: string) => void;
};

type BarcodeDetectorResult = { rawValue: string };
type BarcodeDetectorClass = {
  new (options?: { formats?: string[] }): {
    detect: (source: ImageBitmapSource) => Promise<BarcodeDetectorResult[]>;
  };
  getSupportedFormats?: () => Promise<string[]>;
};

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorClass;
  }
}

type Html5QrcodeModule = typeof import("html5-qrcode");
type Html5QrcodeInstance = import("html5-qrcode").Html5Qrcode;

export function MobileCameraScanner({ open, onOpenChange, onDetected }: MobileCameraScannerProps) {
  const { language } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<InstanceType<BarcodeDetectorClass> | null>(null);
  const fallbackScannerRef = useRef<Html5QrcodeInstance | null>(null);
  const scannerRegionId = useId().replace(/:/g, "-");

  const [scannerMode, setScannerMode] = useState<"native" | "fallback" | null>(null);
  const [status, setStatus] = useState<"idle" | "starting" | "ready" | "unsupported" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [cameraPermissionState, setCameraPermissionState] = useState<CameraPermissionState>("unknown");
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingFile(true);
    setErrorMessage("");
    try {
      const { Html5Qrcode } = (await import("html5-qrcode")) as unknown as Html5QrcodeModule;
      const scanner = new Html5Qrcode(scannerRegionId);
      const decoded = await scanner.scanFile(file, false);
      if (decoded) {
        onDetected(decoded);
        onOpenChange(false);
      }
    } catch {
      setErrorMessage(
        language === "sw"
          ? "Barcode haikutambuliwa kwenye picha hii. Jaribu picha ya karibu zaidi yenye mwanga mzuri."
          : "No barcode detected in this image. Please take a closer photo with good lighting."
      );
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const copy = useMemo(
    () => ({
      title: language === "sw" ? "Skani kwa kamera" : "Scan with camera",
      description:
        language === "sw"
          ? "Elekeza kamera kwenye barcode au QR code. Ukisomwa, bidhaa itaongezwa moja kwa moja."
          : "Point the camera at a barcode or QR code. Once detected, the item will be added automatically.",
      unsupported:
        language === "sw"
          ? "Kifaa au kivinjari hiki hakiungi mkono skani ya kamera."
          : "This device or browser does not support camera scanning.",
      fallback:
        language === "sw"
          ? "Inatumia njia ya ziada ya skani kwa simu za zamani."
          : "Using a broader scanner mode for older mobile browsers.",
      permission:
        language === "sw"
          ? "Imeshindikana kufungua kamera. Ruhusu matumizi ya kamera kisha ujaribu tena."
          : "Could not access the camera. Allow camera access and try again.",
      permissionDenied:
        language === "sw"
          ? "Kamera imezuiwa. Fungua ruhusa ya kamera kwenye browser au kwenye settings za simu, kisha rudi ujaribu tena."
          : "Camera access is blocked. Allow camera access in your browser or phone app settings, then try again.",
      insecure:
        language === "sw"
          ? "Kamera inahitaji app ifunguliwe kwenye muunganisho salama wa HTTPS."
          : "Camera access requires the app to be opened on a secure HTTPS connection.",
      unavailable:
        language === "sw"
          ? "Hakuna kamera inayopatikana, au kamera inatumiwa na app nyingine."
          : "No camera is available, or the camera is busy in another app.",
      close: language === "sw" ? "Funga" : "Close",
      opening: language === "sw" ? "Inafungua kamera..." : "Opening camera...",
      hint: language === "sw" ? "Lenga barcode au QR code ndani ya fremu." : "Keep the barcode or QR code inside the frame.",
      allow: language === "sw" ? "Ruhusu kamera" : "Allow camera",
      retry: language === "sw" ? "Jaribu tena" : "Try again",
      snapPhoto: language === "sw" ? "Piga picha ya barcode" : "Upload / Snap photo",
      processingPhoto: language === "sw" ? "Inasoma picha..." : "Scanning photo...",
      settingsHelp:
        language === "sw"
          ? "Ikiwa imekataliwa tayari, fungua settings za simu > app/browser > Permissions > Camera, halafu weka Allow."
          : "If access was denied before, open your phone settings or browser site settings and set Camera to Allow.",
    }),
    [language],
  );

  const getCameraErrorMessage = useCallback(
    (permissionState: CameraPermissionState, fallbackMessage?: string) => {
      switch (permissionState) {
        case "denied":
          return copy.permissionDenied;
        case "insecure":
          return copy.insecure;
        case "unavailable":
          return copy.unavailable;
        default:
          return fallbackMessage || copy.permission;
      }
    },
    [copy.insecure, copy.permission, copy.permissionDenied, copy.unavailable],
  );

  const stopScanner = useCallback(async () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    detectorRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (fallbackScannerRef.current) {
      try {
        if (fallbackScannerRef.current.isScanning) {
          await fallbackScannerRef.current.stop();
        }
      } catch {
        // Ignore stop failures during teardown and clear the region.
      }

      try {
        fallbackScannerRef.current.clear();
      } catch {
        // Ignore DOM cleanup errors if the dialog already unmounted.
      }

      fallbackScannerRef.current = null;
    }

    setScannerMode(null);
  }, []);

  const detectLoop = useCallback(async () => {
    const video = videoRef.current;
    const detector = detectorRef.current;

    if (!video || !detector || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(() => {
        void detectLoop();
      });
      return;
    }

    try {
      const results = await detector.detect(video);
      const code = results.find((result) => result.rawValue)?.rawValue;

      if (code) {
        onDetected(code);
        onOpenChange(false);
        return;
      }
    } catch {
      // Ignore transient detect errors and keep scanning.
    }

    rafRef.current = requestAnimationFrame(() => {
      void detectLoop();
    });
  }, [onDetected, onOpenChange]);

  const startFallbackScanner = useCallback(async () => {
    const module = (await import("html5-qrcode")) as Html5QrcodeModule;
    const { Html5Qrcode, Html5QrcodeSupportedFormats } = module;

    const scanner = new Html5Qrcode(
      scannerRegionId,
      {
        verbose: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
        useBarCodeDetectorIfSupported: false,
      },
    );

    fallbackScannerRef.current = scanner;
    setScannerMode("fallback");

    await scanner.start(
      { facingMode: { ideal: "environment" } },
      {
        fps: 10,
        qrbox: { width: 280, height: 280 },
        aspectRatio: 1,
        disableFlip: false,
      },
      (decodedText) => {
        onDetected(decodedText);
        onOpenChange(false);
      },
      () => {
        // Ignore scan misses while the camera keeps scanning.
      },
    );
  }, [onDetected, onOpenChange, scannerRegionId]);

  const startScanner = useCallback(async () => {
    setErrorMessage("");
    setStatus("starting");
    setCameraPermissionState("unknown");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraPermissionState("unsupported");
      setStatus("unsupported");
      return;
    }

    try {
      const permissionResult = await requestCameraPermission();
      setCameraPermissionState(permissionResult.state);

      if (permissionResult.state === "denied" || permissionResult.state === "insecure" || permissionResult.state === "unavailable") {
        setStatus("error");
        setErrorMessage(getCameraErrorMessage(permissionResult.state));
        return;
      }

      if (permissionResult.state === "unsupported") {
        setStatus("unsupported");
        return;
      }

      if (!window.BarcodeDetector) {
        await startFallbackScanner();
        setStatus("ready");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
        },
      });

      streamRef.current = stream;

      const formats = window.BarcodeDetector.getSupportedFormats
        ? await window.BarcodeDetector.getSupportedFormats()
        : [];

      const preferredFormats = ["qr_code", "ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e"];
      const supportedFormats = formats.length
        ? preferredFormats.filter((format) => formats.includes(format))
        : preferredFormats;

      detectorRef.current = new window.BarcodeDetector({
        formats: supportedFormats.length ? supportedFormats : undefined,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setScannerMode("native");
      setStatus("ready");
      rafRef.current = requestAnimationFrame(() => {
        void detectLoop();
      });
    } catch (error) {
      const mappedError = mapCameraPermissionError(error);
      setCameraPermissionState(mappedError.state);

      try {
        await stopScanner();

        if (navigator.mediaDevices?.getUserMedia && mappedError.state !== "denied" && mappedError.state !== "insecure") {
          await startFallbackScanner();
          setStatus("ready");
          return;
        }
      } catch (fallbackError) {
        const mappedFallbackError = mapCameraPermissionError(fallbackError);
        setCameraPermissionState(mappedFallbackError.state);
        setStatus("error");
        setErrorMessage(getCameraErrorMessage(mappedFallbackError.state, (fallbackError as Error)?.message));
        return;
      }

      setStatus("error");
      setErrorMessage(getCameraErrorMessage(mappedError.state, (error as Error)?.message));
    }
  }, [detectLoop, getCameraErrorMessage, startFallbackScanner, stopScanner]);

  useEffect(() => {
    if (!open) {
      void stopScanner();
      return;
    }

    void startScanner();

    return () => {
      void stopScanner();
    };
  }, [open, startScanner, stopScanner]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[1.5rem] border-border/70 p-0 sm:rounded-[1.75rem]">
        <DialogHeader className="space-y-2 px-5 pb-0 pt-5 text-left">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            {copy.title}
          </DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-5">
          <div className="overflow-hidden rounded-[1.35rem] border border-border/70 bg-black">
            <div className="relative aspect-[3/4] w-full">
              <div
                id={scannerRegionId}
                className={`h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover [&>div]:h-full [&>div]:w-full ${
                  scannerMode === "fallback" ? "block" : "hidden"
                }`}
              />
              <video
                ref={videoRef}
                className={`h-full w-full object-cover ${scannerMode === "fallback" ? "hidden" : "block"}`}
                muted
                playsInline
                autoPlay
              />

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-[58%] w-[78%] rounded-[1.6rem] border-2 border-white/85 shadow-[0_0_0_9999px_rgba(0,0,0,0.26)]" />
              </div>

              <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
                <div className="rounded-full bg-black/55 px-3 py-1.5 text-xs text-white">
                  {status === "starting"
                    ? copy.opening
                    : scannerMode === "fallback"
                    ? copy.fallback
                    : copy.hint}
                </div>
              </div>
            </div>
          </div>

          {status === "starting" ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              {copy.opening}
            </div>
          ) : null}

          {status === "unsupported" ? (
            <div className="mt-4 flex items-start gap-2 rounded-[1rem] border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{copy.unsupported}</span>
            </div>
          ) : null}

          {status === "error" ? (
            <div className="mt-4 flex items-start gap-2 rounded-[1rem] border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-1">
                <p>{errorMessage || copy.permission}</p>
                {cameraPermissionState === "denied" ? <p className="text-xs text-destructive/90">{copy.settingsHelp}</p> : null}
              </div>
            </div>
          ) : null}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
          />

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              type="button"
              disabled={isProcessingFile}
              className="h-11 flex-1 gap-2 rounded-xl border-border bg-card text-xs font-semibold text-foreground shadow-xs hover:bg-muted"
              onClick={() => fileInputRef.current?.click()}
            >
              {isProcessingFile ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>{isProcessingFile ? copy.processingPhoto : copy.snapPhoto}</span>
            </Button>

            {status !== "ready" && status !== "starting" ? (
              <Button
                type="button"
                className="h-11 flex-1 gap-2 rounded-xl bg-neutral-950 text-xs font-semibold text-white shadow-xs hover:bg-neutral-900 dark:bg-white dark:text-neutral-950"
                onClick={() => void startScanner()}
              >
                <ScanLine className="h-4 w-4" />
                {cameraPermissionState === "denied" || cameraPermissionState === "prompt" || cameraPermissionState === "unknown" ? copy.allow : copy.retry}
              </Button>
            ) : (
              <Button
                variant="outline"
                type="button"
                className="h-11 flex-1 rounded-xl border-border text-xs"
                onClick={() => onOpenChange(false)}
              >
                {copy.close}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
