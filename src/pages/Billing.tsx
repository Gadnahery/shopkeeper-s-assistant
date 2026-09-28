import { useState, useEffect, useMemo } from "react";
import { Loader2, Smartphone, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PaymentWaiting, PaymentSuccess, PaymentFailed } from "@/features/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader } from "@/components/common/PageHeader";
import {
  MANUAL_MONTHLY_PRICE_TZS,
  calculateSubscriptionBreakdown,
} from "@/lib/subscription";
import { cn } from "@/lib/utils";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

/**
 * Simple subscription billing:
 * status → phone → Pay → waiting → success / failed
 * Mobile money only (provider handled server-side).
 */
export default function Billing() {
  const { language } = useLanguage();
  const isSw = language === "sw";
  const {
    subscription,
    latestPayment,
    pendingPayment,
    isLoading,
    canManageBilling,
    daysRemaining,
    renewalDateLabel,
    initiatePayment,
    isInitiatingPayment,
    checkPaymentStatus,
    cancelPayment,
    refreshSubscription,
    isTrialing,
  } = useSubscription();

  const [phone, setPhone] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [outcome, setOutcome] = useState<"idle" | "success" | "failed">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const breakdown = useMemo(
    () =>
      calculateSubscriptionBreakdown({
        basePrice: MANUAL_MONTHLY_PRICE_TZS,
        extraSeats: 0,
        hasReferralDiscount: false,
      }),
    [],
  );

  const amountLabel = formatCurrency(breakdown.total);

  // Resolve waiting from Realtime payment status
  useEffect(() => {
    if (!waiting) return;
    const status = latestPayment?.status;
    if (status === "success") {
      setWaiting(false);
      setOutcome("success");
    } else if (status === "failed" || status === "cancelled" || status === "rejected") {
      setWaiting(false);
      const payMsg = (latestPayment as { message?: string } | null)?.message;
      setErrorMessage(
        payMsg ||
          (isSw
            ? "Malipo yalikataliwa au yameisha muda."
            : "Payment was declined or expired."),
      );
      setOutcome("failed");
    }
  }, [waiting, latestPayment?.status, isSw]);

  // If pending payment exists for this provider and is fresh (< 45s), show waiting; otherwise clean it up
  useEffect(() => {
    if (pendingPayment?.provider === "harakapay" && pendingPayment.status === "pending") {
      const createdAtMs = new Date(String(pendingPayment.created_at)).getTime();
      const ageMs = Date.now() - createdAtMs;
      if (ageMs < 45_000) {
        setWaiting(true);
      } else {
        // If older than 45s, proactively mark it cancelled so it doesn't linger or confuse the UI
        cancelPayment(pendingPayment.id).catch(() => {});
      }
    }
  }, [pendingPayment?.provider, pendingPayment?.status, pendingPayment?.created_at, pendingPayment?.id, cancelPayment]);

  // Active polling of HarakaPay status while waiting (every 3.5s)
  useEffect(() => {
    if (!waiting) return;

    let isMounted = true;
    const paymentIdToCheck = activePaymentId || pendingPayment?.id;

    const interval = setInterval(async () => {
      try {
        const result = await checkPaymentStatus(paymentIdToCheck || undefined);
        if (!isMounted) return;

        if (result.status === "success") {
          setWaiting(false);
          setOutcome("success");
          toast.success(
            isSw
              ? "Malipo yamekamilika! WiseCash Pro imeamilishwa."
              : "Payment confirmed! WiseCash Pro is active.",
          );
        } else if (["failed", "cancelled", "rejected", "expired"].includes(result.status)) {
          setWaiting(false);
          setErrorMessage(
            result.message ||
              (isSw
                ? "Malipo yalighairiwa au hayakukamilika kwenye simu."
                : "Payment was cancelled or failed on your phone."),
          );
          setOutcome("failed");
        }
      } catch {
        // Transient network failures during background poll are ignored
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [waiting, activePaymentId, pendingPayment?.id, isSw, checkPaymentStatus]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageBilling) {
      toast.error(isSw ? "Huna ruhusa ya kulipa" : "You do not have permission to pay");
      return;
    }
    const p = phone.trim();
    if (!p) {
      toast.error(isSw ? "Weka namba ya simu" : "Enter your phone number");
      return;
    }
    try {
      setOutcome("idle");
      setErrorMessage("");
      // Call initiate payment — passes 25,000 TZS
      const res = await initiatePayment({
        provider: "harakapay",
        phoneNumber: p,
      });
      if (res?.payment_id) {
        setActivePaymentId(res.payment_id);
      }
      // If we reach here, HarakaPay accepted the request → show waiting overlay
      setWaiting(true);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : isSw
            ? "Imeshindikana kuanzisha malipo"
            : "Failed to start payment";
      setWaiting(false);
      setErrorMessage(msg);
      setOutcome("failed");
      toast.error(msg);
    }
  };

  const handleCheckAgain = async () => {
    try {
      setIsChecking(true);
      const paymentIdToCheck = activePaymentId || pendingPayment?.id;
      const result = await checkPaymentStatus(paymentIdToCheck || undefined);
      if (result.status === "success") {
        setWaiting(false);
        setOutcome("success");
        toast.success(isSw ? "Malipo yamekamilika!" : "Payment completed!");
      } else if (["failed", "cancelled", "rejected", "expired"].includes(result.status)) {
        setWaiting(false);
        setErrorMessage(
          result.message ||
            (isSw
              ? "Malipo yalighairiwa au hayakukamilika kwenye simu."
              : "Payment was cancelled or failed on your phone."),
        );
        setOutcome("failed");
      } else {
        toast.info(
          isSw
            ? "Muamala bado unashughulikiwa. Weka PIN kwenye simu yako."
            : "Transaction still processing. Enter your PIN on your phone.",
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to verify status");
    } finally {
      setIsChecking(false);
    }
  };

  const handleCancelPayment = async () => {
    try {
      setIsCancelling(true);
      const paymentIdToCancel = activePaymentId || pendingPayment?.id;
      const res = await cancelPayment(paymentIdToCancel || undefined);
      if (res?.status === "success") {
        setWaiting(false);
        setOutcome("success");
        toast.success(
          isSw
            ? "Malipo yamekamilika! WiseCash Pro imeamilishwa."
            : "Payment confirmed! WiseCash Pro is active.",
        );
        return;
      }
      setWaiting(false);
      setOutcome("idle");
      toast.info(isSw ? "Ombi la malipo limeghairiwa." : "Payment request cancelled.");
    } catch {
      // Best effort
      setWaiting(false);
      setOutcome("idle");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleTimeout = async () => {
    try {
      const paymentIdToCancel = activePaymentId || pendingPayment?.id;
      const res = await cancelPayment(paymentIdToCancel || undefined);
      if (res?.status === "success") {
        setWaiting(false);
        setOutcome("success");
        toast.success(
          isSw
            ? "Malipo yamekamilika! WiseCash Pro imeamilishwa."
            : "Payment confirmed! WiseCash Pro is active.",
        );
        return;
      }
    } catch {
      // Best effort
    }
    setWaiting(false);
    setErrorMessage(
      isSw
        ? "Muda wa kuthibitisha kwenye simu umekwisha (sekunde 60) au ombi lilighairiwa. Hujatozwa chochote."
        : "Confirmation window (60s) expired or prompt was cancelled. You were not charged.",
    );
    setOutcome("failed");
  };

  // Immediate status check when user returns to browser tab
  useEffect(() => {
    if (!waiting) return;

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const paymentIdToCheck = activePaymentId || pendingPayment?.id;
        checkPaymentStatus(paymentIdToCheck || undefined)
          .then((res) => {
            if (res.status === "success") {
              setWaiting(false);
              setOutcome("success");
            } else if (["failed", "cancelled", "rejected", "expired"].includes(res.status)) {
              setWaiting(false);
              setErrorMessage(
                res.message ||
                  (isSw
                    ? "Malipo yalighairiwa au hayakukamilika kwenye simu."
                    : "Payment was cancelled or failed on your phone."),
              );
              setOutcome("failed");
            }
          })
          .catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [waiting, activePaymentId, pendingPayment?.id, isSw, checkPaymentStatus]);

  if (isLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isActive = subscription?.status === "active" || isTrialing;
  const isPending = Boolean(pendingPayment);
  const statusLabel = isTrialing
    ? isSw
      ? "Jaribio"
      : "Trial"
    : subscription?.status === "active"
      ? isSw
        ? "Hai"
        : "Active"
      : isPending
        ? isSw
          ? "Inasubiri"
          : "Pending"
        : isSw
          ? "Imeisha"
          : "Expired";

  return (
    <div className="mx-auto max-w-md space-y-6 pb-24">
      <PageHeader
        title={isSw ? "Usajili" : "Billing"}
        description={
          isSw
            ? "Lipa kwa simu ili kuendelea kutumia WiseCash."
            : "Pay by phone to keep using WiseCash."
        }
      />

      {/* Status card */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {isSw ? "Hali" : "Status"}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Badge
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  isActive
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-500/15 text-amber-800 dark:text-amber-200",
                )}
              >
                {statusLabel}
              </Badge>
              {daysRemaining !== null && isActive && (
                <span className="text-xs text-muted-foreground">
                  {isSw ? `Siku ${daysRemaining} zimebaki` : `${daysRemaining} days left`}
                </span>
              )}
            </div>
            {renewalDateLabel && (
              <p className="mt-2 text-xs text-muted-foreground">
                {isSw ? "Inaisha" : "Renews"} · {renewalDateLabel}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => refreshSubscription()}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted"
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 border-t border-border/60 pt-4">
          <p className="text-xs text-muted-foreground">{isSw ? "Kiasi cha mwezi" : "Monthly amount"}</p>
          <p className="mt-0.5 text-3xl font-semibold tracking-tight text-foreground">{amountLabel}</p>
        </div>
      </div>

      {/* Pay form */}
      {canManageBilling ? (
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEF7E6]">
              <Smartphone className="h-5 w-5 text-[#D99A4E]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {isSw ? "Lipa kwa simu" : "Pay by phone"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isSw
                  ? "Weka namba → thibitisha kwenye simu"
                  : "Enter number → approve on your phone"}
              </p>
            </div>
          </div>

          <form onSubmit={handlePay} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {isSw ? "Namba ya simu" : "Phone number"}
              </Label>
              <Input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XXXXXXXX"
                className="h-12 rounded-xl text-base"
                disabled={waiting || isInitiatingPayment}
                autoComplete="tel"
              />
            </div>

            <Button
              type="submit"
              disabled={waiting || isInitiatingPayment || !phone.trim()}
              className="h-12 w-full rounded-xl bg-[#1A1D29] text-base font-semibold text-white hover:bg-[#2a2e3d]"
            >
              {waiting || isInitiatingPayment ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {isSw ? `Lipa ${amountLabel}` : `Pay ${amountLabel}`}
            </Button>

            <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
              {isSw
                ? "Utapokea ombi la malipo kwenye simu. Usilipie mara mbili."
                : "You'll get a payment prompt on your phone. Do not pay twice."}
            </p>
          </form>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/80 bg-muted/30 p-5 text-sm text-muted-foreground">
          {isSw
            ? "Ni mmiliki wa duka tu anayeweza kulipa usajili."
            : "Only the shop owner can pay for the subscription."}
        </div>
      )}

      {/* Overlays */}
      {waiting && (
        <PaymentWaiting
          amountLabel={amountLabel}
          phoneLabel={phone || pendingPayment?.phone_number || "—"}
          language={isSw ? "sw" : "en"}
          onCheckAgain={handleCheckAgain}
          onCancel={handleCancelPayment}
          onTimeout={handleTimeout}
          isChecking={isChecking}
          isCancelling={isCancelling}
        />
      )}
      {outcome === "success" && (
        <PaymentSuccess
          amountLabel={amountLabel}
          language={isSw ? "sw" : "en"}
          onContinue={() => {
            setOutcome("idle");
            refreshSubscription();
          }}
        />
      )}
      {outcome === "failed" && (
        <PaymentFailed
          language={isSw ? "sw" : "en"}
          message={errorMessage}
          onRetry={() => {
            setOutcome("idle");
            setErrorMessage("");
          }}
          onDismiss={() => {
            setOutcome("idle");
            setErrorMessage("");
          }}
        />
      )}
    </div>
  );
}
