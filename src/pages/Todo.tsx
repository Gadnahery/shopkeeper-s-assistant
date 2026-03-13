import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

  const { shopId, user } = useAuth();
  const { data: todos, isLoading } = useTodos();
  const { data: shopUsers } = useShopUsers(shopId ?? null);
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  if (todos === undefined || isLoading) {
    return <PageLoader message="Loading tasks..." messageSw="Inapakia kazi..." language={language} />;
  }

  const filtered = todos?.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || (t.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesFilter = filter === "all" || (filter === "completed" && t.completed) || (filter === "active" && !t.completed);
    return matchesSearch && matchesFilter;
  }) ?? [];

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
          <div className="flex gap-1 border rounded-lg p-1 bg-muted/30">
            <Button
              variant={filter === "all" ? "default" : "ghost"}
              size="sm"
              className={filter === "all" ? "bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white shadow-md" : ""}
              onClick={() => setFilter("all")}
            >
              {language === "sw" ? "Zote" : "All"}
            </Button>
            <Button
              variant={filter === "active" ? "default" : "ghost"}
              size="sm"
              className={filter === "active" ? "bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white shadow-md" : ""}
              onClick={() => setFilter("active")}
            >
              {language === "sw" ? "Hazijakamilika" : "Active"}
            </Button>
            <Button
              variant={filter === "completed" ? "default" : "ghost"}
              size="sm"
              className={filter === "completed" ? "bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white shadow-md" : ""}
              onClick={() => setFilter("completed")}
            >
              {language === "sw" ? "Zimekamilika" : "Completed"}
            </Button>
          </div>
          <Button className="gap-2 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30" onClick={() => setAddOpen(true)} disabled={!shopId} title={!shopId ? (language === "sw" ? "Hakuna duka limetambuliwa" : "No shop identified") : undefined}>
            <Plus className="h-4 w-4" />{language === "sw" ? "Ongeza" : "Add"}
          </Button>
        </div>
        }
      />

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{language === "sw" ? "Ongeza Kazi" : "Add To-Do"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{language === "sw" ? "Kichwa" : "Title"} *</Label>
              <Input value={addForm.title} onChange={(e) => setAddForm({ ...addForm, title: e.target.value })} placeholder={language === "sw" ? "Kichwa cha kazi" : "Task title"} />
            </div>
            <div className="space-y-2">
              <Label>{language === "sw" ? "Maelezo" : "Description"}</Label>
              <Input value={addForm.description} onChange={(e) => setAddForm({ ...addForm, description: e.target.value })} placeholder={language === "sw" ? "Maelezo mafupi" : "Brief description"} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><CalendarIcon className="h-4 w-4" />{language === "sw" ? "Tarehe" : "Due date"}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !addForm.due_date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {addForm.due_date ? format(new Date(addForm.due_date), "PPP") : (language === "sw" ? "Chagua tarehe" : "Pick date")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={addForm.due_date ? new Date(addForm.due_date) : undefined} onSelect={(d) => setAddForm({ ...addForm, due_date: d ? format(d, "yyyy-MM-dd") : "" })} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>{language === "sw" ? "Saa" : "Time"}</Label>
                <Select value={addForm.due_time} onValueChange={(v) => setAddForm({ ...addForm, due_time: v })}>
                  <SelectTrigger><SelectValue placeholder={language === "sw" ? "Chagua saa" : "Pick time"} /></SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{language === "sw" ? "Tuma kwa" : "Assign to"}</Label>
              <Select value={addForm.assigned_to_user_id || "__none__"} onValueChange={(v) => setAddForm({ ...addForm, assigned_to_user_id: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder={language === "sw" ? "Mteja wa kawaida (si lazima)" : "Unassigned (optional)"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{language === "sw" ? "Hakuna (kazi yangu)" : "None (my task)"}</SelectItem>
                  {shopUsers?.map((u) => (
                    <SelectItem key={(u as any).user_id} value={(u as any).user_id}>{(u as any).full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
              <Label className="flex items-center gap-1 text-primary"><Bell className="h-4 w-4" />{language === "sw" ? "Alerti" : "Alert"}</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-foreground/70 dark:text-foreground/80">{language === "sw" ? "Tarehe" : "Date"}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("w-full justify-start text-left font-normal", !addForm.alert_date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {addForm.alert_date ? format(new Date(addForm.alert_date), "PPP") : (language === "sw" ? "Chagua" : "Pick")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={addForm.alert_date ? new Date(addForm.alert_date) : undefined} onSelect={(d) => setAddForm({ ...addForm, alert_date: d ? format(d, "yyyy-MM-dd") : "" })} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{language === "sw" ? "Saa" : "Time"}</Label>
                  <Select value={addForm.alert_time} onValueChange={(v) => setAddForm({ ...addForm, alert_time: v })}>
                    <SelectTrigger className="h-9"><SelectValue placeholder={language === "sw" ? "Saa" : "Time"} /></SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => { clearAddTodoDraft(); setAddOpen(false); }}>{t("common.cancel")}</Button>
              <Button 
                className="gap-2 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30 transition-all" 
                onClick={handleAdd} 
                disabled={!addForm.title.trim() || createTodo.isPending}
              >
                {createTodo.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "sw" ? "Hifadhi" : "Save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingTodo} onOpenChange={(open) => { if (!open) { setEditingTodo(null); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{language === "sw" ? "Hariri Kazi" : "Edit To-Do"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>{language === "sw" ? "Kichwa" : "Title"} *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={language === "sw" ? "Kichwa cha kazi" : "Task title"} />
            </div>
            <div className="space-y-2">
              <Label>{language === "sw" ? "Maelezo" : "Description"}</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={language === "sw" ? "Maelezo mafupi" : "Brief description"} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><CalendarIcon className="h-4 w-4" />{language === "sw" ? "Tarehe" : "Due date"}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.due_date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.due_date ? format(new Date(form.due_date), "PPP") : (language === "sw" ? "Chagua tarehe" : "Pick date")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={form.due_date ? new Date(form.due_date) : undefined} onSelect={(d) => setForm({ ...form, due_date: d ? format(d, "yyyy-MM-dd") : "" })} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>{language === "sw" ? "Saa" : "Time"}</Label>
                <Select value={form.due_time} onValueChange={(v) => setForm({ ...form, due_time: v })}>
                  <SelectTrigger><SelectValue placeholder={language === "sw" ? "Chagua saa" : "Pick time"} /></SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{language === "sw" ? "Tuma kwa" : "Assign to"}</Label>
              <Select value={form.assigned_to_user_id || "__none__"} onValueChange={(v) => setForm({ ...form, assigned_to_user_id: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder={language === "sw" ? "Mteja wa kawaida (si lazima)" : "Unassigned (optional)"} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{language === "sw" ? "Hakuna (kazi yangu)" : "None (my task)"}</SelectItem>
                  {shopUsers?.map((u) => (
                    <SelectItem key={(u as any).user_id} value={(u as any).user_id}>{(u as any).full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
              <Label className="flex items-center gap-1 text-primary"><Bell className="h-4 w-4" />{language === "sw" ? "Alerti" : "Alert"}</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-foreground/70 dark:text-foreground/80">{language === "sw" ? "Tarehe" : "Date"}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("w-full justify-start text-left font-normal", !form.alert_date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.alert_date ? format(new Date(form.alert_date), "PPP") : (language === "sw" ? "Chagua" : "Pick")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={form.alert_date ? new Date(form.alert_date) : undefined} onSelect={(d) => setForm({ ...form, alert_date: d ? format(d, "yyyy-MM-dd") : "" })} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{language === "sw" ? "Saa" : "Time"}</Label>
                  <Select value={form.alert_time} onValueChange={(v) => setForm({ ...form, alert_time: v })}>
                    <SelectTrigger className="h-9"><SelectValue placeholder={language === "sw" ? "Saa" : "Time"} /></SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30 transition-all" 
              onClick={handleEdit} 
              disabled={!form.title.trim() || updateTodo.isPending}
            >
              {updateTodo.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "sw" ? "Hifadhi Mabadiliko" : "Save Changes")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {!shopId && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          {language === "sw" ? "Hakuna duka limetambuliwa. Ingia au usajili duka lako kwanza." : "No shop identified. Sign in or set up your shop first."}
        </div>
      )}
      <Card className="section-shell overflow-hidden">
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
