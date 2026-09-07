import { useState, useEffect, useCallback } from "react";
import { syncManager } from "@/lib/syncManager";
import { type PendingAction } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

export function useSyncQueue() {
  const { shopId } = useAuth();
  const queryClient = useQueryClient();

  const [isOnline, setIsOnline] = useState(syncManager.isOnline());
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [counts, setCounts] = useState({
    pending: 0,
    syncing: 0,
    failed: 0,
    total: 0,
  });

  // Bind queryClient to syncManager for automatic query invalidation
  useEffect(() => {
    syncManager.setQueryClient(queryClient);
  }, [queryClient]);

  const refreshData = useCallback(async () => {
    setIsOnline(syncManager.isOnline());
    const actions = await syncManager.getPendingActions(shopId);
    const c = await syncManager.getCounts(shopId);
    setPendingActions(actions);
    setCounts(c);
  }, [shopId]);

  useEffect(() => {
    refreshData();
    const unsubscribe = syncManager.subscribe(() => {
      refreshData();
    });
    return () => {
      unsubscribe();
    };
  }, [refreshData]);

  const syncNow = useCallback(async () => {
    return await syncManager.processQueue();
  }, []);

  const discardAction = useCallback(async (id: string) => {
    await syncManager.discardAction(id);
  }, []);

  const retryAction = useCallback(async (id: string) => {
    await syncManager.retryAction(id);
  }, []);

  const retryAllFailed = useCallback(async () => {
    await syncManager.retryAllFailed();
  }, []);

  const clearAllFailed = useCallback(async () => {
    await syncManager.clearAllFailed();
  }, []);

  return {
    isOnline,
    pendingActions,
    pendingCount: counts.pending,
    syncingCount: counts.syncing,
    failedCount: counts.failed,
    totalCount: counts.total,
    isSyncing: counts.syncing > 0,
    syncNow,
    discardAction,
    retryAction,
    retryAllFailed,
    clearAllFailed,
    refresh: refreshData,
  };
}
