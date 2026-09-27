import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  amountLabel: string;
  language: "en" | "sw";
  onContinue: () => void;
  onViewReceipt?: () => void;
};

export function PaymentSuccess({ amountLabel, language, onContinue, onViewReceipt }: Props) {
  const isSw = language === "sw";
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1A1D29]/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[24px] bg-white p-7 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <Check className="h-7 w-7 text-emerald-600" strokeWidth={2.5} />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-[#1A1D29]">
          {isSw ? "Malipo yamefanikiwa" : "Payment successful"}
        </h2>
        <p className="mt-3 text-2xl font-semibold text-[#1A1D29]">{amountLabel}</p>
        <div className="mt-6 flex flex-col gap-2">
          {onViewReceipt && (
            <Button type="button" className="h-11 rounded-xl bg-[#1A1D29] hover:bg-[#2a2e3d]" onClick={onViewReceipt}>
              {isSw ? "Angalia risiti" : "View receipt"}
            </Button>
          )}
          <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={onContinue}>
            {isSw ? "Endelea" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
