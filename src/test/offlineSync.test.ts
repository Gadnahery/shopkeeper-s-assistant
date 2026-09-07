import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { db } from "@/lib/db";
import { syncManager } from "@/lib/syncManager";
import { supabase } from "@/integrations/supabase/client";
import "fake-indexeddb/auto";

// Mock Supabase RPC
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

describe("WiseCash Offline Write Queue & Sync Manager", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await db.pending_actions.clear();
  });

  afterEach(async () => {
    await db.pending_actions.clear();
  });

  describe("Queueing Offline Sales", () => {
    it("queues a sale action into Dexie with optimistic record and idempotency key", async () => {
      const saleInput = {
        customer_id: "cust-123",
        customer_name: "Juma Hamisi",
        payment_method: "Cash",
        discount_amount: 500,
        discount_percent: 0,
        tax_amount: 0,
        items: [
          {
            product_id: "prod-1",
            product_name: "Sugar 1kg",
            unit_price: 3000,
            quantity: 2,
          },
          {
            product_id: "prod-2",
            product_name: "Milk 500ml",
            unit_price: 1500,
            quantity: 1,
          },
        ],
      };

      const customId = "client-uuid-12345";
      const record = await syncManager.queueSaleAction(saleInput, "shop-abc", customId);

      expect(record.id).toBe("client-uuid-12345");
      expect(record.is_offline_pending).toBe(true);
      expect(record.invoice_number).toMatch(/^OFF-/);
      expect(record.subtotal).toBe(7500); // 3000*2 + 1500*1
      expect(record.total).toBe(7000); // 7500 - 500
      expect(record.customer_name).toBe("Juma Hamisi");
      expect(record.sale_items.length).toBe(2);

      // Verify persisted in Dexie
      const stored = await db.pending_actions.get("client-uuid-12345");
      expect(stored).toBeDefined();
      expect(stored?.status).toBe("pending");
      expect(stored?.type).toBe("complete_sale");
      expect(stored?.shopId).toBe("shop-abc");
      expect(stored?.retryCount).toBe(0);
    });

    it("tracks queue counts accurately", async () => {
      await syncManager.queueSaleAction(
        {
          payment_method: "Cash",
          items: [{ product_id: "p1", product_name: "P1", unit_price: 100, quantity: 1 }],
        },
        "shop-1",
        "action-1"
      );

      await syncManager.queueSaleAction(
        {
          payment_method: "Cash",
          items: [{ product_id: "p2", product_name: "P2", unit_price: 200, quantity: 1 }],
        },
        "shop-1",
        "action-2"
      );

      const counts = await syncManager.getCounts("shop-1");
      expect(counts.total).toBe(2);
      expect(counts.pending).toBe(2);
      expect(counts.syncing).toBe(0);
      expect(counts.failed).toBe(0);
    });
  });

  describe("Network Error Detection", () => {
    it("correctly identifies network failures vs business rejections", () => {
      expect(syncManager.isNetworkError(new Error("Failed to fetch"))).toBe(true);
      expect(syncManager.isNetworkError(new Error("network connection lost"))).toBe(true);
      expect(syncManager.isNetworkError(new Error("Network timeout: Sale took too long"))).toBe(true);
      expect(syncManager.isNetworkError({ name: "AbortError", message: "The operation was aborted" })).toBe(true);

      // Business logic rejections are NOT network errors
      expect(syncManager.isNetworkError(new Error("Insufficient stock for product Sugar 1kg"))).toBe(false);
      expect(syncManager.isNetworkError(new Error("Customer is required for credit sales"))).toBe(false);
      expect(syncManager.isNetworkError(new Error("Authentication required"))).toBe(false);
      expect(syncManager.isNetworkError(new Error("Your subscription has expired"))).toBe(false);
    });
  });

  describe("Replay & Background Sync", () => {
    it("replays queued sales sequentially passing the client idempotency key", async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: {
          id: "server-sale-1",
          invoice_number: "INV-2026-0001",
          total: 3000,
        },
        error: null,
      });
      (supabase.rpc as any) = mockRpc;

      await syncManager.queueSaleAction(
        {
          customer_id: "cust-1",
          payment_method: "Cash",
          items: [{ product_id: "p1", product_name: "Item 1", unit_price: 3000, quantity: 1 }],
        },
        "shop-1",
        "idempotency-key-001"
      );

      const result = await syncManager.processQueue();

      expect(result.synced).toBe(1);
      expect(result.failed).toBe(0);

      // Verify RPC was invoked with p_idempotency_key
      expect(mockRpc).toHaveBeenCalledWith("complete_sale_transaction", expect.objectContaining({
        p_idempotency_key: "idempotency-key-001",
        p_payment_method: "Cash",
        p_items: [{ product_id: "p1", product_name: "Item 1", unit_price: 3000, quantity: 1 }],
      }));

      // Verify action was removed from Dexie on success
      const remaining = await db.pending_actions.toArray();
      expect(remaining.length).toBe(0);
    });

    it("handles server business rejection by keeping the action in failed status without deleting it", async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Insufficient stock for product Sugar 1kg" },
      });
      (supabase.rpc as any) = mockRpc;

      await syncManager.queueSaleAction(
        {
          payment_method: "Cash",
          items: [{ product_id: "p1", product_name: "Sugar 1kg", unit_price: 3000, quantity: 5 }],
        },
        "shop-1",
        "conflict-action-1"
      );

      const result = await syncManager.processQueue();

      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);

      // Action should NOT be deleted, but marked failed with errorMessage
      const stored = await db.pending_actions.get("conflict-action-1");
      expect(stored).toBeDefined();
      expect(stored?.status).toBe("failed");
      expect(stored?.errorMessage).toBe("Insufficient stock for product Sugar 1kg");
      expect(stored?.retryCount).toBe(1);
    });

    it("allows discarding and retrying actions", async () => {
      await syncManager.queueSaleAction(
        {
          payment_method: "Cash",
          items: [{ product_id: "p1", product_name: "Item", unit_price: 100, quantity: 1 }],
        },
        "shop-1",
        "action-to-discard"
      );

      await syncManager.discardAction("action-to-discard");
      const found = await db.pending_actions.get("action-to-discard");
      expect(found).toBeUndefined();
    });
  });
});
