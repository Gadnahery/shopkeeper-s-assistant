import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { UserPlus, Loader2, Shield, Eye, Pencil, Trash2, Mail, Search, Users, UserCog, KeyRound } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useShopUsers } from "@/hooks/useShopUsers";
import { logAudit } from "@/lib/audit";
import { checkPasswordStrength } from "@/lib/validation";
import { PageLoader } from "@/components/PageLoader";
import { PageHeader } from "@/components/common/PageHeader";
import { requestPasswordReset } from "@/lib/passwordRecovery";

type ShopUser = {
  id: string;
  user_id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  created_at: string;
};

const ROLES = [
  { value: "owner", en: "Owner", sw: "Mmiliki" },
  { value: "cashier", en: "Cashier", sw: "Mkaguzi" },
  { value: "staff", en: "Staff", sw: "Mfanyakazi" },
  { value: "manager", en: "Manager", sw: "Meneja" },
  { value: "hr", en: "HR", sw: "Rasilimali" },
];

export default function UserManagement() {
  const { language } = useLanguage();
  const { shopId, user } = useAuth();
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailsUser, setDetailsUser] = useState<ShopUser | null>(null);
  const [editUser, setEditUser] = useState<ShopUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<ShopUser | null>(null);

  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [search, setSearch] = useState("");
  const [mobilePage, setMobilePage] = useState(1);
  const MOBILE_PAGE_SIZE = 4;

  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "staff" });
  const [editForm, setEditForm] = useState({ full_name: "", email: "", phone: "", role: "staff" });

  const { data: users, isLoading } = useShopUsers(shopId);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return (users ?? []) as ShopUser[];
    return ((users ?? []) as ShopUser[]).filter((row) => {
      return (
        row.full_name.toLowerCase().includes(q) ||
        (row.email ?? "").toLowerCase().includes(q) ||
        (row.phone ?? "").toLowerCase().includes(q) ||
        (row.role ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, search]);

  const totalMobilePages = Math.ceil(filteredUsers.length / MOBILE_PAGE_SIZE) || 1;
  const currentMobileUsers = filteredUsers.slice((mobilePage - 1) * MOBILE_PAGE_SIZE, mobilePage * MOBILE_PAGE_SIZE);

  if (users === undefined || isLoading) {
    return <PageLoader message="Loading users..." messageSw="Inapakia watumiaji..." language={language} />;
  }

  const getRoleLabel = (role: string) => {
    const r = ROLES.find((x) => x.value === role);
    return r ? (language === "sw" ? r.sw : r.en) : role;
  };

  const handleRegister = async () => {
    if (!form.email.trim() || !form.password.trim() || !form.full_name.trim()) {
      toast.error(language === "sw" ? "Jaza barua pepe, neno la siri na jina" : "Fill email, password and name");
      return;
    }
    if (checkPasswordStrength(form.password).suggestions.length > 0) {
      toast.error(
        language === "sw"
          ? "Neno la siri liwe na herufi 8 au zaidi, herufi kubwa na ndogo, namba, na alama."
          : "Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol."
      );
      return;
    }
    if (!shopId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: {
          email: form.email.trim(),
          password: form.password,
          full_name: form.full_name.trim(),
          shop_id: shopId,
          role: form.role,
        },
      });

      if (error) throw error;

      await logAudit({
        action: "user_created",
        entityType: "profiles",
        entityId: (data as { user_id?: string } | null)?.user_id ?? null,
        metadata: { email: form.email.trim(), role: form.role },
      });

      queryClient.invalidateQueries({ queryKey: ["shop-users"] });
      toast.success(language === "sw" ? "Mtumiaji amesajiliwa." : "User registered.");
      setAddOpen(false);
      setForm({ email: "", password: "", full_name: "", role: "staff" });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  const openDetails = (u: ShopUser) => { setDetailsUser(u); setDetailsOpen(true); };
  const openEdit = (u: ShopUser) => { setEditUser(u); setEditForm({ full_name: u.full_name, email: u.email ?? "", phone: u.phone ?? "", role: u.role ?? "staff" }); setEditOpen(true); };

  const handleUpdateUser = async () => {
    if (!editUser || !shopId) return;
    setUpdating(true);
    try {
      await supabase.from("profiles").update({ full_name: editForm.full_name.trim(), phone: editForm.phone.trim() || null }).eq("user_id", editUser.user_id);
      await supabase.from("user_roles").update({ role: editForm.role }).eq("user_id", editUser.user_id);
      queryClient.invalidateQueries({ queryKey: ["shop-users"] });
      toast.success(language === "sw" ? "Mtumiaji amesasishwa" : "User updated");
      setEditOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveUser = async () => {
    if (!userToDelete || !shopId) return;
    try {
      await supabase.from("user_roles").delete().eq("user_id", userToDelete.user_id);
      await supabase.from("profiles").delete().eq("user_id", userToDelete.user_id).eq("shop_id", shopId);
      queryClient.invalidateQueries({ queryKey: ["shop-users"] });
      setDeleteOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const handleSendPasswordReset = async (email: string) => {
    setResettingPassword(true);
    try {
      const message = await requestPasswordReset(email.trim(), language);
      toast.success(message);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setResettingPassword(false);
    }
  };

  const totalUsers = filteredUsers.length;
  const managers = filteredUsers.filter((row) => row.role === "manager" || row.role === "owner").length;
  const activeEmails = filteredUsers.filter((row) => !!row.email).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title={language === "sw" ? "Usimamizi wa Watumiaji" : "User Management"}
        subtitle={language === "sw" ? "Sajili na udhibiti watumiaji wa duka lako" : "Register and manage users for your shop"}
        actions={
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={language === "sw" ? "Tafuta mtumiaji..." : "Search users..."} className="w-full bg-background/80 pl-10" />
          </div>
          <Button className="bg-black text-white hover:bg-black/90 gap-2" onClick={() => setAddOpen(true)}>
            <UserPlus className="h-4 w-4" />{language === "sw" ? "Ongeza Mtumiaji" : "Add User"}
          </Button>
        </div>
        }
      />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: language === "sw" ? "Watumiaji wote" : "Total users", val: totalUsers, icon: Users },
          { label: language === "sw" ? "Wasimamizi" : "Managers", val: managers, icon: UserCog },
          { label: language === "sw" ? "Barua pepe" : "Email ready", val: activeEmails, icon: Mail },
          { label: language === "sw" ? "Ulinzi" : "Security", val: "RBAC", icon: Shield },
        ].map((k, i) => (
          <Card key={i} className="p-5">
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground uppercase">{k.label}</p>
              <k.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold">{k.val}</p>
          </Card>
        ))}
      </section>

      {/* Inventory-style Bottom Sheet for Add */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-4 border-t border-border bg-card">
          <SheetHeader className="pb-3 border-b border-border">
            <SheetTitle className="text-sm font-bold flex items-center gap-2">
              <Shield className="h-4 w-4" />{language === "sw" ? "Sajili Mtumiaji" : "Register User"}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-3.5 pt-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Barua pepe" : "Email"} *</Label>
              <Input placeholder="user@example.com" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="h-9 rounded-xl border-border text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Jina Kamili" : "Full Name"} *</Label>
              <Input placeholder="Full Name" value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})} className="h-9 rounded-xl border-border text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Neno la Siri" : "Password"} *</Label>
              <Input type="password" placeholder="8+ chars" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="h-9 rounded-xl border-border text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Jukumu" : "Role"}</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger className="h-9 rounded-xl border-border text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value} className="text-xs">{language === "sw" ? r.sw : r.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full h-9 rounded-xl bg-neutral-950 font-medium text-white shadow-xs hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 text-xs transition-all" onClick={handleRegister} disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (language === "sw" ? "Sajili" : "Register")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Details Sheet */}
      <Sheet open={detailsOpen} onOpenChange={(o) => { setDetailsOpen(o); if (!o) setDetailsUser(null); }}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-4 border-t border-border bg-card">
          <SheetHeader className="pb-3 border-b border-border">
            <SheetTitle className="text-sm font-bold flex items-center gap-2">
              <Shield className="h-4 w-4" />{language === "sw" ? "Maelezo ya Mtumiaji" : "User Details"}
            </SheetTitle>
          </SheetHeader>
          {detailsUser && (
            <div className="space-y-3.5 pt-3">
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-muted-foreground">{language === "sw" ? "Jina kamili" : "Full name"}</p>
                <p className="text-foreground font-semibold text-sm">{detailsUser.full_name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-muted-foreground">{language === "sw" ? "Barua pepe" : "Email"}</p>
                <p className="text-foreground text-xs">{detailsUser.email || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-muted-foreground">{language === "sw" ? "Simu" : "Phone"}</p>
                <p className="text-foreground text-xs">{detailsUser.phone || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-muted-foreground">{language === "sw" ? "Jukumu" : "Role"}</p>
                <p className="text-foreground text-xs">{getRoleLabel(detailsUser.role ?? "staff")}</p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="outline" size="sm" className="h-8 rounded-xl text-xs" onClick={() => { setDetailsOpen(false); openEdit(detailsUser); }}>
                  <Pencil className="h-3.5 w-3.5 mr-1" />{language === "sw" ? "Hariri" : "Edit"}
                </Button>
                <Button variant="outline" size="sm" className="h-8 rounded-xl text-xs" onClick={() => handleSendPasswordReset(detailsUser.email ?? "")} disabled={resettingPassword || !detailsUser.email}>
                  {resettingPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Mail className="h-3.5 w-3.5 mr-1" />}
                  {language === "sw" ? "Tuma reset" : "Send reset"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-xl text-xs text-destructive hover:text-destructive"
                  onClick={() => { setDetailsOpen(false); setUserToDelete(detailsUser); setDeleteOpen(true); }}
                  disabled={detailsUser.user_id === user?.id}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />{language === "sw" ? "Ondoa" : "Remove"}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Sheet */}
      <Sheet open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditUser(null); }}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-4 border-t border-border bg-card">
          <SheetHeader className="pb-3 border-b border-border">
            <SheetTitle className="text-sm font-bold">{language === "sw" ? "Hariri Mtumiaji" : "Edit User"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-3.5 pt-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Jina kamili" : "Full name"} *</Label>
              <Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} className="h-9 rounded-xl border-border text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Simu" : "Phone"}</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="h-9 rounded-xl border-border text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Jukumu" : "Role"}</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger className="h-9 rounded-xl border-border text-xs"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value} className="text-xs">{language === "sw" ? r.sw : r.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full h-9 rounded-xl bg-neutral-950 font-medium text-white shadow-xs hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 text-xs transition-all" onClick={handleUpdateUser} disabled={updating}>
              {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (language === "sw" ? "Hifadhi Mabadiliko" : "Save Changes")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <div className="md:hidden space-y-3">
        {currentMobileUsers.map((u) => (
          <Card key={u.id} className="p-3.5 rounded-2xl border border-border bg-card flex justify-between items-center shadow-xs">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate">{u.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{u.email || "-"}</p>
              <span className="badge-neutral text-[10px] mt-1 inline-block">{getRoleLabel(u.role)}</span>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openDetails(u)}><Eye className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(u)}><Pencil className="h-4 w-4 text-blue-600 dark:text-blue-400" /></Button>
            </div>
          </Card>
        ))}
        {totalMobilePages > 1 && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-xs">
            <span className="text-muted-foreground text-[11px]">{mobilePage} / {totalMobilePages}</span>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" className="h-7 px-2.5 text-[11px] rounded-lg" disabled={mobilePage === 1} onClick={() => setMobilePage(p => p - 1)}>Prev</Button>
              <Button variant="outline" size="sm" className="h-7 px-2.5 text-[11px] rounded-lg" disabled={mobilePage === totalMobilePages} onClick={() => setMobilePage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      <div className="hidden md:block border border-border rounded-2xl overflow-hidden bg-card shadow-xs">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {filteredUsers.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email || "-"}</TableCell>
                <TableCell><span className="badge-neutral text-xs">{getRoleLabel(u.role)}</span></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetails(u)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)}><Pencil className="h-4 w-4 text-blue-600 dark:text-blue-400" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === "sw" ? "Ondoa mtumiaji?" : "Remove user from shop?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete && (language === "sw" ? `"${userToDelete.full_name}" ataondolewa kwenye duka hili.` : `"${userToDelete.full_name}" will be removed from this shop.`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "sw" ? "Ghairi" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "sw" ? "Ondoa" : "Remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
