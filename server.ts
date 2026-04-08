// server.ts (root of project)
import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { WebSocketServer } from "ws";
import { initWebSocketServer } from "@/lib/websocket/server";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
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
