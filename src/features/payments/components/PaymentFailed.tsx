import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  language: "en" | "sw";
  /** Specific reason from API / system */
  message?: string;
  onRetry: () => void;
  onDismiss?: () => void;
};

export function PaymentFailed({ language, message, onRetry, onDismiss }: Props) {
  const isSw = language === "sw";
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[24px] bg-white dark:bg-[#1A1D29] border border-border/40 dark:border-[#2E344A] p-7 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/15">
          <X className="h-7 w-7 text-red-500 dark:text-red-400" strokeWidth={2.5} />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-[#1A1D29] dark:text-white">
          {isSw ? "Malipo hayajakamilika" : "Payment wasn't completed"}
        </h2>
        <p className="mt-2 text-sm text-[#6B7280] dark:text-[#94A3B8]">
          {message
            ? message
            : isSw
              ? "Hujakatozwa na WiseCash. Unaweza kujaribu tena."
              : "You have not been charged by WiseCash. You can try again."}
        </p>
        {!message && (
          <p className="mt-1 text-xs text-[#9CA3AF] dark:text-[#64748B]">
            {isSw
              ? "Ikiwa tatizo linaendelea, wasiliana na msaada."
              : "If this keeps happening, contact support."}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2">
          <Button type="button" className="h-11 rounded-xl bg-[#1A1D29] text-white hover:bg-[#2a2e3d] dark:bg-white dark:text-[#1A1D29] dark:hover:bg-neutral-200" onClick={onRetry}>
            {isSw ? "Jaribu tena" : "Try again"}
          </Button>
          {onDismiss && (
            <button type="button" onClick={onDismiss} className="text-sm text-[#6B7280] dark:text-[#94A3B8] hover:text-[#1A1D29] dark:hover:text-white">
              {isSw ? "Rudi" : "Go back"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
