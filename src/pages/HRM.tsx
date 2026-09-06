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
import { Sheet, SheetContent } from "@/components/ui/sheet";
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
  const [mobileStaffPage, setMobileStaffPage] = useState(1);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Master-Detail Panel State
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

  const MOBILE_STAFF_PAGE_SIZE = 4;
  const totalMobileStaffPages = Math.ceil(filteredStaff.length / MOBILE_STAFF_PAGE_SIZE) || 1;
  const currentMobileStaff = useMemo(() => {
    const start = (mobileStaffPage - 1) * MOBILE_STAFF_PAGE_SIZE;
    return filteredStaff.slice(start, start + MOBILE_STAFF_PAGE_SIZE);
  }, [filteredStaff, mobileStaffPage]);

  useEffect(() => {
    setMobileStaffPage(1);
  }, [searchTerm]);

  const totalPayroll = useMemo(() => {
    return staffList.reduce((sum, s) => sum + (s.active ? s.salary : 0), 0);
  }, [staffList]);

  const handleSelectStaff = (s: StaffMember) => {
    setSelectedStaff(s);
    setEditStaff({ ...s });
    setIsAddingStaff(false);
    setMobileDrawerOpen(true);
  };

  const handleStartAddStaff = () => {
    setIsAddingStaff(true);
    setSelectedStaff(null);
    setMobileDrawerOpen(true);
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
    setMobileDrawerOpen(false);
    setNewStaff({ name: "", phone: "", role: "Cashier", salary: "", department: "Sales" });
    handleSelectStaff(created);
  };

  const handleUpdateStaff = () => {
    if (!editStaff) return;
    setStaffList(staffList.map((s) => (s.id === editStaff.id ? editStaff : s)));
    setSelectedStaff({ ...editStaff });
    setMobileDrawerOpen(false);
    toast.success(language === "sw" ? "Taarifa zimesasishwa" : "Staff details updated");
  };

  const handleDeleteStaff = (id: string) => {
    setStaffList(staffList.filter((s) => s.id !== id));
    setSelectedStaff(null);
    setStaffToDeleteId(null);
    toast.success(language === "sw" ? "Mfanyakazi ameondolewa" : "Staff member removed");
  };

  const renderAddStaffForm = () => (
    <Card className="border border-border bg-card shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
        <div>
          <CardTitle className="text-sm font-semibold text-foreground">
            {language === "sw" ? "Ongeza Mfanyakazi Mpya" : "Add New Staff Member"}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {language === "sw" ? "Jaza taarifa za mfanyakazi mpya" : "Enter details for the new staff member"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={() => {
            setIsAddingStaff(false);
            setMobileDrawerOpen(false);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground">
            {language === "sw" ? "Jina Kamili *" : "Full Name *"}
          </Label>
          <Input
            value={newStaff.name}
            onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
            placeholder={language === "sw" ? "Mfano: Juma Rashid" : "e.g. John Doe"}
            className="h-9 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground">
            {language === "sw" ? "Namba ya Simu" : "Phone Number"}
          </Label>
          <Input
            value={newStaff.phone}
            onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
            placeholder="0712 345 678"
            className="h-9 text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              {language === "sw" ? "Wadhifa (Role)" : "Role"}
            </Label>
            <Input
              value={newStaff.role}
              onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
              placeholder="Cashier"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              {language === "sw" ? "Idara (Department)" : "Department"}
            </Label>
            <Input
              value={newStaff.department}
              onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })}
              placeholder="Sales"
              className="h-9 text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground">
            {language === "sw" ? "Mshahara wa Mwezi (TZS)" : "Monthly Salary (TZS)"}
          </Label>
          <Input
            type="number"
            value={newStaff.salary}
            onChange={(e) => setNewStaff({ ...newStaff, salary: e.target.value })}
            placeholder="350000"
            className="h-9 text-xs"
          />
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Button
            onClick={handleSaveNewStaff}
            className="w-full h-10 rounded-xl bg-neutral-950 font-medium text-white hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 text-xs shadow-xs"
          >
            {language === "sw" ? "Hifadhi Mfanyakazi" : "Save Staff Member"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setIsAddingStaff(false);
              setMobileDrawerOpen(false);
            }}
            className="w-full h-9 rounded-xl text-xs"
          >
            {language === "sw" ? "Ghairi" : "Cancel"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStaffDetail = () => {
    if (!editStaff) return null;

    return (
      <Card className="border border-border bg-card shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white font-bold text-sm">
              {editStaff.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                {editStaff.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="badge-neutral text-[10px] px-1.5 py-0">{editStaff.role}</span>
                <span className={cn(
                  "text-[10px] font-medium px-1.5 py-0 rounded-full",
                  editStaff.active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-neutral-500/10 text-neutral-500"
                )}>
                  {editStaff.active ? (language === "sw" ? "Hai" : "Active") : (language === "sw" ? "Amesitishwa" : "Inactive")}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => {
              setSelectedStaff(null);
              setEditStaff(null);
              setMobileDrawerOpen(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              {language === "sw" ? "Jina Kamili" : "Full Name"}
            </Label>
            <Input
              value={editStaff.name}
              onChange={(e) => setEditStaff({ ...editStaff, name: e.target.value })}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              {language === "sw" ? "Namba ya Simu" : "Phone"}
            </Label>
            <Input
              value={editStaff.phone}
              onChange={(e) => setEditStaff({ ...editStaff, phone: e.target.value })}
              className="h-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                {language === "sw" ? "Wadhifa" : "Role"}
              </Label>
              <Input
                value={editStaff.role}
                onChange={(e) => setEditStaff({ ...editStaff, role: e.target.value })}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                {language === "sw" ? "Idara" : "Department"}
              </Label>
              <Input
                value={editStaff.department}
                onChange={(e) => setEditStaff({ ...editStaff, department: e.target.value })}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">
              {language === "sw" ? "Mshahara wa Mwezi (TZS)" : "Monthly Salary (TZS)"}
            </Label>
            <Input
              type="number"
              value={editStaff.salary}
              onChange={(e) => setEditStaff({ ...editStaff, salary: Number(e.target.value) || 0 })}
              className="h-9 text-xs"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <div>
              <p className="text-xs font-medium text-foreground">
                {language === "sw" ? "Hali ya Mfanyakazi" : "Staff Status"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {editStaff.active ? (language === "sw" ? "Anaendelea na kazi" : "Currently employed") : (language === "sw" ? "Hayupo kazini" : "Suspended or left")}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditStaff({ ...editStaff, active: !editStaff.active })}
              className={cn("h-7 px-2.5 text-xs font-medium", editStaff.active ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}
            >
              {editStaff.active ? (language === "sw" ? "Badilisha: Sitisha" : "Set Inactive") : (language === "sw" ? "Badilisha: Washa" : "Set Active")}
            </Button>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Button
              onClick={handleUpdateStaff}
              className="w-full h-10 rounded-xl bg-neutral-950 font-medium text-white hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 text-xs shadow-xs"
            >
              {language === "sw" ? "Sasisha Taarifa" : "Update Staff Details"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setStaffToDeleteId(editStaff.id)}
              className="w-full h-9 rounded-xl text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              {language === "sw" ? "Futa Mfanyakazi" : "Delete Staff Member"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 4 Compact Olly KPI Cards (2x2 on Mobile, 4 cols on Desktop) */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Wafanyakazi Wote" : "Total Staff"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate">{staffList.length}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{staffList.filter((s) => s.active).length} {language === "sw" ? "hai" : "active"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Jumla ya Mishahara" : "Total Monthly Payroll"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate">{formatMoney(totalPayroll)}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Kwa mwezi mmoja" : "Per calendar month"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Akaunti za Mfumo" : "User Logins"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <KeyRound className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate">{users?.length || 1}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Wenye ruhusa" : "Authorized logins"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Idara" : "Departments"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <Building className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate">
              {new Set(staffList.map((s) => s.department)).size}
            </p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Vitengo vya kazi" : "Active divisions"}</p>
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
                    onClick={handleStartAddStaff}
                    className="h-9 gap-1.5 rounded-xl bg-neutral-950 text-xs font-medium text-white shadow-xs hover:bg-neutral-900 dark:bg-white dark:text-neutral-950"
                  >
                    <Plus className="h-3.5 w-3.5 text-accent" />
                    <span>{language === "sw" ? "+ Mfanyakazi" : "+ Add Staff"}</span>
                  </Button>
                </div>

                {/* Mobile View: 4 Compact Cards per page */}
                <div className="md:hidden">
                  <div className="divide-y divide-border/60">
                    {currentMobileStaff.map((s) => {
                      const isSelected = selectedStaff?.id === s.id && !isAddingStaff;

                      return (
                        <div
                          key={s.id}
                          onClick={() => handleSelectStaff(s)}
                          className={cn(
                            "flex items-center justify-between p-3.5 transition-colors active:bg-muted/60 cursor-pointer",
                            isSelected ? "bg-accent/10" : ""
                          )}
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-xs text-foreground truncate">{s.name}</p>
                              <span className="badge-neutral text-[10px] px-1.5 py-0">{s.role}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                              <span>{s.department}</span>
                              {s.phone && (
                                <>
                                  <span>•</span>
                                  <span>{s.phone}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-bold text-xs text-foreground">
                              {formatMoney(s.salary)}
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalMobileStaffPages > 1 && (
                    <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-border/60 bg-muted/20 text-xs">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={mobileStaffPage <= 1}
                        onClick={() => setMobileStaffPage((p) => Math.max(1, p - 1))}
                        className="h-7 px-2 text-xs"
                      >
                        Prev
                      </Button>
                      <span className="text-muted-foreground">
                        {mobileStaffPage} / {totalMobileStaffPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={mobileStaffPage >= totalMobileStaffPages}
                        onClick={() => setMobileStaffPage((p) => Math.min(totalMobileStaffPages, p + 1))}
                        className="h-7 px-2 text-xs"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>

                {/* Desktop View: Full Master Table */}
                <div className="hidden md:block internal-table-scroll overflow-x-auto">
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

            {/* Desktop Right Column: Inline Detail / Add Panel */}
            <div className="hidden lg:block lg:col-span-5 space-y-4">
              {isAddingStaff && renderAddStaffForm()}
              {!isAddingStaff && editStaff && renderStaffDetail()}
            </div>
          </div>

          {/* Mobile Bottom Sheet for Adding / Editing Staff (NO SCROLLING DOWN) */}
          <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
            <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-0 border-t border-border bg-card lg:hidden">
              <div className="p-1">
                {isAddingStaff && renderAddStaffForm()}
                {!isAddingStaff && editStaff && renderStaffDetail()}
              </div>
            </SheetContent>
          </Sheet>
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
