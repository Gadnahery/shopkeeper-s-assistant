/** Sales domain hooks — re-exported for feature-first imports */
export {
  useSales,
  useSalesByCustomer,
  useSalesByDateRange,
  useSalesSummaryByRange,
  useTodaySales,
  useCreateSale,
  useEditSale,
  useDraftSales,
  useSaveDraftSale,
  useCompleteDraftSale,
  useDeleteDraftSale,
  useDeleteSale,
} from "@/hooks/useSales";
export type { Sale, CreateSaleInput, UseSalesOptions, EditSaleInput } from "@/hooks/useSales";
