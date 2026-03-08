"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NeonAuthUIProvider } from "@neondatabase/auth/react";
import { authClient } from "@/lib/auth/client";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

// Cast needed: beta package type mismatch between @neondatabase/auth and auth-ui
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const typedAuthClient = authClient as any;

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <NeonAuthUIProvider authClient={typedAuthClient} emailOTP>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </NeonAuthUIProvider>
  );
}
