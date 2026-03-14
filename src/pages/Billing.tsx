import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, CreditCard, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useLanguage } from "@/contexts/LanguageContext";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export default function Billing() {
  const { language } = useLanguage();
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

  const statusTone = useMemo(() => {
    if (!subscription) return "secondary";
    if (subscription.status === "active" || subscription.status === "trialing") return "default";
    return "destructive";
  }, [subscription]) as "default" | "secondary" | "destructive";

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

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge variant={statusTone}>
              {subscription?.status === "trialing"
                ? language === "sw"
                  ? "Jaribio la wiki 1"
                  : "7-day free trial"
                : subscription?.status === "active"
                  ? language === "sw"
                    ? "Usajili hai"
                    : "Subscription active"
                  : language === "sw"
                    ? "Malipo yanahitajika"
                    : "Payment required"}
            </Badge>
            <div>
              <h1 className="text-3xl font-semibold text-foreground">
                {language === "sw" ? "Malipo ya usajili" : "Subscription billing"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {language === "sw"
                  ? "Wateja wapya hupata mafunzo ya wiki 1 bure. Baada ya hapo, malipo ya mwezi yanahitajika ili kuendelea kutumia mfumo."
                  : "Every new shop gets a one-week training trial. After that, monthly payment is required to keep using the system."}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/85 px-4 py-3 text-sm">
            <div className="text-muted-foreground">
              {language === "sw" ? "Bei ya mwezi" : "Monthly price"}
            </div>
            <div className="mt-1 text-2xl font-semibold text-foreground">
              {formatCurrency(paymentAmount || subscription?.monthly_price || 0)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-[1.75rem]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock3 className="h-4 w-4 text-primary" />
              {language === "sw" ? "Hali ya sasa" : "Current access"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              {language === "sw" ? "Hali" : "Status"}:{" "}
              <span className="font-medium text-foreground">{subscription?.status ?? "unknown"}</span>
            </p>
            <p>
              {language === "sw" ? "Inaisha" : "Ends on"}:{" "}
              <span className="font-medium text-foreground">{renewalDateLabel ?? "-"}</span>
            </p>
            <p>
              {language === "sw" ? "Siku zilizobaki" : "Days remaining"}:{" "}
              <span className="font-medium text-foreground">
                {daysRemaining === null ? "-" : Math.max(daysRemaining, 0)}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {language === "sw" ? "Ufikiaji" : "Access policy"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              {language === "sw"
                ? "Ufikiaji wa huduma hufunguliwa tu baada ya malipo kuthibitishwa."
                : "Service access is granted only after the subscription payment is confirmed."}
            </p>
            <p>
              {language === "sw"
                ? "Onyo la ndani ya app huonekana siku chache kabla ya mwisho wa kipindi."
                : "In-app reminders appear shortly before the current period ends."}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              {language === "sw" ? "Malipo ya mwisho" : "Latest payment"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              {language === "sw" ? "Njia" : "Channel"}:{" "}
              <span className="font-medium text-foreground">{latestPayment?.payment_channel ?? "-"}</span>
            </p>
            <p>
              {language === "sw" ? "Hali" : "Status"}:{" "}
              <span className="font-medium text-foreground">{latestPayment?.status ?? "-"}</span>
            </p>
            <p>
              {language === "sw" ? "Namba" : "Phone"}:{" "}
              <span className="font-medium text-foreground">{latestPayment?.phone_number ?? "-"}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[1.75rem]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {language === "sw" ? "Lipia mwezi unaofuata" : "Pay for the next month"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {canManageBilling ? (
            <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
              <div className="space-y-2">
                <Label>{language === "sw" ? "Mtandao wa malipo" : "Mobile money provider"}</Label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger className="h-12 rounded-2xl">
                    <SelectValue placeholder={language === "sw" ? "Chagua mtandao" : "Choose provider"} />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{language === "sw" ? "Namba ya simu ya mteja" : "Customer phone number"}</Label>
                <Input
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="07XXXXXXXX or 2557XXXXXXXX"
                  className="h-12 rounded-2xl"
                />
              </div>

              <div className="flex items-end">
                <Button type="submit" className="h-12 w-full rounded-2xl lg:w-auto" disabled={isInitiatingPayment}>
                  {isInitiatingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
                  <span className="ml-2">
                    {language === "sw" ? "Tuma ombi la malipo" : "Send payment prompt"}
                  </span>
                </Button>
              </div>
            </form>
          ) : (
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
              {language === "sw"
                ? "Mmiliki au meneja ndiye anayeruhusiwa kuanzisha malipo ya usajili."
                : "Only the owner or manager can start subscription payments."}
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-border/70 bg-background/85 p-4 text-sm text-muted-foreground">
            {isBillingLocked
              ? language === "sw"
                ? "Ufikiaji wa app umefungwa hadi malipo ya usajili yathibitishwe."
                : "The app is locked until the subscription payment is confirmed."
              : language === "sw"
                ? "Unaweza kulipia mapema kabla muda wa sasa haujaisha."
                : "You can renew early before the current period ends."}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
