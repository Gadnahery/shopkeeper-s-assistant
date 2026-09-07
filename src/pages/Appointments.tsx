import { useMemo, useState } from "react";
import {
  CalendarPlus,
  Check,
  Clock3,
  UserRound,
  X,
  CheckCircle2,
  Scissors,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
  Ban,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { format, parseISO, addDays, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
  type Appointment,
} from "@/hooks/useAppointments";
import { useCustomers } from "@/hooks/useCustomers";
import { useProducts } from "@/hooks/useProducts";
import { PageHeader } from "@/components/common/PageHeader";
import { cn } from "@/lib/utils";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function Appointments() {
  const { language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "confirmed" | "completed" | "cancelled">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [mobilePage, setMobilePage] = useState(1);

  const [form, setForm] = useState({
    customerId: "walk-in",
    customerName: "",
    serviceId: "",
    serviceName: "",
    staffName: "",
    time: "10:00",
    duration: "30",
    notes: "",
  });

  const showForm = searchParams.get("new") === "true";
  const { data: appointments = [], isLoading } = useAppointments(selectedDate);
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();
  const deleteAppointment = useDeleteAppointment();

  const services = useMemo(() => products.filter((product) => product.item_type === "service"), [products]);

  const openForm = () => {
    // If services exist and no service selected yet, default to first service
    if (services.length > 0 && !form.serviceName) {
      setForm((prev) => ({
        ...prev,
        serviceId: services[0].id,
        serviceName: services[0].name,
      }));
    }
    setSearchParams({ new: "true" });
  };
  const closeForm = () => setSearchParams({});

  const handlePrevDay = () => {
    try {
      const d = parseISO(selectedDate);
      setSelectedDate(format(subDays(d, 1), "yyyy-MM-dd"));
    } catch {
      setSelectedDate(todayKey());
    }
  };

  const handleNextDay = () => {
    try {
      const d = parseISO(selectedDate);
      setSelectedDate(format(addDays(d, 1), "yyyy-MM-dd"));
    } catch {
      setSelectedDate(todayKey());
    }
  };

  const handleToday = () => {
    setSelectedDate(todayKey());
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const selectedCustomer = customers.find((customer) => customer.id === form.customerId);
    const selectedService = services.find((service) => service.id === form.serviceId);

    const resolvedCustomerName =
      selectedCustomer?.name ||
      form.customerName.trim() ||
      (language === "sw" ? "Mteja wa kutembea" : "Walk-in customer");

    const resolvedServiceName = selectedService?.name || form.serviceName.trim();
    if (!resolvedServiceName) return;

    await createAppointment.mutateAsync({
      customer_id: form.customerId === "walk-in" ? null : form.customerId,
      customer_name: resolvedCustomerName,
      service_id: selectedService?.id || null,
      service_name: resolvedServiceName,
      staff_name: form.staffName.trim() || null,
      appointment_at: `${selectedDate}T${form.time}:00`,
      duration_minutes: Number(form.duration) || 30,
      notes: form.notes.trim() || null,
      status: "scheduled",
    });

    setForm({
      customerId: "walk-in",
      customerName: "",
      serviceId: services.length > 0 ? services[0].id : "",
      serviceName: services.length > 0 ? services[0].name : "",
      staffName: "",
      time: "10:00",
      duration: "30",
      notes: "",
    });
    closeForm();
  };

  const completedCount = appointments.filter((a) => a.status === "completed").length;
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;
  const pendingCount = appointments.filter((a) => a.status === "scheduled").length;

  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      if (statusFilter === "scheduled" && app.status !== "scheduled") return false;
      if (statusFilter === "confirmed" && app.status !== "confirmed") return false;
      if (statusFilter === "completed" && app.status !== "completed") return false;
      if (statusFilter === "cancelled" && app.status !== "cancelled") return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchCustomer = app.customer_name?.toLowerCase().includes(q);
        const matchService = app.service_name?.toLowerCase().includes(q);
        const matchStaff = app.staff_name?.toLowerCase().includes(q);
        const matchNotes = app.notes?.toLowerCase().includes(q);
        if (!matchCustomer && !matchService && !matchStaff && !matchNotes) return false;
      }
      return true;
    });
  }, [appointments, statusFilter, searchTerm]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-2.5 w-2.5" />
            {language === "sw" ? "Imekamilika" : "Completed"}
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Check className="h-2.5 w-2.5" />
            {language === "sw" ? "Imethibitishwa" : "Confirmed"}
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <Ban className="h-2.5 w-2.5" />
            {language === "sw" ? "Imeghairiwa" : "Cancelled"}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Clock3 className="h-2.5 w-2.5" />
            {language === "sw" ? "Imepangwa" : "Scheduled"}
          </span>
        );
    }
  };

  const renderActionButtons = (appointment: Appointment) => {
    return (
      <div className="flex items-center gap-1 shrink-0">
        {appointment.status === "scheduled" && (
          <>
            <Button
              size="icon"
              variant="outline"
              title={language === "sw" ? "Thibitisha miadi" : "Confirm appointment"}
              onClick={() => updateAppointment.mutate({ id: appointment.id, status: "confirmed" })}
              className="h-8 w-8 rounded-xl text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/40"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              title={language === "sw" ? "Kamilisha huduma" : "Mark completed"}
              onClick={() => updateAppointment.mutate({ id: appointment.id, status: "completed" })}
              className="h-8 w-8 rounded-xl text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              title={language === "sw" ? "Ghairi" : "Cancel"}
              onClick={() => updateAppointment.mutate({ id: appointment.id, status: "cancelled" })}
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-rose-600"
            >
              <Ban className="h-3.5 w-3.5" />
            </Button>
          </>
        )}

        {appointment.status === "confirmed" && (
          <>
            <Button
              size="icon"
              variant="outline"
              title={language === "sw" ? "Kamilisha huduma" : "Mark completed"}
              onClick={() => updateAppointment.mutate({ id: appointment.id, status: "completed" })}
              className="h-8 w-8 rounded-xl text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              title={language === "sw" ? "Ghairi" : "Cancel"}
              onClick={() => updateAppointment.mutate({ id: appointment.id, status: "cancelled" })}
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-rose-600"
            >
              <Ban className="h-3.5 w-3.5" />
            </Button>
          </>
        )}

        {(appointment.status === "completed" || appointment.status === "cancelled") && (
          <Button
            size="icon"
            variant="ghost"
            title={language === "sw" ? "Fungua upya" : "Reopen"}
            onClick={() => updateAppointment.mutate({ id: appointment.id, status: "scheduled" })}
            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}

        <Button
          size="icon"
          variant="ghost"
          title={language === "sw" ? "Futa" : "Delete"}
          onClick={() => {
            if (window.confirm(language === "sw" ? "Una uhakika unataka kufuta miadi hii?" : "Are you sure you want to delete this appointment?")) {
              deleteAppointment.mutate(appointment.id);
            }
          }}
          className="h-8 w-8 rounded-xl text-muted-foreground hover:text-rose-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  };

  const renderFormFields = () => (
    <form onSubmit={submit} className="space-y-4">
      {/* Customer Selection */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">{language === "sw" ? "Mteja" : "Customer"}</Label>
        <Select
          value={form.customerId}
          onValueChange={(value) => setForm({ ...form, customerId: value })}
        >
          <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="rounded-xl text-xs">
            <SelectItem value="walk-in">{language === "sw" ? "Mteja wa kutembea" : "Walk-in customer"}</SelectItem>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {form.customerId === "walk-in" && (
          <Input
            value={form.customerName}
            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            placeholder={language === "sw" ? "Jina la mteja (si lazima)" : "Walk-in guest name (optional)"}
            className="h-9 rounded-xl text-xs mt-1.5"
          />
        )}
      </div>

      {/* Service Selection or Custom Service Entry */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">{language === "sw" ? "Huduma" : "Service"}</Label>
        {services.length > 0 ? (
          <div className="space-y-2">
            <Select
              value={form.serviceId}
              onValueChange={(value) => {
                if (value === "custom") {
                  setForm({ ...form, serviceId: "custom", serviceName: "" });
                } else {
                  const s = services.find((srv) => srv.id === value);
                  setForm({ ...form, serviceId: value, serviceName: s?.name || "" });
                }
              }}
            >
              <SelectTrigger className="h-9 rounded-xl text-xs">
                <SelectValue placeholder={language === "sw" ? "Chagua huduma au andika mpya" : "Select service or enter custom"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl text-xs">
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                ))}
                <SelectItem value="custom" className="font-semibold text-primary">
                  + {language === "sw" ? "Huduma maalum..." : "Custom service..."}
                </SelectItem>
              </SelectContent>
            </Select>

            {form.serviceId === "custom" && (
              <Input
                value={form.serviceName}
                onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
                placeholder={language === "sw" ? "Andika jina la huduma..." : "Enter custom service name..."}
                className="h-9 rounded-xl text-xs"
                required
              />
            )}
          </div>
        ) : (
          <div>
            <Input
              value={form.serviceName}
              onChange={(e) => setForm({ ...form, serviceId: "custom", serviceName: e.target.value })}
              placeholder={language === "sw" ? "K.m. Kunyoa nywele, Ukarabati, Ushauri" : "e.g., Haircut, Repair, Consultation"}
              className="h-9 rounded-xl text-xs"
              required
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              {language === "sw"
                ? "Unaweza kuandika huduma yoyote moja kwa moja."
                : "You can type any service name directly."}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{language === "sw" ? "Muda" : "Time"}</Label>
          <Input
            type="time"
            value={form.time}
            onChange={(event) => setForm({ ...form, time: event.target.value })}
            className="h-9 rounded-xl text-xs"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{language === "sw" ? "Dakika" : "Minutes"}</Label>
          <Input
            type="number"
            min="5"
            step="5"
            value={form.duration}
            onChange={(event) => setForm({ ...form, duration: event.target.value })}
            className="h-9 rounded-xl text-xs"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">{language === "sw" ? "Mhudumu" : "Staff member"}</Label>
        <Input
          value={form.staffName}
          onChange={(event) => setForm({ ...form, staffName: event.target.value })}
          placeholder={language === "sw" ? "Jina la mhudumu" : "Staff member name"}
          className="h-9 rounded-xl text-xs"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">{language === "sw" ? "Maelezo" : "Notes"}</Label>
        <Textarea
          value={form.notes}
          onChange={(event) => setForm({ ...form, notes: event.target.value })}
          rows={3}
          placeholder={language === "sw" ? "Maelezo ya ziada..." : "Special instructions or notes..."}
          className="rounded-xl text-xs"
        />
      </div>

      <Button
        type="submit"
        disabled={createAppointment.isPending || !form.serviceName.trim()}
        className="w-full h-10 rounded-xl bg-neutral-950 font-medium text-white hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 text-xs shadow-xs"
      >
        {createAppointment.isPending
          ? (language === "sw" ? "Inahifadhi..." : "Saving...")
          : (language === "sw" ? "Thibitisha miadi" : "Confirm appointment")}
      </Button>
    </form>
  );

  const formattedDateTitle = useMemo(() => {
    try {
      const d = parseISO(selectedDate);
      return format(d, "EEEE, MMMM d, yyyy");
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={language === "sw" ? "Miadi & Ratiba" : "Appointments & Schedule"}
        subtitle={language === "sw" ? "Panga huduma za wateja na ratiba ya timu kwa uwazi." : "Plan client visits, assign staff, and keep the team on schedule."}
        actions={
          <Button
            onClick={openForm}
            className="gap-2 rounded-xl bg-neutral-950 font-medium text-white hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 text-xs shadow-xs"
          >
            <CalendarPlus className="h-4 w-4 text-accent" />
            {language === "sw" ? "Miadi mpya" : "Book appointment"}
          </Button>
        }
      />

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Jumla ya Leo" : "Total Booked"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <CalendarPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate">{appointments.length}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Wateja kwenye ratiba" : "Scheduled clients"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Zilizokamilika" : "Completed"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate">{completedCount}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Huduma zilizotolewa" : "Done today"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Zinazosubiri" : "Upcoming"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <Clock3 className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", (pendingCount + confirmedCount) > 0 ? "text-amber-500" : "text-muted-foreground")} />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate">{pendingCount + confirmedCount}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Bado kuhudumiwa" : "Pending service"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Huduma za Katalogi" : "Catalog Services"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <Scissors className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate">{services.length}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Zilizosajiliwa bidhaani" : "Configured services"}</p>
          </div>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <Card className="border-border shadow-xs">
            {/* Header with Date Navigator */}
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 space-y-0 border-b border-border pb-4">
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold text-foreground">
                  {formattedDateTitle}
                </CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {language === "sw" ? "Ratiba na wateja wa siku hii" : "Schedule and client visits for this date"}
                </p>
              </div>

              {/* Date Navigation Toolbar */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handlePrevDay}
                  title="Previous Day"
                  className="h-8 w-8 rounded-xl"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToday}
                  className="h-8 px-2.5 text-xs rounded-xl font-medium"
                >
                  {language === "sw" ? "Leo" : "Today"}
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleNextDay}
                  title="Next Day"
                  className="h-8 w-8 rounded-xl"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="h-8 w-auto text-xs rounded-xl"
                />
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                {/* Status Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  {(["all", "scheduled", "confirmed", "completed", "cancelled"] as const).map((st) => (
                    <Button
                      key={st}
                      type="button"
                      variant={statusFilter === st ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(st)}
                      className={cn(
                        "h-7 px-2.5 text-xs rounded-lg capitalize whitespace-nowrap",
                        statusFilter === st
                          ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {st === "all"
                        ? (language === "sw" ? "Yote" : "All")
                        : st === "scheduled"
                        ? (language === "sw" ? "Zilizopangwa" : "Scheduled")
                        : st === "confirmed"
                        ? (language === "sw" ? "Zilizothibitishwa" : "Confirmed")
                        : st === "completed"
                        ? (language === "sw" ? "Zimekamilika" : "Completed")
                        : (language === "sw" ? "Zimeghairiwa" : "Cancelled")}
                    </Button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={language === "sw" ? "Tafuta miadi..." : "Search appointments..."}
                    className="h-8 pl-8 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Appointments List */}
              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-16 animate-pulse rounded-2xl bg-muted" />
                  <div className="h-16 animate-pulse rounded-2xl bg-muted" />
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
                  <CalendarPlus className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium text-foreground">
                    {appointments.length === 0
                      ? (language === "sw" ? "Hakuna miadi iliyopangwa leo" : "No appointments scheduled for this date")
                      : (language === "sw" ? "Hakuna miadi inayolingana na kichujio" : "No appointments match your filters")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {language === "sw" ? "Ongeza miadi mpya au badilisha tarehe." : "Book a new visit or select another date."}
                  </p>
                  <Button variant="outline" onClick={openForm} className="mt-4 rounded-xl text-xs">
                    {language === "sw" ? "Weka miadi sasa" : "Book appointment"}
                  </Button>
                </div>
              ) : (
                <>
                  {/* Mobile 4-Item Paginated List */}
                  <div className="space-y-3 md:hidden">
                    {filteredAppointments
                      .slice((mobilePage - 1) * 4, mobilePage * 4)
                      .map((appointment) => (
                        <div
                          key={appointment.id}
                          className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-xs"
                        >
                          <div className="w-12 shrink-0 text-center text-xs font-bold text-foreground pt-0.5">
                            {new Date(appointment.appointment_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div className="min-w-0 flex-1 border-l border-border pl-3">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <p className="font-semibold text-xs text-foreground truncate">
                                {appointment.customer_name}
                              </p>
                              {getStatusBadge(appointment.status)}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground truncate font-medium">
                              {appointment.service_name}
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Clock3 className="h-3 w-3" />
                                {appointment.duration_minutes}m
                              </span>
                              {appointment.staff_name && (
                                <span className="inline-flex items-center gap-1">
                                  <UserRound className="h-3 w-3" />
                                  {appointment.staff_name}
                                </span>
                              )}
                            </div>
                            {appointment.notes && (
                              <p className="mt-1.5 text-[11px] text-muted-foreground bg-muted/50 rounded-lg p-1.5 border border-border/50">
                                {appointment.notes}
                              </p>
                            )}
                            <div className="mt-2 pt-2 border-t border-border/50 flex justify-end">
                              {renderActionButtons(appointment)}
                            </div>
                          </div>
                        </div>
                      ))}

                    {/* Mobile Pagination Footer */}
                    {filteredAppointments.length > 4 && (
                      <div className="flex items-center justify-between pt-2 border-t border-border/70 text-xs">
                        <span className="text-muted-foreground">
                          {Math.min((mobilePage - 1) * 4 + 1, filteredAppointments.length)}–
                          {Math.min(mobilePage * 4, filteredAppointments.length)} / {filteredAppointments.length}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={mobilePage === 1}
                            onClick={() => setMobilePage((p) => Math.max(1, p - 1))}
                            className="h-7 px-2 text-xs rounded-lg"
                          >
                            Prev
                          </Button>
                          <span className="px-1.5 font-medium text-foreground">
                            {mobilePage} / {Math.ceil(filteredAppointments.length / 4)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={mobilePage >= Math.ceil(filteredAppointments.length / 4)}
                            onClick={() => setMobilePage((p) => Math.min(Math.ceil(filteredAppointments.length / 4), p + 1))}
                            className="h-7 px-2 text-xs rounded-lg"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Desktop Full List */}
                  <div className="hidden md:block space-y-3">
                    {filteredAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-xs"
                      >
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          <div className="w-16 shrink-0 text-center">
                            <div className="text-sm font-bold text-foreground">
                              {new Date(appointment.appointment_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {appointment.duration_minutes} min
                            </div>
                          </div>

                          <div className="min-w-0 flex-1 border-l border-border pl-4">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm text-foreground">
                                {appointment.customer_name}
                              </p>
                              {getStatusBadge(appointment.status)}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground font-medium">
                              {appointment.service_name}
                            </p>
                            <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                              {appointment.staff_name && (
                                <span className="inline-flex items-center gap-1">
                                  <UserRound className="h-3 w-3" />
                                  {appointment.staff_name}
                                </span>
                              )}
                              {appointment.notes && (
                                <span className="truncate italic">
                                  &bull; {appointment.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {renderActionButtons(appointment)}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Desktop Side Form */}
        {showForm && (
          <Card className="h-fit border-border shadow-xs hidden lg:block sticky top-20">
            <CardHeader className="flex-row items-start justify-between space-y-0 pb-3 border-b border-border">
              <div>
                <CardTitle className="text-sm font-semibold">{language === "sw" ? "Miadi mpya" : "New appointment"}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">{language === "sw" ? "Jaza taarifa muhimu tu." : "Capture visit details."}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={closeForm} aria-label="Close" className="h-7 w-7 rounded-lg"><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="pt-4">
              {renderFormFields()}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mobile Bottom Sheet for New Appointment */}
      <Sheet open={showForm} onOpenChange={(o) => !o && closeForm}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-4 border-t border-border bg-card lg:hidden">
          <SheetHeader className="pb-3 border-b border-border">
            <SheetTitle className="text-sm font-bold">{language === "sw" ? "Miadi mpya" : "New appointment"}</SheetTitle>
          </SheetHeader>
          <div className="pt-3">
            {renderFormFields()}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

