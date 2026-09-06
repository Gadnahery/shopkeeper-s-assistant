import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  ShieldCheck,
  Smartphone,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageHeader } from "@/components/common/PageHeader";
import { useAdaptiveLayout } from "@/hooks/useAdaptiveLayout";
import { BILLING_ENABLED } from "@/lib/billing";
import { cn } from "@/lib/utils";
import { resolveSubscriptionMonthlyPrice } from "@/lib/subscription";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

const providerMeta: Record<
  string,
  { brand: string; icon: string; shell: string; badge: string; accent: string; note: string; noteSw: string }
> = {
  Mpesa: {
    brand: "Vodacom M-Pesa",
    icon: "/payment-icons/vodacom.ico",
    shell: "border-emerald-500/25 bg-emerald-500/8",
    badge: "bg-emerald-600 text-white",
    accent: "text-emerald-700 dark:text-emerald-300",
    note: "Best for customers who pay with Vodacom M-Pesa.",
    noteSw: "Inafaa kwa wateja wanaolipa kwa Vodacom M-Pesa.",
  },
  Tigo: {
    brand: "Yas Mixx",
    icon: "/payment-icons/yas.svg",
    shell: "border-blue-500/25 bg-blue-500/8",
    badge: "bg-blue-600 text-white",
    accent: "text-blue-700 dark:text-blue-300",
    note: "Use the Yas / Mixx wallet number for the payment prompt.",
    noteSw: "Tumia namba ya Yas / Mixx kupokea ombi la malipo.",
  },
  Airtel: {
    brand: "Airtel Money",
    icon: "/payment-icons/airtel.ico",
    shell: "border-rose-500/25 bg-rose-500/8",
    badge: "bg-rose-600 text-white",
    accent: "text-rose-700 dark:text-rose-300",
    note: "Works well for Airtel Money collections and renewals.",
    noteSw: "Inafaa kwa malipo na upyaishaji kupitia Airtel Money.",
  },
  Halopesa: {
    brand: "HaloPesa",
    icon: "/payment-icons/halotel.png",
    shell: "border-amber-500/25 bg-amber-500/8",
    badge: "bg-amber-500 text-amber-950",
    accent: "text-amber-700 dark:text-amber-300",
    note: "Supports customers using Halotel HaloPesa accounts.",
    noteSw: "Inasaidia wateja wanaotumia HaloPesa ya Halotel.",
  },
  Azampesa: {
    brand: "AzamPesa",
    icon: "/payment-icons/azampesa.png",
    shell: "border-violet-500/25 bg-violet-500/8",
    badge: "bg-violet-600 text-white",
    accent: "text-violet-700 dark:text-violet-300",
    note: "A good option when customers prefer the AzamPesa wallet.",
    noteSw: "Ni chaguo zuri kwa wateja wanaopendelea pochi ya AzamPesa.",
  },
};

