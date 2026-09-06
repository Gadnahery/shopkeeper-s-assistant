import { useMemo, useState } from "react";
import { CalendarPlus, Check, Clock3, UserRound, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={language === "sw" ? "Miadi" : "Appointments"}
        subtitle={language === "sw" ? "Panga huduma za leo na ratiba ya timu." : "Plan service visits and keep the team on schedule."}
        actions={
          <Button onClick={openForm} className="gap-2 rounded-xl">
            <CalendarPlus className="h-4 w-4" />
            {language === "sw" ? "Miadi mpya" : "Book appointment"}
          </Button>
        }
      />

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

        {showForm && (
          <Card className="h-fit border-border shadow-xs">
            <CardHeader className="flex-row items-start justify-between space-y-0">
              <div><CardTitle className="text-base">{language === "sw" ? "Miadi mpya" : "New appointment"}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{language === "sw" ? "Jaza taarifa muhimu tu." : "Capture the essentials first."}</p></div>
              <Button size="icon" variant="ghost" onClick={closeForm} aria-label="Close" className="h-8 w-8 rounded-lg"><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5"><Label>{language === "sw" ? "Mteja" : "Customer"}</Label><Select value={form.customerId} onValueChange={(value) => setForm({ ...form, customerId: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="walk-in">{language === "sw" ? "Mteja wa kutembea" : "Walk-in customer"}</SelectItem>{customers.map((customer) => <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label>{language === "sw" ? "Huduma" : "Service"}</Label><Select value={form.serviceId} onValueChange={(value) => setForm({ ...form, serviceId: value, serviceName: services.find((service) => service.id === value)?.name || "" })}><SelectTrigger><SelectValue placeholder={language === "sw" ? "Chagua huduma" : "Select service"} /></SelectTrigger><SelectContent>{services.map((service) => <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label>{language === "sw" ? "Muda" : "Time"}</Label><Input type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} required /></div><div className="space-y-1.5"><Label>{language === "sw" ? "Dakika" : "Minutes"}</Label><Input type="number" min="1" value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} required /></div></div>
                <div className="space-y-1.5"><Label>{language === "sw" ? "Mhudumu" : "Staff member"}</Label><Input value={form.staffName} onChange={(event) => setForm({ ...form, staffName: event.target.value })} placeholder={language === "sw" ? "Jina la mhudumu" : "Staff name"} /></div>
                <div className="space-y-1.5"><Label>{language === "sw" ? "Maelezo" : "Notes"}</Label><Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} /></div>
                <Button type="submit" disabled={createAppointment.isPending || !form.serviceName} className="w-full rounded-xl">{createAppointment.isPending ? (language === "sw" ? "Inahifadhi..." : "Saving...") : (language === "sw" ? "Thibitisha miadi" : "Confirm appointment")}</Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
