import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000, // 30 seconds
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * Completely purges all cached query data across the entire application.
 * Must be called when signing out or switching active user / shop.
 */
export function clearAppQueryCache() {
  queryClient.clear();
}
