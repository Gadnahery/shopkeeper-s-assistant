import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

function base64UrlToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

type StoredPushSubscription = {
  id: string;
  endpoint: string;
};

export function usePushNotifications() {
  const { shopId, user } = useAuth();
  const queryClient = useQueryClient();
  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  const [browserSubscription, setBrowserSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    let active = true;

    const syncSubscription = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (active) {
        setBrowserSubscription(subscription);
      }
    };

    void syncSubscription();

    return () => {
      active = false;
    };
  }, []);

  const storedSubscriptions = useQuery({
    queryKey: ["push-subscriptions", user?.id, shopId],
    enabled: Boolean(user?.id && shopId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("push_subscriptions")
        .select("id, endpoint")
        .eq("user_id", user!.id)
        .eq("shop_id", shopId!);

      if (error) {
        throw error;
      }

      return (data || []) as StoredPushSubscription[];
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !shopId) {
        throw new Error("You must be signed in.");
      }

      if (!vapidPublicKey) {
        throw new Error("Missing VAPID public key.");
      }

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Push notifications are not supported on this device.");
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notification permission was not granted.");
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToUint8Array(vapidPublicKey),
        });
      }

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Invalid push subscription.");
      }

      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          shop_id: shopId,
          user_id: user.id,
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
          user_agent: navigator.userAgent,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" },
      );

      if (error) {
        throw error;
      }

      setBrowserSubscription(subscription);
      return subscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-subscriptions"] });
      toast.success("Push notifications enabled");
    },
    onError: (error) => {
      toast.error((error as Error).message);
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
        if (error) {
          throw error;
        }
      }

      setBrowserSubscription(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["push-subscriptions"] });
      toast.success("Push notifications disabled");
    },
    onError: (error) => {
      toast.error((error as Error).message);
    },
  });

  const isSupported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const isSubscribed = useMemo(
    () => Boolean(browserSubscription) || Boolean(storedSubscriptions.data?.length),
    [browserSubscription, storedSubscriptions.data],
  );

  return {
    isSupported,
    isSubscribed,
    permission: typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported",
    subscribe: subscribeMutation.mutateAsync,
    unsubscribe: unsubscribeMutation.mutateAsync,
    isLoading: subscribeMutation.isPending || unsubscribeMutation.isPending || storedSubscriptions.isLoading,
  };
}
