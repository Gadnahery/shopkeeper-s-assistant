import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";

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
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show" | string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AppointmentInsert = Omit<TablesInsert<"appointments">, "shop_id"> & { shop_id?: string };
export type AppointmentUpdate = TablesUpdate<"appointments"> & { id: string };

export function useAppointments(date?: string) {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ["appointments", shopId, date ?? "all"],
    queryFn: async () => {
      if (!shopId) return [];
      let query = supabase
        .from("appointments")
        .select("*")
        .eq("shop_id", shopId)
        .order("appointment_at", { ascending: true });

      if (date) {
        // Construct local day boundaries to prevent UTC day-shift clipping
        const [year, month, day] = date.split("-").map(Number);
        if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
          const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
          const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
          query = query.gte("appointment_at", startOfDay).lte("appointment_at", endOfDay);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Appointment[];
    },
    enabled: !!shopId,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { shopId: currentShopId } = useAuth();

  return useMutation({
    mutationFn: async (input: AppointmentInsert) => {
      const shopId = input.shop_id || currentShopId;
      if (!shopId) throw new Error("No business found");
      const { data, error } = await supabase
        .from("appointments")
        .insert({ ...input, shop_id: shopId })
        .select()
        .single();
      if (error) throw error;
      return data as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment booked successfully");
    },
    onError: (error) => toast.error(`Could not book appointment: ${error.message}`),
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  const { shopId } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: AppointmentUpdate) => {
      let query = supabase
        .from("appointments")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (shopId) {
        query = query.eq("shop_id", shopId);
      }
      const { data, error } = await query.select().single();
      if (error) throw error;
      return data as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (error) => toast.error(`Could not update appointment: ${error.message}`),
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  const { shopId } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      let query = supabase.from("appointments").delete().eq("id", id);
      if (shopId) {
        query = query.eq("shop_id", shopId);
      }
      const { error } = await query;
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Appointment deleted");
    },
    onError: (error) => toast.error(`Could not delete appointment: ${error.message}`),
  });
}
