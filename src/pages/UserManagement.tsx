import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { UserPlus, Loader2, Shield, Settings2, Eye, Pencil, Trash2, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useShopUsers } from "@/hooks/useShopUsers";
import { useUserPageAccess, useUpdateUserPageAccess, PAGE_PATHS } from "@/hooks/useUserPageAccess";
import { logAudit } from "@/lib/audit";
import { PageLoader } from "@/components/PageLoader";

const ROLES = [
  { value: "owner", en: "Owner", sw: "Mmiliki" },
  { value: "cashier", en: "Cashier", sw: "Mkaguzi" },
  { value: "staff", en: "Staff", sw: "Mfanyakazi" },
  { value: "manager", en: "Manager", sw: "Meneja" },
  { value: "hr", en: "HR", sw: "Rasilimali" },
];

export default function UserManagement() {
  const { t, language } = useLanguage();
  const { shopId, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  type ShopUser = { id: string; user_id: string; full_name: string; email?: string | null; phone?: string | null; role: string; created_at: string };
  const [addOpen, setAddOpen] = useState(false);
  const [pageAccessOpen, setPageAccessOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailsUser, setDetailsUser] = useState<ShopUser | null>(null);
  const [editUser, setEditUser] = useState<ShopUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<ShopUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<{ user_id: string; full_name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "staff" });
  const [editForm, setEditForm] = useState({ full_name: "", email: "", phone: "", role: "staff" });
  const [pageAccessForm, setPageAccessForm] = useState<Set<string>>(new Set());
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const { data: users, isLoading } = useShopUsers(shopId);
  const { data: currentAccess } = useUserPageAccess(selectedUser?.user_id ?? null, shopId);
  const updatePageAccess = useUpdateUserPageAccess(selectedUser?.user_id ?? null, shopId);

  useEffect(() => {
    if (pageAccessOpen && selectedUser && currentAccess) {
      setPageAccessForm(new Set(currentAccess));
    }
  }, [pageAccessOpen, selectedUser, currentAccess]);

  if (users === undefined || isLoading) {
    return <PageLoader message="Loading users..." messageSw="Inapakia watumiaji..." language={language} />;
  }

  const handleRegister = async () => {
    if (!form.email.trim() || !form.password.trim() || !form.full_name.trim()) {
      toast.error(language === "sw" ? "Jaza barua pepe, neno la siri na jina" : "Fill email, password and name");
      return;
    }
    if (form.password.length < 6) {
      toast.error(language === "sw" ? "Neno la siri lazima liwe na herufi 6 zaidi" : "Password must be at least 6 characters");
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
      if (error) {
        // Fallback for environments where edge function is not deployed yet.
        const { data: { session: prevSession } } = await supabase.auth.getSession();
        const signupRes = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            data: {
              full_name: form.full_name.trim(),
              invited_to_shop_id: shopId,
              invited_role: form.role,
            },
          },
        });
        if (signupRes.error) throw signupRes.error;
        if (prevSession?.access_token && prevSession?.refresh_token) {
          await supabase.auth.setSession({ access_token: prevSession.access_token, refresh_token: prevSession.refresh_token });
          await refreshProfile();
        }
      }
      await logAudit({
        action: "user_created",
        entityType: "profiles",
        entityId: data?.user_id ?? null,
        metadata: { email: form.email.trim(), role: form.role },
      });
      queryClient.invalidateQueries({ queryKey: ["shop-users"] });
      // Refetch again after a short delay so DB trigger has written profile (email, etc.)
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["shop-users"] });
      }, 800);
      toast.success(language === "sw" ? "Mtumiaji amesajiliwa. Atapokea barua pepe ya uthibitishaji." : "User registered. They will receive a verification email.");
      setAddOpen(false);
      setForm({ email: "", password: "", full_name: "", role: "staff" });
    } catch (e: any) {
      toast.error(e?.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const r = ROLES.find((x) => x.value === role);
    return r ? (language === "sw" ? r.sw : r.en) : role;
  };

  const openDetails = (u: ShopUser) => {
    // Use current user from list so we show latest data (e.g. after refetch)
    const current = users?.find((x) => (x as ShopUser).user_id === u.user_id) as ShopUser | undefined;
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
      const { error: pe } = await supabase.from("profiles").update({
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim() || null,
        phone: editForm.phone.trim() || null,
      }).eq("user_id", editUser.user_id).eq("shop_id", shopId);
      if (pe) throw pe;
      const { error: re } = await supabase.from("user_roles").update({ role: editForm.role as any }).eq("user_id", editUser.user_id).eq("shop_id", shopId);
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
      toast.success(language === "sw" ? "Mtumiaji imesasishwa" : "User updated");
      setEditOpen(false);
      setEditUser(null);
      setDetailsUser((prev) => (prev?.user_id === editUser.user_id ? { ...prev, ...editForm } : prev));
    } catch (e: any) {
      toast.error(e?.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };
  const handleRemoveUser = async () => {
    if (!userToDelete || !shopId) return;
    setDeleting(true);
    try {
      const { error: re } = await supabase.from("user_roles").delete().eq("user_id", userToDelete.user_id).eq("shop_id", shopId);
      if (re) throw re;
      const { error: pe } = await supabase.from("profiles").delete().eq("user_id", userToDelete.user_id).eq("shop_id", shopId);
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
    } catch (e: any) {
      toast.error(e?.message || "Remove failed");
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
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
      if (error) throw error;
      await logAudit({
        action: "user_password_reset_requested",
        entityType: "profiles",
        metadata: { email: email.trim() },
      });
      toast.success(language === "sw" ? "Barua pepe ya kubadilisha neno la siri imetumwa" : "Password reset email sent");
    } catch (e: any) {
      toast.error(e?.message || "Failed to send reset email");
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{language === "sw" ? "Usimamizi wa Watumiaji" : "User Management"}</h1>
          <p className="text-muted-foreground">{language === "sw" ? "Sajili na udhibiti watumiaji wa duka lako" : "Register and manage users for your shop"}</p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30" onClick={() => setAddOpen(true)}>
          <UserPlus className="h-4 w-4" />{language === "sw" ? "Ongeza Mtumiaji" : "Add User"}
        </Button>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />{language === "sw" ? "Sajili Mtumiaji Mpya" : "Register New User"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{language === "sw" ? "Mtumiaji atapokea barua pepe ya uthibitishaji na kuingia kwenye duka lako." : "The user will receive a verification email and sign in to your shop."}</p>
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
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={language === "sw" ? "Angalau herufi 6" : "At least 6 characters"} />
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
            <Button 
              className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30 transition-all" 
              onClick={handleRegister} 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "sw" ? "Sajili" : "Register")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : !users?.length ? (
            <div className="py-12 text-center text-foreground/70 dark:text-foreground/80">{language === "sw" ? "Hakuna watumiaji bado. Ongeza mtumiaji mpya." : "No users yet. Add a new user."}</div>
          ) : (
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
                {users?.map((u) => {
                  const row = u as ShopUser;
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.full_name}</TableCell>
                      <TableCell className="text-foreground/80">{row.email || "—"}</TableCell>
                      <TableCell>{getRoleLabel(row.role ?? "staff")}</TableCell>
                      <TableCell className="text-foreground/70 dark:text-foreground/80">{new Date(row.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 flex-wrap">
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => openDetails(row)} title={language === "sw" ? "Angalia maelezo" : "View details"}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => openEdit(row)} title={language === "sw" ? "Hariri" : "Edit"}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-1" onClick={() => { setSelectedUser({ user_id: row.user_id, full_name: row.full_name }); setPageAccessOpen(true); }} title={language === "sw" ? "Vipengele" : "Pages"}>
                            <Settings2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive" onClick={() => { setUserToDelete(row); setDeleteOpen(true); }} title={language === "sw" ? "Ondoa" : "Remove"}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          </CardContent>
      </Card>

      <Dialog open={pageAccessOpen} onOpenChange={(open) => { setPageAccessOpen(open); if (!open) setSelectedUser(null); }}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{language === "sw" ? "Vipengele vinavyoruhusiwa" : "Allowed Pages"}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-foreground/70 dark:text-foreground/80">
            {selectedUser?.full_name} – {language === "sw" ? "Chagua kurasa mtumiaji anazoweza kufikia." : "Select pages this user can access."}
          </p>
          <p className="text-xs text-foreground/60 dark:text-foreground/70">
            {language === "sw" ? "Ukiwaacha tupu, mtumiaji atapata kurasa zote kulingana na jukumu lake." : "Leave empty for full access based on role."}
          </p>
          <div className="space-y-2 py-4">
            {PAGE_PATHS.map((p) => (
              <div key={p.path} className="flex items-center gap-2">
                <Checkbox
                  id={p.path}
                  checked={pageAccessForm.has(p.path)}
                  onCheckedChange={(c) => {
                    setPageAccessForm((prev) => {
                      const next = new Set(prev);
                      if (c) next.add(p.path);
                      else next.delete(p.path);
                      return next;
                    });
                  }}
                />
                <Label htmlFor={p.path} className="font-normal cursor-pointer">{p.label}</Label>
              </div>
            ))}
          </div>
          <Button
            className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30 transition-all"
            disabled={updatePageAccess.isPending}
            onClick={async () => {
              await updatePageAccess.mutateAsync(Array.from(pageAccessForm));
              toast.success(language === "sw" ? "Vipengele vimehifadhiwa" : "Page access saved");
              setPageAccessOpen(false);
              setSelectedUser(null);
            }}
          >
            {updatePageAccess.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "sw" ? "Hifadhi" : "Save")}
          </Button>
        </DialogContent>
      </Dialog>

      {/* User details dialog */}
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
                <p className="text-foreground">{detailsUser.email || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{language === "sw" ? "Simu" : "Phone"}</p>
                <p className="text-foreground">{detailsUser.phone || "—"}</p>
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
                {language === "sw" ? "Neno la siri halionyeshwi kwa usalama. Tumia 'Tuma barua pepe ya neno la siri' ili mtumiaji aweze kuweka neno jipya." : "Password is not shown for security. Use 'Send password reset' to let this user set a new password."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => { setDetailsOpen(false); openEdit(detailsUser); setEditOpen(true); }}>
                  <Pencil className="h-4 w-4 mr-1" />{language === "sw" ? "Hariri" : "Edit"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleSendPasswordReset(detailsUser.email ?? "")} disabled={resettingPassword || !detailsUser.email}>
                  {resettingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Mail className="h-4 w-4 mr-1" />}
                  {language === "sw" ? "Tuma barua pepe ya neno la siri" : "Send password reset"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setDetailsOpen(false); setSelectedUser({ user_id: detailsUser.user_id, full_name: detailsUser.full_name }); setPageAccessOpen(true); }}>
                  <Settings2 className="h-4 w-4 mr-1" />{language === "sw" ? "Vipengele" : "Pages"}
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => { setDetailsOpen(false); setUserToDelete(detailsUser); setDeleteOpen(true); }}>
                  <Trash2 className="h-4 w-4 mr-1" />{language === "sw" ? "Ondoa" : "Remove"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit user dialog */}
      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditUser(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{language === "sw" ? "Hariri Mtumiaji" : "Edit User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>{language === "sw" ? "Jina kamili" : "Full name"}</Label>
              <Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} placeholder={language === "sw" ? "Jina" : "Full name"} />
            </div>
            <div className="space-y-2">
              <Label>{language === "sw" ? "Barua pepe" : "Email"}</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="user@example.com" />
            </div>
            <div className="space-y-2">
              <Label>{language === "sw" ? "Simu" : "Phone"}</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder={language === "sw" ? "Nambari ya simu" : "Phone number"} />
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
            <Button className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-teal-500/25 dark:shadow-teal-500/30" onClick={handleUpdateUser} disabled={updating}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : (language === "sw" ? "Hifadhi" : "Save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove user confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={(o) => { if (!o) setUserToDelete(null); setDeleteOpen(o); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === "sw" ? "Ondoa mtumiaji?" : "Remove user from shop?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete && (language === "sw" ? `"${userToDelete.full_name}" ataondolewa kwenye duka. Hawawezi tena kuingia kwenye duka hili.` : `"${userToDelete.full_name}" will be removed from this shop and will no longer have access.`)}
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
