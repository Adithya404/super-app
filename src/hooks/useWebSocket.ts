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
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage; // always up to date, no reconnect
  }, [onMessage]);

  const queueRef = useRef<WSMessage[]>([]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    function connect() {
      const wsUrl =
        process.env.NEXT_PUBLIC_WS_URL ??
        `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`;
      ws = new WebSocket(`${wsUrl}/ws?userId=${userId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        queueRef.current.forEach((msg) => {
          ws?.send(JSON.stringify(msg));
        });
        queueRef.current = [];
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          onMessageRef.current(msg);
        } catch {}
      };

      ws.onclose = () => {
        timeoutId = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      if (ws) ws.close();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [userId]);

  const send = useCallback((msg: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      queueRef.current.push(msg); // buffer until open
    }
  }, []);

  return { send };
}
