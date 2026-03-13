import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Users, DollarSign, Calendar, Loader2, Trash2, Pencil } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDraftForm } from "@/hooks/useDraftForm";
import { toast } from "sonner";
import { PageLoader } from "@/components/PageLoader";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/common/PageHeader";

export default function HRM() {
  const { language } = useLanguage();
  const { shopId } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [staffToDeleteId, setStaffToDeleteId] = useState<string | null>(null);
  const initialStaffForm = { full_name: "", phone: "", email: "", position: "Staff", department: "", salary: "", status: "active" };
  const [form, setForm, clearAddStaffDraft] = useDraftForm("add-staff", initialStaffForm);

  const { data: staffList, isLoading } = useQuery({
    queryKey: ["staff", shopId],
    queryFn: async () => {
      const { data, error } = await supabase.from("staff").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!shopId,
  });

  const addStaff = useMutation({
    mutationFn: async (staff: any) => {
      const { error } = await supabase.from("staff").insert({ ...staff, shop_id: shopId });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["staff"] }); toast.success("Staff added"); setIsAddOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateStaff = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase.from("staff").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["staff"] }); toast.success("Staff updated"); setEditingStaff(null); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteStaff = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("staff").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["staff"] }); toast.success("Staff removed"); },
  });

  if (staffList === undefined || isLoading) {
    return <PageLoader message="Loading HRM..." messageSw="Inapakia wafanyakazi..." language={language} />;
  }

  const filtered = staffList?.filter(s => s.full_name.toLowerCase().includes(searchTerm.toLowerCase())) || [];
  const totalSalary = staffList?.reduce((sum, s) => sum + Number(s.salary || 0), 0) || 0;

  const handleAdd = () => {
    addStaff.mutate(
      { full_name: form.full_name, phone: form.phone || null, email: form.email || null, position: form.position, department: form.department || null, salary: parseFloat(form.salary) || 0, status: form.status },
      { onSuccess: () => clearAddStaffDraft() }
    );
  };

  const handleEditSave = () => {
    if (!editingStaff) return;
    updateStaff.mutate({ id: editingStaff.id, full_name: editingStaff.full_name, phone: editingStaff.phone || null, email: editingStaff.email || null, position: editingStaff.position, department: editingStaff.department || null, salary: parseFloat(editingStaff.salary) || 0, status: editingStaff.status });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0 space-y-6">
      <PageHeader
        title={language === "sw" ? "Rasilimali Watu" : "Human Resources"}
        subtitle={language === "sw" ? "Simamia wafanyakazi, hali ya ajira, na gharama za mishahara kwa mtazamo wa kisasa." : "Manage staff records, employment status, and payroll costs in a modern workspace."}
        actions={
          <div className="flex w-full min-w-0 flex-wrap gap-2 xl:w-auto xl:justify-end">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder={language === "sw" ? "Tafuta..." : "Search staff..."} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild><Button className="gap-2 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30"><Plus className="h-4 w-4" />{language === "sw" ? "Ongeza" : "Add Staff"}</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{language === "sw" ? "Ongeza Mfanyakazi" : "Add New Staff"}</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2"><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Position</Label><Select value={form.position} onValueChange={v => setForm({...form, position: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Staff">Staff</SelectItem><SelectItem value="Manager">Manager</SelectItem><SelectItem value="Cashier">Cashier</SelectItem><SelectItem value="HR">HR</SelectItem><SelectItem value="Security">Security</SelectItem><SelectItem value="Cleaner">Cleaner</SelectItem></SelectContent></Select></div>
                    <div className="space-y-2"><Label>Department</Label><Input value={form.department} onChange={e => setForm({...form, department: e.target.value})} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Salary (Tsh)</Label><Input type="number" value={form.salary} onChange={e => setForm({...form, salary: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={v => setForm({...form, status: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => { clearAddStaffDraft(); setIsAddOpen(false); }}>{language === "sw" ? "Ghairi" : "Cancel"}</Button>
                    <Button className="gap-2 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30 transition-all" onClick={handleAdd} disabled={!form.full_name || addStaff.isPending}>
                      {addStaff.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "sw" ? "Hifadhi" : "Save Staff")}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="section-shell"><CardContent className="flex items-center gap-4 p-6"><div className="rounded-xl bg-primary/10 p-3"><Users className="h-6 w-6 text-primary" /></div><div><p className="text-sm text-muted-foreground">{language === "sw" ? "Wafanyakazi Wote" : "Total Staff"}</p><p className="text-xl font-bold">{staffList?.length || 0}</p></div></CardContent></Card>
        <Card className="section-shell"><CardContent className="flex items-center gap-4 p-6"><div className="rounded-xl bg-secondary/10 p-3"><DollarSign className="h-6 w-6 text-secondary" /></div><div><p className="text-sm text-muted-foreground">{language === "sw" ? "Mishahara ya Mwezi" : "Monthly Payroll"}</p><p className="text-xl font-bold">Tsh {totalSalary.toLocaleString()}</p></div></CardContent></Card>
        <Card className="section-shell"><CardContent className="flex items-center gap-4 p-6"><div className="rounded-xl bg-success/10 p-3"><Calendar className="h-6 w-6 text-success" /></div><div><p className="text-sm text-muted-foreground">{language === "sw" ? "Wafanyakazi Hai" : "Active Staff"}</p><p className="text-xl font-bold">{staffList?.filter(s => s.status === 'active').length || 0}</p></div></CardContent></Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingStaff} onOpenChange={(o) => !o && setEditingStaff(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{language === "sw" ? "Hariri Mfanyakazi" : "Edit Staff"}</DialogTitle></DialogHeader>
          {editingStaff && (
            <div className="space-y-4 pt-4">
              <div className="space-y-2"><Label>Full Name</Label><Input value={editingStaff.full_name} onChange={e => setEditingStaff({...editingStaff, full_name: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Phone</Label><Input value={editingStaff.phone || ""} onChange={e => setEditingStaff({...editingStaff, phone: e.target.value})} /></div>
                <div className="space-y-2"><Label>Email</Label><Input value={editingStaff.email || ""} onChange={e => setEditingStaff({...editingStaff, email: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Position</Label><Select value={editingStaff.position || "Staff"} onValueChange={v => setEditingStaff({...editingStaff, position: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Staff">Staff</SelectItem><SelectItem value="Manager">Manager</SelectItem><SelectItem value="Cashier">Cashier</SelectItem><SelectItem value="HR">HR</SelectItem><SelectItem value="Security">Security</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Salary (Tsh)</Label><Input type="number" value={editingStaff.salary} onChange={e => setEditingStaff({...editingStaff, salary: e.target.value})} /></div>
              </div>
              <div className="space-y-2"><Label>Status</Label><Select value={editingStaff.status || "active"} onValueChange={v => setEditingStaff({...editingStaff, status: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div>
              <Button 
                className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30 transition-all" 
                onClick={handleEditSave} 
                disabled={updateStaff.isPending}
              >
                {updateStaff.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "sw" ? "Hifadhi" : "Save")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card className="section-shell overflow-hidden"><CardContent className="p-0">
        {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
          <div className="max-w-full overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Position</TableHead><TableHead>Phone</TableHead><TableHead>Salary</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-foreground/70 dark:text-foreground/80">No staff members yet</TableCell></TableRow> :
            filtered.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.full_name}</TableCell>
                <TableCell>{s.position}</TableCell>
                <TableCell>{s.phone || "-"}</TableCell>
                <TableCell>Tsh {Number(s.salary).toLocaleString()}</TableCell>
                <TableCell><Badge className={s.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}>{s.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-500/10 dark:hover:bg-blue-500/20" onClick={() => setEditingStaff({...s})}>
                      <Pencil className="h-4 w-4 text-blue-600 dark:text-blue-400 dark:drop-shadow-[0_0_4px_rgba(59,130,246,0.3)]" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20" onClick={() => setStaffToDeleteId(s.id)}>
                      <Trash2 className="h-4 w-4 dark:drop-shadow-[0_0_4px_rgba(239,68,68,0.3)]" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
          </div>
        )}
      </CardContent></Card>

      <AlertDialog open={!!staffToDeleteId} onOpenChange={(open) => !open && setStaffToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === "sw" ? "Futa mfanyakazi huyu?" : "Delete this staff member?"}</AlertDialogTitle>
            <AlertDialogDescription>{language === "sw" ? "Kitendo hiki hakiwezi kufutwa." : "This action cannot be undone."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "sw" ? "Ghairi" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => staffToDeleteId && deleteStaff.mutate(staffToDeleteId, { onSettled: () => setStaffToDeleteId(null) })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteStaff.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "sw" ? "Futa" : "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
