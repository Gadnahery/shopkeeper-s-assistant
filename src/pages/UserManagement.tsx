import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Loader2, Shield } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";

const ROLES = [
  { value: "cashier", en: "Cashier", sw: "Mkaguzi" },
  { value: "staff", en: "Staff", sw: "Mfanyakazi" },
  { value: "manager", en: "Manager", sw: "Meneja" },
  { value: "hr", en: "HR", sw: "Rasilimali" },
];

async function getShopUsers(shopId: string) {
  const { data: profiles, error: pe } = await supabase
    .from("profiles")
    .select("id, user_id, full_name, created_at")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });
  if (pe) throw pe;
  const { data: roles, error: re } = await supabase
    .from("user_roles")
    .select("user_id, role")
    .eq("shop_id", shopId);
  if (re) throw re;
  const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
  return (profiles ?? []).map((p) => ({ ...p, role: roleMap.get(p.user_id) ?? "staff" }));
}

export default function UserManagement() {
  const { t, language } = useLanguage();
  const { shopId, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "staff" });

  const { data: users, isLoading } = useQuery({
    queryKey: ["shop-users", shopId],
    queryFn: () => getShopUsers(shopId!),
    enabled: !!shopId,
  });

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
      queryClient.invalidateQueries({ queryKey: ["shop-users", shopId] });
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
        <Button className="gap-2" onClick={() => setAddOpen(true)}>
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
            <Button className="w-full" onClick={handleRegister} disabled={loading}>
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
            <div className="py-12 text-center text-muted-foreground">{language === "sw" ? "Hakuna watumiaji bado. Ongeza mtumiaji mpya." : "No users yet. Add a new user."}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "sw" ? "Jina" : "Name"}</TableHead>
                  <TableHead>{language === "sw" ? "Jukumu" : "Role"}</TableHead>
                  <TableHead>{language === "sw" ? "Ilioongezwa" : "Added"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{(u as any).full_name}</TableCell>
                    <TableCell>{getRoleLabel((u as any).role ?? "staff")}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date((u as any).created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
