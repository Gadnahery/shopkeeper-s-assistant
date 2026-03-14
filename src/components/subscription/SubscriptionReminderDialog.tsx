import { useMemo, useState } from "react";
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
  const [dismissed, setDismissed] = useState(false);

  const shouldOpen = useMemo(() => {
    if (!subscription || dismissed) return false;
    if (isBillingLocked) return true;
    return daysRemaining !== null && daysRemaining <= 7;
  }, [subscription, dismissed, isBillingLocked, daysRemaining]);

  if (!subscription) {
    return null;
  }

  const title = isBillingLocked
    ? language === "sw"
      ? "Usajili umeisha"
      : "Subscription expired"
    : language === "sw"
      ? "Usajili unaisha karibuni"
      : "Subscription ending soon";

  const description = isBillingLocked
    ? language === "sw"
      ? "Lipa usajili wa mwezi ili kuendelea kutumia Smart Money."
      : "Renew your monthly plan to continue using Smart Money."
    : language === "sw"
      ? `Zimebaki siku ${Math.max(daysRemaining ?? 0, 0)} kabla ya mpango wako kuisha.`
      : `${Math.max(daysRemaining ?? 0, 0)} day(s) remain before your current access ends.`;

  return (
    <Dialog open={shouldOpen} onOpenChange={(open) => !open && !isBillingLocked && setDismissed(true)}>
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
            ? "Malipo yakithibitishwa na AzamPay, ufikiaji wa duka lako utarejeshwa kiotomatiki."
            : "As soon as AzamPay confirms the payment, your shop access will be restored automatically."}
        </div>

        <DialogFooter className="sm:justify-between">
          {!isBillingLocked && (
            <Button variant="ghost" onClick={() => setDismissed(true)}>
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
