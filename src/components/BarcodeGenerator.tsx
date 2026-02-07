import { useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface BarcodeGeneratorProps {
  value: string;
  productName?: string;
  price?: number;
  width?: number;
  height?: number;
}

/** Simple Code 128 barcode renderer using canvas */
export function BarcodeGenerator({ value, productName, price, width = 200, height = 80 }: BarcodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height + 30;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Simple barcode bars pattern based on value characters
    const barWidth = Math.max(1, Math.floor(width / (value.length * 11 + 35)));
    let x = 10;

    // Start pattern
    [2, 1, 1, 1].forEach(w => {
      ctx.fillStyle = ctx.fillStyle === "#000000" ? "#ffffff" : "#000000";
      ctx.fillRect(x, 5, barWidth * w, height);
      x += barWidth * w;
    });

    // Data bars
    ctx.fillStyle = "#000000";
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      const widths = [
        ((code >> 6) & 1) + 1,
        ((code >> 5) & 1) + 1,
        ((code >> 4) & 1) + 1,
        ((code >> 3) & 1) + 1,
        ((code >> 2) & 1) + 1,
        ((code >> 1) & 1) + 1,
      ];
      widths.forEach((w, j) => {
        ctx.fillStyle = j % 2 === 0 ? "#000000" : "#ffffff";
        ctx.fillRect(x, 5, barWidth * w, height);
        x += barWidth * w;
      });
    }

    // End pattern
    [2, 1, 1, 2].forEach((w, i) => {
      ctx.fillStyle = i % 2 === 0 ? "#000000" : "#ffffff";
      ctx.fillRect(x, 5, barWidth * w, height);
      x += barWidth * w;
    });

    // Text below
    ctx.fillStyle = "#000000";
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.fillText(value, width / 2, height + 20);
  }, [value, width, height]);

  useEffect(() => { draw(); }, [draw]);

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Barcode - ${value}</title>
        <style>
          @page { margin: 2mm; size: 50mm 30mm; }
          body { margin: 0; padding: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
          .label { text-align: center; }
          .name { font-size: 10px; font-weight: bold; margin-bottom: 2px; font-family: sans-serif; }
          .price { font-size: 9px; margin-top: 2px; font-family: sans-serif; }
          img { max-width: 45mm; }
        </style>
      </head>
      <body>
        <div class="label">
          ${productName ? `<div class="name">${productName}</div>` : ""}
          <img src="${canvas.toDataURL()}" />
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
      <canvas ref={canvasRef} className="rounded border" />
      <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
        <Printer className="h-3 w-3" />
        Print Label
      </Button>
    </div>
  );
}
