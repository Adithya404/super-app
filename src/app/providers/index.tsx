"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ReactQueryProvider } from "./react-query";
import { AuthSessionProvider } from "./session";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthSessionProvider>
      <ReactQueryProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </ReactQueryProvider>
    </AuthSessionProvider>
  );
}
