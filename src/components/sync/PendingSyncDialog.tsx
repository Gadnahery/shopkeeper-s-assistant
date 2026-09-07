import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  RefreshCw,
  CloudOff,
  CloudCheck,
  AlertCircle,
  Clock,
  Trash2,
  CheckCircle2,
  Receipt,
  RotateCcw,
  Wifi,
  WifiOff,
  ShoppingBag,
} from "lucide-react";
import { useSyncQueue } from "@/hooks/useSyncQueue";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PendingSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PendingSyncDialog({ open, onOpenChange }: PendingSyncDialogProps) {
  const {
    isOnline,
    pendingActions,
    pendingCount,
    syncingCount,
    failedCount,
    totalCount,
    isSyncing,
    syncNow,
    discardAction,
    retryAction,
    retryAllFailed,
    clearAllFailed,
  } = useSyncQueue();

  const { language } = useLanguage();
  const { formatMoney } = useShopFormatting();

  const [itemToDiscard, setItemToDiscard] = useState<string | null>(null);
  const [confirmClearFailed, setConfirmClearFailed] = useState(false);

  const handleSyncAll = async () => {
    await syncNow();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 rounded-2xl border-border bg-card overflow-hidden">
          {/* Dialog Header */}
          <DialogHeader className="p-5 pb-4 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {isSyncing ? (
                    <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                  ) : failedCount > 0 ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : totalCount > 0 ? (
                    <Clock className="h-5 w-5 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <span>{language === "sw" ? "Msururu wa Usawazishaji wa Mauzo" : "Pending Offline Sync Queue"}</span>
                    {totalCount > 0 && (
                      <Badge variant="secondary" className="text-xs px-2 py-0.5 rounded-full font-bold">
                        {totalCount}
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    {language === "sw"
                      ? "Mauzo yaliyofanywa bila mtandao yanayotunzwa na kusawazishwa moja kwa moja mtandao unapopatikana."
                      : "Offline sales stored locally and replayed automatically when internet connectivity is active."}
                  </DialogDescription>
                </div>
              </div>

              {/* Online/Offline Status Pill */}
              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold bg-background">
                {isOnline ? (
                  <>
                    <Wifi className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-700 dark:text-emerald-400">
                      {language === "sw" ? "Mtandaoni" : "Online"}
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    <span className="text-amber-700 dark:text-amber-400">
                      {language === "sw" ? "Bila Mtandao" : "Offline"}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Status Bar */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground font-medium">
                  {language === "sw" ? "Inasubiri:" : "Pending:"}{" "}
                  <strong className="text-foreground">{pendingCount}</strong>
                </span>
                {syncingCount > 0 && (
                  <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    {language === "sw" ? "Inasawazisha:" : "Syncing:"}{" "}
                    <strong>{syncingCount}</strong>
                  </span>
                )}
                {failedCount > 0 && (
                  <span className="text-destructive font-bold flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {language === "sw" ? "Imeshindwa:" : "Failed:"}{" "}
                    <strong>{failedCount}</strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {failedCount > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmClearFailed(true)}
                      className="h-7 text-[11px] text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      {language === "sw" ? "Futa Zilizoshindwa" : "Clear Failed"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={retryAllFailed}
                      disabled={isSyncing || !isOnline}
                      className="h-7 text-[11px] gap-1"
                    >
                      <RotateCcw className="h-3 w-3" />
                      {language === "sw" ? "Jaribu Tena Zote" : "Retry All"}
                    </Button>
                  </>
                )}

                {totalCount > 0 && (
                  <Button
                    size="sm"
                    onClick={handleSyncAll}
                    disabled={isSyncing || !isOnline}
                    className="h-7 text-[11px] font-bold gap-1 bg-primary text-primary-foreground shadow-xs"
                  >
                    <RefreshCw className={cn("h-3 w-3", isSyncing && "animate-spin")} />
                    {isSyncing
                      ? language === "sw"
                        ? "Inasawazisha..."
                        : "Syncing..."
                      : language === "sw"
                      ? "Sawazisha Sasa"
                      : "Sync All Now"}
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Queue List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {totalCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  {language === "sw" ? "Hakuna mauzo yanayosubiri" : "All Sales Synchronized"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  {language === "sw"
                    ? "Mauzo yote yamesawazishwa vizuri kwenye seva. Ukipoteza mtandao, mauzo mapya yatahifadhiwa hapa kiotomatiki."
                    : "Every sale transaction is currently synchronized with the cloud server. Any offline sales will appear here automatically."}
                </p>
              </div>
            ) : (
              pendingActions.map((action) => {
                const rec = action.optimisticRecord;
                const isFailed = action.status === "failed";
                const isCurrentSyncing = action.status === "syncing";
                const itemsCount = rec?.sale_items?.length || (action.payload?.items as any[])?.length || 0;
                const totalAmt = rec?.total ?? 0;

                return (
                  <div
                    key={action.id}
                    className={cn(
                      "rounded-xl border p-3.5 text-xs transition-all",
                      isFailed
                        ? "border-destructive/40 bg-destructive/5"
                        : isCurrentSyncing
                        ? "border-blue-500/40 bg-blue-500/5 ring-1 ring-blue-500/20"
                        : "border-border bg-card hover:border-border/80"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground shrink-0">
                          <Receipt className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-foreground">
                              {rec?.invoice_number || "Offline Sale"}
                            </span>
                            {isFailed ? (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                                {language === "sw" ? "Imeshindwa" : "Failed"}
                              </Badge>
                            ) : isCurrentSyncing ? (
                              <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0 h-4 animate-pulse">
                                {language === "sw" ? "Inasawazisha..." : "Syncing..."}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                                {language === "sw" ? "Inasubiri" : "Pending"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {rec?.customer_name || (language === "sw" ? "Mteja wa kawaida" : "Walk-in Customer")} ·{" "}
                            {format(new Date(action.createdAt), "dd MMM yyyy, HH:mm")}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-foreground text-sm">{formatMoney(totalAmt)}</p>
                        <p className="text-[10px] text-muted-foreground">{rec?.payment_method || "Cash"}</p>
                      </div>
                    </div>

                    {/* Items brief preview */}
                    {rec?.sale_items && rec.sale_items.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex flex-wrap gap-1.5">
                        {rec.sale_items.map((it, idx) => (
                          <span
                            key={it.id || idx}
                            className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-foreground"
                          >
                            <span>{it.quantity}x {it.product_name}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Error message banner if failed */}
                    {isFailed && (
                      <div className="mt-2.5 rounded-lg bg-destructive/10 border border-destructive/20 p-2 text-destructive text-[11px] flex items-start gap-1.5">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold">
                            {language === "sw" ? "Hitilafu wakati wa kusawazisha:" : "Sync Conflict:"}
                          </p>
                          <p className="text-[10px] opacity-90 break-words mt-0.5">
                            {action.errorMessage || "Unknown server error"}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action buttons per row */}
                    <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-xs">
                      <span className="text-[10px] text-muted-foreground">
                        {action.retryCount > 0 && (
                          <span>
                            {language === "sw" ? `Majaribio: ${action.retryCount}` : `Retries: ${action.retryCount}`}
                          </span>
                        )}
                      </span>

                      <div className="flex items-center gap-2">
                        {isFailed ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setItemToDiscard(action.id)}
                              className="h-6 text-[11px] text-muted-foreground hover:text-destructive px-2"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              {language === "sw" ? "Batilisha / Futa" : "Discard"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => retryAction(action.id)}
                              disabled={isSyncing || !isOnline}
                              className="h-6 text-[11px] px-2"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              {language === "sw" ? "Jaribu Tena" : "Retry"}
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setItemToDiscard(action.id)}
                            className="h-6 text-[11px] text-muted-foreground hover:text-destructive px-2"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            {language === "sw" ? "Futa kwenye foleni" : "Cancel Queued"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Discard Confirmation Alert */}
      <AlertDialog open={!!itemToDiscard} onOpenChange={(open) => !open && setItemToDiscard(null)}>
        <AlertDialogContent className="rounded-2xl border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "sw" ? "Una uhakika unataka kufuta mauzo haya?" : "Discard Queued Sale?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              {language === "sw"
                ? "Mauzo haya hayajafika kwenye seva. Ukifuta sasa, taarifa zake zitapotea kabisa na hazitasawazishwa."
                : "This sale has not been synchronized with the cloud server yet. Discarding will permanently remove the record."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs rounded-xl">
              {language === "sw" ? "Hapana, Baki nayo" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (itemToDiscard) {
                  discardAction(itemToDiscard);
                  setItemToDiscard(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs rounded-xl"
            >
              {language === "sw" ? "Ndio, Futa" : "Yes, Discard"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Failed Confirmation */}
      <AlertDialog open={confirmClearFailed} onOpenChange={setConfirmClearFailed}>
        <AlertDialogContent className="rounded-2xl border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "sw" ? "Futa Mauzo Yote Yaliyoshindwa?" : "Clear All Failed Transactions?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              {language === "sw"
                ? "Vitendo vyote vilivyoshindwa kusawazishwa vitafutwa kwenye foleni."
                : "All failed transactions will be removed from your pending queue."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs rounded-xl">
              {language === "sw" ? "Ghairi" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearAllFailed();
                setConfirmClearFailed(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs rounded-xl"
            >
              {language === "sw" ? "Futa Zote" : "Clear All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
