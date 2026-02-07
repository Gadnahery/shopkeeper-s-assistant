import { useAuth } from "@/contexts/AuthContext";

export function useShopId() {
  const { shopId } = useAuth();
  return shopId;
}
