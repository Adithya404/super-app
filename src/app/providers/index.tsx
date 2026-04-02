"use client";

import { ReactQueryProvider } from "./react-query";
import { AuthSessionProvider } from "./session";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthSessionProvider>
      <ReactQueryProvider>{children}</ReactQueryProvider>
    </AuthSessionProvider>
  );
}
