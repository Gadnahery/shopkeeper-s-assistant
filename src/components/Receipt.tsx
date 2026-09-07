import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface ReceiptData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  cashier?: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  mpesaCode?: string;
  shopName: string;
  shopPhone?: string;
  shopAddress?: string;
  /** Custom header text (from shop settings) */
  receiptHeader?: string | null;
  /** Custom footer text (from shop settings) */
  receiptFooter?: string | null;
  /** Shop logo URL (from shop settings) */
  logoUrl?: string | null;
  /** If the sale was recorded in offline mode */
  isOfflinePending?: boolean;
}

interface ReceiptProps {
  data: ReceiptData;
  onClose: () => void;
}

export function Receipt({ data, onClose }: ReceiptProps) {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const receiptRef = useRef<HTMLDivElement>(null);

  const formatNumber = (num: number) => num.toLocaleString("en-US");

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${t("receipt.title")}</title>
        <style>
          @page { margin: 0; size: 80mm auto; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 8px;
            width: 80mm;
            box-sizing: border-box;
          }
          .receipt { max-width: 280px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 12px; }
          .shop-name { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
          .shop-info { font-size: 10px; color: #666; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; margin: 4px 0; }
          .label { font-weight: bold; }
          .items-table { width: 100%; margin: 8px 0; }
          .items-table th { text-align: left; font-size: 10px; border-bottom: 1px solid #000; padding: 4px 0; }
          .items-table td { padding: 4px 0; font-size: 11px; }
          .items-table .qty { width: 30px; text-align: center; }
          .items-table .price { text-align: right; }
          .items-table .total { text-align: right; font-weight: bold; }
          .totals { margin-top: 12px; }
          .grand-total { font-size: 14px; font-weight: bold; margin-top: 8px; }
          .footer { text-align: center; margin-top: 16px; font-size: 11px; }
          .thank-you { font-weight: bold; margin-bottom: 4px; }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-auto rounded-[1.5rem] border border-border/70 bg-background/95 p-4 shadow-2xl sm:p-6">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className={theme === "dark" ? "rounded-[1.35rem] border border-white/10 bg-slate-950/70 p-3" : "rounded-[1.35rem] border border-border/70 bg-muted/30 p-3"}>
        <div
          ref={receiptRef}
          className="receipt rounded-[1.1rem] border border-slate-200 bg-white p-5 font-mono text-sm text-slate-900 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.45)]"
        >
          {/* Header */}
          <div className="header mb-4 text-center">
            {data.receiptHeader && (
              <div className="receipt-custom-header mb-2 whitespace-pre-wrap text-xs text-gray-700">
                {data.receiptHeader}
              </div>
            )}
            {data.logoUrl && (
              <img
                src={data.logoUrl}
                alt="Logo"
                className="mx-auto mb-2 max-h-16 w-auto object-contain"
              />
            )}
            <div className="shop-name text-lg font-bold">{data.shopName}</div>
            {data.shopPhone && <div className="text-xs text-gray-600">{data.shopPhone}</div>}
            {data.shopAddress && <div className="text-xs text-gray-600">{data.shopAddress}</div>}
            <div className="mt-2 text-xs font-bold uppercase tracking-wider">
              {t("receipt.title")}
            </div>
            {data.isOfflinePending && (
              <div className="mt-1.5 inline-block rounded-md bg-amber-100 dark:bg-amber-900/40 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-200 uppercase">
                ⚡ {language === "sw" ? "Mauzo ya Bila Mtandao (Yatasawazishwa)" : "Offline Sale (Will Auto-Sync)"}
              </div>
            )}
          </div>

          <div className="divider my-2 border-t border-dashed border-gray-400" />

          {/* Invoice Info */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>{t("receipt.invoice")}:</span>
              <span className="font-bold">{data.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("receipt.date")}:</span>
              <span>{data.date}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("receipt.customer")}:</span>
              <span>{data.customerName}</span>
            </div>
            {data.cashier && (
              <div className="flex justify-between">
                <span>{t("receipt.cashier")}:</span>
                <span>{data.cashier}</span>
              </div>
            )}
          </div>

          <div className="divider my-2 border-t border-dashed border-gray-400" />

          {/* Items Table */}
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="py-1 text-left">{t("receipt.qty")}</th>
                <th className="py-1 text-left">{t("receipt.item")}</th>
                <th className="py-1 text-right">{t("receipt.price")}</th>
                <th className="py-1 text-right">{t("receipt.total")}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index}>
                  <td className="py-1 text-center">{item.quantity}</td>
                  <td className="py-1">{item.name}</td>
                  <td className="py-1 text-right">{formatNumber(item.price)}</td>
                  <td className="py-1 text-right font-medium">{formatNumber(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="divider my-2 border-t border-dashed border-gray-400" />

          {/* Totals */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>{t("receipt.subtotal")}:</span>
              <span>{formatNumber(data.subtotal)}</span>
            </div>
            {data.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>{t("receipt.discount")}:</span>
                <span>-{formatNumber(data.discount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 text-base font-bold">
              <span>{t("receipt.grandTotal")}:</span>
              <span>Tsh {formatNumber(data.total)}</span>
            </div>
          </div>

          <div className="divider my-2 border-t border-dashed border-gray-400" />

          {/* Payment Info */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>{t("receipt.paymentMethod")}:</span>
              <span className="font-bold">{data.paymentMethod}</span>
            </div>
            {data.mpesaCode && (
              <div className="flex justify-between">
                <span>{t("receipt.mpesaCode")}:</span>
                <span className="font-bold">{data.mpesaCode}</span>
              </div>
            )}
          </div>

          <div className="divider my-2 border-t border-dashed border-gray-400" />

          {/* Footer */}
          <div className="mt-4 text-center text-xs">
            {data.receiptFooter ? (
              <div className="whitespace-pre-wrap text-gray-700">{data.receiptFooter}</div>
            ) : (
              <>
                <div className="font-bold">{t("receipt.thankYou")}</div>
                <div className="mt-1 text-gray-600">{t("receipt.comeAgain")}</div>
              </>
            )}
          </div>
        </div>
        </div>

        {/* Print Button */}
        <Button onClick={handlePrint} className="mt-4 w-full gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90">
          <Printer className="h-4 w-4 text-accent" />
          {t("sales.printReceipt")}
        </Button>
      </div>
    </div>
  );
}
