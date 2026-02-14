import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, Trash2, Bell, Calendar, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTodos, useCreateTodo, useUpdateTodo, useDeleteTodo } from "@/hooks/useTodos";
import { format, parseISO, isPast } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Todo() {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", due_date: "", due_time: "", alert_date: "", alert_time: "" });

  const { data: todos, isLoading } = useTodos();
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const filtered = todos?.filter((t) => t.title.toLowerCase().includes(search.toLowerCase())) ?? [];

  const handleAdd = async () => {
    if (!form.title.trim()) {
      toast.error(language === "sw" ? "Ingiza kichwa" : "Enter a title");
      return;
    }
    let alert_at: string | undefined;
    if (form.alert_date && form.alert_time) {
      alert_at = `${form.alert_date}T${form.alert_time}:00`;
    } else if (form.alert_date) {
      alert_at = `${form.alert_date}T09:00:00`;
    }
    await createTodo.mutateAsync({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      due_date: form.due_date || undefined,
      due_time: form.due_time || undefined,
      alert_at,
    });
    setAddOpen(false);
    setForm({ title: "", description: "", due_date: "", due_time: "", alert_date: "", alert_time: "" });
  };

  const toggleComplete = (id: string, completed: boolean) => {
    updateTodo.mutate({ id, completed: !completed });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{language === "sw" ? "Orodha ya Kazi" : "To-Do List"}</h1>
          <p className="text-muted-foreground">{language === "sw" ? "Dhibitisha kazi na alerti" : "Manage tasks and set alerts"}</p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-48 md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={language === "sw" ? "Tafuta..." : "Search..."} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Button className="gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />{language === "sw" ? "Ongeza" : "Add"}
          </Button>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{language === "sw" ? "Ongeza Kazi" : "Add To-Do"}</DialogTitle></DialogHeader>
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
                <Label className="flex items-center gap-1"><Calendar className="h-4 w-4" />{language === "sw" ? "Tarehe" : "Due date"}</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{language === "sw" ? "Saa" : "Time"}</Label>
                <Input type="time" value={form.due_time} onChange={(e) => setForm({ ...form, due_time: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
              <Label className="flex items-center gap-1 text-primary"><Bell className="h-4 w-4" />{language === "sw" ? "Alerti" : "Alert"}</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">{language === "sw" ? "Tarehe" : "Date"}</Label>
                  <Input type="date" value={form.alert_date} onChange={(e) => setForm({ ...form, alert_date: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{language === "sw" ? "Saa" : "Time"}</Label>
                  <Input type="time" value={form.alert_time} onChange={(e) => setForm({ ...form, alert_time: e.target.value })} />
                </div>
              </div>
            </div>
            <Button className="w-full" onClick={handleAdd} disabled={!form.title.trim() || createTodo.isPending}>
              {createTodo.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "sw" ? "Hifadhi" : "Save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">{language === "sw" ? "Hakuna kazi bado. Ongeza kazi mpya." : "No tasks yet. Add a new to-do."}</div>
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
                    <p className={`font-medium ${todo.completed ? "line-through text-muted-foreground" : ""}`}>{todo.title}</p>
                    {todo.description && <p className="text-sm text-muted-foreground mt-0.5">{todo.description}</p>}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                      {todo.due_date && (
                        <span className={`flex items-center gap-1 ${todo.due_date && isPast(parseISO(todo.due_date)) && !todo.completed ? "text-destructive font-medium" : ""}`}>
                          <Calendar className="h-3 w-3" />
                          {format(parseISO(todo.due_date), "dd MMM yyyy")}
                          {todo.due_time && ` • ${todo.due_time.slice(0, 5)}`}
                        </span>
                      )}
                      {todo.alert_at && (
                        <span className="flex items-center gap-1"><Bell className="h-3 w-3" />{format(parseISO(todo.alert_at), "dd MMM HH:mm")}</span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => deleteTodo.mutate(todo.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
