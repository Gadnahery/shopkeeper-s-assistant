import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Rocket,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import { MANUAL_MONTHLY_PRICE_TZS } from "@/lib/subscription";

export function FreeTrialWelcomeDialog() {
  const { isTrialing, subscription, paymentAmount } = useSubscription();
  const { shopId, user, role } = useAuth();
  const { language } = useLanguage();
  const { formatMoney } = useShopFormatting();
  const [open, setOpen] = useState(false);
  const displayPrice = paymentAmount && paymentAmount !== 10000 ? paymentAmount : MANUAL_MONTHLY_PRICE_TZS;

  useEffect(() => {
    if (!shopId && !user) return;
    // Suppress trial welcome popup for sub-users/staff registered under an admin
    if (role && role !== "owner") return;

    const storageKey = `wisecash_free_trial_welcome_seen_${shopId || user?.id}`;
    const alreadySeen = localStorage.getItem(storageKey);

    // Show if on trial (or pending new user) and haven't seen the welcome dialog
    const qualifiesForTrialWelcome =
      isTrialing ||
      subscription?.status === "trialing" ||
      subscription?.status === "pending";

    if (qualifiesForTrialWelcome && !alreadySeen) {
      setOpen(true);
    }
  }, [shopId, user, role, isTrialing, subscription?.status]);

  if (role && role !== "owner") {
    return null;
  }

  const handleDismiss = () => {
    const storageKey = `wisecash_free_trial_welcome_seen_${shopId || user?.id}`;
    localStorage.setItem(storageKey, "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleDismiss()}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-6 overflow-hidden">
        <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        <DialogHeader className="space-y-2.5 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/30 px-3 py-1 text-xs font-semibold gap-1.5 rounded-full"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {language === "sw"
                ? "Siku 14 za Bure Zimeanza"
                : "14-Day Free Trial Activated"}
            </Badge>
          </div>

          <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center justify-center sm:justify-start gap-2">
            <Rocket className="h-6 w-6 text-primary shrink-0 animate-bounce" />
            {language === "sw"
              ? "Karibu WiseCash!"
              : "Welcome to WiseCash!"}
          </DialogTitle>

          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {language === "sw" ? (
              <>
                Hongera! Akaunti yako ipo tayari. Umepata{" "}
                <strong className="text-foreground">siku 14 za kujaribu mfumo bure kabisa</strong>{" "}
                bila malipo yoyote ya awali. Tumia huduma zote kuendesha na kukuza biashara yako.
              </>
            ) : (
              <>
                Congratulations! Your account is active. You have{" "}
                <strong className="text-foreground">14 days of free trial</strong>{" "}
                to explore all features of WiseCash with zero upfront payment required.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-2.5 py-3">
          <div className="p-3 rounded-xl border border-border/80 bg-card/60 flex flex-col gap-1.5">
            <div className="h-7 w-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <p className="text-xs font-bold text-foreground">
              {language === "sw" ? "Mauzo ya Haraka (POS)" : "POS & Quick Sales"}
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {language === "sw" ? "Uza haraka na kutoa risiti papo hapo" : "Fast checkout and printable receipts"}
            </p>
          </div>

          <div className="p-3 rounded-xl border border-border/80 bg-card/60 flex flex-col gap-1.5">
            <div className="h-7 w-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
            <p className="text-xs font-bold text-foreground">
              {language === "sw" ? "Usimamizi wa Stoki" : "Inventory Control"}
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {language === "sw" ? "Fuatilia idadi na tahadhari ya bidhaa" : "Live stock tracking & low-stock alerts"}
            </p>
          </div>

          <div className="p-3 rounded-xl border border-border/80 bg-card/60 flex flex-col gap-1.5">
            <div className="h-7 w-7 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
            <p className="text-xs font-bold text-foreground">
              {language === "sw" ? "Madeni ya Wateja" : "Customer Debts"}
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {language === "sw" ? "Rekodi mikopo na mapokezi ya madeni" : "Ledger of credit balances & payments"}
            </p>
          </div>

          <div className="p-3 rounded-xl border border-border/80 bg-card/60 flex flex-col gap-1.5">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
            <p className="text-xs font-bold text-foreground">
              {language === "sw" ? "Ripoti za Faida" : "Profit & Analytics"}
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {language === "sw" ? "Tazama faida halisi na gharama" : "Gross profit, COGS, and expense analytics"}
            </p>
          </div>
        </div>

        {/* Pricing Reassurance */}
        <div className="rounded-xl bg-muted/40 p-3 border border-border/60 flex items-center gap-2.5 text-xs text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            {language === "sw" ? (
              <>
                Baada ya majaribio ya bure, unaweza kuendelea kwa{" "}
                <strong className="text-foreground">{formatMoney(displayPrice)}/mwezi</strong> tu.
              </>
            ) : (
              <>
                After your trial, continue seamlessly for just{" "}
                <strong className="text-foreground">{formatMoney(displayPrice)}/month</strong>.
              </>
            )}
          </span>
        </div>

        <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2 sm:justify-between items-center">
          <Button
            asChild
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-xs text-muted-foreground hover:text-foreground w-full sm:w-auto"
          >
            <Link to="/billing">
              {language === "sw" ? "Tazama Usajili" : "View Subscription"}
            </Link>
          </Button>

          <Button
            onClick={handleDismiss}
            size="default"
            className="w-full sm:w-auto font-semibold gap-1.5 shadow-md"
          >
            {language === "sw" ? "Anza Kutumia WiseCash" : "Start Using WiseCash"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
