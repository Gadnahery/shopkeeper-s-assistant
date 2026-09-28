import { useState, useEffect, useRef } from "react";
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
  const endTimeRef = useRef<number>(Date.now() + 60_000);
  const hasTimedOutRef = useRef(false);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    const updateCountdown = () => {
      const remainingMs = endTimeRef.current - Date.now();
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
      setSecondsLeft(remainingSec);

      if (remainingSec <= 0 && !hasTimedOutRef.current) {
        hasTimedOutRef.current = true;
        onTimeoutRef.current?.();
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[24px] bg-white dark:bg-[#1A1D29] border border-border/40 dark:border-[#2E344A] p-7 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF7E6] dark:bg-[#D99A4E]/15">
          <Loader2 className="h-7 w-7 animate-spin text-[#D99A4E]" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-[#1A1D29] dark:text-white">
          {isSw ? "Inasubiri malipo" : "Waiting for payment"}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[#6B7280] dark:text-[#94A3B8]">
          {isSw
            ? "Weka PIN kuthibitisha ombi kwenye simu:"
            : "Enter your PIN on your phone to approve:"}
        </p>
        <p className="mt-1 text-base font-semibold text-[#1A1D29] dark:text-white">{phoneLabel}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-[#1A1D29] dark:text-white">{amountLabel}</p>

        {/* 60-Second Countdown Timer Badge */}
        <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-[#F3F4F6] dark:bg-[#282E42] border border-border/40 dark:border-[#374151] px-3.5 py-1 text-xs font-semibold text-[#4B5563] dark:text-[#CBD5E1]">
          <Clock className="h-3.5 w-3.5 text-[#D99A4E]" />
          <span>
            {isSw ? "Muda uliobaki:" : "Expires in:"} {secondsLeft}s
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          {onCheckAgain && (
            <Button
              type="button"
              disabled={isChecking || isCancelling}
              className="h-11 w-full rounded-xl border border-[#E5E7EB] dark:border-[#374151] bg-[#F9FAFB] dark:bg-[#282E42] text-[#1A1D29] dark:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#323952] font-semibold text-sm transition-colors shadow-xs"
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
              className="h-10 rounded-xl text-xs font-semibold text-[#DC2626] dark:text-[#F87171] hover:bg-[#FEE2E2]/60 dark:hover:bg-[#EF4444]/15 hover:text-[#B91C1C] dark:hover:text-[#FCA5A5]"
            >
              {isCancelling ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-[#DC2626] dark:text-[#F87171]" />
              ) : (
                <XCircle className="mr-1.5 h-3.5 w-3.5 text-[#DC2626] dark:text-[#F87171]" />
              )}
              {isSw ? "Ghairi" : "Cancel"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
