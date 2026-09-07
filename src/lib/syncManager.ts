import { supabase } from "@/integrations/supabase/client";
import { db, type PendingAction, type OptimisticSaleRecord } from "./db";
import { toast } from "sonner";
import type { QueryClient } from "@tanstack/react-query";

type SyncListener = () => void;

class SyncManager {
  private isSyncing = false;
  private listeners: Set<SyncListener> = new Set();
  private queryClient: QueryClient | null = null;
  private heartbeatTimer: any = null;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.notifyListeners();
        this.processQueue();
      });
      window.addEventListener("offline", () => {
        this.notifyListeners();
      });

      // Periodic check if there are pending actions and device is online
      this.heartbeatTimer = setInterval(() => {
        if (this.isOnline() && !this.isSyncing) {
          this.hasPendingActions().then((hasPending) => {
            if (hasPending) {
              this.processQueue();
            }
          });
        }
      }, 30000);
    }
  }

  public setQueryClient(client: QueryClient) {
    this.queryClient = client;
  }

  public isOnline(): boolean {
    if (typeof navigator !== "undefined" && typeof navigator.onLine === "boolean") {
      return navigator.onLine;
    }
    return true;
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error("Sync listener error:", err);
      }
    });
  }

  public isNetworkError(error: any): boolean {
    if (!this.isOnline()) return true;
    if (!error) return false;

    const msg = (error.message || String(error)).toLowerCase();
    return (
      msg.includes("fetch failed") ||
      msg.includes("failed to fetch") ||
      msg.includes("network") ||
      msg.includes("timeout") ||
      msg.includes("aborted") ||
      msg.includes("offline") ||
      msg.includes("connection") ||
      msg.includes("gateway") ||
      error.name === "AbortError" ||
      error.name === "TypeError"
    );
  }

  public async getPendingActions(shopId?: string | null): Promise<PendingAction[]> {
    try {
      let collection = db.pending_actions.orderBy("createdAt");
      const items = await collection.toArray();
      if (shopId) {
        return items.filter((item) => !item.shopId || item.shopId === shopId);
      }
      return items;
    } catch (err) {
      console.error("Failed to load pending actions:", err);
      return [];
    }
  }

  public async getCounts(shopId?: string | null) {
    const items = await this.getPendingActions(shopId);
    let pending = 0;
    let syncing = 0;
    let failed = 0;

    for (const item of items) {
      if (item.status === "pending") pending++;
      else if (item.status === "syncing") syncing++;
      else if (item.status === "failed") failed++;
    }

    return {
      pending,
      syncing,
      failed,
      total: items.length,
    };
  }

  public async hasPendingActions(): Promise<boolean> {
    try {
      const count = await db.pending_actions.where("status").equals("pending").count();
      return count > 0;
    } catch {
      return false;
    }
  }

  /**
   * Generates an optimistic sale record and persists it to IndexedDB
   */
  public async queueSaleAction(
    input: {
      customer_id?: string | null;
      customer_name?: string | null;
      payment_method: string;
      mpesa_code?: string | null;
      discount_amount?: number;
      discount_percent?: number;
      tax_amount?: number;
      items: Array<{
        product_id: string;
        product_name: string;
        unit_price: number;
        quantity: number;
      }>;
      cash_amount?: number;
      mpesa_amount?: number;
    },
    shopId?: string | null,
    customId?: string
  ): Promise<OptimisticSaleRecord> {
    const actionId = customId || crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const subtotal = input.items.reduce((sum, it) => sum + it.unit_price * it.quantity, 0);
    const total = Math.max(0, subtotal - (input.discount_amount || 0) + (input.tax_amount || 0));

    // Unique readable offline invoice number
    const datePart = timestamp.slice(0, 10).replace(/-/g, "");
    const randPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const invoiceNumber = `OFF-${datePart}-${randPart}`;

    const optimisticRecord: OptimisticSaleRecord = {
      id: actionId,
      invoice_number: invoiceNumber,
      customer_id: input.customer_id ?? null,
      customer_name: input.customer_name ?? null,
      payment_method: input.payment_method,
      mpesa_code: input.mpesa_code ?? null,
      discount_amount: input.discount_amount || 0,
      discount_percent: input.discount_percent || 0,
      tax_amount: input.tax_amount || 0,
      cash_amount: input.cash_amount ?? null,
      mpesa_amount: input.mpesa_amount ?? null,
      subtotal,
      total,
      status: "completed",
      created_at: timestamp,
      sale_items: input.items.map((it, idx) => ({
        id: `offline-item-${idx}-${crypto.randomUUID().slice(0, 8)}`,
        product_id: it.product_id,
        product_name: it.product_name,
        quantity: it.quantity,
        unit_price: it.unit_price,
        total: it.quantity * it.unit_price,
      })),
      is_offline_pending: true,
    };

    const action: PendingAction = {
      id: actionId,
      type: "complete_sale",
      payload: {
        customer_id: input.customer_id ?? null,
        customer_name: input.customer_name ?? null,
        payment_method: input.payment_method,
        mpesa_code: input.mpesa_code ?? null,
        discount_amount: input.discount_amount || 0,
        discount_percent: input.discount_percent || 0,
        tax_amount: input.tax_amount || 0,
        items: input.items,
        cash_amount: input.cash_amount ?? null,
        mpesa_amount: input.mpesa_amount ?? null,
      },
      createdAt: timestamp,
      status: "pending",
      retryCount: 0,
      shopId: shopId ?? null,
      optimisticRecord,
    };

    await db.pending_actions.put(action);
    this.notifyListeners();
    return optimisticRecord;
  }

  /**
   * Main sync queue processor: replays queued actions in creation order (FIFO)
   */
  public async processQueue(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) {
      return { synced: 0, failed: 0 };
    }

    if (!this.isOnline()) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.notifyListeners();

    let syncedCount = 0;
    let failedCount = 0;

    try {
      // Get all pending and retryable actions in creation order
      const allActions = await db.pending_actions.orderBy("createdAt").toArray();
      const actionsToProcess = allActions.filter((a) => a.status === "pending" || a.status === "syncing");

      for (const action of actionsToProcess) {
        // Double check network state before each item
        if (!this.isOnline()) {
          // Revert current syncing item back to pending
          await db.pending_actions.update(action.id, { status: "pending" });
          break;
        }

        // Set status to syncing
        await db.pending_actions.update(action.id, { status: "syncing" });
        this.notifyListeners();

        try {
          if (action.type === "complete_sale") {
            const payload = {
              p_customer_id: action.payload.customer_id ?? null,
              p_customer_name: action.payload.customer_name ?? null,
              p_payment_method: action.payload.payment_method,
              p_mpesa_code: action.payload.mpesa_code ?? null,
              p_discount_amount: action.payload.discount_amount || 0,
              p_discount_percent: action.payload.discount_percent || 0,
              p_tax_amount: action.payload.tax_amount || 0,
              p_items: action.payload.items,
              p_cash_amount: action.payload.cash_amount ?? null,
              p_mpesa_amount: action.payload.mpesa_amount ?? null,
              p_idempotency_key: action.id, // client UUID as idempotency key
            };

            const { data, error } = await (supabase as any).rpc("complete_sale_transaction", payload);

            if (error) {
              if (this.isNetworkError(error)) {
                // Connection dropped mid-sync - revert to pending and stop loop
                await db.pending_actions.update(action.id, {
                  status: "pending",
                  retryCount: action.retryCount + 1,
                });
                break;
              } else {
                // Real business error (e.g. stock out, auth issue)
                await db.pending_actions.update(action.id, {
                  status: "failed",
                  errorMessage: error.message || "Failed to process sale on server",
                  retryCount: action.retryCount + 1,
                });
                failedCount++;
                toast.error(`Sync conflict for offline sale: ${error.message}`, {
                  duration: 8000,
                });
                continue;
              }
            }

            // Successfully processed!
            await db.pending_actions.delete(action.id);
            syncedCount++;

            const invNum = data?.invoice_number || action.optimisticRecord?.invoice_number;
            toast.success(`Sale ${invNum} synced successfully!`, {
              duration: 4000,
            });
          }
        } catch (err: any) {
          if (this.isNetworkError(err)) {
            await db.pending_actions.update(action.id, {
              status: "pending",
              retryCount: action.retryCount + 1,
            });
            break;
          } else {
            await db.pending_actions.update(action.id, {
              status: "failed",
              errorMessage: err.message || "Unknown error during sync",
              retryCount: action.retryCount + 1,
            });
            failedCount++;
          }
        }
      }

      if (syncedCount > 0 && this.queryClient) {
        this.queryClient.invalidateQueries({ queryKey: ["sales"] });
        this.queryClient.invalidateQueries({ queryKey: ["products"] });
        this.queryClient.invalidateQueries({ queryKey: ["customers"] });
        this.queryClient.invalidateQueries({ queryKey: ["sales", "today"] });
        this.queryClient.invalidateQueries({ queryKey: ["sales", "summary"] });
        this.queryClient.invalidateQueries({ queryKey: ["sales", "range"] });
      }
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }

    return { synced: syncedCount, failed: failedCount };
  }

  public async discardAction(id: string): Promise<void> {
    await db.pending_actions.delete(id);
    if (this.queryClient) {
      this.queryClient.invalidateQueries({ queryKey: ["sales"] });
      this.queryClient.invalidateQueries({ queryKey: ["products"] });
    }
    this.notifyListeners();
  }

  public async retryAction(id: string): Promise<void> {
    await db.pending_actions.update(id, {
      status: "pending",
      errorMessage: undefined,
    });
    this.notifyListeners();
    this.processQueue();
  }

  public async retryAllFailed(): Promise<void> {
    const failedItems = await db.pending_actions.where("status").equals("failed").toArray();
    for (const item of failedItems) {
      await db.pending_actions.update(item.id, {
        status: "pending",
        errorMessage: undefined,
      });
    }
    this.notifyListeners();
    this.processQueue();
  }

  public async clearAllFailed(): Promise<void> {
    await db.pending_actions.where("status").equals("failed").delete();
    if (this.queryClient) {
      this.queryClient.invalidateQueries({ queryKey: ["sales"] });
    }
    this.notifyListeners();
  }
}

export const syncManager = new SyncManager();
