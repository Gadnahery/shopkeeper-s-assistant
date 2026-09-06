import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import {
  Users,
  UserCheck,
  Shield,
  KeyRound,
  Plus,
  Search,
  Pencil,
  Trash2,
  DollarSign,
  Briefcase,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  Lock,
  ChevronRight,
  Loader2,
  X,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useShopUsers } from "@/hooks/useShopUsers";
import { useShopFormatting } from "@/hooks/useShopFormatting";
import { supabase } from "@/integrations/supabase/client";
import { PageLoader } from "@/components/PageLoader";
import { cn } from "@/lib/utils";

interface StaffMember {
  id: string;
  name: string;
  phone: string;
  role: string;
  salary: number;
  department: string;
  active: boolean;
  joined_date: string;
}

export default function HRM() {
  const { t, language } = useLanguage();
  const { formatMoney, formatNumber } = useShopFormatting();
  const { shopId, profile } = useAuth();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<string>("staff");
  const [searchTerm, setSearchTerm] = useState("");

  // Inline Master-Detail Panel State (NO POPUPS)
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [staffToDeleteId, setStaffToDeleteId] = useState<string | null>(null);

  // New Staff Form
  const [newStaff, setNewStaff] = useState({
    name: "",
    phone: "",
    role: "Cashier",
    salary: "",
    department: "Sales",
  });

  // Edit Staff Form
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null);

  // User Accounts
  const { data: users, isLoading: usersLoading } = useShopUsers(shopId);

  // Local Staff List (persisted with fallback mock)
  const [staffList, setStaffList] = useState<StaffMember[]>([
    {
      id: "staff-1",
      name: "Baraka Juma",
      phone: "0712345678",
      role: "Sales Lead",
      salary: 450000,
      department: "Sales",
      active: true,
      joined_date: "2024-01-15",
    },
    {
      id: "staff-2",
      name: "Neema Amani",
      phone: "0788112233",
      role: "Storekeeper",
      salary: 380000,
      department: "Inventory",
      active: true,
      joined_date: "2024-02-01",
    },
    {
      id: "staff-3",
      name: "Emmanuel John",
      phone: "0755443322",
      role: "Cashier",
      salary: 300000,
      department: "Finance",
      active: true,
      joined_date: "2024-03-10",
    },
  ]);

  useEffect(() => {
    if (staffList.length > 0 && !selectedStaff && !isAddingStaff) {
      setSelectedStaff(staffList[0]);
      setEditStaff({ ...staffList[0] });
    }
  }, [staffList]);

  const filteredStaff = useMemo(() => {
    return staffList.filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.includes(searchTerm) ||
        s.department.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [staffList, searchTerm]);

  const totalPayroll = useMemo(() => {
    return staffList.reduce((sum, s) => sum + (s.active ? s.salary : 0), 0);
  }, [staffList]);

  const handleSelectStaff = (s: StaffMember) => {
    setSelectedStaff(s);
    setEditStaff({ ...s });
    setIsAddingStaff(false);
  };

  const handleSaveNewStaff = () => {
    if (!newStaff.name.trim()) {
      toast.error(language === "sw" ? "Jaza jina la mfanyakazi" : "Fill in staff name");
      return;
    }

    const created: StaffMember = {
      id: `staff-${Date.now()}`,
      name: newStaff.name.trim(),
      phone: newStaff.phone.trim(),
      role: newStaff.role,
      salary: Number(newStaff.salary) || 0,
      department: newStaff.department,
      active: true,
      joined_date: format(new Date(), "yyyy-MM-dd"),
    };

    setStaffList([...staffList, created]);
    toast.success(language === "sw" ? "Mfanyakazi ameongezwa" : "Staff member added");
    setIsAddingStaff(false);
    setNewStaff({ name: "", phone: "", role: "Cashier", salary: "", department: "Sales" });
    handleSelectStaff(created);
  };

  const handleUpdateStaff = () => {
    if (!editStaff) return;
    setStaffList(staffList.map((s) => (s.id === editStaff.id ? editStaff : s)));
    setSelectedStaff({ ...editStaff });
    toast.success(language === "sw" ? "Taarifa zimesasishwa" : "Staff details updated");
  };

  const handleDeleteStaff = (id: string) => {
    setStaffList(staffList.filter((s) => s.id !== id));
    setSelectedStaff(null);
    setStaffToDeleteId(null);
    toast.success(language === "sw" ? "Mfanyakazi ameondolewa" : "Staff member removed");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 4 Olly KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{language === "sw" ? "Wafanyakazi Wote" : "Total Staff"}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <Users className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">{staffList.length}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{staffList.filter((s) => s.active).length} {language === "sw" ? "wafanyakazi hai" : "active staff"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{language === "sw" ? "Jumla ya Mishahara" : "Total Monthly Payroll"}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <DollarSign className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">{formatMoney(totalPayroll)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{language === "sw" ? "Kwa mwezi mmoja" : "Per calendar month"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{language === "sw" ? "Akaunti za Mfumo" : "User Logins"}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <KeyRound className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">{users?.length || 1}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{language === "sw" ? "Wenye ruhusa za kuingia" : "Authenticated accounts"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{language === "sw" ? "Idara" : "Departments"}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground">
              <Building className="h-4 w-4 text-accent" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {new Set(staffList.map((s) => s.department)).size}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">{language === "sw" ? "Idara za biashara" : "Active divisions"}</p>
          </div>
        </Card>
      </div>

      {/* Tabs for Staff vs User Access */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted p-1 rounded-xl mb-4">
          <TabsTrigger value="staff" className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs">
            {language === "sw" ? "Wafanyakazi" : "Staff Members"} ({staffList.length})
          </TabsTrigger>
          <TabsTrigger value="access" className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs">
            {language === "sw" ? "Ruhusa za Kuingia (User Access)" : "User Access"} ({users?.length || 1})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Staff Members Master-Detail */}
        <TabsContent value="staff" className="m-0 space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column (Master Staff Table - 7 Cols) */}
            <div className="space-y-4 lg:col-span-7">
              <Card className="border border-border bg-card shadow-xs">
                <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:w-56">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={language === "sw" ? "Tafuta mfanyakazi..." : "Search staff..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-9 rounded-xl border-border bg-background pl-9 text-xs"
                    />
                  </div>

                  <Button
                    onClick={() => {
                      setIsAddingStaff(true);
                      setSelectedStaff(null);
                    }}
                    className="h-9 gap-1.5 rounded-xl bg-primary text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
                  >
                    <Plus className="h-3.5 w-3.5 text-accent" />
                    <span>{language === "sw" ? "+ Mfanyakazi" : "+ Add Staff"}</span>
                  </Button>
                </div>

                <div className="internal-table-scroll overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                        <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{t("hrm.name")}</TableHead>
                        <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{t("hrm.role")}</TableHead>
                        <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{language === "sw" ? "Idara" : "Dept"}</TableHead>
                        <TableHead className="text-xs font-semibold uppercase text-muted-foreground">{language === "sw" ? "Mshahara" : "Salary"}</TableHead>
                        <TableHead className="text-right text-xs font-semibold uppercase text-muted-foreground"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStaff.map((s) => {
                        const isSelected = selectedStaff?.id === s.id && !isAddingStaff;

                        return (
                          <TableRow
                            key={s.id}
                            onClick={() => handleSelectStaff(s)}
                            className={cn(
                              "cursor-pointer border-b border-border/60 transition-colors",
                              isSelected ? "bg-accent/10 hover:bg-accent/15" : "hover:bg-muted/40",
                            )}
                          >
                            <TableCell className="text-xs font-semibold text-foreground">
                              {s.name}
                            </TableCell>
                            <TableCell className="text-xs text-foreground">{s.role}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{s.department}</TableCell>
                            <TableCell className="text-xs font-bold text-foreground">{formatMoney(s.salary)}</TableCell>
                            <TableCell className="text-right">
                              <ChevronRight className={cn("h-4 w-4 transition-transform", isSelected ? "text-accent translate-x-1" : "text-muted-foreground")} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </div>

            {/* Right Column (Inline Detail / Add Panel - 5 Cols, NO POPUPS) */}
            <div className="space-y-4 lg:col-span-5">
              {/* Case 1: Inline Add Staff Form */}
              {isAddingStaff && (
                <Card className="border border-border bg-card shadow-xs">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-accent" />
                      <span>{language === "sw" ? "Ongeza Mfanyakazi" : "Add Staff Member"}</span>
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsAddingStaff(false)}
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">{t("hrm.name")} *</Label>
                      <Input
                        value={newStaff.name}
                        onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                        placeholder="e.g. Amani Mwita"
                        className="h-9 rounded-xl border-border bg-background text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">{t("hrm.phone")}</Label>
                        <Input
                          value={newStaff.phone}
                          onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                          placeholder="0712345678"
                          className="h-9 rounded-xl border-border bg-background text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">{t("hrm.role")}</Label>
                        <Input
                          value={newStaff.role}
                          onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                          placeholder="Cashier"
                          className="h-9 rounded-xl border-border bg-background text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">{language === "sw" ? "Idara" : "Department"}</Label>
                        <Input
                          value={newStaff.department}
                          onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
                          placeholder="Sales"
                          className="h-9 rounded-xl border-border bg-background text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">{language === "sw" ? "Mshahara (TSH)" : "Monthly Salary"}</Label>
                        <Input
                          type="number"
                          value={newStaff.salary}
                          onChange={(e) => setNewStaff({ ...newStaff, salary: e.target.value })}
                          placeholder="350000"
                          className="h-9 rounded-xl border-border bg-background text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" onClick={() => setIsAddingStaff(false)} className="h-9 rounded-xl text-xs flex-1">
                        {t("common.cancel")}
                      </Button>
                      <Button
                        onClick={handleSaveNewStaff}
                        disabled={!newStaff.name.trim()}
                        className="h-9 rounded-xl bg-primary text-xs font-bold text-primary-foreground flex-[2]"
                      >
                        {language === "sw" ? "Hifadhi Mfanyakazi" : "Save Staff"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Case 2: Inline Selected Staff Details & Edit */}
              {!isAddingStaff && editStaff && (
                <Card className="border border-border bg-card shadow-xs">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-border p-4">
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground">
                        {editStaff.name}
                      </CardTitle>
                      <p className="text-[11px] text-muted-foreground">{editStaff.role} · {editStaff.department}</p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setStaffToDeleteId(editStaff.id)}
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">{t("hrm.name")}</Label>
                      <Input
                        value={editStaff.name}
                        onChange={(e) => setEditStaff({ ...editStaff, name: e.target.value })}
                        className="h-9 rounded-xl border-border bg-background text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">{t("hrm.phone")}</Label>
                        <Input
                          value={editStaff.phone}
                          onChange={(e) => setEditStaff({ ...editStaff, phone: e.target.value })}
                          className="h-9 rounded-xl border-border bg-background text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">{t("hrm.role")}</Label>
                        <Input
                          value={editStaff.role}
                          onChange={(e) => setEditStaff({ ...editStaff, role: e.target.value })}
                          className="h-9 rounded-xl border-border bg-background text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">{language === "sw" ? "Idara" : "Department"}</Label>
                        <Input
                          value={editStaff.department}
                          onChange={(e) => setEditStaff({ ...editStaff, department: e.target.value })}
                          className="h-9 rounded-xl border-border bg-background text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">{language === "sw" ? "Mshahara (TSH)" : "Salary"}</Label>
                        <Input
                          type="number"
                          value={editStaff.salary}
                          onChange={(e) => setEditStaff({ ...editStaff, salary: Number(e.target.value) })}
                          className="h-9 rounded-xl border-border bg-background text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        onClick={handleUpdateStaff}
                        className="h-9 w-full rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-accent mr-1" />
                        <span>{language === "sw" ? "Hifadhi Mabadiliko" : "Save Changes"}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: User Access & Roles */}
        <TabsContent value="access" className="m-0">
          <Card className="border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">{language === "sw" ? "Akaunti Zilizosajiliwa Kwenye Mfumo" : "Authorized User Logins"}</h3>
                <p className="text-xs text-muted-foreground">{language === "sw" ? "Dhibiti nani ana uwezo wa kuingia na kuona kurasa zipi" : "Control roles and access permissions"}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-muted/40">
                    <TableHead className="text-xs font-semibold">{language === "sw" ? "Mtumiaji" : "User"}</TableHead>
                    <TableHead className="text-xs font-semibold">{language === "sw" ? "Wadhifa" : "Role"}</TableHead>
                    <TableHead className="text-xs font-semibold">{language === "sw" ? "Hali" : "Status"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(users || []).map((u) => (
                    <TableRow key={u.id} className="border-b border-border/60">
                      <TableCell className="text-xs font-semibold text-foreground">
                        {u.full_name || u.phone || "System User"}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground capitalize">
                          {u.role || "Owner"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success-bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--success-text)]">
                          Active
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Staff Confirm */}
      <AlertDialog open={!!staffToDeleteId} onOpenChange={(o) => !o && setStaffToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === "sw" ? "Ondoa mfanyakazi huyu?" : "Remove this staff member?"}</AlertDialogTitle>
            <AlertDialogDescription>{t("common.confirmDeleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => staffToDeleteId && handleDeleteStaff(staffToDeleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === "sw" ? "Ondoa" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