export default function Billing() {
  const { language } = useLanguage();
  const { isMobile } = useAdaptiveLayout();
  const {
    subscription,
    latestPayment,
    paymentOptions,
    paymentAmount,
    isLoading,
    isBillingLocked,
    canManageBilling,
    daysRemaining,
    renewalDateLabel,
    initiatePayment,
    isInitiatingPayment,
  } = useSubscription();
  const [provider, setProvider] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const monthlyAmount = resolveSubscriptionMonthlyPrice(paymentAmount, subscription?.monthly_price);

  const statusTone = useMemo(() => {
    if (!subscription) return "secondary";
    if (subscription.status === "active" || subscription.status === "trialing") return "default";
    return "destructive";
  }, [subscription]) as "default" | "secondary" | "destructive";

  const selectedProviderMeta = providerMeta[provider] ?? null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!provider || !phoneNumber.trim()) {
      toast.error(language === "sw" ? "Chagua mtandao na namba ya simu" : "Choose a provider and phone number");
      return;
    }

    try {
      const result = await initiatePayment({
        provider,
        phoneNumber,
      });

      toast.success(result.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start payment");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!BILLING_ENABLED) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={language === "sw" ? "Malipo yamesimamishwa kwa sasa" : "Billing is paused for now"}
          subtitle={
            language === "sw"
              ? "Programu iko kwenye free mode. Watumiaji wanaweza kutumia mfumo wote bila vizuizi hadi tutakapowasha malipo halisi."
              : "The app is currently in free mode. Users can use the full system without billing restrictions until live payments are enabled."
          }
        />

        <Card className="section-shell">
          <CardContent className="space-y-4 p-6">
            <div className="rounded-[1.35rem] border border-emerald-500/20 bg-emerald-500/8 p-4">
              <p className="text-sm font-semibold text-foreground">
                {language === "sw" ? "Ufikiaji wa app uko wazi" : "App access is fully open"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {language === "sw"
                  ? "Tumeondoa kufunga app, vikumbusho vya usajili, na kulazimisha malipo kwa muda huu wa mpito."
                  : "Subscription lockouts, reminder popups, and payment enforcement are temporarily disabled during this transition period."}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.2rem] border border-border/70 bg-background/68 p-4">
                <p className="text-sm font-semibold text-foreground">
                  {language === "sw" ? "Global billing baadaye" : "Global billing later"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {language === "sw"
                    ? "Tutawasha tena billing page hii baada ya njia za malipo za kimataifa kukamilika."
                    : "This billing page will be turned back on once the worldwide payment setup is complete."}
                </p>
              </div>

              <div className="rounded-[1.2rem] border border-border/70 bg-background/68 p-4">
                <p className="text-sm font-semibold text-foreground">
                  {language === "sw" ? "Kumbukumbu ya mwisho" : "Last payment record"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {language === "sw" ? "Hali" : "Status"}:{" "}
                  <span className="font-semibold text-foreground">{latestPayment?.status ?? "-"}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === "sw" ? "Njia" : "Channel"}:{" "}
                  <span className="font-semibold text-foreground">{latestPayment?.payment_channel ?? "-"}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const billingStats = [
    {
      label: language === "sw" ? "Hali ya sasa" : "Current access",
      value:
        subscription?.status === "trialing"
          ? language === "sw"
            ? "Jaribio"
            : "Trial"
          : subscription?.status === "active"
            ? language === "sw"
              ? "Hai"
              : "Active"
            : language === "sw"
              ? "Imekwisha"
              : "Payment due",
      hint: renewalDateLabel ?? "-",
      icon: Clock3,
    },
    {
      label: language === "sw" ? "Bei ya mwezi" : "Monthly amount",
      value: formatCurrency(monthlyAmount),
      hint: language === "sw" ? "Kila mwezi" : "Per month",
      icon: WalletCards,
    },
    {
      label: language === "sw" ? "Siku Zilizobaki" : "Days Remaining",
      value: daysRemaining === null ? "-" : `${Math.max(daysRemaining, 0)} ${language === "sw" ? "siku" : "days"}`,
      hint: language === "sw" ? "Kabla ya kuhuisha" : "Until renewal",
      icon: ShieldCheck,
    },
    {
      label: language === "sw" ? "Malipo ya mwisho" : "Latest payment",
      value: latestPayment?.payment_channel ?? (latestPayment?.phone_number ? "Mobile" : "-"),
      hint: latestPayment?.status ?? (language === "sw" ? "Hakuna rekodi" : "No record"),
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={language === "sw" ? "Malipo ya usajili" : "Subscription billing"}
        subtitle={
          language === "sw"
            ? "Lipa kwa urahisi kupitia mitandao ya simu na uendelee kutumia mfumo bila usumbufu."
            : "Use mobile money to renew your subscription quickly and keep your shop running without interruptions."
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge variant={statusTone}>
              {subscription?.status === "trialing"
                ? language === "sw"
                  ? "Jaribio la siku 7"
                  : "7-day trial"
                : subscription?.status === "active"
                  ? language === "sw"
                    ? "Usajili hai"
                    : "Active plan"
                  : language === "sw"
                    ? "Malipo yanahitajika"
                    : "Payment required"}
            </Badge>
            <div className="rounded-full border border-border/70 bg-background/75 px-3 py-2 text-xs text-muted-foreground">
              {language === "sw" ? "Siku zilizobaki" : "Days left"}: {daysRemaining === null ? "-" : Math.max(daysRemaining, 0)}
            </div>
          </div>
        }
      />

      {/* 4 Compact Olly KPI Cards (2x2 on Mobile, 4 cols on Desktop) */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {billingStats.map((stat) => (
          <Card key={stat.label} className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{stat.label}</span>
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
                <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3">
              <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate">{stat.value}</p>
              <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{stat.hint}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_380px]">
        <Card className="section-shell">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="h-5 w-5 text-primary" />
              {language === "sw" ? "Chagua mtandao wa malipo" : "Choose a payment network"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {paymentOptions.map((option) => {
                const meta = providerMeta[option.value] ?? {
                  brand: option.label,
                  icon: "",
                  shell: "border-primary/20 bg-primary/5",
                  badge: "bg-primary text-primary-foreground",
                  accent: "text-primary",
                  note: "Send the payment prompt directly to the customer phone.",
                  noteSw: "Tuma ombi la malipo moja kwa moja kwenye simu ya mteja.",
                };
                const active = provider === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setProvider(option.value)}
                    className={cn(
                      "rounded-[1.35rem] border p-4 text-left transition-all",
                      meta.shell,
                      active
                        ? "ring-2 ring-primary shadow-[0_22px_50px_-28px_hsl(var(--primary)/0.55)]"
                        : "hover:-translate-y-0.5 hover:border-primary/25",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className={cn("flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/50 bg-white/90 shadow-sm", active && meta.badge)}>
                        {meta.icon ? (
                          <img
                            src={meta.icon}
                            alt={meta.brand}
                            className="h-8 w-8 object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-sm font-bold">{option.label.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      {active ? (
                        <Badge className="rounded-full bg-primary text-primary-foreground">
                          {language === "sw" ? "Imechaguliwa" : "Selected"}
                        </Badge>
                      ) : null}
                    </div>
                    <p className={cn("mt-4 font-semibold", meta.accent)}>{meta.brand}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {language === "sw" ? meta.noteSw : meta.note}
                    </p>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 rounded-[1.5rem] border border-border/70 bg-background/68 p-4">
              <div className="space-y-2">
                <Label>{language === "sw" ? "Namba ya simu ya malipo" : "Payment phone number"}</Label>
                <Input
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="07XXXXXXXX or 2557XXXXXXXX"
                  className="h-12"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.1rem] border border-border/70 bg-card/75 p-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {language === "sw" ? "Kiasi cha kulipa" : "Amount to pay"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === "sw" ? "Malipo ya mwezi mmoja" : "One month subscription"}
                  </p>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(monthlyAmount)}
                </p>
              </div>

              <div className="rounded-[1.1rem] border border-border/70 bg-background/72 p-3 text-sm text-muted-foreground">
                {language === "sw"
                  ? "Baada ya kutuma ombi, mteja atapata ujumbe au popup ya kuthibitisha malipo kwenye simu yake."
                  : "After sending the prompt, the customer will receive a payment confirmation request on their phone."}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="submit" className="h-12 min-w-[12rem] rounded-xl bg-neutral-950 font-medium text-white hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 shadow-xs" disabled={isInitiatingPayment || !canManageBilling}>
                  {isInitiatingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
                  <span>{language === "sw" ? "Tuma ombi la malipo" : "Send payment prompt"}</span>
                </Button>

                {!canManageBilling ? (
                  <div className="flex items-center rounded-full border border-border/70 bg-muted/30 px-4 text-sm text-muted-foreground">
                    {language === "sw"
                      ? "Mmiliki au meneja pekee anaweza kuanzisha malipo."
                      : "Only the owner or manager can start billing."}
                  </div>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="section-shell">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-primary" />
                {language === "sw" ? "Nini kitafuata?" : "What happens next?"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                language === "sw"
                  ? "Chagua mtandao wa simu unaotaka kutumia."
                  : "Choose the mobile money network you want to use.",
                language === "sw"
                  ? "Weka namba ya simu itakayopokea ombi la malipo."
                  : "Enter the phone number that should receive the payment prompt.",
                language === "sw"
                  ? "Baada ya kuthibitisha malipo, mfumo utaendelea kufanya kazi moja kwa moja."
                  : "After payment is confirmed, access is restored automatically.",
              ].map((step, index) => (
                <div key={step} className="flex items-start gap-3 rounded-[1.15rem] border border-border/70 bg-background/68 p-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <p className="text-sm text-muted-foreground">{step}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="section-shell">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-primary" />
                {language === "sw" ? "Hali ya ufikiaji" : "Access note"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-[1.2rem] border border-border/70 bg-background/68 p-4">
                {isBillingLocked
                  ? language === "sw"
                    ? "Ufikiaji wa app umefungwa hadi malipo ya usajili yathibitishwe."
                    : "The app is locked until the subscription payment is confirmed."
                  : language === "sw"
                    ? "Unaweza kulipia mapema kabla muda wa sasa haujaisha."
                    : "You can renew early before the current period ends."}
              </div>
              <div className="rounded-[1.2rem] border border-border/70 bg-background/68 p-4">
                <p className="font-medium text-foreground">{language === "sw" ? "Malipo ya mwisho" : "Latest payment"}</p>
                <p className="mt-2">
                  {language === "sw" ? "Njia" : "Channel"}: <span className="font-semibold text-foreground">{latestPayment?.payment_channel ?? "-"}</span>
                </p>
                <p>
                  {language === "sw" ? "Hali" : "Status"}: <span className="font-semibold text-foreground">{latestPayment?.status ?? "-"}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {selectedProviderMeta ? (
            <Card className="section-shell">
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-white/95 shadow-sm">
                    <img
                      src={selectedProviderMeta.icon}
                      alt={selectedProviderMeta.brand}
                      className="h-8 w-8 object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{selectedProviderMeta.brand}</p>
                    <p className="text-sm text-muted-foreground">
                      {language === "sw" ? "Mtandao uliouchagua uko tayari." : "Your chosen network is ready."}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
