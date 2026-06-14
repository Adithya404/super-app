/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { createContext, useCallback, useContext, useRef } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";

export type WSMessage = {
  type: string;
  // biome-ignore lint/suspicious/noExplicitAny: dynamic WS payload fields
  [key: string]: any;
};

type Handler = (msg: WSMessage) => void;

type PingPalWSContextValue = {
  send: (msg: WSMessage) => void;
  subscribe: (handler: Handler) => () => void;
};

const PingPalWSContext = createContext<PingPalWSContextValue | null>(null);

export function PingPalWSProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const subscribersRef = useRef<Set<Handler>>(new Set());

  const dispatch = useCallback((msg: WSMessage) => {
    for (const handler of subscribersRef.current) {
      handler(msg);
    }
  }, []);

  const { send } = useWebSocket(enabled, dispatch);

  const subscribe = useCallback((handler: Handler) => {
    subscribersRef.current.add(handler);
    return () => {
      subscribersRef.current.delete(handler);
    };
  }, []);

  return (
    <PingPalWSContext.Provider value={{ send, subscribe }}>{children}</PingPalWSContext.Provider>
  );
}

export function usePingPalWS() {
  const ctx = useContext(PingPalWSContext);
  if (!ctx) {
    throw new Error("usePingPalWS must be used within PingPalWSProvider");
  }
  return ctx;
}
