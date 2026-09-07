import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProductionMaterial {
  product_id: string;
  product_name: string;
  product_code?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
}

export interface ProductionBatch {
  id: string;
  shop_id: string;
  batch_number: string;
  output_product_id: string;
  output_product_name?: string;
  output_product_code?: string;
  quantity_to_produce: number;
  quantity_produced: number;
  input_materials: ProductionMaterial[];
  total_cost: number;
  status: "planned" | "in_progress" | "completed" | "cancelled";
  notes?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

const LOCAL_STORAGE_KEY = "wisecash_production_batches";

function getLocalBatches(shopId: string): ProductionBatch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${shopId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalBatches(shopId: string, batches: ProductionBatch[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_${shopId}`, JSON.stringify(batches));
  } catch (e) {
    console.error("Error saving local batches", e);
  }
}

export function useProductionBatches() {
  const { shopId } = useAuth();

  return useQuery({
    queryKey: ["production_batches", shopId],
    queryFn: async (): Promise<ProductionBatch[]> => {
      if (!shopId) return [];

      try {
        const { data, error } = await supabase
          .from("production_batches")
          .select(`
            id,
            shop_id,
            batch_number,
            output_product_id,
            quantity_to_produce,
            quantity_produced,
            input_materials,
            total_cost,
            status,
            notes,
            started_at,
            completed_at,
            created_at,
            updated_at,
            products:output_product_id (
              id,
              name,
              barcode
            )
          `)
          .eq("shop_id", shopId)
          .order("created_at", { ascending: false });

        if (error) {
          console.warn("Could not query production_batches from Supabase, using local store:", error.message);
          return getLocalBatches(shopId);
        }

        const batches: ProductionBatch[] = (data || []).map((b: any) => ({
          id: b.id,
          shop_id: b.shop_id,
          batch_number: b.batch_number,
          output_product_id: b.output_product_id,
          output_product_name: b.products?.name || "Product",
          output_product_code: b.products?.barcode || "",
          quantity_to_produce: Number(b.quantity_to_produce || 0),
          quantity_produced: Number(b.quantity_produced || 0),
          input_materials: Array.isArray(b.input_materials) ? (b.input_materials as ProductionMaterial[]) : [],
          total_cost: Number(b.total_cost || 0),
          status: b.status as "planned" | "in_progress" | "completed" | "cancelled",
          notes: b.notes,
          started_at: b.started_at,
          completed_at: b.completed_at,
          created_at: b.created_at,
          updated_at: b.updated_at,
        }));

        saveLocalBatches(shopId, batches);
        return batches;
      } catch (err) {
        console.warn("Production batches fetch error, using local fallback", err);
        return getLocalBatches(shopId);
      }
    },
    enabled: !!shopId,
  });
}

export function useCreateProductionBatch() {
  const queryClient = useQueryClient();
  const { shopId } = useAuth();

  return useMutation({
    mutationFn: async ({
      outputProductId,
      outputProductName,
      outputProductCode,
      quantityToProduce,
      inputMaterials,
      notes,
    }: {
      outputProductId: string;
      outputProductName?: string;
      outputProductCode?: string;
      quantityToProduce: number;
      inputMaterials: ProductionMaterial[];
      notes?: string;
    }) => {
      if (!shopId) throw new Error("Shop ID is required");

      const totalCost = inputMaterials.reduce((sum, m) => sum + (m.total_cost || 0), 0);
      const batchNumber = `BAT-${Date.now().toString().slice(-6)}`;
      const now = new Date().toISOString();

      try {
        const { data, error } = await supabase
          .from("production_batches")
          .insert({
            shop_id: shopId,
            batch_number: batchNumber,
            output_product_id: outputProductId,
            quantity_to_produce: quantityToProduce,
            quantity_produced: 0,
            input_materials: inputMaterials as any,
            total_cost: totalCost,
            status: "planned",
            notes: notes || null,
            started_at: now,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (e: any) {
        console.warn("Could not insert production_batch to Supabase, falling back to local storage:", e.message);
        const newBatch: ProductionBatch = {
          id: `local-batch-${Date.now()}`,
          shop_id: shopId,
          batch_number: batchNumber,
          output_product_id: outputProductId,
          output_product_name: outputProductName || "Finished Product",
          output_product_code: outputProductCode || "",
          quantity_to_produce: quantityToProduce,
          quantity_produced: 0,
          input_materials: inputMaterials,
          total_cost: totalCost,
          status: "planned",
          notes: notes || null,
          started_at: now,
          created_at: now,
          updated_at: now,
        };

        const existing = getLocalBatches(shopId);
        saveLocalBatches(shopId, [newBatch, ...existing]);
        return newBatch;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production_batches"] });
    },
  });
}

export function useUpdateProductionBatch() {
  const queryClient = useQueryClient();
  const { shopId } = useAuth();

  return useMutation({
    mutationFn: async ({
      batchId,
      quantityToProduce,
      inputMaterials,
      notes,
      status,
    }: {
      batchId: string;
      quantityToProduce?: number;
      inputMaterials?: ProductionMaterial[];
      notes?: string;
      status?: "planned" | "in_progress" | "completed" | "cancelled";
    }) => {
      if (!shopId) throw new Error("Shop ID is required");

      const now = new Date().toISOString();
      const payload: any = { updated_at: now };
      if (quantityToProduce !== undefined) payload.quantity_to_produce = quantityToProduce;
      if (inputMaterials !== undefined) {
        payload.input_materials = inputMaterials as any;
        payload.total_cost = inputMaterials.reduce((sum, m) => sum + (m.total_cost || 0), 0);
      }
      if (notes !== undefined) payload.notes = notes;
      if (status !== undefined) payload.status = status;

      try {
        const { data, error } = await supabase
          .from("production_batches")
          .update(payload)
          .eq("id", batchId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (e: any) {
        console.warn("Could not update production_batch in Supabase, using local:", e);
        const local = getLocalBatches(shopId);
        const updated = local.map((b) => (b.id === batchId ? { ...b, ...payload } : b));
        saveLocalBatches(shopId, updated);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production_batches"] });
    },
  });
}

export function useDeleteProductionBatch() {
  const queryClient = useQueryClient();
  const { shopId } = useAuth();

  return useMutation({
    mutationFn: async (batch: ProductionBatch) => {
      if (!shopId) throw new Error("Shop ID is required");
      if (batch.status === "completed") {
        throw new Error("Cannot delete a completed production batch. It has already updated inventory.");
      }

      try {
        const { error } = await supabase
          .from("production_batches")
          .delete()
          .eq("id", batch.id);

        if (error) throw error;
      } catch (e: any) {
        console.warn("Supabase delete failed, removing from local storage:", e);
      }

      const local = getLocalBatches(shopId);
      const updated = local.filter((b) => b.id !== batch.id);
      saveLocalBatches(shopId, updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production_batches"] });
    },
  });
}

export function useCompleteProductionBatch() {
  const queryClient = useQueryClient();
  const { shopId } = useAuth();

  return useMutation({
    mutationFn: async ({
      batch,
      quantityProduced,
    }: {
      batch: ProductionBatch;
      quantityProduced: number;
    }) => {
      if (!shopId) throw new Error("Shop ID is required");

      const now = new Date().toISOString();

      // 1. Deduct input materials from inventory
      for (const mat of batch.input_materials) {
        try {
          const { data: prod } = await supabase
            .from("products")
            .select("stock, name")
            .eq("id", mat.product_id)
            .single();

          const currentStock = Number(prod?.stock || 0);
          const deduction = Number(mat.quantity || 0);
          const newStock = Math.max(0, currentStock - deduction);

          await supabase
            .from("products")
            .update({ stock: newStock })
            .eq("id", mat.product_id);

          await supabase.from("stock_history").insert({
            shop_id: shopId,
            product_id: mat.product_id,
            quantity_change: -deduction,
            previous_stock: currentStock,
            new_stock: newStock,
            change_type: "production_consumed",
            notes: `Consumed in batch ${batch.batch_number} (Output: ${batch.output_product_name || "Finished product"})`,
          });
        } catch (e) {
          console.error("Error deducting material stock", mat, e);
        }
      }

      // 2. Add output product stock and update buying_price using Weighted Average Costing (WAC)
      try {
        const { data: outProd } = await supabase
          .from("products")
          .select("stock, name, buying_price")
          .eq("id", batch.output_product_id)
          .single();

        const currentOutStock = Math.max(0, Number(outProd?.stock || 0));
        const currentCost = Number(outProd?.buying_price || 0);
        const addedQty = Number(quantityProduced || batch.quantity_to_produce);
        const batchTotalCost = Number(batch.total_cost || 0);
        const batchUnitCost = addedQty > 0 ? (batchTotalCost / addedQty) : currentCost;

        let newBlendedCost = batchUnitCost;
        if (currentOutStock + addedQty > 0) {
          newBlendedCost = ((currentOutStock * currentCost) + (addedQty * batchUnitCost)) / (currentOutStock + addedQty);
        }

        const newOutStock = currentOutStock + addedQty;

        await supabase
          .from("products")
          .update({
            stock: newOutStock,
            buying_price: Math.round(newBlendedCost * 100) / 100,
          })
          .eq("id", batch.output_product_id);

        await supabase.from("stock_history").insert({
          shop_id: shopId,
          product_id: batch.output_product_id,
          quantity_change: addedQty,
          previous_stock: currentOutStock,
          new_stock: newOutStock,
          change_type: "production_produced",
          notes: `Produced in batch ${batch.batch_number} (WAC blended unit cost: ${Math.round(newBlendedCost)})`,
        });
      } catch (e) {
        console.error("Error adding output product stock", e);
      }

      // 3. Update batch record
      try {
        await supabase
          .from("production_batches")
          .update({
            status: "completed",
            quantity_produced: quantityProduced,
            completed_at: now,
            updated_at: now,
          })
          .eq("id", batch.id);
      } catch (e) {
        console.warn("Supabase update error, updating local store", e);
      }

      const localBatches = getLocalBatches(shopId);
      const updated = localBatches.map((b) =>
        b.id === batch.id
          ? {
              ...b,
              status: "completed" as const,
              quantity_produced: quantityProduced,
              completed_at: now,
              updated_at: now,
            }
          : b,
      );
      saveLocalBatches(shopId, updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production_batches"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["stock_history"] });
      queryClient.invalidateQueries({ queryKey: ["stock_by_category"] });
    },
  });
}

export function useUpdateBatchStatus() {
  const queryClient = useQueryClient();
  const { shopId } = useAuth();

  return useMutation({
    mutationFn: async ({
      batchId,
      status,
    }: {
      batchId: string;
      status: "planned" | "in_progress" | "cancelled";
    }) => {
      if (!shopId) throw new Error("Shop ID is required");
      const now = new Date().toISOString();

      try {
        await supabase
          .from("production_batches")
          .update({
            status,
            updated_at: now,
          })
          .eq("id", batchId);
      } catch (e) {
        console.warn("Supabase status update fallback to local", e);
      }

      const local = getLocalBatches(shopId);
      const updated = local.map((b) => (b.id === batchId ? { ...b, status, updated_at: now } : b));
      saveLocalBatches(shopId, updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production_batches"] });
    },
  });
}
