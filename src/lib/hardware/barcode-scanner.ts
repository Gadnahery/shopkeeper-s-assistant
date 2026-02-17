/**
 * Barcode Scanner - USB HID (keyboard emulation)
 */
export interface BarcodeScanner {
  isConnected: boolean;
  type: 'usb_hid' | 'serial' | 'camera';
  start: () => Promise<void>;
  stop: () => void;
  onScan: (callback: (barcode: string) => void) => void;
}

export class USBHIDScanner implements BarcodeScanner {
  isConnected = false;
  type = 'usb_hid' as const;
  private scanBuffer = '';
  private scanCallback: ((barcode: string) => void) | null = null;
  private scanTimeout: ReturnType<typeof setTimeout> | null = null;
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;

  async start(): Promise<void> {
    this.keydownListener = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && !target.classList.contains('barcode-scanner-input')) return;
      if (e.key === 'Enter') {
        if (this.scanBuffer.length > 0) { this.emitScan(this.scanBuffer); this.scanBuffer = ''; }
      } else if (e.key.length === 1) {
        this.scanBuffer += e.key;
        if (this.scanTimeout) clearTimeout(this.scanTimeout);
        this.scanTimeout = setTimeout(() => { this.scanBuffer = ''; }, 100);
      }
    };
    window.addEventListener('keydown', this.keydownListener);
    this.isConnected = true;
  }

  stop(): void {
    if (this.keydownListener) window.removeEventListener('keydown', this.keydownListener);
    if (this.scanTimeout) clearTimeout(this.scanTimeout);
    this.isConnected = false;
  }

  onScan(callback: (barcode: string) => void): void { this.scanCallback = callback; }
  private emitScan(barcode: string): void { if (this.scanCallback) this.scanCallback(barcode); }
}

export class ScannerManager {
  private scanner: BarcodeScanner | null = null;
  async initialize(): Promise<BarcodeScanner> {
    this.scanner = new USBHIDScanner();
    await this.scanner.start();
    return this.scanner;
  }
  getScanner(): BarcodeScanner | null { return this.scanner; }
  disconnect(): void { if (this.scanner) { this.scanner.stop(); this.scanner = null; } }
}

export const scannerManager = new ScannerManager();
