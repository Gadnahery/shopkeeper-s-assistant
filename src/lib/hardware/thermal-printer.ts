/**
 * Thermal Receipt Printer Integration
 * Supports browser print for thermal and regular printers
 */

export interface PrinterOptions {
  printerName?: string;
  paperWidth: 58 | 80;
  copies: number;
}

export interface ReceiptData {
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
  taxId?: string;
  logoUrl?: string;

  invoiceNumber: string;
  date: string;
  time: string;

  cashier?: string;
  customer?: string;

  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;

  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;

  payments: Array<{
    method: string;
    amount: number;
  }>;

  cashReceived?: number;
  changeGiven?: number;

  footer?: string;
}

export class ThermalPrinter {
  private paperWidth: 58 | 80;
  private charsPerLine: number;

  constructor(paperWidth: 58 | 80 = 80) {
    this.paperWidth = paperWidth;
    this.charsPerLine = paperWidth === 58 ? 32 : 48;
  }

  async printReceipt(
    data: ReceiptData,
    _options: Partial<PrinterOptions> = {}
  ): Promise<void> {
    const html = this.generateReceiptHTML(data);

    const printWindow = window.open("", "", "width=400,height=600");
    if (!printWindow) {
      throw new Error("Could not open print window. Check popup blocker.");
    }

    printWindow.document.write(html);
    printWindow.document.close();

    await new Promise<void>((resolve) => {
      printWindow!.onload = () => resolve();
      setTimeout(resolve, 500);
    });

    printWindow!.focus();
    printWindow!.print();

    setTimeout(() => {
      printWindow!.close();
    }, 100);
  }

  private generateReceiptHTML(data: ReceiptData): string {
    const width = this.paperWidth === 58 ? "58mm" : "80mm";

    const formatMoney = (amount: number) =>
      `Tsh ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

    const truncate = (text: string, len: number) =>
      text.length <= len ? text : text.slice(0, len - 3) + "...";

    const payments =
      data.payments?.length > 0
        ? data.payments
        : [{ method: "Cash", amount: data.total }];

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - ${data.invoiceNumber}</title>
  <style>
    @page { size: ${width} auto; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      font-size: ${this.paperWidth === 58 ? "10px" : "12px"};
      line-height: 1.4;
      padding: 10px;
      width: ${width};
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .large { font-size: ${this.paperWidth === 58 ? "14px" : "16px"}; }
    .separator { border-top: 1px dashed #000; margin: 8px 0; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
    .item-row { display: flex; justify-content: space-between; margin: 4px 0; }
    .item-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 8px; }
    .item-qty { width: 40px; text-align: right; margin-right: 8px; }
    .item-price { width: 60px; text-align: right; }
    .total-row { display: flex; justify-content: space-between; font-weight: bold; margin: 4px 0; }
    .footer { margin-top: 16px; text-align: center; font-size: ${this.paperWidth === 58 ? "9px" : "11px"}; }
    @media print { body { margin: 0; padding: 10px; } }
  </style>
</head>
<body>
  <div class="center">
    ${data.logoUrl ? `<img src="${data.logoUrl}" style="max-width: 80px; margin-bottom: 8px;" />` : ""}
    <div class="bold large">${data.shopName}</div>
    ${data.shopAddress ? `<div>${data.shopAddress}</div>` : ""}
    ${data.shopPhone ? `<div>${data.shopPhone}</div>` : ""}
    ${data.taxId ? `<div>TIN: ${data.taxId}</div>` : ""}
  </div>
  <div class="separator"></div>
  <div class="center">
    <div class="bold large">TAX INVOICE</div>
    <div>Invoice #: ${data.invoiceNumber}</div>
    <div>${data.date} ${data.time}</div>
    ${data.cashier ? `<div>Cashier: ${data.cashier}</div>` : ""}
    ${data.customer ? `<div>Customer: ${data.customer}</div>` : ""}
  </div>
  <div class="separator"></div>
  <div>
    ${data.items
      .map(
        (item) => `
      <div class="item-row">
        <div class="item-name">${truncate(item.name, 20)}</div>
        <div class="item-qty">${item.quantity}x</div>
        <div class="item-price">${formatMoney(item.total)}</div>
      </div>
      ${item.quantity > 1 ? `<div style="font-size: 10px; color: #666; margin-left: 8px;">@ ${formatMoney(item.price)} each</div>` : ""}
    `
      )
      .join("")}
  </div>
  <div class="separator"></div>
  <div>
    <div class="row"><span>SUBTOTAL:</span><span>${formatMoney(data.subtotal)}</span></div>
    ${data.discount ? `<div class="row"><span>DISCOUNT:</span><span>-${formatMoney(data.discount)}</span></div>` : ""}
    ${data.tax ? `<div class="row"><span>TAX:</span><span>${formatMoney(data.tax)}</span></div>` : ""}
    <div class="separator"></div>
    <div class="total-row"><span>TOTAL:</span><span>${formatMoney(data.total)}</span></div>
  </div>
  <div class="separator"></div>
  <div>
    <div class="bold center">PAYMENT</div>
    ${payments.map((p) => `<div class="row"><span>${p.method}:</span><span>${formatMoney(p.amount)}</span></div>`).join("")}
    ${data.cashReceived ? `<div class="row"><span>CASH RECEIVED:</span><span>${formatMoney(data.cashReceived)}</span></div><div class="row bold"><span>CHANGE:</span><span>${formatMoney(data.changeGiven ?? 0)}</span></div>` : ""}
  </div>
  <div class="separator"></div>
  <div class="footer">
    <div>Thank you for your business!</div>
    ${data.footer ? `<div style="margin-top: 8px;">${data.footer}</div>` : ""}
  </div>
  <div style="page-break-after: always;"></div>
</body>
</html>`;
  }

  private formatMoney(amount: number): string {
    return `Tsh ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }

  private truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.slice(0, length - 3) + "...";
  }
}

export const thermalPrinter = new ThermalPrinter(80);
