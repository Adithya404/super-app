// server.ts (root of project)
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { WebSocketServer } from "ws";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  // Dynamically import initWebSocketServer after environment variables have been loaded
  const { initWebSocketServer } = await import("@/lib/websocket/server");

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url ?? "", true);
    handle(req, res, parsedUrl);
  });

  // Mount WebSocket server on /ws path
  const wss = new WebSocketServer({ noServer: true });
  initWebSocketServer(wss);

  server.on("upgrade", (req, socket, head) => {
    const { pathname } = parse(req.url ?? "");
    if (pathname === "/ws") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    }
  });

  server.listen(3000, () => {
    console.info("> Ready on http://localhost:3000");
  });
});
