import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Trash2, Bell, Calendar as CalendarIcon, Loader2, Pencil } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTodos, useCreateTodo, useUpdateTodo, useDeleteTodo } from "@/hooks/useTodos";
import { useShopUsers } from "@/hooks/useShopUsers";
import { useDraftForm } from "@/hooks/useDraftForm";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { PageLoader } from "@/components/PageLoader";
import { PageHeader } from "@/components/common/PageHeader";

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = (i % 2) * 30;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

export default function Todo() {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<any>(null);
  const [todoToDeleteId, setTodoToDeleteId] = useState<string | null>(null);
  const initialTodoForm = { title: "", description: "", due_date: "", due_time: "", alert_date: "", alert_time: "", assigned_to_user_id: "" };
  const [addForm, setAddForm, clearAddTodoDraft] = useDraftForm("add-todo", initialTodoForm);
  const [form, setForm] = useState(initialTodoForm);

  const [mobilePage, setMobilePage] = useState(1);
  const MOBILE_PAGE_SIZE = 4;

  const { shopId } = useAuth();
  const { data: todos, isLoading } = useTodos();
  const { data: shopUsers } = useShopUsers(shopId ?? null);
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const filtered = todos?.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || (t.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesFilter = filter === "all" || (filter === "completed" && t.completed) || (filter === "active" && !t.completed);
    return matchesSearch && matchesFilter;
  }) ?? [];

  useEffect(() => {
    setMobilePage(1);
  }, [search, filter]);

  const totalMobilePages = Math.ceil(filtered.length / MOBILE_PAGE_SIZE) || 1;
  const currentMobileTodos = filtered.slice((mobilePage - 1) * MOBILE_PAGE_SIZE, mobilePage * MOBILE_PAGE_SIZE);

  if (todos === undefined || isLoading) {
    return <PageLoader message="Loading tasks..." messageSw="Inapakia kazi..." language={language} />;
  }

  const resetForm = () => {
    setForm({ title: "", description: "", due_date: "", due_time: "", alert_date: "", alert_time: "", assigned_to_user_id: "" });
  };

  const handleAdd = async () => {
    if (!addForm.title.trim()) {
      toast.error(language === "sw" ? "Ingiza kichwa" : "Enter a title");
      return;
    }
    let alert_at: string | undefined;
    if (addForm.alert_date && addForm.alert_time) {
      alert_at = `${addForm.alert_date}T${addForm.alert_time}:00`;
    } else if (addForm.alert_date) {
      alert_at = `${addForm.alert_date}T09:00:00`;
    }
    await createTodo.mutateAsync({
      title: addForm.title.trim(),
      description: addForm.description.trim() || undefined,
      due_date: addForm.due_date || undefined,
      due_time: addForm.due_time || undefined,
      alert_at,
      assigned_to_user_id: addForm.assigned_to_user_id || undefined,
    });
    clearAddTodoDraft();
    setAddOpen(false);
  };

  const handleEdit = async () => {
    if (!editingTodo || !form.title.trim()) {
      toast.error(language === "sw" ? "Ingiza kichwa" : "Enter a title");
      return;
    }
    let alert_at: string | undefined;
    if (form.alert_date && form.alert_time) {
      alert_at = `${form.alert_date}T${form.alert_time}:00`;
    } else if (form.alert_date) {
      alert_at = `${form.alert_date}T09:00:00`;
    } else {
      alert_at = null;
    }
    await updateTodo.mutateAsync({
      id: editingTodo.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      due_date: form.due_date || null,
      due_time: form.due_time || null,
      alert_at,
      assigned_to_user_id: form.assigned_to_user_id || null,
    });
    setEditingTodo(null);
    resetForm();
  };

  const openEditDialog = (todo: any) => {
    setEditingTodo(todo);
    const alertDate = todo.alert_at ? format(parseISO(todo.alert_at), "yyyy-MM-dd") : "";
    const alertTime = todo.alert_at ? format(parseISO(todo.alert_at), "HH:mm") : "";
    setForm({
      title: todo.title || "",
      description: todo.description || "",
      due_date: todo.due_date || "",
      due_time: todo.due_time || "",
      alert_date: alertDate,
      alert_time: alertTime,
      assigned_to_user_id: (todo as any).assigned_to_user_id || "",
    });
  };

  const toggleComplete = (id: string, completed: boolean) => {
    updateTodo.mutate({ id, completed: !completed });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6">
      <PageHeader
        title={language === "sw" ? "Orodha ya Kazi" : "To-Do List"}
        subtitle={language === "sw" ? "Dhibiti kazi, tarehe za mwisho, na alerti kwa timu yako." : "Manage tasks, due dates, and alerts for yourself and your team."}
        actions={
        <div className="flex w-full min-w-0 flex-wrap gap-2 xl:w-auto xl:justify-end">
          <div className="relative w-48 md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/60 dark:text-foreground/70 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" />
            <Input placeholder={language === "sw" ? "Tafuta..." : "Search..."} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-1 border border-border rounded-xl p-1 bg-muted/30">
            <Button
              variant={filter === "all" ? "default" : "ghost"}
              size="sm"
              className={filter === "all" ? "bg-neutral-950 text-white font-medium dark:bg-white dark:text-neutral-950 rounded-lg shadow-2xs text-xs" : "rounded-lg text-xs"}
              onClick={() => setFilter("all")}
            >
              {language === "sw" ? "Zote" : "All"}
            </Button>
            <Button
              variant={filter === "active" ? "default" : "ghost"}
              size="sm"
              className={filter === "active" ? "bg-neutral-950 text-white font-medium dark:bg-white dark:text-neutral-950 rounded-lg shadow-2xs text-xs" : "rounded-lg text-xs"}
              onClick={() => setFilter("active")}
            >
              {language === "sw" ? "Hazijakamilika" : "Active"}
            </Button>
            <Button
              variant={filter === "completed" ? "default" : "ghost"}
              size="sm"
              className={filter === "completed" ? "bg-neutral-950 text-white font-medium dark:bg-white dark:text-neutral-950 rounded-lg shadow-2xs text-xs" : "rounded-lg text-xs"}
              onClick={() => setFilter("completed")}
            >
              {language === "sw" ? "Zimekamilika" : "Completed"}
            </Button>
          </div>
          <Button className="gap-1.5 rounded-xl bg-neutral-950 px-3 text-xs font-medium text-white shadow-xs hover:bg-neutral-900 dark:bg-white dark:text-neutral-950" onClick={() => setAddOpen(true)} disabled={!shopId} title={!shopId ? (language === "sw" ? "Hakuna duka limetambuliwa" : "No shop identified") : undefined}>
            <Plus className="h-3.5 w-3.5 text-accent" />{language === "sw" ? "Ongeza" : "Add"}
          </Button>
        </div>
        }
      />

      {/* Add Sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-4 border-t border-border bg-card">
          <SheetHeader className="pb-3 border-b border-border">
            <SheetTitle className="text-sm font-bold">{language === "sw" ? "Ongeza Kazi" : "Add To-Do"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Kichwa" : "Title"} *</Label>
              <Input value={addForm.title} onChange={(e) => setAddForm({ ...addForm, title: e.target.value })} placeholder={language === "sw" ? "Kichwa cha kazi" : "Task title"} className="h-9 rounded-xl border-border text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Maelezo" : "Description"}</Label>
              <Input value={addForm.description} onChange={(e) => setAddForm({ ...addForm, description: e.target.value })} placeholder={language === "sw" ? "Maelezo mafupi" : "Brief description"} className="h-9 rounded-xl border-border text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs font-semibold text-foreground"><CalendarIcon className="h-3.5 w-3.5" />{language === "sw" ? "Tarehe" : "Due date"}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("h-9 w-full justify-start text-left font-normal rounded-xl text-xs border-border", !addForm.due_date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                      {addForm.due_date ? format(new Date(addForm.due_date), "PPP") : (language === "sw" ? "Chagua tarehe" : "Pick date")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                    <Calendar mode="single" selected={addForm.due_date ? new Date(addForm.due_date) : undefined} onSelect={(d) => setAddForm({ ...addForm, due_date: d ? format(d, "yyyy-MM-dd") : "" })} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Saa" : "Time"}</Label>
                <Select value={addForm.due_time} onValueChange={(v) => setAddForm({ ...addForm, due_time: v })}>
                  <SelectTrigger className="h-9 rounded-xl border-border text-xs"><SelectValue placeholder={language === "sw" ? "Chagua saa" : "Pick time"} /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {TIME_OPTIONS.map((t) => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Tuma kwa" : "Assign to"}</Label>
              <Select value={addForm.assigned_to_user_id || "__none__"} onValueChange={(v) => setAddForm({ ...addForm, assigned_to_user_id: v === "__none__" ? "" : v })}>
                <SelectTrigger className="h-9 rounded-xl border-border text-xs"><SelectValue placeholder={language === "sw" ? "Mteja wa kawaida (si lazima)" : "Unassigned (optional)"} /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="__none__" className="text-xs">{language === "sw" ? "Hakuna (kazi yangu)" : "None (my task)"}</SelectItem>
                  {shopUsers?.map((u) => (
                    <SelectItem key={(u as any).user_id} value={(u as any).user_id} className="text-xs">{(u as any).full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
              <Label className="flex items-center gap-1 text-xs font-semibold text-primary"><Bell className="h-3.5 w-3.5" />{language === "sw" ? "Alerti" : "Alert"}</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{language === "sw" ? "Tarehe" : "Date"}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-8 w-full justify-start text-left font-normal rounded-xl text-xs border-border", !addForm.alert_date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                        {addForm.alert_date ? format(new Date(addForm.alert_date), "PPP") : (language === "sw" ? "Chagua" : "Pick")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                      <Calendar mode="single" selected={addForm.alert_date ? new Date(addForm.alert_date) : undefined} onSelect={(d) => setAddForm({ ...addForm, alert_date: d ? format(d, "yyyy-MM-dd") : "" })} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{language === "sw" ? "Saa" : "Time"}</Label>
                  <Select value={addForm.alert_time} onValueChange={(v) => setAddForm({ ...addForm, alert_time: v })}>
                    <SelectTrigger className="h-8 rounded-xl border-border text-xs"><SelectValue placeholder={language === "sw" ? "Saa" : "Time"} /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {TIME_OPTIONS.map((t) => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => { clearAddTodoDraft(); setAddOpen(false); }} className="h-9 rounded-xl text-xs">{t("common.cancel")}</Button>
              <Button 
                className="h-9 gap-1.5 rounded-xl bg-neutral-950 font-medium text-white shadow-xs hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 text-xs px-4 transition-all" 
                onClick={handleAdd} 
                disabled={!addForm.title.trim() || createTodo.isPending}
              >
                {createTodo.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (language === "sw" ? "Hifadhi" : "Save")}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Sheet */}
      <Sheet open={!!editingTodo} onOpenChange={(open) => { if (!open) { setEditingTodo(null); resetForm(); } }}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-4 border-t border-border bg-card">
          <SheetHeader className="pb-3 border-b border-border">
            <SheetTitle className="text-sm font-bold">{language === "sw" ? "Hariri Kazi" : "Edit To-Do"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Kichwa" : "Title"} *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={language === "sw" ? "Kichwa cha kazi" : "Task title"} className="h-9 rounded-xl border-border text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Maelezo" : "Description"}</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={language === "sw" ? "Maelezo mafupi" : "Brief description"} className="h-9 rounded-xl border-border text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-xs font-semibold text-foreground"><CalendarIcon className="h-3.5 w-3.5" />{language === "sw" ? "Tarehe" : "Due date"}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("h-9 w-full justify-start text-left font-normal rounded-xl text-xs border-border", !form.due_date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                      {form.due_date ? format(new Date(form.due_date), "PPP") : (language === "sw" ? "Chagua tarehe" : "Pick date")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                    <Calendar mode="single" selected={form.due_date ? new Date(form.due_date) : undefined} onSelect={(d) => setForm({ ...form, due_date: d ? format(d, "yyyy-MM-dd") : "" })} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Saa" : "Time"}</Label>
                <Select value={form.due_time} onValueChange={(v) => setForm({ ...form, due_time: v })}>
                  <SelectTrigger className="h-9 rounded-xl border-border text-xs"><SelectValue placeholder={language === "sw" ? "Chagua saa" : "Pick time"} /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {TIME_OPTIONS.map((t) => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Tuma kwa" : "Assign to"}</Label>
              <Select value={form.assigned_to_user_id || "__none__"} onValueChange={(v) => setForm({ ...form, assigned_to_user_id: v === "__none__" ? "" : v })}>
                <SelectTrigger className="h-9 rounded-xl border-border text-xs"><SelectValue placeholder={language === "sw" ? "Mteja wa kawaida (si lazima)" : "Unassigned (optional)"} /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="__none__" className="text-xs">{language === "sw" ? "Hakuna (kazi yangu)" : "None (my task)"}</SelectItem>
                  {shopUsers?.map((u) => (
                    <SelectItem key={(u as any).user_id} value={(u as any).user_id} className="text-xs">{(u as any).full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 rounded-xl border border-border bg-muted/30 p-3">
              <Label className="flex items-center gap-1 text-xs font-semibold text-primary"><Bell className="h-3.5 w-3.5" />{language === "sw" ? "Alerti" : "Alert"}</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{language === "sw" ? "Tarehe" : "Date"}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-8 w-full justify-start text-left font-normal rounded-xl text-xs border-border", !form.alert_date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                        {form.alert_date ? format(new Date(form.alert_date), "PPP") : (language === "sw" ? "Chagua" : "Pick")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                      <Calendar mode="single" selected={form.alert_date ? new Date(form.alert_date) : undefined} onSelect={(d) => setForm({ ...form, alert_date: d ? format(d, "yyyy-MM-dd") : "" })} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{language === "sw" ? "Saa" : "Time"}</Label>
                  <Select value={form.alert_time} onValueChange={(v) => setForm({ ...form, alert_time: v })}>
                    <SelectTrigger className="h-8 rounded-xl border-border text-xs"><SelectValue placeholder={language === "sw" ? "Saa" : "Time"} /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {TIME_OPTIONS.map((t) => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <Button 
              className="w-full h-9 rounded-xl bg-neutral-950 font-medium text-white shadow-xs hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 text-xs transition-all" 
              onClick={handleEdit} 
              disabled={!form.title.trim() || updateTodo.isPending}
            >
              {updateTodo.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (language === "sw" ? "Hifadhi Mabadiliko" : "Save Changes")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {!shopId && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          {language === "sw" ? "Hakuna duka limetambuliwa. Ingia au usajili duka lako kwanza." : "No shop identified. Sign in or set up your shop first."}
        </div>
      )}
      {/* Mobile Card List with 4 items & Pagination */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground rounded-2xl border border-border bg-card p-6">
            {language === "sw" ? "Hakuna kazi bado. Ongeza kazi mpya." : "No tasks yet. Add a new to-do."}
          </div>
        ) : (
          <>
            <div className="space-y-2.5">
              {currentMobileTodos.map((todo) => (
                <div
                  key={todo.id}
                  className={`rounded-2xl border border-border bg-card p-3.5 shadow-xs transition-all flex items-start gap-3 ${todo.completed ? "opacity-60" : ""}`}
                >
                  <Checkbox checked={!!todo.completed} onCheckedChange={() => toggleComplete(todo.id, !!todo.completed)} className="mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${todo.completed ? "line-through text-foreground/50" : "text-foreground"}`}>{todo.title}</p>
                    {todo.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{todo.description}</p>}
                    {(todo as any).assigned_to_user_id && (
                      <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1">
                        {language === "sw" ? "Imetumwa kwa: " : "Assigned to: "}
                        {shopUsers?.find((u) => (u as any).user_id === (todo as any).assigned_to_user_id)?.full_name ?? (todo as any).assigned_to_user_id}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2.5 mt-2 text-[11px] text-muted-foreground">
                      {todo.due_date && (
                        <span className={`flex items-center gap-1 ${isPast(parseISO(todo.due_date)) && !todo.completed ? "text-destructive font-semibold" : ""}`}>
                          <CalendarIcon className="h-3 w-3" />
                          {format(parseISO(todo.due_date), "dd MMM yyyy")}
                          {todo.due_time && ` • ${todo.due_time.slice(0, 5)}`}
                        </span>
                      )}
                      {todo.alert_at && (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <Bell className="h-3 w-3" />
                          {format(parseISO(todo.alert_at), "dd MMM HH:mm")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => openEditDialog(todo)}>
                      <Pencil className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => setTodoToDeleteId(todo.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {totalMobilePages > 1 && (
              <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-xs">
                <span className="text-muted-foreground text-[11px]">
                  {mobilePage} / {totalMobilePages} ({filtered.length} {language === "sw" ? "kazi" : "tasks"})
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={mobilePage <= 1}
                    onClick={() => setMobilePage((p) => Math.max(1, p - 1))}
                    className="h-7 px-2.5 text-[11px] rounded-lg"
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={mobilePage >= totalMobilePages}
                    onClick={() => setMobilePage((p) => Math.min(totalMobilePages, p + 1))}
                    className="h-7 px-2.5 text-[11px] rounded-lg"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Desktop Card List (hidden md:block) */}
      <Card className="section-shell overflow-hidden hidden md:block">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-foreground/70 dark:text-foreground/80">{language === "sw" ? "Hakuna kazi bado. Ongeza kazi mpya." : "No tasks yet. Add a new to-do."}</div>
          ) : (
            <div className="divide-y">
              {filtered.map((todo) => (
                <motion.div
                  key={todo.id}
                  layout
                  className={`flex items-start gap-3 p-4 transition-colors hover:bg-muted/50 ${todo.completed ? "opacity-60" : ""}`}
                >
                  <Checkbox checked={!!todo.completed} onCheckedChange={() => toggleComplete(todo.id, !!todo.completed)} className="mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${todo.completed ? "line-through text-foreground/50 dark:text-foreground/50" : "text-foreground dark:text-foreground"}`}>{todo.title}</p>
                    {todo.description && <p className="text-sm text-foreground/70 dark:text-foreground/80 mt-0.5">{todo.description}</p>}
                    {(todo as any).assigned_to_user_id && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        {language === "sw" ? "Imetumwa kwa: " : "Assigned to: "}
                        {shopUsers?.find((u) => (u as any).user_id === (todo as any).assigned_to_user_id)?.full_name ?? (todo as any).assigned_to_user_id}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-foreground/70 dark:text-foreground/80">
                      {todo.due_date && (
                        <span className={`flex items-center gap-1 ${todo.due_date && isPast(parseISO(todo.due_date)) && !todo.completed ? "text-destructive font-medium dark:text-destructive" : ""}`}>
                          <CalendarIcon className="h-3 w-3" />
                          {format(parseISO(todo.due_date), "dd MMM yyyy")}
                          {todo.due_time && ` • ${todo.due_time.slice(0, 5)}`}
                        </span>
                      )}
                      {todo.alert_at && (
                        <span className="flex items-center gap-1">
                          <Bell className="h-3 w-3 dark:drop-shadow-[0_0_3px_rgba(251,191,36,0.3)]" />
                          {format(parseISO(todo.alert_at), "dd MMM HH:mm")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-500/10 dark:hover:bg-blue-500/20" onClick={() => openEditDialog(todo)}>
                      <Pencil className="h-4 w-4 text-blue-600 dark:text-blue-400 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20" onClick={() => setTodoToDeleteId(todo.id)}>
                      <Trash2 className="h-4 w-4 dark:drop-shadow-[0_0_4px_rgba(239,68,68,0.3)]" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!todoToDeleteId} onOpenChange={(open) => !open && setTodoToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirmDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("common.confirmDeleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => todoToDeleteId && deleteTodo.mutate(todoToDeleteId, { onSettled: () => setTodoToDeleteId(null) })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTodo.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
