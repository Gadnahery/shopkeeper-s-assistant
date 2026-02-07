import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, SwitchCamera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setError(null);

      // Use BarcodeDetector API if available
      if ("BarcodeDetector" in window) {
        const detector = new (window as any).BarcodeDetector({
          formats: ["ean_13", "ean_8", "code_128", "code_39", "qr_code", "upc_a", "upc_e"],
        });

        const detect = async () => {
          if (!videoRef.current || videoRef.current.readyState !== 4) {
            requestAnimationFrame(detect);
            return;
          }
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const value = barcodes[0].rawValue;
              onScan(value);
              return;
            }
          } catch {}
          requestAnimationFrame(detect);
        };
        requestAnimationFrame(detect);
      }
    } catch (err: any) {
      setError("Camera access denied. Please allow camera permissions.");
    }
  }, [facingMode, onScan]);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [startCamera]);

  const toggleCamera = () => {
    setFacingMode(f => f === "environment" ? "user" : "environment");
  };

  // Manual barcode input fallback
  const [manualCode, setManualCode] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-black"
    >
      <div className="flex items-center justify-between p-4">
        <h3 className="text-lg font-semibold text-white">Scan Barcode</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={toggleCamera} className="text-white hover:bg-white/20">
            <SwitchCamera className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="relative flex-1">
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
            <Camera className="h-16 w-16 text-white/50" />
            <p className="text-white/80">{error}</p>
            <div className="w-full max-w-xs space-y-3">
              <input
                type="text"
                placeholder="Enter barcode manually"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                className="w-full rounded-lg bg-white/10 px-4 py-3 text-white placeholder:text-white/50"
                autoFocus
              />
              <Button
                className="w-full"
                onClick={() => { if (manualCode) onScan(manualCode); }}
                disabled={!manualCode}
              >
                Submit
              </Button>
            </div>
          </div>
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            {/* Scan overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-48 w-64 rounded-xl border-2 border-white/60">
                <motion.div
                  animate={{ y: [0, 176, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="h-0.5 w-full bg-primary"
                />
              </div>
            </div>
            <p className="absolute bottom-8 left-0 right-0 text-center text-sm text-white/70">
              Align barcode within the frame
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}
