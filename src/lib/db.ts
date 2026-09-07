import Dexie, { type Table } from "dexie";

export type PendingActionType = "complete_sale";

export type PendingActionStatus = "pending" | "syncing" | "failed";

export interface OptimisticSaleItem {
  id?: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  total?: number;
}

export interface OptimisticSaleRecord {
  id: string;
  invoice_number: string;
  customer_id?: string | null;
  customer_name?: string | null;
  payment_method: string;
  mpesa_code?: string | null;
  discount_amount: number;
  discount_percent: number;
  tax_amount: number;
  cash_amount?: number | null;
  mpesa_amount?: number | null;
  total: number;
  subtotal: number;
  status: "completed";
  created_at: string;
  sale_items: Array<{
    id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  is_offline_pending: boolean;
}

export interface PendingAction {
  id: string; // client-generated UUID, used as idempotency key
  type: PendingActionType;
  payload: Record<string, any>;
  createdAt: string; // ISO string
  status: PendingActionStatus;
  errorMessage?: string;
  retryCount: number;
  shopId?: string | null;
  optimisticRecord?: OptimisticSaleRecord;
}

export class WiseCashDB extends Dexie {
  pending_actions!: Table<PendingAction, string>;

  constructor() {
    super("WiseCashDB");
    this.version(1).stores({
      pending_actions: "id, type, status, createdAt, shopId",
    });
  }
}

export const db = new WiseCashDB();
