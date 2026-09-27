import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  amountLabel: string;
  phoneLabel: string;
  language: "en" | "sw";
  onCancel?: () => void;
  onCheckAgain?: () => void;
};

export function PaymentWaiting({ amountLabel, phoneLabel, language, onCancel, onCheckAgain }: Props) {
  const isSw = language === "sw";
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1A1D29]/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[24px] bg-white p-7 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF7E6]">
          <Loader2 className="h-7 w-7 animate-spin text-[#D99A4E]" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-[#1A1D29]">
          {isSw ? "Inasubiri malipo" : "Waiting for payment"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
          {isSw
            ? "Thibitisha ombi la malipo kwenye simu:"
            : "Approve the mobile-money prompt on:"}
        </p>
        <p className="mt-1 text-base font-semibold text-[#1A1D29]">{phoneLabel}</p>
        <p className="mt-4 text-2xl font-semibold tracking-tight text-[#1A1D29]">{amountLabel}</p>
        <p className="mt-2 text-xs text-[#6B7280]">
          {isSw
            ? "Usilipie tena. Tunakagua kiotomatiki…"
            : "Do not pay again. Checking automatically…"}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          {onCheckAgain && (
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl"
              onClick={onCheckAgain}
            >
              {isSw ? "Angalia tena" : "Check again"}
            </Button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-[#6B7280] hover:text-[#1A1D29]"
            >
              {isSw ? "Ghairi" : "Cancel"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
