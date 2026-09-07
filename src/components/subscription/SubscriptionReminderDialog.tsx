import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock3, CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useLanguage } from "@/contexts/LanguageContext";

export function SubscriptionReminderDialog() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { subscription, daysRemaining, isBillingLocked, canManageBilling } = useSubscription();
  const [open, setOpen] = useState(false);

  const reminderTarget = useMemo(() => {
    if (!subscription) return null;
    return subscription.current_period_ends_at;
  }, [subscription]);

  const reminderStage = useMemo(() => {
    if (!subscription || !reminderTarget) return null;
    if (isBillingLocked) return "locked";
    if (daysRemaining === 1) return "day-1";
    if (daysRemaining === 3) return "day-3";
    return null;
  }, [subscription, reminderTarget, isBillingLocked, daysRemaining]);

  const reminderStorageKey = useMemo(() => {
    if (!subscription || !reminderTarget || !reminderStage) return null;
    return `subscription-reminder:${subscription.shop_id}:${reminderTarget}:${reminderStage}`;
  }, [subscription, reminderTarget, reminderStage]);

  const shouldOpen = useMemo(() => {
    if (!subscription || !reminderStorageKey || !reminderStage) return false;
    if (typeof window === "undefined") return true;
    return localStorage.getItem(reminderStorageKey) !== "seen";
  }, [subscription, reminderStorageKey, reminderStage]);

  useEffect(() => {
    setOpen(shouldOpen);
  }, [shouldOpen]);

  const dismissReminder = () => {
    if (reminderStorageKey && typeof window !== "undefined") {
      localStorage.setItem(reminderStorageKey, "seen");
    }
    setOpen(false);
  };

  if (!subscription) {
    return null;
  }

  const title = isBillingLocked
    ? language === "sw"
      ? "Usajili umeisha"
      : "Subscription expired"
    : daysRemaining === 1
      ? language === "sw"
        ? "Kesho ndiyo siku ya mwisho"
        : "Your access ends tomorrow"
    : language === "sw"
      ? "Usajili unaisha karibuni"
      : "Subscription ending soon";

  const description = isBillingLocked
    ? language === "sw"
      ? "Lipa usajili wa mwezi (TZS 25,000) ili kuendelea kutumia WiseCash."
      : "Renew your monthly plan (TZS 25,000) to continue using WiseCash."
    : daysRemaining === 1
      ? language === "sw"
        ? "Kesho ndiyo siku ya mwisho ya kipindi chako cha sasa."
        : "Tomorrow is the last day of your current access."
    : language === "sw"
      ? `Zimebaki siku ${Math.max(daysRemaining ?? 0, 0)} kabla ya mpango wako kuisha.`
      : `${Math.max(daysRemaining ?? 0, 0)} day(s) remain before your current access ends.`;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && dismissReminder()}>
      <DialogContent className="rounded-[1.75rem] sm:max-w-lg">
        <DialogHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
            {isBillingLocked ? <AlertTriangle className="h-6 w-6" /> : <Clock3 className="h-6 w-6" />}
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
          {language === "sw"
            ? "Malipo yakithibitishwa, ufikiaji wa duka lako utahuishwa kiotomatiki."
            : "Once payment is verified, your shop access will be active immediately."}
        </div>

        <DialogFooter className="sm:justify-between">
          {!isBillingLocked && (
            <Button variant="ghost" onClick={dismissReminder}>
              {language === "sw" ? "Nikumbushe baadaye" : "Remind me later"}
            </Button>
          )}
          <Button className="gap-2" onClick={() => navigate("/billing")}>
            <CreditCard className="h-4 w-4" />
            {canManageBilling
              ? language === "sw"
                ? "Fungua malipo"
                : "Open billing"
              : language === "sw"
                ? "Ona hali ya usajili"
                : "View subscription"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
