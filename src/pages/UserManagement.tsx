import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Unexpected error";
}

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
  const [deleting, setDeleting] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [search, setSearch] = useState("");

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
    if (!shopId) {
      toast.error("No shop found");
      return;
    }

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
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["shop-users"] }), 800);

      toast.success(language === "sw" ? "Mtumiaji amesajiliwa." : "User registered.");
      setAddOpen(false);
      setForm({ email: "", password: "", full_name: "", role: "staff" });
    } catch (e: unknown) {
      const message = getErrorMessage(e);
      if (message.toLowerCase().includes("function") && message.toLowerCase().includes("not found")) {
        toast.error(language === "sw" ? "Kazi ya admin-create-user haijadeployiwa Supabase." : "admin-create-user function is not deployed in Supabase.");
      } else {
        toast.error(message || "Failed to register");
      }
    } finally {
      setLoading(false);
    }
  };

  const openDetails = (u: ShopUser) => {
    const current = (users as ShopUser[]).find((x) => x.user_id === u.user_id);
    setDetailsUser(current ?? u);
    setDetailsOpen(true);
  };

  const openEdit = (u: ShopUser) => {
    setEditUser(u);
    setEditForm({ full_name: u.full_name, email: u.email ?? "", phone: u.phone ?? "", role: u.role ?? "staff" });
    setEditOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editUser || !shopId) return;
    setUpdating(true);
    try {
      const { error: pe } = await (supabase.from("profiles" as any) as any)
        .update({
          full_name: editForm.full_name.trim(),
          phone: editForm.phone.trim() || null,
        })
        .eq("user_id", editUser.user_id)
        .eq("shop_id", shopId);
      if (pe) throw pe;

      const { error: re } = await (supabase.from("user_roles" as any) as any)
        .update({ role: editForm.role })
        .eq("user_id", editUser.user_id);
      if (re) throw re;

      await logAudit({
        action: "user_updated",
        entityType: "profiles",
        entityId: editUser.user_id,
        metadata: {
          role: editForm.role,
          full_name: editForm.full_name.trim(),
          email: editForm.email.trim() || null,
          phone: editForm.phone.trim() || null,
        },
      });

      queryClient.invalidateQueries({ queryKey: ["shop-users"] });
      toast.success(language === "sw" ? "Mtumiaji amesasishwa" : "User updated");
      setEditOpen(false);
      setEditUser(null);
    } catch (e: unknown) {
      toast.error(getErrorMessage(e));
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveUser = async () => {
    if (!userToDelete || !shopId) return;
    if (user?.id === userToDelete.user_id) {
      toast.error(language === "sw" ? "Huwezi kujiondoa mwenyewe." : "You cannot remove your own account.");
      return;
    }

    setDeleting(true);
    try {
      const { error: re } = await (supabase.from("user_roles" as any) as any)
        .delete()
        .eq("user_id", userToDelete.user_id);
      if (re) throw re;

      const { error: pe } = await (supabase.from("profiles" as any) as any)
        .delete()
        .eq("user_id", userToDelete.user_id)
        .eq("shop_id", shopId);
      if (pe) throw pe;

      await logAudit({
        action: "user_removed_from_shop",
        entityType: "profiles",
        entityId: userToDelete.user_id,
        metadata: { full_name: userToDelete.full_name, email: userToDelete.email ?? null },
      });

      queryClient.invalidateQueries({ queryKey: ["shop-users"] });
      toast.success(language === "sw" ? "Mtumiaji ameondolewa" : "User removed from shop");
      setDeleteOpen(false);
      setUserToDelete(null);
    } catch (e: unknown) {
      toast.error(getErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  const handleSendPasswordReset = async (email: string) => {
    if (!email?.trim()) {
      toast.error(language === "sw" ? "Barua pepe haipo" : "No email for this user");
      return;
    }

    setResettingPassword(true);
    try {
      const message = await requestPasswordReset(email.trim(), language);

      await logAudit({
        action: "user_password_reset_requested",
        entityType: "profiles",
        metadata: { email: email.trim() },
      });

      toast.success(message);
    } catch (e: unknown) {
      toast.error(getErrorMessage(e));
    } finally {
      setResettingPassword(false);
    }
  };

  const title = language === "sw" ? "Usimamizi wa Watumiaji" : "User Management";
  const subtitle = language === "sw" ? "Sajili na udhibiti watumiaji wa duka lako" : "Register and manage users for your shop";
  const totalUsers = filteredUsers.length;
  const managers = filteredUsers.filter((row) => row.role === "manager" || row.role === "owner").length;
  const activeEmails = filteredUsers.filter((row) => !!row.email).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={language === "sw" ? "Tafuta mtumiaji..." : "Search users..."}
              className="w-full bg-background/80 pl-10"
            />
          </div>
          <Button className="gap-2 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700" onClick={() => setAddOpen(true)}>
            <UserPlus className="h-4 w-4" />{language === "sw" ? "Ongeza Mtumiaji" : "Add User"}
          </Button>
        </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="section-shell">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {language === "sw" ? "Watumiaji wote" : "Total users"}
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">{totalUsers}</p>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="section-shell">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {language === "sw" ? "Wasimamizi" : "Leadership roles"}
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">{managers}</p>
            </div>
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-blue-500">
              <UserCog className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="section-shell">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {language === "sw" ? "Barua pepe tayari" : "Email available"}
              </p>
              <p className="mt-2 text-3xl font-bold text-foreground">{activeEmails}</p>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-600 p-3">
              <KeyRound className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </section>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />{language === "sw" ? "Sajili Mtumiaji Mpya" : "Register New User"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{language === "sw" ? "Mtumiaji atapokea barua pepe ya uthibitishaji." : "The user will receive a verification email."}</p>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>{language === "sw" ? "Barua pepe" : "Email"} *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@example.com" />
            </div>
            <div className="space-y-2">
              <Label>{language === "sw" ? "Jina Kamili" : "Full Name"} *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder={language === "sw" ? "Jina la mtumiaji" : "User full name"} />
            </div>
            <div className="space-y-2">
              <Label>{language === "sw" ? "Neno la Siri" : "Password"} *</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={language === "sw" ? "Herufi 8+, kubwa, ndogo, namba, alama" : "8+ chars, upper, lower, number, symbol"} minLength={8} />
            </div>
            <div className="space-y-2">
              <Label>{language === "sw" ? "Jukumu" : "Role"}</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{language === "sw" ? r.sw : r.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleRegister} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "sw" ? "Sajili" : "Register")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="section-shell overflow-hidden">
        <CardContent className="p-0">
          {!filteredUsers.length ? (
            <div className="px-6 py-14 text-center text-foreground/70 dark:text-foreground/80">
              {language === "sw" ? "Hakuna watumiaji bado." : "No users yet."}
            </div>
          ) : (
            <>
              <div className="internal-table-scroll hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "sw" ? "Jina" : "Name"}</TableHead>
                      <TableHead>{language === "sw" ? "Barua pepe" : "Email"}</TableHead>
                      <TableHead>{language === "sw" ? "Jukumu" : "Role"}</TableHead>
                      <TableHead>{language === "sw" ? "Ilioongezwa" : "Added"}</TableHead>
                      <TableHead className="text-right">{language === "sw" ? "Vitendo" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((row) => {
                      const isSelf = row.user_id === user?.id;
                      return (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.full_name}</TableCell>
                          <TableCell className="text-foreground/80">{row.email || "-"}</TableCell>
                          <TableCell>{getRoleLabel(row.role ?? "staff")}</TableCell>
                          <TableCell className="text-foreground/70 dark:text-foreground/80">{new Date(row.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 flex-wrap">
                              <Button variant="ghost" size="sm" className="gap-1" onClick={() => openDetails(row)} title={language === "sw" ? "Angalia" : "View"}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="gap-1" onClick={() => openEdit(row)} title={language === "sw" ? "Hariri" : "Edit"}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={() => { setUserToDelete(row); setDeleteOpen(true); }} title={language === "sw" ? "Ondoa" : "Remove"} disabled={isSelf}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-3 p-4 md:hidden">
                {filteredUsers.map((row) => {
                  const isSelf = row.user_id === user?.id;
                  return (
                    <Card key={row.id} className="border-border/70 bg-background/60">
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{row.full_name}</p>
                            <p className="truncate text-sm text-muted-foreground">{row.email || "-"}</p>
                          </div>
                          <span className="rounded-full bg-muted px-2 py-1 text-xs">{getRoleLabel(row.role ?? "staff")}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</p>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => openDetails(row)}><Eye className="mr-1 h-4 w-4" />{language === "sw" ? "Angalia" : "View"}</Button>
                          <Button variant="outline" size="sm" onClick={() => openEdit(row)}><Pencil className="mr-1 h-4 w-4" />{language === "sw" ? "Hariri" : "Edit"}</Button>
                          <Button variant="outline" size="sm" className="text-destructive" disabled={isSelf} onClick={() => { setUserToDelete(row); setDeleteOpen(true); }}><Trash2 className="mr-1 h-4 w-4" />{language === "sw" ? "Ondoa" : "Remove"}</Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={(o) => { setDetailsOpen(o); if (!o) setDetailsUser(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />{language === "sw" ? "Maelezo ya Mtumiaji" : "User Details"}
            </DialogTitle>
          </DialogHeader>
          {detailsUser && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{language === "sw" ? "Jina kamili" : "Full name"}</p>
                <p className="text-foreground font-medium">{detailsUser.full_name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{language === "sw" ? "Barua pepe" : "Email"}</p>
                <p className="text-foreground">{detailsUser.email || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{language === "sw" ? "Simu" : "Phone"}</p>
                <p className="text-foreground">{detailsUser.phone || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{language === "sw" ? "Jukumu" : "Role"}</p>
                <p className="text-foreground">{getRoleLabel(detailsUser.role ?? "staff")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{language === "sw" ? "Iliyoongezwa" : "Added"}</p>
                <p className="text-foreground">{new Date(detailsUser.created_at).toLocaleString()}</p>
              </div>
              <p className="text-xs text-muted-foreground border-t pt-3 mt-3">
                {language === "sw" ? "Neno la siri halionyeshwi kwa usalama. Tuma barua pepe ya kuweka neno jipya." : "Password is never shown for security. Use reset email to set a new password."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => { setDetailsOpen(false); openEdit(detailsUser); setEditOpen(true); }}>
                  <Pencil className="h-4 w-4 mr-1" />{language === "sw" ? "Hariri" : "Edit"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleSendPasswordReset(detailsUser.email ?? "")} disabled={resettingPassword || !detailsUser.email}>
                  {resettingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Mail className="h-4 w-4 mr-1" />}
                  {language === "sw" ? "Tuma reset" : "Send reset"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => { setDetailsOpen(false); setUserToDelete(detailsUser); setDeleteOpen(true); }}
                  disabled={detailsUser.user_id === user?.id}
                >
                  <Trash2 className="h-4 w-4 mr-1" />{language === "sw" ? "Ondoa" : "Remove"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditUser(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{language === "sw" ? "Hariri Mtumiaji" : "Edit User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>{language === "sw" ? "Jina kamili" : "Full name"}</Label>
              <Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{language === "sw" ? "Barua pepe" : "Email"}</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{language === "sw" ? "Simu" : "Phone"}</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{language === "sw" ? "Jukumu" : "Role"}</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{language === "sw" ? r.sw : r.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleUpdateUser} disabled={updating}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "sw" ? "Hifadhi" : "Save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={(o) => { if (!o) setUserToDelete(null); setDeleteOpen(o); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === "sw" ? "Ondoa mtumiaji?" : "Remove user from shop?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete && (language === "sw" ? `"${userToDelete.full_name}" ataondolewa kwenye duka hili.` : `"${userToDelete.full_name}" will be removed from this shop.`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "sw" ? "Ghairi" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "sw" ? "Ondoa" : "Remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
