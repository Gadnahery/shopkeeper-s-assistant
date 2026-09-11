import { useState, useMemo } from "react";
import {
  Trash2,
  RotateCcw,
  Search,
  AlertTriangle,
  Clock,
  Package,
  Tag,
  DollarSign,
  ClipboardList,
  Users,
  ShieldAlert,
  Loader2,
  Info,
  CheckCircle2,
} from "lucide-react";
import { format, formatDistanceToNow, differenceInHours, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import {
  useRecycleBinItems,
  useRestoreRecycleBinItem,
  usePermanentDeleteRecycleBinItem,
  useEmptyRecycleBin,
  type RecycleBinItem,
} from "@/hooks/useRecycleBin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type EntityFilter = "all" | "sales" | "products" | "expenses" | "orders";

export default function RecycleBin() {
  const { language } = useLanguage();
  const { formatMoney } = useShopFormatting();
  const { role, isOwner } = useAuth();
  const canManage = isOwner || role === "owner" || role === "manager";

  const [activeTab, setActiveTab] = useState<EntityFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [itemToRestore, setItemToRestore] = useState<RecycleBinItem | null>(null);
  const [itemToDeletePermanently, setItemToDeletePermanently] = useState<RecycleBinItem | null>(null);
  const [emptyBinDialogOpen, setEmptyBinDialogOpen] = useState(false);

  const { data: items = [], isLoading, isRefetching } = useRecycleBinItems(activeTab === "all" ? undefined : activeTab);
  const restoreItem = useRestoreRecycleBinItem();
  const deletePermanently = usePermanentDeleteRecycleBinItem();
  const emptyBin = useEmptyRecycleBin();

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((it) => {
      const nameMatch = (it.item_name || "").toLowerCase().includes(q);
      const deleterMatch = (it.deleted_by_name || "").toLowerCase().includes(q);
      const detailsMatch = JSON.stringify(it.item_details || {}).toLowerCase().includes(q);
      return nameMatch || deleterMatch || detailsMatch;
    });
  }, [items, searchQuery]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: items.length,
      sales: items.filter((i) => i.entity_type === "sales").length,
      products: items.filter((i) => i.entity_type === "products").length,
      expenses: items.filter((i) => i.entity_type === "expenses").length,
      orders: items.filter((i) => i.entity_type === "orders").length,
    };
  }, [items]);

  const getItemIcon = (type: string) => {
    switch (type) {
      case "sales":
        return <Tag className="h-4 w-4 text-emerald-500" />;
      case "products":
        return <Package className="h-4 w-4 text-blue-500" />;
      case "expenses":
        return <DollarSign className="h-4 w-4 text-amber-500" />;
      case "orders":
        return <ClipboardList className="h-4 w-4 text-purple-500" />;
      case "customers":
        return <Users className="h-4 w-4 text-indigo-500" />;
      default:
        return <Trash2 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getItemBadge = (type: string) => {
    switch (type) {
      case "sales":
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {language === "sw" ? "Mauzo" : "Sale"}
          </span>
        );
      case "products":
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            {language === "sw" ? "Bidhaa" : "Product"}
          </span>
        );
      case "expenses":
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {language === "sw" ? "Matumizi" : "Expense"}
          </span>
        );
      case "orders":
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            {language === "sw" ? "Agizo" : "Order"}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-muted text-muted-foreground">
            {type}
          </span>
        );
    }
  };

  const getExpirationBadge = (expiresAtStr: string) => {
    const expiresAt = new Date(expiresAtStr);
    const now = new Date();
    const hoursLeft = differenceInHours(expiresAt, now);
    const daysLeft = differenceInDays(expiresAt, now);

    if (hoursLeft <= 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive">
          <Clock className="h-3 w-3" />
          {language === "sw" ? "Muda umekwisha" : "Expiring now"}
        </span>
      );
    }

    if (hoursLeft < 24) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-[11px] font-bold text-destructive">
          <Clock className="h-3 w-3 animate-pulse" />
          {hoursLeft} {language === "sw" ? "saa zimebaki" : "hrs left"}
        </span>
      );
    }

    if (daysLeft <= 2) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
          <Clock className="h-3 w-3" />
          {daysLeft} {language === "sw" ? "siku zimebaki" : "days left"}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
        <Clock className="h-3 w-3" />
        {daysLeft} {language === "sw" ? "siku zimebaki" : "days left"}
      </span>
    );
  };

  const formatItemDetails = (item: RecycleBinItem) => {
    const d = item.item_details || {};
    switch (item.entity_type) {
      case "sales":
        return `${formatMoney(Number(d.total || 0))} • ${d.payment_method || "Cash"} • ${d.items_count || 1} items`;
      case "products":
        return `Price: ${formatMoney(Number(d.selling_price || 0))} • Stock: ${d.stock || 0} • ${d.category || "General"}`;
      case "expenses":
        return `${formatMoney(Number(d.amount || 0))} • Category: ${d.category || "General"}`;
      case "orders":
        return `${formatMoney(Number(d.total || 0))} • Status: ${d.status || "Pending"} • ${d.customer_name || "Customer"}`;
      default:
        return Object.entries(d).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(" • ");
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              {language === "sw" ? "Jalada la Taka" : "Recycle Bin"}
            </h1>
            <Badge variant="outline" className="font-semibold text-xs border-primary/30 text-primary bg-primary/5">
              {items.length} {language === "sw" ? "Vipengele" : "Items"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {language === "sw"
              ? "Vipengele vilivyofutwa huwekwa kwa siku 7 kabla ya kufutwa kabisa."
              : "Deleted items are kept for 7 days before being permanently removed."}
          </p>
        </div>

        {/* Action: Empty Bin */}
        {canManage && items.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setEmptyBinDialogOpen(true)}
            className="h-9 rounded-xl text-xs font-bold gap-1.5 shadow-sm"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{language === "sw" ? "Safisha Jalada Lote" : "Empty Recycle Bin"}</span>
          </Button>
        )}
      </div>

      {/* Info Notice Banner */}
      <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-foreground shadow-xs">
        <Info className="h-4 w-4 shrink-0 text-primary" />
        <div className="flex-1">
          <span className="font-semibold">
            {language === "sw" ? "Sera ya Uhifadhi wa Siku 7:" : "7-Day Retention Policy:"}
          </span>{" "}
          <span className="text-muted-foreground">
            {language === "sw"
              ? "Rekodi zote zilizofutwa zitaondolewa kiotomatiki mara tu siku 7 zikipita. Unaweza kurejesha rekodi yoyote wakati wowote kabla ya muda kuisha."
              : "All deleted records will be permanently purged once their 7-day timer expires. You can restore any item back to its active view anytime."}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: "all", label: language === "sw" ? "Zote" : "All", count: counts.all },
              { id: "sales", label: language === "sw" ? "Mauzo" : "Sales", count: counts.sales },
              { id: "products", label: language === "sw" ? "Bidhaa" : "Products", count: counts.products },
              { id: "expenses", label: language === "sw" ? "Matumizi" : "Expenses", count: counts.expenses },
              { id: "orders", label: language === "sw" ? "Maagizo" : "Orders", count: counts.orders },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all shrink-0",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/50"
              )}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px]",
                    activeTab === tab.id ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === "sw" ? "Tafuta kwenye jalada..." : "Search recycle bin..."}
            className="h-9 pl-9 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* Items List */}
      {isLoading ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-border bg-card p-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[240px] rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-3">
            <Trash2 className="h-6 w-6 opacity-60" />
          </div>
          <h3 className="text-sm font-bold text-foreground">
            {language === "sw" ? "Jalada la Taka ni Tupu" : "Recycle Bin is Empty"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            {searchQuery
              ? language === "sw"
                ? "Hakuna rekodi zilizopatikana kulingana na utafutaji wako."
                : "No deleted records match your search criteria."
              : language === "sw"
              ? "Hakuna rekodi zilizofutwa hivi karibuni. Rekodi zozote unazofuta zitawekwa hapa kwa siku 7."
              : "No deleted records found. Any items you delete across Sales, Inventory, Expenses, and Orders will appear here for 7 days."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-3">{language === "sw" ? "Kipengele" : "Item"}</th>
                  <th className="px-4 py-3">{language === "sw" ? "Aina" : "Type"}</th>
                  <th className="px-4 py-3">{language === "sw" ? "Maelezo" : "Details"}</th>
                  <th className="px-4 py-3">{language === "sw" ? "Alifuta / Tarehe" : "Deleted By"}</th>
                  <th className="px-4 py-3">{language === "sw" ? "Muda Uliobaki" : "Retention"}</th>
                  <th className="px-4 py-3 text-right">{language === "sw" ? "Vitendo" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    {/* Item Title & Icon */}
                    <td className="px-4 py-3 font-semibold text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted/60 border border-border/40">
                          {getItemIcon(item.entity_type)}
                        </div>
                        <div>
                          <div className="font-bold text-foreground truncate max-w-[200px] sm:max-w-[260px]">
                            {item.item_name || "Unnamed Item"}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            ID: {item.entity_id.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getItemBadge(item.entity_type)}
                    </td>

                    {/* Details */}
                    <td className="px-4 py-3 text-muted-foreground font-medium max-w-[240px] truncate">
                      {formatItemDetails(item)}
                    </td>

                    {/* Deleted By & Date */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-foreground text-xs">
                        {item.deleted_by_name || "User"}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {format(new Date(item.deleted_at), "dd MMM yyyy, hh:mm a")}
                      </div>
                    </td>

                    {/* Expiration Countdown */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getExpirationBadge(item.expires_at)}
                    </td>

                    {/* Actions: Restore & Permanent Delete */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Tooltip delayDuration={150}>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setItemToRestore(item)}
                              className="h-8 rounded-xl px-2.5 text-xs font-semibold gap-1 text-primary hover:text-primary hover:bg-primary/10 border-primary/20"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">{language === "sw" ? "Rejesha" : "Restore"}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            {language === "sw" ? "Rejesha kwenye orodha ya kazi" : "Restore back to active list"}
                          </TooltipContent>
                        </Tooltip>

                        {canManage && (
                          <Tooltip delayDuration={150}>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                aria-label="Delete permanently"
                                onClick={() => setItemToDeletePermanently(item)}
                                className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              {language === "sw" ? "Futa kabisa" : "Delete permanently"}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialog: Confirm Single Item Restore */}
      <AlertDialog open={!!itemToRestore} onOpenChange={(open) => !open && setItemToRestore(null)}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <RotateCcw className="h-5 w-5" />
              </div>
              <AlertDialogTitle className="text-base font-bold">
                {language === "sw" ? "Rejesha Rekodi Hii?" : "Restore This Record?"}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="text-xs text-muted-foreground leading-relaxed pt-2">
                {language === "sw" ? (
                  <>
                    Una uhakika unataka kurejesha{" "}
                    <strong className="text-foreground">{itemToRestore?.item_name}</strong>?
                    <br />
                    <br />
                    Rekodi hii itarudishwa mara moja kwenye orodha ya kazi ya{" "}
                    <strong className="text-foreground capitalize">{itemToRestore?.entity_type}</strong>, na
                    athari zake zote za kifedha au stoki zitasawazishwa upya.
                  </>
                ) : (
                  <>
                    Are you sure you want to restore{" "}
                    <strong className="text-foreground">{itemToRestore?.item_name}</strong>?
                    <br />
                    <br />
                    This record will immediately return to your active{" "}
                    <strong className="text-foreground capitalize">{itemToRestore?.entity_type}</strong> view,
                    and its corresponding inventory/financial figures will be synchronized.
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-2">
            <AlertDialogCancel className="h-9 rounded-xl text-xs">
              {language === "sw" ? "Ghairi" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={restoreItem.isPending}
              onClick={async (e) => {
                e.preventDefault();
                if (!itemToRestore?.id) return;
                try {
                  await restoreItem.mutateAsync(itemToRestore.id);
                  setItemToRestore(null);
                } catch {}
              }}
              className="h-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold gap-1.5"
            >
              {restoreItem.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              <span>{language === "sw" ? "Rejesha Sasa" : "Restore Now"}</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Confirm Permanent Delete Single Item */}
      <AlertDialog
        open={!!itemToDeletePermanently}
        onOpenChange={(open) => !open && setItemToDeletePermanently(null)}
      >
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <AlertDialogTitle className="text-base font-bold text-destructive">
                {language === "sw" ? "Futa Kabisa Rekodi Hii?" : "Permanently Delete Record?"}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="text-xs text-muted-foreground leading-relaxed pt-2">
                {language === "sw" ? (
                  <>
                    Una uhakika unataka kufuta kabisa{" "}
                    <strong className="text-foreground">{itemToDeletePermanently?.item_name}</strong> kutoka
                    kwenye Jalada la Taka?
                    <br />
                    <br />
                    <span className="text-destructive font-semibold">Onyo:</span> Kitendo hiki hakiwezi
                    kubadilishwa au kurejeshwa tena. Rekodi hii itaondolewa moja kwa moja kwenye seva.
                  </>
                ) : (
                  <>
                    Are you sure you want to permanently delete{" "}
                    <strong className="text-foreground">{itemToDeletePermanently?.item_name}</strong> from the
                    Recycle Bin?
                    <br />
                    <br />
                    <span className="text-destructive font-semibold">Warning:</span> This action is irreversible.
                    The record will be completely erased and cannot be recovered.
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-2">
            <AlertDialogCancel className="h-9 rounded-xl text-xs">
              {language === "sw" ? "Ghairi" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deletePermanently.isPending}
              onClick={async (e) => {
                e.preventDefault();
                if (!itemToDeletePermanently?.id) return;
                try {
                  await deletePermanently.mutateAsync(itemToDeletePermanently.id);
                  setItemToDeletePermanently(null);
                } catch {}
              }}
              className="h-9 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-bold gap-1.5"
            >
              {deletePermanently.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span>{language === "sw" ? "Futa Kabisa" : "Delete Permanently"}</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog: Confirm Empty Recycle Bin */}
      <AlertDialog open={emptyBinDialogOpen} onOpenChange={setEmptyBinDialogOpen}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <AlertDialogTitle className="text-base font-bold text-destructive">
                {language === "sw" ? "Safisha Jalada Lote la Taka?" : "Empty All Recycle Bin Records?"}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="text-xs text-muted-foreground leading-relaxed pt-2">
                {language === "sw" ? (
                  <>
                    Una uhakika unataka kusafisha rekodi zote{" "}
                    <strong className="text-foreground">{items.length}</strong> zilizopo kwenye Jalada la Taka?
                    <br />
                    <br />
                    <span className="text-destructive font-semibold">Onyo Kubwa:</span> Hatua hii itafuta
                    rekodi zote zilizofutwa kabisa na hazitaweza kurejeshwa tena kamwe.
                  </>
                ) : (
                  <>
                    Are you sure you want to permanently delete all{" "}
                    <strong className="text-foreground">{items.length}</strong> items currently in the Recycle
                    Bin?
                    <br />
                    <br />
                    <span className="text-destructive font-semibold">Caution:</span> All deleted sales,
                    products, expenses, and orders in the bin will be permanently eradicated and cannot be
                    recovered.
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-2">
            <AlertDialogCancel className="h-9 rounded-xl text-xs">
              {language === "sw" ? "Ghairi" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={emptyBin.isPending}
              onClick={async (e) => {
                e.preventDefault();
                try {
                  await emptyBin.mutateAsync();
                  setEmptyBinDialogOpen(false);
                } catch {}
              }}
              className="h-9 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-bold gap-1.5"
            >
              {emptyBin.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span>{language === "sw" ? "Ndio, Safisha Yote" : "Yes, Empty Recycle Bin"}</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
