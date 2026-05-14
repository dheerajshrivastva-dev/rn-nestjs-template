/**
 * React Query Provider
 * Configures TanStack Query with optimized settings
 */

import React from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

// ============================================================================
// Query Client Configuration
// ============================================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: Data is fresh for 5 minutes
      staleTime: 5 * 60 * 1000,

      // Cache time: Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,

      // Retry configuration
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },

      // Refetch settings
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations once on failure (except for client errors)
      retry: (failureCount, error: any) => {
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});

// ============================================================================
// Provider Component
// ============================================================================

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({children}) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Export query client for use outside components
export {queryClient};
