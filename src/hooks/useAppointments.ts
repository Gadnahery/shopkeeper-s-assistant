import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Appointment = {
  id: string;
  shop_id: string;
  customer_id: string | null;
  service_id: string | null;
  customer_name: string;
  service_name: string;
  staff_name: string | null;
  appointment_at: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type AppointmentInsert = Omit<TablesInsert<"appointments">, "shop_id"> & { shop_id?: string };
type AppointmentUpdate = TablesUpdate<"appointments"> & { id: string };

async function getShopId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("shop_id").eq("user_id", user.id).maybeSingle();
  return data?.shop_id ?? null;
}

export function useAppointments(date?: string) {
  return useQuery({
    queryKey: ["appointments", date ?? "all"],
    queryFn: async () => {
      let query = supabase.from("appointments").select("*").order("appointment_at", { ascending: true });
      if (date) query = query.gte("appointment_at", `${date}T00:00:00`).lt("appointment_at", `${date}T23:59:59.999`);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Appointment[];
    },
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AppointmentInsert) => {
      const shopId = input.shop_id ?? await getShopId();
      if (!shopId) throw new Error("No business found");
      const { data, error } = await supabase.from("appointments").insert({ ...input, shop_id: shopId }).select().single();
      if (error) throw error;
      return data as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment booked");
    },
    onError: (error) => toast.error(`Could not book appointment: ${error.message}`),
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: AppointmentUpdate) => {
      const { data, error } = await supabase.from("appointments").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data as Appointment;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
    onError: (error) => toast.error(`Could not update appointment: ${error.message}`),
  });
}
