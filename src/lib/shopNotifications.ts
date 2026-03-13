import { supabase } from "@/integrations/supabase/client";

type ShopNotificationInput = {
  shopId: string;
  title: string;
  message?: string;
  type?: string;
  url?: string;
};

export async function createShopNotification(input: ShopNotificationInput) {
  const { data, error } = await supabase.functions.invoke("send-push-notification", {
    body: {
      shop_id: input.shopId,
      title: input.title,
      message: input.message ?? "",
      type: input.type ?? "info",
      url: input.url ?? "/notifications",
    },
  });

  if (error) {
    throw error;
  }

  return data;
}
