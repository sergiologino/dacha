"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { PwaInstallBanner } from "@/components/pwa-install-banner";
import { OfflineSyncBridge } from "@/components/offline-sync-bridge";
import { useState } from "react";
import {
  createGardenQueryPersister,
  QUERY_PERSIST_BUSTER,
  shouldPersistGardenQuery,
} from "@/lib/offline/query-persist";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, retry: 1 },
        },
      })
  );
  const [persister] = useState(() => createGardenQueryPersister());

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider
        refetchInterval={2 * 60}
        refetchOnWindowFocus
      >
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister,
            maxAge: 1000 * 60 * 60 * 24 * 14,
            buster: QUERY_PERSIST_BUSTER,
            dehydrateOptions: {
              shouldDehydrateQuery: shouldPersistGardenQuery,
            },
          }}
        >
          {children}
          <OfflineSyncBridge />
          <Toaster position="top-center" richColors />
          <ServiceWorkerRegister />
          <PwaInstallBanner />
        </PersistQueryClientProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
