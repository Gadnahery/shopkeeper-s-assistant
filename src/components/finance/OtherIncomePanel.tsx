import { useState } from "react";
import { ChevronRight, DollarSign, Loader2, Plus, Trash2, Pencil, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import { useCreateOtherIncome, useUpdateOtherIncome, useDeleteOtherIncome } from "@/hooks/useOtherIncome";
import type { OtherIncome } from "@/hooks/useOtherIncome";

const categories = ["Consulting", "Rent", "Grant", "Interest", "Other"];

export function OtherIncomePanel({ income }: { income: OtherIncome[] }) {
  const { language } = useLanguage();
  const { formatMoney } = useShopFormatting();
  const createIncome = useCreateOtherIncome();
  const updateIncome = useUpdateOtherIncome();
  const deleteIncome = useDeleteOtherIncome();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<OtherIncome | null>(null);
  const [form, setForm] = useState({
    title: "",
    category: "Other",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    payment_method: "Cash",
    notes: "",
  });

  const total = income.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const startCreate = () => {
    setEditingId(null);
    setSelected(null);
    setForm({
      title: "",
      category: "Other",
      amount: "",
      date: format(new Date(), "yyyy-MM-dd"),
      payment_method: "Cash",
      notes: "",
    });
    setShowForm(true);
  };

  const startEdit = (item: OtherIncome) => {
    setEditingId(item.id);
    setSelected(item);
    setForm({
      title: item.title,
      category: item.category,
      amount: String(item.amount),
      date: item.date,
      payment_method: item.payment_method ?? "Cash",
      notes: item.notes ?? "",
    });
    setShowForm(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || Number(form.amount) <= 0) return;

    if (editingId) {
      await updateIncome.mutateAsync({
        id: editingId,
        updates: {
          title: form.title.trim(),
          category: form.category,
          amount: Number(form.amount),
          date: form.date,
          payment_method: form.payment_method,
          notes: form.notes.trim() || null,
        },
      });
      setEditingId(null);
    } else {
      await createIncome.mutateAsync({
        ...form,
        title: form.title.trim(),
        amount: Number(form.amount),
        notes: form.notes.trim() || null,
      });
    }

    setForm({
      title: "",
      category: "Other",
      amount: "",
      date: format(new Date(), "yyyy-MM-dd"),
      payment_method: "Cash",
      notes: "",
    });
    setShowForm(false);
  };

  const isSaving = createIncome.isPending || updateIncome.isPending;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="flex-row items-center justify-between border-b border-border p-4">
          <div>
            <CardTitle className="text-sm font-bold">
              {language === "sw" ? "Mapato Mengine" : "Other Income"}
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {language === "sw"
                ? "Mapato yasiyotokana na mauzo ya kawaida ya bidhaa au huduma."
                : "Income not generated directly by product or service sales."}
            </p>
          </div>
          <Button onClick={startCreate} className="h-9 gap-1.5 rounded-xl text-xs">
            <Plus className="h-3.5 w-3.5" />
            {language === "sw" ? "Ongeza Mapato" : "Record Income"}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {income.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">
              {language === "sw" ? "Hakuna mapato mengine bado." : "No other income recorded yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-[11px] uppercase text-muted-foreground">
                    <th className="px-4 py-3">{language === "sw" ? "Tarehe" : "Date"}</th>
                    <th className="px-4 py-3">{language === "sw" ? "Chanzo" : "Source"}</th>
                    <th className="px-4 py-3">{language === "sw" ? "Aina" : "Category"}</th>
                    <th className="px-4 py-3 text-right">{language === "sw" ? "Kiasi" : "Amount"}</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {income.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => {
                        setSelected(item);
                        setShowForm(false);
                      }}
                      className="cursor-pointer border-b border-border/60 hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">
                        {format(new Date(item.date), "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">{item.title}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.category}</td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">
                        {formatMoney(item.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right Column: Form (Create/Edit) or Selected Detail or Total Card */}
      {showForm ? (
        <Card className="h-fit border-border shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold">
              {editingId
                ? language === "sw"
                  ? "Hariri Mapato"
                  : "Edit Other Income"
                : language === "sw"
                ? "Rekodi Mapato Mengine"
                : "Record Other Income"}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg"
              onClick={() => setShowForm(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-3">
              <div>
                <Label className="text-xs">{language === "sw" ? "Chanzo" : "Source"}</Label>
                <Input
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder={language === "sw" ? "Mfano: Kodi ya chumba" : "e.g. Room rental"}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs">{language === "sw" ? "Kategoria" : "Category"}</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm({ ...form, category: value })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category} className="text-xs">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">{language === "sw" ? "Kiasi (TZS)" : "Amount (TZS)"}</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.amount}
                  onChange={(event) => setForm({ ...form, amount: event.target.value })}
                  required
                  className="h-9 text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">{language === "sw" ? "Tarehe" : "Date"}</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(event) => setForm({ ...form, date: event.target.value })}
                    required
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">{language === "sw" ? "Njia ya Malipo" : "Payment Method"}</Label>
                  <Select
                    value={form.payment_method}
                    onValueChange={(value) => setForm({ ...form, payment_method: value })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash" className="text-xs">Cash</SelectItem>
                      <SelectItem value="M-Pesa" className="text-xs">M-Pesa</SelectItem>
                      <SelectItem value="HaloPesa" className="text-xs">HaloPesa</SelectItem>
                      <SelectItem value="Bank" className="text-xs">Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs">{language === "sw" ? "Maelezo ya Ziada (Si lazima)" : "Notes (Optional)"}</Label>
                <Input
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  placeholder={language === "sw" ? "Maelezo..." : "Notes..."}
                  className="h-9 text-xs"
                />
              </div>

              <Button
                type="submit"
                disabled={isSaving}
                className="w-full h-10 rounded-xl gap-2 font-semibold text-xs"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <DollarSign className="h-4 w-4" />
                )}
                <span>
                  {editingId
                    ? language === "sw"
                      ? "Sasisha Mapato"
                      : "Update Income"
                    : language === "sw"
                    ? "Hifadhi Mapato"
                    : "Save Income"}
                </span>
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : selected ? (
        <Card className="h-fit border-border shadow-xs">
          <CardHeader className="flex-row items-start justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">{selected.title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{selected.category}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => startEdit(selected)}
                aria-label="Edit income"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (window.confirm(language === "sw" ? "Futa mapato haya?" : "Delete this income?")) {
                    deleteIncome.mutate(selected.id);
                    setSelected(null);
                  }
                }}
                aria-label="Delete income"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-foreground">{formatMoney(selected.amount)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {format(new Date(selected.date), "PPP")} · {selected.payment_method}
              </p>
            </div>
            {selected.notes && (
              <p className="rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground">
                {selected.notes}
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => startEdit(selected)}
              className="w-full gap-1.5 text-xs h-8"
            >
              <Pencil className="h-3 w-3" />
              <span>{language === "sw" ? "Hariri Mapato Haya" : "Edit This Record"}</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="h-fit border-border bg-muted/20 shadow-xs">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">
              {language === "sw" ? "Jumla ya Mapato Mengine" : "Total Other Income"}
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">{formatMoney(total)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {income.length} {language === "sw" ? "miamala iliyorekodiwa" : "transactions recorded"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}