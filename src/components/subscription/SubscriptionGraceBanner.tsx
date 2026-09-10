import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Clock, X, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsPlatformAdmin } from "@/hooks/usePlatformAdmin";

const DISMISS_STORAGE_KEY = "wisecash_grace_banner_dismissed_at";
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export const SubscriptionGraceBanner: React.FC = () => {
  const { isBillingLocked, isTrialing, daysRemaining, subscription, paymentAmount } = useSubscription();
  const { data: isPlatformAdmin } = useIsPlatformAdmin();
  const { language } = useLanguage();
  const [isDismissed, setIsDismissed] = useState<boolean>(true);
  const formattedPrice = (paymentAmount && paymentAmount !== 10000 ? paymentAmount : 25000).toLocaleString();

  useEffect(() => {
    try {
      const dismissedAt = localStorage.getItem(DISMISS_STORAGE_KEY);
      if (dismissedAt) {
        const timePassed = Date.now() - parseInt(dismissedAt, 10);
        if (timePassed < DISMISS_DURATION_MS) {
          setIsDismissed(true);
          return;
        }
      }
      setIsDismissed(false);
    } catch {
      setIsDismissed(false);
    }
  }, []);

  // Platform admin doesn't need to see the grace banner for themselves
  if (isPlatformAdmin) return null;

  // New users, trialing accounts, or pending free trials must NEVER see the locked banner
  if (isTrialing || subscription?.status === "trialing" || subscription?.status === "pending") {
    return null;
  }

  // If subscription is still active or in positive grace period, don't show locked
  if (daysRemaining !== null && daysRemaining > 0 && subscription?.status === "active") {
    // Proceed to grace/expiring check below
  } else if (isBillingLocked) {
    return (
      <div
        className="w-full bg-destructive text-destructive-foreground px-4 py-2.5 shadow-md flex items-center justify-between flex-wrap gap-2 text-sm z-50 animate-in fade-in duration-300"
        role="alert"
      >
        <div className="flex items-center gap-2 max-w-3xl">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" />
          <span>
            {language === "sw" ? (
              <>
                <strong>Usajili Unahitajika:</strong> WiseCash inahitaji usajili wa kila mwezi (TZS {formattedPrice}). Uandikaji wa mauzo na stoki umesitishwa mpaka uamilishe.
              </>
            ) : (
              <>
                <strong>Subscription Required:</strong> WiseCash requires an active subscription (TZS {formattedPrice}/mo). Data creation is locked until activated.
              </>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Button
            asChild
            size="sm"
            variant="secondary"
            className="h-8 font-semibold text-xs bg-white text-destructive hover:bg-white/90"
          >
            <Link to="/billing">
              {language === "sw" ? "Amilisha Sasa" : "Activate Now"}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // If dismissed, don't show the warning/grace banner
  if (isDismissed) return null;

  // Case 2: Transition Grace Period or nearing expiration (14 days or fewer)
  const isGraceOrExpiringSoon =
    subscription?.status === "active" &&
    daysRemaining !== null &&
    daysRemaining <= 14;

  if (!isGraceOrExpiringSoon) {
    return null;
  }

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, Date.now().toString());
    } catch {
      // Ignore storage errors
    }
    setIsDismissed(true);
  };

  const isTransitionGrace = daysRemaining !== null && daysRemaining <= 14;

  return (
    <div
      className="w-full bg-gradient-to-r from-amber-500/15 via-primary/10 to-amber-500/10 border-b border-amber-500/30 text-foreground px-4 py-2.5 flex items-center justify-between flex-wrap gap-2 text-sm z-40 transition-all"
      role="region"
      aria-label="Subscription Notice"
    >
      <div className="flex items-center gap-2.5 max-w-3xl">
        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="text-xs sm:text-sm">
          {language === "sw" ? (
            <>
              <strong>Taarifa ya Usajili:</strong> WiseCash sasa inatumia usajili wa kila mwezi wa{" "}
              <span className="font-semibold text-primary">TZS {formattedPrice}</span>. Una siku{" "}
              <span className="font-bold text-amber-600 dark:text-amber-400">{daysRemaining}</span> zilizobaki za kipindi cha mpito. Lipa kwa M-Pesa au Halotel kuendelea kutumia bila usumbufu.
            </>
          ) : (
            <>
              <strong>Subscription Notice:</strong> WiseCash now requires a monthly subscription of{" "}
              <span className="font-semibold text-primary">TZS {formattedPrice}</span>. You have{" "}
              <span className="font-bold text-amber-600 dark:text-amber-400">{daysRemaining} days remaining</span> in your transition grace window. Pay via M-Pesa or Halotel to keep uninterrupted access.
            </>
          )}
        </span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Button
          asChild
          size="sm"
          className="h-8 text-xs font-medium shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Link to="/billing">
            {language === "sw" ? `Lipia Sasa (TZS ${formattedPrice})` : `Pay Now (TZS ${formattedPrice})`}
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-background/40 transition-colors"
          title={language === "sw" ? "Funga" : "Dismiss"}
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
