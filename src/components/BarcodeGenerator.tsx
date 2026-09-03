import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";

interface BarcodeGeneratorProps {
  value: string;
  productId?: string;
  productName?: string;
  price?: number;
  width?: number;
  height?: number;
  format?: "code128" | "qr";
  type?: "barcode" | "qr" | "code128";
}

/** Barcode (Code 128) or QR Code generator - uses JsBarcode for scannable Code 128 */
export function BarcodeGenerator({
  value,
  productId,
  productName,
  price,
  width = 200,
  height = 80,
  format = "code128",
  type,
}: BarcodeGeneratorProps) {
  const actualFormat = type === "qr" || format === "qr" ? "qr" : "code128";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);

  const qrData = JSON.stringify({ id: productId || value, name: productName || value, code: value });

  useEffect(() => {
    if (actualFormat === "qr" && value) {
      QRCode.toDataURL(qrData, { width: Math.min(200, width), margin: 1 }).then(setQrUrl).catch(() => setQrUrl(null));
    } else {
      setQrUrl(null);
    }
  }, [actualFormat, value, qrData, width]);

  useEffect(() => {
    if (actualFormat !== "code128" || !value || !canvasRef.current) {
      setBarcodeError(null);
      return;
    }
    setBarcodeError(null);
    try {
      JsBarcode(canvasRef.current, value, {
        format: "CODE128",
        width: 2,
        height: Math.max(40, height - 20),
        displayValue: true,
        margin: 12,
        marginTop: 4,
        marginBottom: 4,
        fontOptions: "bold",
        fontSize: 12,
        background: "#ffffff",
        lineColor: "#000000",
      });
    } catch (e) {
      setBarcodeError(e instanceof Error ? e.message : "Invalid barcode value");
    }
  }, [format, value, height]);

  const handlePrint = () => {
    const canvas = canvasRef.current;
    const imgSrc = format === "qr" && qrUrl ? qrUrl : (canvas?.toDataURL() || "");
    if (!imgSrc) return;

    const displayName = (productName || value).replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const html = `<!DOCTYPE html>
      <html>
      <head>
        <title>${format === "qr" ? "QR" : "Barcode"} - ${displayName}</title>
        <style>
          @page { margin: 3mm; size: 80mm 50mm; }
          body { margin: 0; padding: 0; font-family: sans-serif; }
          .label { display: flex; flex-direction: column; align-items: center; justify-content: space-between; width: 74mm; min-height: 44mm; text-align: center; }
          .name { font-size: 11px; font-weight: bold; line-height: 1.2; margin-bottom: 4px; max-width: 100%; overflow-wrap: break-word; }
          .code-wrap { flex: 1; display: flex; align-items: center; justify-content: center; margin: 4px 0; }
          .code-wrap img { max-width: 60mm; max-height: 22mm; object-fit: contain; }
          .price { font-size: 12px; font-weight: bold; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="name">${displayName}</div>
          <div class="code-wrap"><img src="${imgSrc}" alt="${value}" /></div>
          <div class="price">${price != null ? `Tsh ${price.toLocaleString()}` : value}</div>
        </div>
      </body>
      </html>`;

    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:absolute;width:0;height:0;border:none;left:-9999px;top:0;";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }
    doc.open();
    doc.write(html);
    doc.close();

    const printDoc = iframe.contentWindow;
    if (!printDoc) {
      document.body.removeChild(iframe);
      return;
    }

    setTimeout(() => {
      printDoc.focus();
      printDoc.print();
      setTimeout(() => document.body.removeChild(iframe), 500);
    }, 100);
  };

  if (!value) return null;

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {format === "qr" && qrUrl ? (
        <img src={qrUrl} alt="QR Code" className="rounded-[1rem] border border-border/70 bg-white p-2 max-w-[200px]" />
      ) : format === "code128" ? (
        <div className="flex w-full justify-center overflow-hidden rounded-[1rem] border border-border/70 bg-white p-2">
          {barcodeError ? (
            <p className="text-sm text-destructive px-4 py-2">{barcodeError}</p>
          ) : (
            <canvas ref={canvasRef} className="max-w-full h-auto" />
          )}
        </div>
      ) : null}
      <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 rounded-xl" disabled={!!barcodeError}>
        <Printer className="h-3 w-3" />
        Print
      </Button>
    </div>
  );
}
