import { useMemo, useState } from "react";
import { CalendarPlus, Check, Clock3, UserRound, X, CheckCircle2, Scissors, CalendarCheck } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppointments, useCreateAppointment, useUpdateAppointment } from "@/hooks/useAppointments";
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
  const services = useMemo(() => products.filter((product) => product.item_type === "service"), [products]);

  const openForm = () => setSearchParams({ new: "true" });
  const closeForm = () => setSearchParams({});

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const selectedCustomer = customers.find((customer) => customer.id === form.customerId);
    const selectedService = services.find((service) => service.id === form.serviceId);
    await createAppointment.mutateAsync({
      customer_id: form.customerId === "walk-in" ? null : form.customerId,
      customer_name: selectedCustomer?.name || form.customerName.trim() || (language === "sw" ? "Mteja wa kutembea" : "Walk-in customer"),
      service_id: selectedService?.id || null,
      service_name: selectedService?.name || form.serviceName.trim(),
      staff_name: form.staffName.trim() || null,
      appointment_at: `${selectedDate}T${form.time}:00`,
      duration_minutes: Number(form.duration) || 30,
      notes: form.notes.trim() || null,
      status: "scheduled",
    });
    closeForm();
  };

  const completedCount = appointments.filter((a) => a.status === "completed").length;
  const pendingCount = appointments.filter((a) => a.status !== "completed" && a.status !== "cancelled").length;

  const renderFormFields = () => (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">{language === "sw" ? "Mteja" : "Customer"}</Label>
        <Select value={form.customerId} onValueChange={(value) => setForm({ ...form, customerId: value })}>
          <SelectTrigger className="h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="rounded-xl text-xs">
            <SelectItem value="walk-in">{language === "sw" ? "Mteja wa kutembea" : "Walk-in customer"}</SelectItem>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">{language === "sw" ? "Huduma" : "Service"}</Label>
        <Select
          value={form.serviceId}
          onValueChange={(value) => setForm({ ...form, serviceId: value, serviceName: services.find((service) => service.id === value)?.name || "" })}
        >
          <SelectTrigger className="h-9 rounded-xl text-xs">
            <SelectValue placeholder={language === "sw" ? "Chagua huduma" : "Select service"} />
          </SelectTrigger>
          <SelectContent className="rounded-xl text-xs">
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{language === "sw" ? "Muda" : "Time"}</Label>
          <Input type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} className="h-9 rounded-xl text-xs" required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{language === "sw" ? "Dakika" : "Minutes"}</Label>
          <Input type="number" min="1" value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} className="h-9 rounded-xl text-xs" required />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">{language === "sw" ? "Mhudumu" : "Staff member"}</Label>
        <Input value={form.staffName} onChange={(event) => setForm({ ...form, staffName: event.target.value })} placeholder={language === "sw" ? "Jina la mhudumu" : "Staff name"} className="h-9 rounded-xl text-xs" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">{language === "sw" ? "Maelezo" : "Notes"}</Label>
        <Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} className="rounded-xl text-xs" />
      </div>
      <Button
        type="submit"
        disabled={createAppointment.isPending || !form.serviceName}
        className="w-full h-10 rounded-xl bg-neutral-950 font-medium text-white hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 text-xs shadow-xs"
      >
        {createAppointment.isPending ? (language === "sw" ? "Inahifadhi..." : "Saving...") : (language === "sw" ? "Thibitisha miadi" : "Confirm appointment")}
      </Button>
    </form>
  );

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={language === "sw" ? "Miadi" : "Appointments"}
        subtitle={language === "sw" ? "Panga huduma za leo na ratiba ya timu." : "Plan service visits and keep the team on schedule."}
        actions={
          <Button onClick={openForm} className="gap-2 rounded-xl bg-neutral-950 font-medium text-white hover:bg-neutral-900 dark:bg-white dark:text-neutral-950 text-xs shadow-xs">
            <CalendarPlus className="h-4 w-4 text-accent" />
            {language === "sw" ? "Miadi mpya" : "Book appointment"}
          </Button>
        }
      />

      {/* 4 Compact Olly KPI Cards (2x2 on Mobile, 4 cols on Desktop) */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Miadi ya Leo" : "Today's Schedule"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <CalendarPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate">{appointments.length}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Wateja waliopangwa" : "Total booked"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Zilizokamilika" : "Completed"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate">{completedCount}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Huduma zimetoa" : "Done today"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Zinazosubiri" : "Upcoming"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <Clock3 className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", pendingCount > 0 ? "text-amber-500" : "text-muted-foreground")} />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate">{pendingCount}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Bado kuhudumiwa" : "Waiting for service"}</p>
          </div>
        </Card>

        <Card className="border border-border bg-card p-3.5 sm:p-5 shadow-xs transition-all hover:shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-medium text-muted-foreground truncate">{language === "sw" ? "Aina za Huduma" : "Services"}</span>
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-muted text-foreground flex-shrink-0">
              <Scissors className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <p className="text-base sm:text-2xl font-bold tracking-tight text-foreground truncate">{services.length}</p>
            <p className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground truncate">{language === "sw" ? "Huduma zilizosajiliwa" : "Service catalog"}</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <Card className="border-border shadow-xs">
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="text-base">{language === "sw" ? "Ratiba ya siku" : "Day schedule"}</CardTitle>
              <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="h-9 w-auto text-xs" />
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="space-y-3"><div className="h-16 animate-pulse rounded-xl bg-muted" /><div className="h-16 animate-pulse rounded-xl bg-muted" /></div>
              ) : appointments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
                  <CalendarPlus className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">{language === "sw" ? "Hakuna miadi leo" : "No appointments yet"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{language === "sw" ? "Ongeza miadi ya kwanza kwa siku hii." : "Book the first appointment for this day."}</p>
                  <Button variant="outline" onClick={openForm} className="mt-4 rounded-xl">{language === "sw" ? "Ongeza miadi" : "Add appointment"}</Button>
                </div>
              ) : (
                <>
                  {/* Mobile 4-Item List */}
                  <div className="space-y-3 md:hidden">
                    {appointments.slice((mobilePage - 1) * 4, mobilePage * 4).map((appointment) => (
                      <div key={appointment.id} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-xs">
                        <div className="w-12 shrink-0 text-center text-xs font-bold text-foreground">
                          {new Date(appointment.appointment_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="min-w-0 flex-1 border-l border-border pl-3">
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <p className="font-semibold text-xs text-foreground truncate">{appointment.customer_name}</p>
                            <span className={appointment.status === "completed" ? "badge-success text-[10px]" : "badge-warning text-[10px]"}>
                              {appointment.status}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground truncate">{appointment.service_name}</p>
                          <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1"><Clock3 className="h-3 w-3" />{appointment.duration_minutes}m</span>
                            {appointment.staff_name && <span className="inline-flex items-center gap-1"><UserRound className="h-3 w-3" />{appointment.staff_name}</span>}
                          </div>
                        </div>
                        {appointment.status !== "completed" && appointment.status !== "cancelled" && (
                          <Button size="icon" variant="outline" aria-label="Mark appointment completed" onClick={() => updateAppointment.mutate({ id: appointment.id, status: "completed" })} className="h-8 w-8 rounded-xl shrink-0">
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}

                    {/* Mobile Pagination Footer */}
                    {appointments.length > 4 && (
                      <div className="flex items-center justify-between pt-2 border-t border-border/70 text-xs">
                        <span className="text-muted-foreground">
                          {Math.min((mobilePage - 1) * 4 + 1, appointments.length)}–{Math.min(mobilePage * 4, appointments.length)} / {appointments.length}
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
                            {mobilePage} / {Math.ceil(appointments.length / 4)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={mobilePage >= Math.ceil(appointments.length / 4)}
                            onClick={() => setMobilePage((p) => Math.min(Math.ceil(appointments.length / 4), p + 1))}
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
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
                        <div className="w-14 shrink-0 text-center text-xs font-semibold text-muted-foreground">
                          {new Date(appointment.appointment_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="min-w-0 flex-1 border-l border-border pl-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-foreground">{appointment.customer_name}</p>
                            <span className={appointment.status === "completed" ? "badge-success" : "badge-warning"}>
                              {appointment.status}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{appointment.service_name}</p>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{appointment.duration_minutes} min</span>
                            {appointment.staff_name && <span className="inline-flex items-center gap-1"><UserRound className="h-3.5 w-3.5" />{appointment.staff_name}</span>}
                          </div>
                        </div>
                        {appointment.status !== "completed" && appointment.status !== "cancelled" && (
                          <Button size="icon" variant="outline" aria-label="Mark appointment completed" onClick={() => updateAppointment.mutate({ id: appointment.id, status: "completed" })} className="h-9 w-9 rounded-xl">
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
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
          <Card className="h-fit border-border shadow-xs hidden lg:block">
            <CardHeader className="flex-row items-start justify-between space-y-0 pb-3 border-b border-border">
              <div>
                <CardTitle className="text-sm font-semibold">{language === "sw" ? "Miadi mpya" : "New appointment"}</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">{language === "sw" ? "Jaza taarifa muhimu tu." : "Capture the essentials first."}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={closeForm} aria-label="Close" className="h-7 w-7 rounded-lg"><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="pt-4">
              {renderFormFields()}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mobile Inventory-style Bottom Sheet for New Appointment */}
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
