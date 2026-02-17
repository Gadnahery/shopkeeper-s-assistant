import { forwardRef } from "react";
import { Input } from "@/components/ui/input";

interface BarcodeScannerInputProps {
  onScan: (barcode: string) => void;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  "data-testid"?: string;
}

export const BarcodeScannerInput = forwardRef<HTMLInputElement, BarcodeScannerInputProps>(
  function BarcodeScannerInput(
    { onScan, value = "", onChange, placeholder = "Scan or type barcode...", className, ...props },
    ref
  ) {
    return (
      <Input
        ref={ref}
        className={`barcode-scanner-input ${className ?? ""}`.trim()}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (value || (e.target as HTMLInputElement).value)?.trim()) {
            e.preventDefault();
            const barcode = (value || (e.target as HTMLInputElement).value).trim();
            onScan(barcode);
            onChange?.("");
          }
        }}
        autoComplete="off"
        {...props}
      />
    );
  }
);
