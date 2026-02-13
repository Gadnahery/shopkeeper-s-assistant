import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

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
}

interface ReceiptProps {
  data: ReceiptData;
  onClose: () => void;
}

export function Receipt({ data, onClose }: ReceiptProps) {
  const { t, language } = useLanguage();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative max-h-[90vh] w-full max-w-sm overflow-auto rounded-lg bg-white p-6 shadow-xl">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <div ref={receiptRef} className="receipt font-mono text-sm">
          {/* Header */}
          <div className="header mb-4 text-center">
            <div className="shop-name text-lg font-bold">{data.shopName}</div>
            {data.shopPhone && <div className="text-xs text-gray-600">{data.shopPhone}</div>}
            {data.shopAddress && <div className="text-xs text-gray-600">{data.shopAddress}</div>}
            <div className="mt-2 text-xs font-bold uppercase tracking-wider">
              {t("receipt.title")}
            </div>
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
            <div className="font-bold">{t("receipt.thankYou")}</div>
            <div className="mt-1 text-gray-600">{t("receipt.comeAgain")}</div>
          </div>
        </div>

        {/* Print Button */}
        <Button onClick={handlePrint} className="mt-4 w-full gap-2">
          <Printer className="h-4 w-4" />
          {t("sales.printReceipt")}
        </Button>
      </div>
    </div>
  );
}
