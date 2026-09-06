import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  AlertCircle,
  PackageX,
  CreditCard,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { useLowStockProducts } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useCustomers";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import { PageLoader } from "@/components/PageLoader";
import { PageHeader } from "@/components/common/PageHeader";

export default function Notifications() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { formatCurrency } = useShopFormatting();
  const { data: dbNotifications, isLoading: notifsLoading, markAsRead, markAllRead, unreadCount } = useNotifications();
  const { data: lowStockProducts, isLoading: stockLoading } = useLowStockProducts();
  const { data: customers } = useCustomers();

  const [activeTab, setActiveTab] = useState<"all" | "unread" | "stock" | "debts">("all");

  // Format low-stock alerts
  const stockAlerts = useMemo(() => {
    return (lowStockProducts || []).map((prod) => ({
      id: `stock-${prod.id}`,
      type: "stock",
      title: language === "sw" ? `Bidhaa Imepungua: ${prod.name}` : `Low Stock: ${prod.name}`,
      message:
        language === "sw"
          ? `Zimebaki ${prod.current_stock} pekee (Kiwango cha chini: ${prod.min_stock_alert ?? 5}). Ongeza oda mpya.`
          : `Only ${prod.current_stock} left in stock (Min reorder point: ${prod.min_stock_alert ?? 5}). Reorder now.`,
      link: "/purchases?new=true",
      linkText: language === "sw" ? "Agiza Upya" : "Reorder Stock",
      created_at: prod.updated_at || new Date().toISOString(),
      is_unread: true,
      severity: prod.current_stock <= 0 ? "critical" : "warning",
    }));
  }, [lowStockProducts, language]);

  // Format debt reminders
  const debtAlerts = useMemo(() => {
    return (customers || [])
      .filter((c) => Number(c.credit_balance) > 0)
      .map((c) => ({
        id: `debt-${c.id}`,
        type: "debt",
        title: language === "sw" ? `Deni la Mteja: ${c.name}` : `Outstanding Debt: ${c.name}`,
        message:
          language === "sw"
            ? `Ana deni la ${formatCurrency(Number(c.credit_balance))}. Mawasiliano: ${c.phone || "Hakuna simu"}`
            : `Has an outstanding balance of ${formatCurrency(Number(c.credit_balance))}. Phone: ${c.phone || "N/A"}`,
        link: `/customers/${c.id}`,
        linkText: language === "sw" ? "Tazama Mteja" : "View Customer",
        created_at: c.updated_at || new Date().toISOString(),
        is_unread: true,
        severity: "warning",
      }));
  }, [customers, formatCurrency, language]);

  // Combined system feed
  const combinedAlerts = useMemo(() => {
    const rawDb = (dbNotifications || []).map((n) => ({
      id: String(n.id),
      type: "system",
      title: n.title,
      message: n.message,
      link: n.link || null,
      linkText: language === "sw" ? "Tazama" : "View",
      created_at: n.created_at,
      is_unread: !n.read_at,
      severity: "info",
    }));

    let list = [...stockAlerts, ...debtAlerts, ...rawDb];

    // Sort newest first
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (activeTab === "unread") {
      list = list.filter((i) => i.is_unread);
    } else if (activeTab === "stock") {
      list = list.filter((i) => i.type === "stock");
    } else if (activeTab === "debts") {
      list = list.filter((i) => i.type === "debt");
    }

    return list;
  }, [dbNotifications, stockAlerts, debtAlerts, activeTab, language]);

  if (notifsLoading || stockLoading) {
    return <PageLoader message="Loading notifications..." messageSw="Inapakia arifa..." language={language} />;
  }

  const totalActionable = (unreadCount || 0) + stockAlerts.length + debtAlerts.length;

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title={language === "sw" ? "Arifa & Taarifa za Duka" : "Notifications & Store Alerts"}
        subtitle={
          language === "sw"
            ? "Fuatilia arifa za duka, tahadhari za akiba ya bidhaa, na madeni ya wateja kwa wakati."
            : "Monitor store activity, low stock alerts, and customer debt reminders in real-time."
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={unreadCount === 0}
              className="gap-1.5 rounded-xl border-border bg-card text-xs font-semibold text-foreground shadow-xs hover:bg-muted"
            >
              <CheckCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              {language === "sw" ? "Weka zote zimesomwa" : "Mark all read"}
            </Button>
          </div>
        }
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/70 pb-3">
        <Button
          variant={activeTab === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("all")}
          className={`h-8 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "all"
              ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-xs"
              : "border-border/70 bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          {language === "sw" ? "Zote" : "All"} ({stockAlerts.length + debtAlerts.length + (dbNotifications?.length || 0)})
        </Button>
        <Button
          variant={activeTab === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("unread")}
          className={`h-8 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "unread"
              ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-xs"
              : "border-border/70 bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          {language === "sw" ? "Zisizosomwa" : "Unread"} ({totalActionable})
        </Button>
        <Button
          variant={activeTab === "stock" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("stock")}
          className={`h-8 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "stock"
              ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-xs"
              : "border-border/70 bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          <PackageX className="mr-1 h-3.5 w-3.5 text-amber-500" />
          {language === "sw" ? "Bidhaa Zilizopungua" : "Low Stock"} ({stockAlerts.length})
        </Button>
        <Button
          variant={activeTab === "debts" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("debts")}
          className={`h-8 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "debts"
              ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-xs"
              : "border-border/70 bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          <CreditCard className="mr-1 h-3.5 w-3.5 text-rose-500" />
          {language === "sw" ? "Madeni ya Wateja" : "Debts Due"} ({debtAlerts.length})
        </Button>
      </div>

      {/* Notifications List */}
      <Card className="rounded-2xl border border-border/80 bg-card shadow-xs">
        <CardContent className="divide-y divide-border/60 p-0">
          {combinedAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
                <Bell className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">
                {language === "sw" ? "Hakuna arifa kwa sasa" : "No notifications right now"}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {language === "sw"
                  ? "Duka lako liko salama, bidhaa zote ziko katika viwango salama na hakuna tahadhari."
                  : "Everything in your business is running smoothly with no immediate alerts."}
              </p>
            </div>
          ) : (
            combinedAlerts.map((item) => {
              const isStock = item.type === "stock";
              const isDebt = item.type === "debt";

              return (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/30 ${
                    item.is_unread ? "bg-primary/[0.02] dark:bg-primary/[0.04]" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        isStock
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : isDebt
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {isStock ? (
                        <PackageX className="h-4 w-4" />
                      ) : isDebt ? (
                        <CreditCard className="h-4 w-4" />
                      ) : (
                        <Bell className="h-4 w-4" />
                      )}
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-foreground">{item.title}</p>
                        {item.is_unread && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      {item.message ? (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {item.message}
                        </p>
                      ) : null}
                      <p className="text-[10px] text-muted-foreground/80 pt-0.5">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-12 sm:pl-0 shrink-0">
                    {item.link ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          if (item.type === "system" && item.is_unread) {
                            markAsRead.mutate(item.id);
                          }
                          navigate(item.link);
                        }}
                        className="h-8 gap-1 rounded-xl bg-neutral-950 px-3 text-xs font-semibold text-white shadow-xs hover:bg-neutral-900 dark:bg-white dark:text-neutral-950"
                      >
                        <span>{item.linkText}</span>
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    ) : item.type === "system" && item.is_unread ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead.mutate(item.id)}
                        className="h-8 rounded-xl text-xs text-muted-foreground hover:text-foreground"
                      >
                        {language === "sw" ? "Weka imesomwa" : "Mark read"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

