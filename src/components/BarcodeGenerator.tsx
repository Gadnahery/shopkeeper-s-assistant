import { useRef, useEffect, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import QRCode from "qrcode";

interface BarcodeGeneratorProps {
  value: string;
  productId?: string;
  productName?: string;
  price?: number;
  width?: number;
  height?: number;
  format?: "code128" | "qr";
}

/** Barcode (Code 128) or QR Code generator - contains product ID and name, printable */
export function BarcodeGenerator({ value, productId, productName, price, width = 200, height = 80, format = "code128" }: BarcodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const qrData = JSON.stringify({ id: productId || value, name: productName || value, code: value });

  useEffect(() => {
    if (format === "qr" && value) {
      QRCode.toDataURL(qrData, { width: Math.min(200, width), margin: 1 }).then(setQrUrl).catch(() => setQrUrl(null));
    } else {
      setQrUrl(null);
    }
  }, [format, value, qrData, width]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value || format !== "code128") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height + 30;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = Math.max(1, Math.floor(width / (value.length * 11 + 35)));
    let x = 10;

    [2, 1, 1, 1].forEach(w => {
      ctx.fillStyle = ctx.fillStyle === "#000000" ? "#ffffff" : "#000000";
      ctx.fillRect(x, 5, barWidth * w, height);
      x += barWidth * w;
    });

    ctx.fillStyle = "#000000";
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      const widths = [((code >> 6) & 1) + 1, ((code >> 5) & 1) + 1, ((code >> 4) & 1) + 1, ((code >> 3) & 1) + 1, ((code >> 2) & 1) + 1, ((code >> 1) & 1) + 1];
      widths.forEach((w, j) => {
        ctx.fillStyle = j % 2 === 0 ? "#000000" : "#ffffff";
        ctx.fillRect(x, 5, barWidth * w, height);
        x += barWidth * w;
      });
    }

    [2, 1, 1, 2].forEach((w, i) => {
      ctx.fillStyle = i % 2 === 0 ? "#000000" : "#ffffff";
      ctx.fillRect(x, 5, barWidth * w, height);
      x += barWidth * w;
    });

    ctx.fillStyle = "#000000";
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.fillText(value, width / 2, height + 20);
  }, [value, width, height, format]);

  useEffect(() => { draw(); }, [draw]);

  const handlePrint = () => {
    const canvas = canvasRef.current;
    const imgSrc = format === "qr" && qrUrl ? qrUrl : (canvas?.toDataURL() || "");

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${format === "qr" ? "QR" : "Barcode"} - ${value}</title>
        <style>
          @page { margin: 2mm; size: 50mm 30mm; }
          body { margin: 0; padding: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; }
          .label { text-align: center; }
          .name { font-size: 10px; font-weight: bold; margin-bottom: 2px; }
          .price { font-size: 9px; margin-top: 2px; }
          img { max-width: 45mm; max-height: 25mm; }
        </style>
      </head>
      <body>
        <div class="label">
          ${productName ? `<div class="name">${productName}</div>` : ""}
          <img src="${imgSrc}" alt="${value}" />
          ${price ? `<div class="price">Tsh ${price.toLocaleString()}</div>` : ""}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  if (!value) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      {format === "qr" && qrUrl ? (
        <img src={qrUrl} alt="QR Code" className="rounded border max-w-[200px]" />
      ) : (
        <canvas ref={canvasRef} className="rounded border" />
      )}
      <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
        <Printer className="h-3 w-3" />
        Print
      </Button>
    </div>
  );
}
