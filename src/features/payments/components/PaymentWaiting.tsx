import { useState, useEffect } from "react";
import { Loader2, XCircle, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  amountLabel: string;
  phoneLabel: string;
  language: "en" | "sw";
  onCancel?: () => void;
  onCheckAgain?: () => void;
  onTimeout?: () => void;
  isCancelling?: boolean;
  isChecking?: boolean;
};

export function PaymentWaiting({
  amountLabel,
  phoneLabel,
  language,
  onCancel,
  onCheckAgain,
  onTimeout,
  isCancelling,
  isChecking,
}: Props) {
  const isSw = language === "sw";
  const [secondsLeft, setSecondsLeft] = useState(60);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onTimeout) onTimeout();
      return;
    }
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft, onTimeout]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1A1D29]/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[24px] bg-white p-7 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF7E6]">
          <Loader2 className="h-7 w-7 animate-spin text-[#D99A4E]" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-[#1A1D29]">
          {isSw ? "Inasubiri malipo" : "Waiting for payment"}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[#6B7280]">
          {isSw
            ? "Weka PIN kuthibitisha ombi kwenye simu:"
            : "Enter your PIN on your phone to approve:"}
        </p>
        <p className="mt-1 text-base font-semibold text-[#1A1D29]">{phoneLabel}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-[#1A1D29]">{amountLabel}</p>

        {/* 60-Second Countdown Timer Badge */}
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#F3F4F6] px-3.5 py-1 text-xs font-semibold text-[#4B5563]">
          <Clock className="h-3.5 w-3.5 text-[#D99A4E]" />
          <span>
            {isSw ? "Muda wa ombi:" : "Prompt expires in:"} {secondsLeft}s
          </span>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-[#6B7280]">
          {isSw
            ? "Ukighairi kwenye simu, ukurasa huu utatambua moja kwa moja muda ukiisha au ukibonyeza Ghairi."
            : "If you cancel on your phone, this screen updates automatically or tap Cancel below."}
        </p>

        <div className="mt-5 flex flex-col gap-2.5">
          {onCheckAgain && (
            <Button
              type="button"
              variant="outline"
              disabled={isChecking || isCancelling}
              className="h-11 rounded-xl border-[#E5E7EB] font-medium"
              onClick={onCheckAgain}
            >
              {isChecking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#D99A4E]" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4 text-[#D99A4E]" />
              )}
              {isSw ? "Nimekamilisha (Angalia Hali)" : "I Approved (Check Status)"}
            </Button>
          )}
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              disabled={isCancelling}
              onClick={onCancel}
              className="h-10 rounded-xl text-xs font-medium text-[#DC2626] hover:bg-[#FEE2E2]/60 hover:text-[#B91C1C]"
            >
              {isCancelling ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
              )}
              {isSw ? "Nimeghairi kwenye simu / Ghairi" : "I Cancelled on Phone / Cancel"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
