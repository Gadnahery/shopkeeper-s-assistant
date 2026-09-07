import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Clock3,
  CheckCircle2,
  XCircle,
  Search,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Filter,
  RefreshCw,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useAllPayments,
  useApprovePayment,
  useRejectPayment,
  type PendingPaymentWithShop,
} from "@/hooks/usePlatformAdmin";
import { cn } from "@/lib/utils";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export default function PlatformAdminPayments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: payments = [], isLoading, refetch, isRefetching } = useAllPayments();
  const approveMutation = useApprovePayment();
  const rejectMutation = useRejectPayment();

  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "success" | "rejected">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Rejection dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [paymentToReject, setPaymentToReject] = useState<PendingPaymentWithShop | null>(null);

  // Image preview modal state
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const selectedPaymentId = searchParams.get("selected");

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      if (statusFilter !== "all" && payment.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const shopName = payment.shops?.name?.toLowerCase() ?? "";
      const phone = payment.phone_number?.toLowerCase() ?? "";
      const ref = payment.transaction_reference?.toLowerCase() ?? "";
      const channel = payment.payment_channel?.toLowerCase() ?? "";

      return shopName.includes(q) || phone.includes(q) || ref.includes(q) || channel.includes(q);
    });
  }, [payments, statusFilter, searchQuery]);

  const selectedPayment = useMemo(() => {
    if (selectedPaymentId) {
      const found = payments.find((p) => p.id === selectedPaymentId);
      if (found) return found;
    }
    return filteredPayments[0] ?? null;
  }, [selectedPaymentId, payments, filteredPayments]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApprove = async (payment: PendingPaymentWithShop) => {
    if (!window.confirm(`Approve payment of TZS ${Number(payment.amount).toLocaleString()} for ${payment.shops?.name ?? "this shop"}?`)) {
      return;
    }

    try {
      await approveMutation.mutateAsync(payment.id);
      toast.success(`Payment approved! ${payment.shops?.name ?? "Shop"} subscription is now active.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve payment");
    }
  };

  const openRejectDialog = (payment: PendingPaymentWithShop) => {
    setPaymentToReject(payment);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!paymentToReject) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason for the shopkeeper.");
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        paymentId: paymentToReject.id,
        reason: rejectionReason.trim(),
      });
      toast.success("Payment marked as rejected. Shopkeeper has been notified.");
      setRejectDialogOpen(false);
      setPaymentToReject(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject payment");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Subscription Payments Verification
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Verify manual M-Pesa / HaloPesa submissions against bank/wallet statements.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="gap-1.5 h-9"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/80 w-full sm:w-auto overflow-x-auto">
          {(["pending", "success", "rejected", "all"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all whitespace-nowrap",
                statusFilter === status
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {status === "pending"
                ? `Pending (${payments.filter((p) => p.status === "pending").length})`
                : status === "success"
                ? `Approved (${payments.filter((p) => p.status === "success").length})`
                : status === "rejected"
                ? `Rejected (${payments.filter((p) => p.status === "rejected").length})`
                : `All (${payments.length})`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search shop, phone, reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Master-Detail Layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Payments List (Left) */}
        <div className="lg:col-span-5 space-y-2.5">
          {isLoading ? (
            <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-border bg-card">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
              <Filter className="mx-auto h-8 w-8 opacity-40 mb-2" />
              <p className="font-semibold text-foreground text-sm">No payments found</p>
              <p className="text-xs mt-1">No payment records match your current filters.</p>
            </div>
          ) : (
            filteredPayments.map((payment) => {
              const isSelected = selectedPayment?.id === payment.id;
              const isPending = payment.status === "pending";
              const isSuccess = payment.status === "success";

              return (
                <div
                  key={payment.id}
                  onClick={() => setSearchParams({ selected: payment.id })}
                  className={cn(
                    "cursor-pointer rounded-xl border p-3.5 transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                      : "border-border/80 bg-card hover:border-border hover:bg-muted/40",
                    isPending && !isSelected && "border-amber-500/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {payment.shops?.name ?? "Unknown Shop"}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {payment.payment_channel} • {payment.phone_number}
                      </p>
                    </div>
                    <Badge
                      variant={isSuccess ? "default" : isPending ? "secondary" : "destructive"}
                      className={cn(
                        "text-[10px] font-bold uppercase",
                        isPending && "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
                        isSuccess && "bg-emerald-600 text-white"
                      )}
                    >
                      {payment.status}
                    </Badge>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">
                      {formatCurrency(Number(payment.amount))}
                    </span>
                    <span className="text-muted-foreground font-mono">
                      Ref: {payment.transaction_reference ?? "N/A"}
                    </span>
                  </div>

                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(payment.created_at).toLocaleString("en-GB")}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Payment Detail (Right) */}
        <div className="lg:col-span-7">
          {selectedPayment ? (
            <Card className="border border-border/80 bg-card shadow-xs sticky top-24">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">Payment Details</CardTitle>
                    <CardDescription>
                      Submitted on {new Date(selectedPayment.created_at).toLocaleString("en-GB")}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      selectedPayment.status === "success"
                        ? "default"
                        : selectedPayment.status === "pending"
                        ? "secondary"
                        : "destructive"
                    }
                    className={cn(
                      "text-xs font-bold uppercase py-1 px-3",
                      selectedPayment.status === "pending" &&
                        "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
                      selectedPayment.status === "success" && "bg-emerald-600 text-white"
                    )}
                  >
                    {selectedPayment.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl border border-border/80 bg-muted/20 p-3.5 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Shop Name</span>
                    <span className="font-semibold text-foreground text-sm">
                      {selectedPayment.shops?.name ?? "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Amount Paid</span>
                    <span className="font-bold text-foreground text-sm text-primary">
                      {formatCurrency(Number(selectedPayment.amount))}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Channel</span>
                    <span className="font-semibold text-foreground text-sm">
                      {selectedPayment.payment_channel}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Sender Phone</span>
                    <span className="font-mono font-semibold text-foreground">
                      {selectedPayment.phone_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Billing Period</span>
                    <span className="font-semibold text-foreground">
                      {selectedPayment.billing_period_months ?? 1} Month(s)
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Provider</span>
                    <span className="font-semibold text-foreground uppercase">
                      {selectedPayment.payment_channel} (Manual)
                    </span>
                  </div>
                </div>

                {/* Reference Code Box with Copy */}
                <div className="rounded-xl border border-border/80 bg-background/80 p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-muted-foreground block">
                      Transaction Reference Code (SMS Receipt)
                    </span>
                    <span className="font-mono text-base font-bold text-foreground tracking-wider">
                      {selectedPayment.transaction_reference ?? "None provided"}
                    </span>
                  </div>
                  {selectedPayment.transaction_reference && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(selectedPayment.transaction_reference!, "ref")
                      }
                      className="h-8 gap-1.5 text-xs"
                    >
                      {copiedKey === "ref" ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Screenshot / Proof Attachment */}
                {selectedPayment.proof_url ? (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold flex items-center justify-between">
                      <span>Receipt Screenshot</span>
                      <a
                        href={selectedPayment.proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Open full resolution</span>
                      </a>
                    </Label>
                    <div
                      onClick={() => setPreviewImage(selectedPayment.proof_url)}
                      className="cursor-pointer overflow-hidden rounded-xl border border-border/80 bg-black/5 hover:opacity-95 transition-all max-h-64 flex items-center justify-center p-2 group relative"
                    >
                      <img
                        src={selectedPayment.proof_url}
                        alt="Payment receipt proof"
                        className="max-h-60 w-auto rounded-lg object-contain"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white font-semibold text-xs gap-1.5">
                        <Eye className="h-4 w-4" />
                        <span>Click to Enlarge</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/80 p-4 text-center text-xs text-muted-foreground">
                    No receipt screenshot was attached to this submission.
                  </div>
                )}

                {/* Rejection Reason if rejected */}
                {selectedPayment.status === "rejected" && selectedPayment.rejection_reason && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5 space-y-1">
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                      Rejection Reason:
                    </span>
                    <p className="text-xs text-muted-foreground">{selectedPayment.rejection_reason}</p>
                  </div>
                )}

                {/* Action Buttons for Pending Payments */}
                {selectedPayment.status === "pending" && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      onClick={() => handleApprove(selectedPayment)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 shadow-xs"
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      <span>Approve & Activate Subscription</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => openRejectDialog(selectedPayment)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      className="h-11 rounded-xl border-rose-500/30 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400 font-semibold gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
              Select a payment from the list to inspect details.
            </div>
          )}
        </div>
      </div>

      {/* Reject Payment Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment Submission</DialogTitle>
            <DialogDescription>
              Please enter the reason for rejecting this payment. The shopkeeper will see this message in their notification feed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Reason for Rejection</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Muamala haujaonekana kwenye taarifa ya M-Pesa / Amount paid is insufficient"
                rows={4}
                className="text-xs"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">Suggestions:</span>
              <button
                type="button"
                onClick={() => setRejectionReason("Namba ya muamala haijapatikana kwenye taarifa yetu ya M-Pesa/HaloPesa.")}
                className="underline hover:text-foreground"
              >
                Kodi haionekani
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setRejectionReason("Kiasi kilicholipwa ni pungufu ya TZS 25,000 ya mwezi.")}
                className="underline hover:text-foreground"
              >
                Kiasi pungufu
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setRejectionReason("Muamala huu ulishathibitishwa au kutumika awali.")}
                className="underline hover:text-foreground"
              >
                Muamala ulishatumika
              </button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
              className="gap-1.5"
            >
              {rejectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Confirm Rejection</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enlarged Image Preview Dialog */}
      <Dialog open={Boolean(previewImage)} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-2xl p-2 bg-black/95 border-none">
          {previewImage && (
            <div className="flex items-center justify-center p-2">
              <img
                src={previewImage}
                alt="Receipt Full Preview"
                className="max-h-[80vh] w-auto rounded-lg object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
