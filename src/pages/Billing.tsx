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
    refreshSubscription,
    isTrialing,
  } = useSubscription();

  const [phone, setPhone] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [outcome, setOutcome] = useState<"idle" | "success" | "failed">("idle");

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
      setOutcome("failed");
    }
  }, [waiting, latestPayment?.status]);

  // If pending payment exists for this provider, show waiting
  useEffect(() => {
    if (pendingPayment?.provider === "harakapay" && pendingPayment.status === "pending") {
      setWaiting(true);
    }
  }, [pendingPayment?.provider, pendingPayment?.status]);

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
      setWaiting(true);
      await initiatePayment({
        provider: "harakapay",
        phoneNumber: p,
      });
    } catch (err) {
      setWaiting(false);
      setOutcome("failed");
      toast.error(err instanceof Error ? err.message : isSw ? "Imeshindikana kuanzisha malipo" : "Failed to start payment");
    }
  };

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
          phoneLabel={phone || "—"}
          language={isSw ? "sw" : "en"}
          onCheckAgain={() => refreshSubscription()}
          onCancel={() => setWaiting(false)}
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
          onRetry={() => setOutcome("idle")}
          onDismiss={() => setOutcome("idle")}
        />
      )}
    </div>
  );
}
