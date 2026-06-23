"use client";

import { createContext, type ReactNode, useContext, useLayoutEffect, useState } from "react";

type SidebarSlotContextValue = {
  sidebar: ReactNode | null;
  setSidebar: (sidebar: ReactNode | null) => void;
};

const SidebarSlotContext = createContext<SidebarSlotContextValue | null>(null);

export function SidebarSlotProvider({ children }: { children: ReactNode }) {
  const [sidebar, setSidebar] = useState<ReactNode | null>(null);

  return (
    <SidebarSlotContext.Provider value={{ sidebar, setSidebar }}>
      {children}
    </SidebarSlotContext.Provider>
  );
}

function useSidebarSlotContext() {
  const context = useContext(SidebarSlotContext);
  if (!context) {
    throw new Error("SidebarSlot must be used within SidebarSlotProvider");
  }
  return context;
}

/** Registers sidebar content to render in AppShell's left column (full height, beside Topbar). */
export function SidebarSlot({ children }: { children: ReactNode }) {
  const { setSidebar } = useSidebarSlotContext();

  useLayoutEffect(() => {
    setSidebar(children);
    return () => setSidebar(null);
  }, [children, setSidebar]);

  return null;
}

export function useSidebarSlot() {
  return useSidebarSlotContext();
}
