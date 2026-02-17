import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Loader2, Shield, Settings2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useShopUsers } from "@/hooks/useShopUsers";
import { useUserPageAccess, useUpdateUserPageAccess, PAGE_PATHS } from "@/hooks/useUserPageAccess";

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
  const [addOpen, setAddOpen] = useState(false);
  const [pageAccessOpen, setPageAccessOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ user_id: string; full_name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "staff" });
  const [pageAccessForm, setPageAccessForm] = useState<Set<string>>(new Set());

  const { data: users, isLoading } = useShopUsers(shopId);
  const { data: currentAccess } = useUserPageAccess(selectedUser?.user_id ?? null, shopId);
  const updatePageAccess = useUpdateUserPageAccess(selectedUser?.user_id ?? null, shopId);

  useEffect(() => {
    if (pageAccessOpen && selectedUser && currentAccess) {
      setPageAccessForm(new Set(currentAccess));
    }
  }, [pageAccessOpen, selectedUser, currentAccess]);

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
      // Capture current session so we can restore it after signUp (signUp can switch session to new user)
      const { data: { session: prevSession } } = await supabase.auth.getSession();
      const { data, error } = await supabase.auth.signUp({
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
      if (error) throw error;
      // Restore admin session so header keeps showing admin name (signUp can switch to new user)
      if (prevSession?.access_token && prevSession?.refresh_token) {
        await supabase.auth.setSession({ access_token: prevSession.access_token, refresh_token: prevSession.refresh_token });
        await refreshProfile();
      }
      queryClient.invalidateQueries({ queryKey: ["shop-users"] });
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
                  <TableHead>{language === "sw" ? "Jukumu" : "Role"}</TableHead>
                  <TableHead>{language === "sw" ? "Ilioongezwa" : "Added"}</TableHead>
                <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((u) => (
                  <TableRow key={(u as any).id}>
                    <TableCell className="font-medium">{(u as any).full_name}</TableCell>
                    <TableCell>{getRoleLabel((u as any).role ?? "staff")}</TableCell>
                    <TableCell className="text-foreground/70 dark:text-foreground/80">{new Date((u as any).created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => {
                          setSelectedUser({ user_id: (u as any).user_id, full_name: (u as any).full_name });
                          setPageAccessOpen(true);
                        }}
                      >
                        <Settings2 className="h-4 w-4" />
                        {language === "sw" ? "Vipengele" : "Pages"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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
    </motion.div>
  );
}
