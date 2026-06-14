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

const AUTH_CLOSE_CODE = 1008;

async function fetchWsToken(): Promise<string | null> {
  const res = await fetch("/api/pingpal/ws-token");
  if (!res.ok) return null;
  const data = (await res.json()) as { token: string };
  return data.token;
}

export function useWebSocket(enabled: boolean, onMessage: Handler) {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const queueRef = useRef<WSMessage[]>([]);

  useEffect(() => {
    if (!enabled) return;

    let ws: WebSocket | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    async function connect() {
      if (cancelled) return;

      const token = await fetchWsToken();
      if (cancelled) return;
      if (!token) {
        timeoutId = setTimeout(connect, 3000);
        return;
      }

      const wsUrl =
        process.env.NEXT_PUBLIC_WS_URL ??
        `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`;
      ws = new WebSocket(`${wsUrl}/ws?token=${encodeURIComponent(token)}`);
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

      ws.onclose = (event) => {
        wsRef.current = null;
        if (cancelled) return;
        const delay = event.code === AUTH_CLOSE_CODE ? 1000 : 3000;
        timeoutId = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (ws) ws.close();
      if (timeoutId) clearTimeout(timeoutId);
      wsRef.current = null;
    };
  }, [enabled]);

  const send = useCallback((msg: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      queueRef.current.push(msg);
    }
  }, []);

  return { send };
}
