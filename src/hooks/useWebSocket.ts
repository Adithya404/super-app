/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useWebSocket.ts
"use client";

import { useCallback, useEffect, useRef } from "react";

type WSMessage = {
  type: string;
  // biome-ignore lint/suspicious/noExplicitAny: <later>
  [key: string]: any;
};

type Handler = (msg: WSMessage) => void;

export function useWebSocket(userId: string, onMessage: Handler) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3000"}/ws?userId=${userId}`,
    );
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        onMessage(msg);
      } catch {}
    };

    ws.onclose = () => {
      // Reconnect after 3s
      setTimeout(() => wsRef.current?.CLOSED && wsRef.current.close(), 3000);
    };

    return () => ws.close();
  }, [userId, onMessage]);

  const send = useCallback((msg: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  return { send };
}
