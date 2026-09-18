"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

type BreadcrumbTrailContextValue = {
  trailSegment: string | null;
  setTrailSegment: (segment: string | null) => void;
};

const BreadcrumbTrailContext = createContext<BreadcrumbTrailContextValue | null>(null);

export function BreadcrumbTrailProvider({ children }: { children: ReactNode }) {
  const [trailSegment, setTrailSegmentState] = useState<string | null>(null);

  const setTrailSegment = useCallback((segment: string | null) => {
    setTrailSegmentState(segment);
  }, []);

  const value = useMemo(
    () => ({
      trailSegment,
      setTrailSegment,
    }),
    [trailSegment, setTrailSegment],
  );

  return (
    <BreadcrumbTrailContext.Provider value={value}>{children}</BreadcrumbTrailContext.Provider>
  );
}

export function useBreadcrumbTrail() {
  const context = useContext(BreadcrumbTrailContext);
  if (!context) {
    throw new Error("useBreadcrumbTrail must be used within BreadcrumbTrailProvider");
  }
  return context;
}
