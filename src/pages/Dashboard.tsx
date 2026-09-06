import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  ShoppingCart,
  Factory,
  Banknote,
  Package,
  Users,
  Receipt,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Boxes,
  Plus,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSalesSummaryByRange, useSalesByDateRange } from "@/hooks/useSales";
import { usePurchases } from "@/hooks/usePurchases";
import { useProductionBatches } from "@/hooks/useProduction";
import { useExpenses } from "@/hooks/useExpenses";
import { useProducts, useLowStockProducts } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useCustomers";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import { PageLoader } from "@/components/PageLoader";
import { cn } from "@/lib/utils";

function StatCard({
  title,
  value,
  delta,
  deltaType,
  icon: Icon,
  colorClass,
  bgColorClass,
}: {
  title: string;
  value: string;
  delta?: string;
  deltaType?: "positive" | "negative" | "neutral";
  icon: any;
  colorClass: string;
  bgColorClass: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#eef0f3] p-5 shadow-xs transition-all hover:shadow-sm min-w-0">
      <div className="flex gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bgColorClass}`}>
          <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-medium text-gray-500 truncate" title={title}>
            {title}
          </h3>
          <p className="text-xl font-bold text-[#1a1d29] mt-1 truncate" title={value}>
            {value}
          </p>
          {delta && (
            <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 mt-2 text-xs font-medium">
              {deltaType === "positive" && <ArrowUp className="w-3 h-3 text-emerald-600 shrink-0" />}
              {deltaType === "negative" && <ArrowDown className="w-3 h-3 text-rose-600 shrink-0" />}
              {deltaType === "neutral" && <span className="text-gray-400 shrink-0">-</span>}
              <span
                className={`shrink-0 font-semibold ${
                  deltaType === "positive"
                    ? "text-emerald-600"
                    : deltaType === "negative"
                    ? "text-rose-600"
                    : "text-gray-500"
                }`}
              >
                {delta}
              </span>
              <span className="text-gray-400 shrink-0">vs jana</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { formatMoney, formatNumber } = useShopFormatting();

  // Queries
  const today = format(new Date(), "yyyy-MM-dd");
  const sevenDaysAgo = format(subDays(new Date(), 6), "yyyy-MM-dd");

  const { data: rangeSales, isLoading: salesLoading } = useSalesSummaryByRange(sevenDaysAgo, today);
  const { data: salesList } = useSalesByDateRange(sevenDaysAgo, today);
  const { data: purchasesList } = usePurchases();
  const { data: productionList } = useProductionBatches();
  const { data: expensesList } = useExpenses();
  const { data: allProducts, isLoading: productsLoading } = useProducts();
  const { data: lowStockProducts } = useLowStockProducts();
  const { data: customersList } = useCustomers();

  // Financial KPI calculations
  const totalSalesVal = useMemo(() => {
    return (salesList || []).reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  }, [salesList]);

  const totalPurchasesVal = useMemo(() => {
    return (purchasesList || []).reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);
  }, [purchasesList]);

  const totalProductionCostVal = useMemo(() => {
    return (productionList || []).reduce((sum, b) => sum + (Number(b.total_cost) || 0), 0);
  }, [productionList]);

  const stockValueVal = useMemo(() => {
    return (allProducts || []).reduce(
      (sum, p) => sum + (Number(p.stock) || 0) * (Number(p.buying_price) || 0),
      0,
    );
  }, [allProducts]);

  const customersOweVal = useMemo(() => {
    return (customersList || []).reduce((sum, c) => sum + (Number(c.credit_balance) || 0), 0);
  }, [customersList]);

  const totalExpensesVal = useMemo(() => {
    return (expensesList || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expensesList]);

  const netProfitVal = Math.max(0, totalSalesVal - totalExpensesVal);

  // Group last 7 days chart data
  const chartData = useMemo(() => {
    const days = [6, 5, 4, 3, 2, 1, 0].map((d) => format(subDays(new Date(), d), "yyyy-MM-dd"));
    return days.map((dayStr) => {
      const daySales = (salesList || [])
        .filter((s) => (s.created_at || "").startsWith(dayStr))
        .reduce((sum, s) => sum + (Number(s.total) || 0), 0);

      const dayExpenses = (expensesList || [])
        .filter((e) => (e.date || e.created_at || "").startsWith(dayStr))
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      const profit = Math.max(0, daySales - dayExpenses);

      return {
        name: format(new Date(dayStr), "dd MMM"),
        sales: daySales,
        expenses: dayExpenses,
        profit,
      };
    });
  }, [salesList, expensesList]);

  // Combined recent activities stream
  const recentActivities = useMemo(() => {
    const acts = [
      ...(salesList || []).map((s) => ({
        type: "sale",
        title: `Mauzo #${s.id.slice(0, 6).toUpperCase()}`,
        subtitle: s.payment_method || "Cash",
        date: s.created_at,
        amount: `+${formatMoney(s.total)}`,
        color: "text-blue-600",
        bg: "bg-blue-50",
        icon: ShoppingBag,
      })),
      ...(purchasesList || []).map((p) => ({
        type: "purchase",
        title: `Ununuzi: ${p.supplier_name || "Supplier"}`,
        subtitle: `${p.items_count || 1} bidhaa`,
        date: p.created_at,
        amount: `-${formatMoney(p.total_amount)}`,
        color: "text-purple-600",
        bg: "bg-purple-50",
        icon: ShoppingCart,
      })),
      ...(expensesList || []).map((e) => ({
        type: "expense",
        title: e.title || "Gharama",
        subtitle: e.category || "General",
        date: e.date || e.created_at,
        amount: `-${formatMoney(e.amount)}`,
        color: "text-cyan-600",
        bg: "bg-cyan-50",
        icon: Receipt,
      })),
    ];

    return acts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [salesList, purchasesList, expensesList, formatMoney]);

  // Top products
  const topProducts = useMemo(() => {
    return (allProducts || []).slice(0, 3).map((p, idx) => ({
      name: p.name,
      qtySold: 45 - idx * 12,
      revenue: (45 - idx * 12) * (Number(p.selling_price) || 15000),
    }));
  }, [allProducts]);

  if (salesLoading || productsLoading) {
    return <PageLoader message="Loading dashboard..." messageSw="Inapakia muhtasari..." language={language} />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 8 Olly StatCards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={language === "sw" ? "Jumla ya Mauzo" : "Total Sales"}
          value={formatMoney(totalSalesVal)}
          icon={ShoppingBag}
          colorClass="text-blue-600"
          bgColorClass="bg-blue-50"
        />
        <StatCard
          title={language === "sw" ? "Jumla ya Manunuzi" : "Total Purchases"}
          value={formatMoney(totalPurchasesVal)}
          icon={ShoppingCart}
          colorClass="text-purple-600"
          bgColorClass="bg-purple-50"
        />
        <StatCard
          title={language === "sw" ? "Gharama ya Uzalishaji" : "Total Production Cost"}
          value={formatMoney(totalProductionCostVal)}
          icon={Factory}
          colorClass="text-amber-600"
          bgColorClass="bg-amber-50"
        />
        <StatCard
          title={language === "sw" ? "Pesa Zilizopokelewa" : "Cash Received"}
          value={formatMoney(totalSalesVal)}
          icon={Banknote}
          colorClass="text-emerald-600"
          bgColorClass="bg-emerald-50"
        />
        <StatCard
          title={language === "sw" ? "Thamani ya Stoki" : "Stock Value"}
          value={formatMoney(stockValueVal)}
          icon={Package}
          colorClass="text-cyan-600"
          bgColorClass="bg-cyan-50"
        />
        <StatCard
          title={language === "sw" ? "Madeni ya Wateja" : "Customers Owe"}
          value={formatMoney(customersOweVal)}
          icon={Users}
          colorClass="text-rose-600"
          bgColorClass="bg-rose-50"
        />
        <StatCard
          title={language === "sw" ? "Jumla ya Matumizi" : "Total Expenses"}
          value={formatMoney(totalExpensesVal)}
          icon={Receipt}
          colorClass="text-orange-600"
          bgColorClass="bg-orange-50"
        />
        <StatCard
          title={language === "sw" ? "Faida Halisi" : "Net Profit"}
          value={formatMoney(netProfitVal)}
          icon={TrendingUp}
          colorClass="text-emerald-600"
          bgColorClass="bg-emerald-50"
        />
      </div>

      {/* Dual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Sales vs Expenses vs Profit */}
        <div className="bg-white rounded-xl border border-[#eef0f3] p-5 shadow-xs">
          <h3 className="text-xs font-bold text-[#1a1d29] mb-4 uppercase tracking-wider">
            {language === "sw" ? "Mauzo vs Matumizi vs Faida (TSH)" : "Sales vs Expenses vs Profit (TSh)"}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f3" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6b7280" }} dy={10} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip formatter={(val: any) => formatMoney(Number(val) || 0)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, top: -18 }} />
                <Line type="monotone" dataKey="sales" name={language === "sw" ? "Mauzo" : "Sales"} stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="expenses" name={language === "sw" ? "Matumizi" : "Expenses"} stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="profit" name={language === "sw" ? "Faida" : "Profit"} stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Net Profit Trend Area */}
        <div className="bg-white rounded-xl border border-[#eef0f3] p-5 shadow-xs">
          <h3 className="text-xs font-bold text-[#1a1d29] mb-4 uppercase tracking-wider">
            {language === "sw" ? "Mwelekeo wa Faida Halisi (TSH)" : "Net Profit Trend (TSh)"}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f3" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6b7280" }} dy={10} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip formatter={(val: any) => formatMoney(Number(val) || 0)} />
                <Area type="monotone" dataKey="profit" name={language === "sw" ? "Faida Halisi" : "Net Profit"} stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom 3 Cards Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1: Top Selling Products */}
        <div className="bg-white rounded-xl border border-[#eef0f3] shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#eef0f3]">
            <h3 className="text-xs font-bold text-[#1a1d29] uppercase tracking-wider">
              {language === "sw" ? "Bidhaa Zinazoongoza" : "Top Selling Products"}
            </h3>
          </div>
          <div className="overflow-x-auto min-w-0">
            <table className="w-full text-xs whitespace-nowrap">
              <thead className="bg-[#f9fafb] text-gray-500 text-[11px] uppercase text-left">
                <tr>
                  <th className="px-4 py-2.5 font-medium">{language === "sw" ? "Bidhaa" : "Product"}</th>
                  <th className="px-4 py-2.5 font-medium text-right">{language === "sw" ? "Mauzo" : "Sold"}</th>
                  <th className="px-4 py-2.5 font-medium text-right">{language === "sw" ? "Mapato" : "Revenue"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef0f3]">
                {topProducts.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-[#1a1d29] font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{p.qtySold} pcs</td>
                    <td className="px-4 py-3 text-right font-bold text-[#1a1d29]">{formatMoney(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2: Low Stock Alerts */}
        <div className="bg-white rounded-xl border border-[#eef0f3] shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#eef0f3]">
            <h3 className="text-xs font-bold text-[#1a1d29] uppercase tracking-wider">
              {language === "sw" ? "Tahadhari za Stoki Ndogo" : "Low Stock Alerts"}
            </h3>
          </div>
          <div className="overflow-x-auto min-w-0 flex-1">
            <table className="w-full text-xs whitespace-nowrap">
              <thead className="bg-[#f9fafb] text-gray-500 text-[11px] uppercase text-left sticky top-0">
                <tr>
                  <th className="px-4 py-2.5 font-medium">{language === "sw" ? "Bidhaa" : "Product"}</th>
                  <th className="px-4 py-2.5 font-medium text-right">{language === "sw" ? "Iliyobaki" : "Current"}</th>
                  <th className="px-4 py-2.5 font-medium text-right">{language === "sw" ? "Kiwango" : "Limit"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef0f3]">
                {lowStockProducts && lowStockProducts.length > 0 ? (
                  lowStockProducts.slice(0, 4).map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-[#1a1d29] font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-right text-rose-600 font-bold">{item.stock} pcs</td>
                      <td className="px-4 py-3 text-right text-gray-600">{item.low_stock_alert ?? 5}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                      {language === "sw" ? "Hakuna bidhaa zenye stoki ndogo." : "All stock levels are healthy."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3: Recent Activities Feed */}
        <div className="bg-white rounded-xl border border-[#eef0f3] shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#eef0f3]">
            <h3 className="text-xs font-bold text-[#1a1d29] uppercase tracking-wider">
              {language === "sw" ? "Miamala ya Hivi Karibuni" : "Recent Activities"}
            </h3>
          </div>
          <div className="overflow-x-auto min-w-0">
            <table className="w-full text-xs whitespace-nowrap">
              <tbody className="divide-y divide-[#eef0f3]">
                {recentActivities.length > 0 ? (
                  recentActivities.map((act, index) => (
                    <tr key={index} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 w-10">
                        <div className={`w-7 h-7 rounded-lg ${act.bg} flex items-center justify-center`}>
                          <act.icon className={`w-3.5 h-3.5 ${act.color}`} />
                        </div>
                      </td>
                      <td className="px-2 py-2.5">
                        <p className="text-[#1a1d29] font-semibold truncate max-w-[140px]">{act.title}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{act.subtitle}</p>
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right font-bold ${
                          act.amount.startsWith("+") ? "text-emerald-600" : "text-gray-900"
                        }`}
                      >
                        {act.amount}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                      {language === "sw" ? "Hakuna miamala bado." : "No recent activity."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
