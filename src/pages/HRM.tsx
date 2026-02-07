import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Users, DollarSign, Calendar, Loader2, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function HRM() {
  const { t } = useLanguage();
  const { shopId } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", position: "Staff", department: "", salary: "" });

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

  const deleteStaff = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("staff").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["staff"] }); toast.success("Staff removed"); },
  });

  const filtered = staffList?.filter(s => s.full_name.toLowerCase().includes(searchTerm.toLowerCase())) || [];
  const totalSalary = staffList?.reduce((sum, s) => sum + Number(s.salary || 0), 0) || 0;

  const handleAdd = () => {
    addStaff.mutate({ full_name: form.full_name, phone: form.phone || null, email: form.email || null, position: form.position, department: form.department || null, salary: parseFloat(form.salary) || 0 });
    setForm({ full_name: "", phone: "", email: "", position: "Staff", department: "", salary: "" });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div><h1 className="text-2xl font-bold">Human Resources</h1><p className="text-muted-foreground">Manage staff, attendance, and salaries</p></div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="flex items-center gap-4 p-6"><div className="rounded-lg bg-primary/10 p-3"><Users className="h-6 w-6 text-primary" /></div><div><p className="text-sm text-muted-foreground">Total Staff</p><p className="text-xl font-bold">{staffList?.length || 0}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-6"><div className="rounded-lg bg-secondary/10 p-3"><DollarSign className="h-6 w-6 text-secondary" /></div><div><p className="text-sm text-muted-foreground">Monthly Payroll</p><p className="text-xl font-bold">Tsh {totalSalary.toLocaleString()}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-6"><div className="rounded-lg bg-success/10 p-3"><Calendar className="h-6 w-6 text-success" /></div><div><p className="text-sm text-muted-foreground">Active Staff</p><p className="text-xl font-bold">{staffList?.filter(s => s.status === 'active').length || 0}</p></div></CardContent></Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search staff..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />Add Staff</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Staff</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2"><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} placeholder="Enter name" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Position</Label>
                  <Select value={form.position} onValueChange={v => setForm({...form, position: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Staff">Staff</SelectItem><SelectItem value="Manager">Manager</SelectItem><SelectItem value="Cashier">Cashier</SelectItem><SelectItem value="HR">HR</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Department</Label><Input value={form.department} onChange={e => setForm({...form, department: e.target.value})} /></div>
              </div>
              <div className="space-y-2"><Label>Monthly Salary (Tsh)</Label><Input type="number" value={form.salary} onChange={e => setForm({...form, salary: e.target.value})} /></div>
              <Button className="w-full" onClick={handleAdd} disabled={!form.full_name || addStaff.isPending}>
                {addStaff.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Staff"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card><CardContent className="p-0">
        {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : (
          <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Position</TableHead><TableHead>Phone</TableHead><TableHead>Salary</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No staff members yet</TableCell></TableRow> :
            filtered.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.full_name}</TableCell>
                <TableCell>{s.position}</TableCell>
                <TableCell>{s.phone || "-"}</TableCell>
                <TableCell>Tsh {Number(s.salary).toLocaleString()}</TableCell>
                <TableCell><Badge className={s.status === 'active' ? 'bg-success/10 text-success' : ''}>{s.status}</Badge></TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteStaff.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        )}
      </CardContent></Card>
    </motion.div>
  );
}
