import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { UserPlus, Loader2, Shield, Eye, Pencil, Trash2, Mail, Search, Users, UserCog, KeyRound, AlertCircle, WalletCards, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useShopUsers } from "@/hooks/useShopUsers";
import { useShopSettings } from "@/hooks/useShopSettings";
import { BASE_ADMIN_STAFF_LIMIT, EXTRA_USER_SEAT_PRICE_TZS } from "@/lib/subscription";
import { logAudit } from "@/lib/audit";
import { checkPasswordStrength } from "@/lib/validation";
import { PageLoader } from "@/components/PageLoader";
import { PageHeader } from "@/components/common/PageHeader";
import { requestPasswordReset } from "@/lib/passwordRecovery";
import { UserPermissionsDialog } from "@/components/user/UserPermissionsDialog";

type AppRole = "owner" | "manager" | "cashier" | "staff" | "hr";

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [permissionsUser, setPermissionsUser] = useState<ShopUser | null>(null);
  const [isInitialPermissions, setIsInitialPermissions] = useState(false);
  const [detailsUser, setDetailsUser] = useState<ShopUser | null>(null);
  const [editUser, setEditUser] = useState<ShopUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<ShopUser | null>(null);

  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [search, setSearch] = useState("");
  const [mobilePage, setMobilePage] = useState(1);
  const MOBILE_PAGE_SIZE = 4;

  const [form, setForm] = useState<{ email: string; password: string; full_name: string; role: string }>({
    email: "",
    password: "",
    full_name: "",
    role: "",
  });
  const [editForm, setEditForm] = useState<{ full_name: string; email: string; phone: string; role: string }>({
    full_name: "",
    email: "",
    phone: "",
    role: "",
  });

  const { data: users = [], isLoading, isError, refetch } = useShopUsers(shopId);
  const { data: shopSettings } = useShopSettings();

  const extraSeats = Number(shopSettings?.extra_user_seats || 0);
  const maxAssignedStaff = BASE_ADMIN_STAFF_LIMIT + extraSeats;

  // Exclude the admin / shop owner and the current logged-in user from the staff list
  const staffUsers = useMemo(() => {
    return (users as any[]).filter(
      (u) =>
        u.raw_role !== "owner" &&
        u.role?.toLowerCase() !== "owner" &&
        u.user_id !== user?.id
    ) as ShopUser[];
  }, [users, user?.id]);

  const assignedStaffCount = useMemo(() => {
    return staffUsers.length;
  }, [staffUsers]);
  const isCapacityReached = assignedStaffCount >= maxAssignedStaff;

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return staffUsers;
    return staffUsers.filter((row) => {
      return (
        row.full_name.toLowerCase().includes(q) ||
        (row.email ?? "").toLowerCase().includes(q) ||
        (row.phone ?? "").toLowerCase().includes(q) ||
        (row.role ?? "").toLowerCase().includes(q)
      );
    });
  }, [staffUsers, search]);

  const totalMobilePages = Math.ceil(filteredUsers.length / MOBILE_PAGE_SIZE) || 1;
  const currentMobileUsers = filteredUsers.slice((mobilePage - 1) * MOBILE_PAGE_SIZE, mobilePage * MOBILE_PAGE_SIZE);

  if (isLoading && users.length === 0) {
    return <PageLoader message="Loading users..." messageSw="Inapakia watumiaji..." language={language} />;
  }

  if (isError && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center p-6">
        <ShieldAlert className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-bold">
          {language === "sw" ? "Imeshindwa kupakia watumiaji" : "Failed to load users"}
        </h2>
        <p className="text-muted-foreground max-w-md text-sm">
          {language === "sw"
            ? "Kulikuwa na hitilafu katika kupakia orodha ya watumiaji. Bonyeza kitufe hapa chini kujaribu tena."
            : "There was an issue loading your staff list. Please try clicking retry below."}
        </p>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          {language === "sw" ? "Jaribu Tena" : "Retry"}
        </Button>
      </div>
    );
  }

  const getRoleLabel = (role: string) => {
    const r = ROLES.find((x) => x.value === role);
    return r ? (language === "sw" ? r.sw : r.en) : role;
  };

  const handleRegister = async () => {
    if (isCapacityReached) {
      toast.error(
        language === "sw"
          ? `Kikomo cha watumiaji kimefikiwa (${assignedStaffCount}/${maxAssignedStaff}). Ongeza nafasi kwa TZS 5,000 kwenye ukurasa wa Malipo.`
          : `Staff user limit reached (${assignedStaffCount}/${maxAssignedStaff}). Add extra user space in Billing for 5,000 TZS.`
      );
      return;
    }

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
    const assignedRole = form.role.trim() || "Staff";
    const registeredName = form.full_name.trim();

    try {
      let createdUserId: string | null = null;
      let registeredSuccess = false;
      let isUnconfirmed = false;

      // 1. Attempt via Database RPC admin_create_staff_user (Primary: creates in auth.users, auto-confirms email, bypasses SMTP rate limits, enforces 4-seat limit)
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc("admin_create_staff_user", {
          p_email: form.email.trim(),
          p_password: form.password,
          p_full_name: registeredName,
          p_role: assignedRole,
        });

        if (!rpcError && (rpcData as any)?.success) {
          createdUserId = (rpcData as any)?.user_id;
          registeredSuccess = true;
        } else if (rpcError) {
          const msg = rpcError.message || "";
          // Re-throw genuine business/seat limit errors
          if (
            msg.includes("limit reached") ||
            msg.includes("Only shop owners") ||
            msg.includes("required") ||
            msg.includes("Password must be")
          ) {
            throw new Error(msg);
          }
          // If RPC is missing (migration 044 not applied yet), proceed to edge function / fallback
        }
      } catch (rpcErr: any) {
        if (
          rpcErr.message &&
          (rpcErr.message.includes("limit reached") ||
            rpcErr.message.includes("Only shop owners") ||
            rpcErr.message.includes("required") ||
            rpcErr.message.includes("Password must be"))
        ) {
          throw rpcErr;
        }
      }

      // 2. Attempt via Edge Function (if deployed on Supabase project)
      if (!registeredSuccess) {
        try {
          const { data, error } = await supabase.functions.invoke("admin-create-user", {
            body: {
              email: form.email.trim(),
              password: form.password,
              full_name: registeredName,
              shop_id: shopId,
              role: assignedRole,
            },
          });

          if (!error && (data as any)?.user_id) {
            createdUserId = (data as any).user_id;
            registeredSuccess = true;
          } else if (error) {
            const errorMsg = (data as any)?.error || error.message || "";
            if (
              errorMsg &&
              !errorMsg.includes("Failed to send a request") &&
              !errorMsg.includes("FunctionsFetchError") &&
              !errorMsg.includes("404")
            ) {
              throw new Error(errorMsg);
            }
          }
        } catch (edgeErr: any) {
          if (
            edgeErr.message &&
            !edgeErr.message.includes("Failed to send a request") &&
            !edgeErr.message.includes("FunctionsFetchError") &&
            !edgeErr.message.includes("404")
          ) {
            throw edgeErr;
          }
          // Edge function is not deployed, proceed to direct fallback
        }
      }

      // 3. Direct fallback via isolated client
      if (!registeredSuccess) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error("Supabase environment configuration is missing");
        }

        const isolatedClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        });

        const { data: signUpData, error: signUpError } = await isolatedClient.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            data: {
              full_name: registeredName,
              invited_to_shop_id: shopId,
              invited_role: assignedRole,
            },
          },
        });

        if (signUpError) {
          throw signUpError;
        }

        // Supabase returns an empty identities array if this email was already registered
        if (signUpData.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
          throw new Error(
            language === "sw"
              ? "Barua pepe hii tayari ipo kwenye mfumo. Run migration 044 kwenye Supabase SQL Editor ili mtumiaji aunganishwe kikamilifu, au tumia barua pepe nyingine."
              : "This email is already registered in the system. Run migration 044 in Supabase SQL Editor to link and auto-confirm this account, or use a new email."
          );
        }

        createdUserId = signUpData.user?.id ?? null;
        if (signUpData.user && !signUpData.user.confirmed_at && !signUpData.user.email_confirmed_at) {
          isUnconfirmed = true;
        }

        // Ensure profile and user_roles are bound to the shop
        if (createdUserId) {
          const profilePayload: any = {
            user_id: createdUserId,
            shop_id: shopId,
            full_name: registeredName,
            email: form.email.trim(),
          };

          // Try upserting with custom_role, fallback without if column does not exist
          const { error: profErr } = await supabase.from("profiles" as any).upsert({
            ...profilePayload,
            custom_role: assignedRole,
          });

          if (profErr) {
            await supabase.from("profiles" as any).upsert(profilePayload);
          }

          // Cache custom role in localStorage for instantaneous resilience
          try {
            const cacheKey = `wisecash_custom_roles_${shopId}`;
            const map = JSON.parse(localStorage.getItem(cacheKey) || "{}");
            map[createdUserId] = assignedRole;
            localStorage.setItem(cacheKey, JSON.stringify(map));
          } catch {}

          const dbEnumRole = ["owner", "manager", "cashier", "staff", "hr"].includes(assignedRole.toLowerCase())
            ? assignedRole.toLowerCase()
            : "staff";

          await supabase.from("user_roles" as any).upsert({
            user_id: createdUserId,
            shop_id: shopId,
            role: dbEnumRole,
          });
        }

        registeredSuccess = true;
      }

      await logAudit({
        action: "user_created",
        entityType: "profiles",
        entityId: createdUserId,
        metadata: { email: form.email.trim(), role: assignedRole },
      });

      await queryClient.invalidateQueries({ queryKey: ["shop-users"] });
      await queryClient.invalidateQueries({ queryKey: ["shop-users", shopId] });
      await queryClient.invalidateQueries({ queryKey: ["shop_settings"] });

      if (isUnconfirmed) {
        toast.warning(
          language === "sw"
            ? "Mtumiaji amesajiliwa lakini anahitaji kuthibitisha barua pepe kabla ya kuingia, au endesha migration 044 kwenye Supabase kuwezesha kuingia mara moja."
            : "User added! Note: Email confirmation is pending. Run migration 044 in Supabase SQL Editor to enable instant logins without email verification."
        );
      } else {
        toast.success(
          language === "sw"
            ? "Mtumiaji amesajiliwa kikamilifu! Sasa chagua kurasa anazoweza kufikia."
            : "User registered successfully! Now select which pages this user can access."
        );
      }

      setAddOpen(false);
      setForm({ email: "", password: "", full_name: "", role: "" });

      // Immediately open Step 2: Page Permissions Dialog
      if (createdUserId) {
        setPermissionsUser({
          id: createdUserId,
          user_id: createdUserId,
          full_name: registeredName,
          role: assignedRole,
        });
        setIsInitialPermissions(true);
        setPermissionsOpen(true);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  const openDetails = (u: ShopUser) => { setDetailsUser(u); setDetailsOpen(true); };
  const openEdit = (u: ShopUser) => {
    setEditUser(u);
    setEditForm({
      full_name: u.full_name,
      email: u.email ?? "",
      phone: u.phone ?? "",
      role: u.role || "staff",
    });
    setEditOpen(true);
  };
  const openPermissions = (u: ShopUser) => {
    setPermissionsUser(u);
    setIsInitialPermissions(false);
    setPermissionsOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editUser || !shopId) return;
    setUpdating(true);
    try {
      const updatedRole = editForm.role.trim() || "Staff";
      const dbRole = ["owner", "manager", "cashier", "staff", "hr"].includes(updatedRole.toLowerCase())
        ? updatedRole.toLowerCase()
        : "staff";

      const { error: profErr } = await supabase
        .from("profiles" as any)
        .update({
          full_name: editForm.full_name.trim(),
          phone: editForm.phone.trim() || null,
          custom_role: updatedRole,
        })
        .eq("user_id", editUser.user_id)
        .eq("shop_id", shopId);

      if (profErr) {
        // Fallback without custom_role column
        await supabase
          .from("profiles" as any)
          .update({
            full_name: editForm.full_name.trim(),
            phone: editForm.phone.trim() || null,
          })
          .eq("user_id", editUser.user_id)
          .eq("shop_id", shopId);
      }

      // Update local storage cache
      try {
        const cacheKey = `wisecash_custom_roles_${shopId}`;
        const map = JSON.parse(localStorage.getItem(cacheKey) || "{}");
        map[editUser.user_id] = updatedRole;
        localStorage.setItem(cacheKey, JSON.stringify(map));
      } catch {}

      await supabase
        .from("user_roles" as any)
        .update({ role: dbRole })
        .eq("user_id", editUser.user_id)
        .eq("shop_id", shopId);

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
    setLoading(true);
    try {
      // 1. Safely unbind foreign key references pointing to profile or user in common transactional tables
      try {
        await supabase.from("sales" as any).update({ employee_id: null }).eq("employee_id", userToDelete.id);
      } catch {}
      try {
        await supabase.from("sales" as any).update({ cashier_id: null }).eq("cashier_id", userToDelete.user_id);
      } catch {}
      try {
        await supabase.from("purchase_orders" as any).update({ created_by: null }).eq("created_by", userToDelete.id);
      } catch {}
      try {
        await supabase.from("purchase_orders" as any).update({ approved_by: null }).eq("approved_by", userToDelete.id);
      } catch {}
      try {
        await supabase.from("expenses" as any).update({ employee_id: null }).eq("employee_id", userToDelete.user_id);
      } catch {}

      // 2. Try deleting via Database RPC admin_delete_staff_user (cleans app tables & purges auth.users)
      let rpcDeleted = false;
      try {
        const { data, error } = await supabase.rpc("admin_delete_staff_user" as any, {
          p_user_id: userToDelete.user_id,
          p_shop_id: shopId,
        });
        if (!error && (data as any)?.success) {
          rpcDeleted = true;
        }
      } catch {
        // Proceed to edge function / direct fallback
      }

      // 3. Invoke Edge Function with Service Role key to ensure user is purged from auth.users
      try {
        await supabase.functions.invoke("admin-create-user", {
          body: {
            action: "delete",
            user_id: userToDelete.user_id,
            shop_id: shopId,
          },
        });
      } catch {
        // Non-blocking if edge function is not deployed locally
      }

      // 4. Direct table deletions/disassociation (always run to ensure complete consistency)
      try {
        // Remove permissions
        await supabase
          .from("user_page_access" as any)
          .delete()
          .eq("user_id", userToDelete.user_id)
          .eq("shop_id", shopId);
      } catch {}

      try {
        // Remove role
        await supabase
          .from("user_roles" as any)
          .delete()
          .eq("user_id", userToDelete.user_id)
          .eq("shop_id", shopId);
      } catch {}

      try {
        // Disassociate profile from shop so it will never be queried as part of this shop
        await supabase
          .from("profiles" as any)
          .update({ shop_id: null })
          .eq("user_id", userToDelete.user_id)
          .eq("shop_id", shopId);
      } catch {}

      try {
        // Attempt profile hard delete
        const { error: profErr } = await supabase
          .from("profiles" as any)
          .delete()
          .eq("user_id", userToDelete.user_id)
          .eq("shop_id", shopId);

        if (profErr) {
          await supabase
            .from("profiles" as any)
            .delete()
            .eq("id", userToDelete.id)
            .eq("shop_id", shopId);
        }
      } catch {}

      // 5. Store deleted user ID in local tombstone so it can never reappear in the UI
      try {
        const tombstoneKey = `wisecash_deleted_users_${shopId}`;
        const tombstones = new Set<string>(JSON.parse(localStorage.getItem(tombstoneKey) || "[]"));
        if (userToDelete.user_id) tombstones.add(userToDelete.user_id);
        if (userToDelete.id) tombstones.add(userToDelete.id);
        localStorage.setItem(tombstoneKey, JSON.stringify([...tombstones]));
      } catch {}

      // 3. Clean up localStorage custom role cache
      try {
        const cacheKey = `wisecash_custom_roles_${shopId}`;
        const map = JSON.parse(localStorage.getItem(cacheKey) || "{}");
        delete map[userToDelete.user_id];
        localStorage.setItem(cacheKey, JSON.stringify(map));
      } catch {}

      // 4. Optimistically update local query cache for instantaneous UI response
      queryClient.setQueryData(["shop-users", shopId], (prev: any[] | undefined) => {
        return (prev ?? []).filter((u) => u.user_id !== userToDelete.user_id && u.id !== userToDelete.id);
      });

      // 5. Invalidate server state
      await queryClient.invalidateQueries({ queryKey: ["shop-users"] });
      await queryClient.invalidateQueries({ queryKey: ["user-page-access"] });

      toast.success(
        language === "sw"
          ? `Mtumiaji "${userToDelete.full_name}" ameondolewa.`
          : `User "${userToDelete.full_name}" removed successfully.`
      );
      setDeleteOpen(false);
      setUserToDelete(null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setLoading(false);
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

      {/* Staff Capacity & Extra Seats Status Banner */}
      <Card className="border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">
                {language === "sw" ? "Nafasi za Watumiaji Chini ya Mmiliki" : "Staff Capacity Under Admin"}
              </span>
              <Badge variant={isCapacityReached ? "destructive" : "secondary"} className="text-xs">
                {assignedStaffCount} / {maxAssignedStaff} {language === "sw" ? "zimetumika" : "used"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {language === "sw"
                ? `Kikomo cha msingi ni watumiaji 4. Nafasi za ziada ni TZS ${EXTRA_USER_SEAT_PRICE_TZS.toLocaleString()} kila moja (Nafasi za ziada zilizopo: ${extraSeats}).`
                : `Base limit is 4 staff users. Additional user seats are TZS ${EXTRA_USER_SEAT_PRICE_TZS.toLocaleString()} each (Current extra seats: ${extraSeats}).`}
            </p>
            <div className="w-full max-w-sm pt-1">
              <Progress value={Math.min(100, (assignedStaffCount / Math.max(1, maxAssignedStaff)) * 100)} className="h-1.5" />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs self-start sm:self-auto"
            onClick={() => navigate("/billing")}
          >
            <WalletCards className="h-3.5 w-3.5" />
            <span>
              {language === "sw"
                ? `Ongeza Nafasi (+TZS ${EXTRA_USER_SEAT_PRICE_TZS.toLocaleString()})`
                : `Add User Space (+TZS ${EXTRA_USER_SEAT_PRICE_TZS.toLocaleString()})`}
            </span>
          </Button>
        </div>
      </Card>

      {/* Inventory-style Bottom Sheet for Add */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-4 border-t border-border bg-card">
          <SheetHeader className="pb-3 border-b border-border">
            <SheetTitle className="text-sm font-bold flex items-center gap-2">
              <Shield className="h-4 w-4" />{language === "sw" ? "Sajili Mtumiaji" : "Register User"}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-3.5 pt-3">
            {isCapacityReached && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">
                    {language === "sw"
                      ? `Kikomo cha watumiaji ${maxAssignedStaff}/${maxAssignedStaff} kimefikiwa`
                      : `User limit reached (${maxAssignedStaff}/${maxAssignedStaff} assigned)`}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {language === "sw"
                      ? `Mmiliki anaweza kuwa na watumiaji 4 pekee chini yake. Ili kuongeza watumiaji zaidi, nunua nafasi za ziada kwa TZS ${EXTRA_USER_SEAT_PRICE_TZS.toLocaleString()} kila moja.`
                      : `The admin can only assign 4 staff users under them. To add more users, purchase additional spaces for TZS ${EXTRA_USER_SEAT_PRICE_TZS.toLocaleString()} each.`}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] mt-1 gap-1"
                    onClick={() => { setAddOpen(false); navigate("/billing"); }}
                  >
                    <WalletCards className="h-3 w-3" />
                    <span>{language === "sw" ? "Nenda Kwenye Malipo" : "Go to Billing"}</span>
                  </Button>
                </div>
              </div>
            )}

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
              <Label className="text-xs font-semibold text-foreground">
                {language === "sw" ? "Jukumu / Wadhifa" : "Role / Position Title"} *
              </Label>
              <Input
                placeholder={language === "sw" ? "mf. Keshia, Msimamizi, Mhasibu, Mlinzi wa Stoo..." : "e.g. Cashier, Storekeeper, Supervisor, Sales Rep..."}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="h-9 rounded-xl border-border text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                {language === "sw"
                  ? "Andika jina la cheo chochote unachopenda kumpa mtumiaji huyu."
                  : "Type any custom title or role you wish to assign to this user."}
              </p>
            </div>
            <Button className="w-full h-9 rounded-xl bg-neutral-950 font-medium text-white shadow-xs hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 text-xs transition-all" onClick={handleRegister} disabled={loading || isCapacityReached}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (language === "sw" ? "Sajili na Chagua Kurasa" : "Register & Configure Access")}
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
                {detailsUser.role !== "owner" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-xl text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10"
                    onClick={() => { setDetailsOpen(false); openPermissions(detailsUser); }}
                  >
                    <ShieldCheck className="h-3.5 w-3.5 mr-1 text-primary" />
                    {language === "sw" ? "Ruhusa za Kurasa" : "Page Access"}
                  </Button>
                )}
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
              <Label className="text-xs font-semibold text-foreground">{language === "sw" ? "Jukumu / Wadhifa" : "Role / Position Title"}</Label>
              <Input
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                placeholder={language === "sw" ? "mf. Keshia, Msimamizi..." : "e.g. Cashier, Supervisor..."}
                className="h-9 rounded-xl border-border text-xs"
              />
            </div>
            <Button className="w-full h-9 rounded-xl bg-neutral-950 font-medium text-white shadow-xs hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 text-xs transition-all" onClick={handleUpdateUser} disabled={updating}>
              {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (language === "sw" ? "Hifadhi Mabadiliko" : "Save Changes")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <div className="md:hidden space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-border text-center bg-card">
            <Users className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-muted-foreground">
              {language === "sw" ? "Hakuna watumiaji waliosajiliwa chini ya akaunti hii bado" : "No staff users registered under your account yet"}
            </p>
          </div>
        ) : (
          currentMobileUsers.map((u) => (
            <Card key={u.id} className="p-3.5 rounded-2xl border border-border bg-card flex justify-between items-center shadow-xs">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">{u.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email || "-"}</p>
                <span className="badge-neutral text-[10px] mt-1 inline-block">{getRoleLabel(u.role)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                  title={language === "sw" ? "Ruhusa za Kurasa" : "Page Permissions"}
                  onClick={() => openPermissions(u)}
                >
                  <ShieldCheck className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openDetails(u)}><Eye className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEdit(u)}><Pencil className="h-4 w-4 text-blue-600 dark:text-blue-400" /></Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  title={language === "sw" ? "Ondoa Mtumiaji" : "Delete User"}
                  onClick={() => { setUserToDelete(u); setDeleteOpen(true); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
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
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground text-sm">
                  {language === "sw" ? "Hakuna watumiaji waliosajiliwa chini ya akaunti hii bado." : "No staff users registered under your admin account yet."}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email || "-"}</TableCell>
                  <TableCell><span className="badge-neutral text-xs">{getRoleLabel(u.role)}</span></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                        title={language === "sw" ? "Weka Ruhusa za Kurasa" : "Page Permissions"}
                        onClick={() => openPermissions(u)}
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetails(u)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)}><Pencil className="h-4 w-4 text-blue-600 dark:text-blue-400" /></Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title={language === "sw" ? "Ondoa Mtumiaji" : "Delete User"}
                        onClick={() => { setUserToDelete(u); setDeleteOpen(true); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
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

      {/* Page Permissions Checklist Dialog */}
      <UserPermissionsDialog
        open={permissionsOpen}
        onOpenChange={setPermissionsOpen}
        user={permissionsUser}
        shopId={shopId}
        isInitialSetup={isInitialPermissions}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["shop-users"] });
          queryClient.invalidateQueries({ queryKey: ["user-page-access"] });
        }}
      />
    </motion.div>
  );
}
