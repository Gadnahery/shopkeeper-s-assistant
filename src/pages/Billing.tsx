import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  ShieldCheck,
  Smartphone,
  WalletCards,
  Copy,
  Check,
  Upload,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Calendar,
  FileText,
  BadgeCheck,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/common/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { MANUAL_PAYMENT_CHANNELS, MANUAL_MONTHLY_PRICE_TZS, type ManualPaymentChannel } from "@/lib/subscription";
import { cn } from "@/lib/utils";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export default function Billing() {
  const { language } = useLanguage();
  const { shopId } = useAuth();
  const {
    subscription,
    latestPayment,
    pendingPayment,
    isLoading,
    isBillingLocked,
    canManageBilling,
    daysRemaining,
    renewalDateLabel,
    submitManualPayment,
    isSubmittingManualPayment,
    refreshSubscription,
  } = useSubscription();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<ManualPaymentChannel>("Mpesa");
  const [senderPhone, setSenderPhone] = useState("");
  const [amount, setAmount] = useState(String(MANUAL_MONTHLY_PRICE_TZS));
  const [reference, setReference] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(language === "sw" ? "Imenakiliwa!" : "Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedChannel) {
      toast.error(language === "sw" ? "Chagua mtandao wa malipo" : "Please select a payment channel");
      return;
    }
    if (!senderPhone.trim()) {
      toast.error(language === "sw" ? "Weka namba ya simu iliyofanya malipo" : "Please enter the payment phone number");
      return;
    }
    if (!reference.trim()) {
      toast.error(language === "sw" ? "Weka namba ya muamala (SMS receipt code)" : "Please enter the transaction reference");
      return;
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount < MANUAL_MONTHLY_PRICE_TZS) {
      toast.error(
        language === "sw"
          ? `Kiasi cha chini ni TZS ${MANUAL_MONTHLY_PRICE_TZS.toLocaleString()}`
          : `Minimum amount is TZS ${MANUAL_MONTHLY_PRICE_TZS.toLocaleString()}`
      );
      return;
    }

    try {
      let proofUrl: string | null = null;

      if (proofFile && shopId) {
        setUploadingProof(true);
        const fileExt = proofFile.name.split(".").pop();
        const filePath = `${shopId}/${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("payment-proofs")
          .upload(filePath, proofFile, { upsert: true });

        if (!uploadErr && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from("payment-proofs")
            .getPublicUrl(filePath);
          proofUrl = publicUrlData.publicUrl;
        }
        setUploadingProof(false);
      }

      await submitManualPayment({
        payment_channel: selectedChannel,
        phone_number: senderPhone.trim(),
        amount: numericAmount,
        transaction_reference: reference.trim(),
        payment_date: paymentDate,
        proof_url: proofUrl,
        billing_period_months: 1,
      });

      toast.success(
        language === "sw"
          ? "Malipo yamewasilishwa kikamilifu! Yatahakikiwa ndani ya muda mfupi."
          : "Payment submitted successfully! It will be verified shortly."
      );
      setShowSubmitForm(false);
      setReference("");
      setProofFile(null);
    } catch (err) {
      setUploadingProof(false);
      toast.error(err instanceof Error ? err.message : "Failed to submit payment");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPending = Boolean(pendingPayment);
  const isTrial = subscription?.status === "trialing";
  const isActive = subscription?.status === "active";
  const isExpired = subscription?.status === "expired" || (!isActive && !isTrial);
  const isExpiringSoon = (isActive || isTrial) && daysRemaining !== null && daysRemaining <= 5;

  const currentChannelInfo = MANUAL_PAYMENT_CHANNELS.find((c) => c.value === selectedChannel);

  return (
    <div className="space-y-6">
      <PageHeader
        title={language === "sw" ? "Usajili na Malipo (WiseCash Pro)" : "Subscription & Billing (WiseCash Pro)"}
        subtitle={
          language === "sw"
            ? "Simamia usajili wako na uthibitishe malipo ya kila mwezi kupitia M-Pesa au HaloPesa."
            : "Manage your subscription plan and confirm monthly payments via M-Pesa or HaloPesa."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshSubscription()}
              className="gap-1.5 h-9"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{language === "sw" ? "Sasisha" : "Refresh"}</span>
            </Button>
            {isPending ? (
              <Badge variant="secondary" className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1.5 py-1 px-3">
                <Clock3 className="h-3.5 w-3.5 animate-pulse" />
                {language === "sw" ? "Uhakiki Unasubiriwa" : "Verification Pending"}
              </Badge>
            ) : isActive ? (
              <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 py-1 px-3">
                <BadgeCheck className="h-3.5 w-3.5" />
                {language === "sw" ? "Mpango Hai" : "Active Plan"}
              </Badge>
            ) : isTrial ? (
              <Badge variant="outline" className="border-blue-500 text-blue-600 dark:text-blue-400 gap-1.5 py-1 px-3">
                <Clock3 className="h-3.5 w-3.5" />
                {language === "sw" ? "Kipindi cha Jaribio" : "Trial Period"}
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1.5 py-1 px-3">
                <AlertCircle className="h-3.5 w-3.5" />
                {language === "sw" ? "Muda Umekwisha" : "Expired"}
              </Badge>
            )}
          </div>
        }
      />

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">
              {language === "sw" ? "Hali ya Ufikiaji" : "Access Status"}
            </span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-xl font-bold tracking-tight text-foreground truncate">
              {isPending
                ? language === "sw" ? "Inahakikiwa" : "In Review"
                : isActive
                ? language === "sw" ? "WiseCash Pro Hai" : "WiseCash Pro Active"
                : isTrial
                ? language === "sw" ? "Jaribio Bure" : "Free Trial"
                : language === "sw" ? "Usajili Umekwisha" : "Expired"}
            </p>
            <p className="mt-0.5 text-[10px] sm:text-xs text-muted-foreground truncate">
              {renewalDateLabel ? `${language === "sw" ? "Mwisho" : "Expires"}: ${renewalDateLabel}` : "-"}
            </p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">
              {language === "sw" ? "Bei ya Mwezi" : "Monthly Price"}
            </span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <WalletCards className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-xl font-bold tracking-tight text-foreground truncate">
              {formatCurrency(MANUAL_MONTHLY_PRICE_TZS)}
            </p>
            <p className="mt-0.5 text-[10px] sm:text-xs text-muted-foreground truncate">
              {language === "sw" ? "Kwa mwezi 1 wa ufikiaji" : "Per 1 month access"}
            </p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">
              {language === "sw" ? "Siku Zilizobaki" : "Days Remaining"}
            </span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <Clock3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-xl font-bold tracking-tight text-foreground truncate">
              {daysRemaining !== null ? `${Math.max(daysRemaining, 0)} ${language === "sw" ? "Siku" : "Days"}` : "-"}
            </p>
            <p className="mt-0.5 text-[10px] sm:text-xs text-muted-foreground truncate">
              {isExpiringSoon
                ? language === "sw" ? "⚠️ Huisha sasa kuepuka kusitishwa" : "⚠️ Renew now to avoid lock"
                : language === "sw" ? "Huduma inafanya kazi" : "Service active"}
            </p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">
              {language === "sw" ? "Malipo ya Mwisho" : "Latest Payment"}
            </span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-xl font-bold tracking-tight text-foreground truncate">
              {latestPayment?.payment_channel ?? "-"}
            </p>
            <p className="mt-0.5 text-[10px] sm:text-xs text-muted-foreground truncate">
              {latestPayment?.status ? (
                <span className={cn(
                  "font-medium",
                  latestPayment.status === "success" && "text-emerald-600 dark:text-emerald-400",
                  latestPayment.status === "pending" && "text-amber-600 dark:text-amber-400",
                  latestPayment.status === "rejected" && "text-rose-600 dark:text-rose-400"
                )}>
                  {latestPayment.status.toUpperCase()}
                </span>
              ) : (
                language === "sw" ? "Hakuna rekodi" : "No record"
              )}
            </p>
          </div>
        </Card>
      </div>

      {/* Pending Banner if user already submitted a payment */}
      {isPending && pendingPayment && (
        <Card className="border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 shadow-xs">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="rounded-xl bg-amber-500/15 p-2.5 text-amber-600 dark:text-amber-400 flex-shrink-0">
                <Clock3 className="h-6 w-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">
                  {language === "sw" ? "Ombi Lako la Malipo Linahakikiwa" : "Your Payment is Being Verified"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === "sw"
                    ? "Tumepokea taarifa zako za malipo. Msimamizi wetu anahakiki muamala huu na akaunti yako itawashwa ndani ya masaa machache."
                    : "We have received your payment submission. Our admin is verifying the transaction and your account will be activated within a few hours."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-border/80 bg-background/80 p-3.5 text-xs">
              <div>
                <span className="text-muted-foreground block">{language === "sw" ? "Mtandao" : "Channel"}</span>
                <span className="font-semibold text-foreground">{pendingPayment.payment_channel}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">{language === "sw" ? "Kiasi" : "Amount"}</span>
                <span className="font-semibold text-foreground">TZS {Number(pendingPayment.amount).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">{language === "sw" ? "Namba ya Simu" : "Phone"}</span>
                <span className="font-semibold text-foreground">{pendingPayment.phone_number}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">{language === "sw" ? "Kumbukumbu ya Muamala" : "Ref"}</span>
                <span className="font-mono font-semibold text-foreground">{pendingPayment.transaction_reference}</span>
              </div>
            </div>

            {pendingPayment.proof_url && (
              <div className="text-xs text-muted-foreground">
                <a
                  href={pendingPayment.proof_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline hover:text-primary/80 inline-flex items-center gap-1"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {language === "sw" ? "Tazama picha ya risiti uliyotuma" : "View submitted receipt proof"}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Payment Section: Instructions + Verification Form */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left column: Step-by-Step Payment Instructions */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                {language === "sw" ? "Maelekezo ya Malipo ya Moja kwa Moja" : "Direct Payment Instructions"}
              </CardTitle>
              <CardDescription>
                {language === "sw"
                  ? "Tuma malipo ya TZS 25,000 kwenye moja ya namba zilizo hapa chini, kisha thibitisha fomu ya pili."
                  : "Send TZS 25,000 to one of the mobile money numbers below, then submit the confirmation form."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {MANUAL_PAYMENT_CHANNELS.map((ch) => {
                const isMpesa = ch.value === "Mpesa";
                return (
                  <div
                    key={ch.value}
                    className={cn(
                      "rounded-2xl border p-4.5 space-y-3 transition-all",
                      isMpesa
                        ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/15"
                        : "border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/15"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-xl text-white font-bold text-xs",
                            isMpesa ? "bg-emerald-600" : "bg-amber-600"
                          )}
                        >
                          {isMpesa ? "VODA" : "HALO"}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{ch.label}</p>
                          <p className="text-xs text-muted-foreground">{ch.name}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs font-semibold">
                        TZS 25,000
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-background/80 border border-border/60 p-2.5 px-3">
                      <div>
                        <span className="text-[11px] text-muted-foreground block">
                          {language === "sw" ? "Namba ya Kupokea:" : "Account / Phone Number:"}
                        </span>
                        <span className="font-mono text-base font-bold text-foreground tracking-wide">
                          {ch.number}
                        </span>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => copyToClipboard(ch.number.replace(/\s+/g, ""), ch.value)}
                        className="h-8 gap-1.5 text-xs"
                      >
                        {copiedKey === ch.value ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                            <span>{language === "sw" ? "Imenakiliwa" : "Copied"}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>{language === "sw" ? "Nakili Namba" : "Copy Number"}</span>
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="text-[11px] text-muted-foreground leading-relaxed flex items-center gap-1.5">
                      <ArrowRight className="h-3 w-3 flex-shrink-0 text-primary" />
                      <span>
                        {language === "sw"
                          ? `Tuma malipo kwa jina "${ch.name}", kisha uhifadhi namba ya muamala (SMS receipt code).`
                          : `Send payment to recipient name "${ch.name}", then keep the SMS confirmation receipt code.`}
                      </span>
                    </div>
                  </div>
                );
              })}

              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400">
                  <ShieldCheck className="h-4 w-4" />
                  <span>{language === "sw" ? "Uhakiki wa Haraka" : "Quick Verification"}</span>
                </div>
                <p>
                  {language === "sw"
                    ? "Uhakiki hufanyika haraka sana punde unapowasilisha namba ya muamala kwenye fomu ya pembeni. Unaweza pia kuambatanisha picha ya risiti kwa uhakiki wa papo hapo."
                    : "Verification is typically fast once you fill the transaction code on the form. You can also attach a screenshot for immediate matching."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Form to Submit Payment Details */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                {language === "sw" ? "Wasilisha Taarifa za Malipo" : "Submit Payment Confirmation"}
              </CardTitle>
              <CardDescription>
                {language === "sw"
                  ? "Jaza maelezo ya muamala baada ya kutuma pesa ili akaunti yako iidhinishwe."
                  : "Provide the transaction receipt details after sending money to activate your plan."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPending && !showSubmitForm ? (
                <div className="space-y-4 py-3 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                    <Clock3 className="h-8 w-8 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {language === "sw" ? "Una malipo yanayohakikiwa tayari" : "You have a payment currently in review"}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      {language === "sw"
                        ? "Ikiwa umefanya muamala mwingine au unahitaji kuwasilisha upya, unaweza kubofya kitufe cha chini."
                        : "If you made another transaction or need to re-submit with new details, click below."}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowSubmitForm(true)}
                    className="text-xs"
                  >
                    {language === "sw" ? "Wasilisha Muamala Mwingine" : "Submit Another Payment"}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  {/* Channel selection */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      {language === "sw" ? "1. Mtandao Uliotumika Kulipa" : "1. Payment Network Used"}
                    </Label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {MANUAL_PAYMENT_CHANNELS.map((ch) => {
                        const active = selectedChannel === ch.value;
                        return (
                          <button
                            key={ch.value}
                            type="button"
                            onClick={() => setSelectedChannel(ch.value)}
                            className={cn(
                              "flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all text-xs font-medium",
                              active
                                ? "border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary"
                                : "border-border hover:bg-muted/50 text-foreground"
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-6 w-6 items-center justify-center rounded-full text-[10px] text-white font-bold",
                                ch.value === "Mpesa" ? "bg-emerald-600" : "bg-amber-600"
                              )}
                            >
                              ✓
                            </div>
                            <span className="truncate">{ch.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sender phone number */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      {language === "sw" ? "2. Namba ya Simu Iliyotuma Malipo" : "2. Sender Phone Number"}
                    </Label>
                    <Input
                      type="text"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder="07XXXXXXXX au 2557XXXXXXXX"
                      required
                      className="h-10 text-sm"
                    />
                  </div>

                  {/* Amount and Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        {language === "sw" ? "3. Kiasi Kilicholipwa (TZS)" : "3. Amount Paid (TZS)"}
                      </Label>
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min={MANUAL_MONTHLY_PRICE_TZS}
                        required
                        className="h-10 text-sm font-semibold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">
                        {language === "sw" ? "Tarehe ya Muamala" : "Transaction Date"}
                      </Label>
                      <Input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        required
                        className="h-10 text-sm"
                      />
                    </div>
                  </div>

                  {/* Transaction Reference (Receipt ID) */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      {language === "sw" ? "4. Namba ya Kumbukumbu ya Muamala (SMS Code)" : "4. Transaction Reference (SMS Code)"}
                    </Label>
                    <Input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value.toUpperCase())}
                      placeholder="Mfano: QK82HD91K au 9J182937..."
                      required
                      className="h-10 text-sm font-mono uppercase tracking-wider"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {language === "sw"
                        ? "Weka kodi iliyo kwenye meseji ya Vodacom/Halotel baada ya kutuma pesa."
                        : "Enter the confirmation code from the Vodacom/Halotel SMS receipt."}
                    </p>
                  </div>

                  {/* Optional Proof Screenshot */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold flex items-center justify-between">
                      <span>{language === "sw" ? "5. Picha ya Risiti / Screenshot (Si lazima)" : "5. Receipt Screenshot (Optional)"}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">PNG, JPG, WebP</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="h-10 text-xs file:mr-2 file:h-7 file:rounded-md file:border-0 file:bg-primary/10 file:px-2.5 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/20"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmittingManualPayment || uploadingProof || !canManageBilling}
                    className="w-full h-11 rounded-xl font-semibold gap-2 shadow-xs"
                  >
                    {isSubmittingManualPayment || uploadingProof ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{language === "sw" ? "Inatuma Taarifa..." : "Submitting..."}</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>{language === "sw" ? "Tuma Taarifa za Malipo Kuhakikiwa" : "Submit Payment for Verification"}</span>
                      </>
                    )}
                  </Button>

                  {!canManageBilling && (
                    <p className="text-center text-xs text-rose-500">
                      {language === "sw"
                        ? "Mmiliki au meneja wa duka pekee ndiye anayeweza kuwasilisha malipo."
                        : "Only the shop owner or manager can submit subscription billing."}
                    </p>
                  )}
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
