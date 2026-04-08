/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/websocket/server.ts

import type { IncomingMessage } from "node:http";
import { WebSocket, type WebSocketServer } from "ws";
import { pingpalPool } from "@/lib/db";

export type WSClient = {
  ws: WebSocket;
  userId: string;
  rooms: Set<string>;
};

// Map of userId → WSClient
const clients = new Map<string, WSClient>();

// Map of roomId → Set of userIds
const roomClients = new Map<string, Set<string>>();

export function broadcastToRoom(roomId: string, payload: object, excludeUserId?: string) {
  const members = roomClients.get(roomId);
  if (!members) return;

  const data = JSON.stringify(payload);
  members.forEach((userId) => {
    if (userId === excludeUserId) return;
    const client = clients.get(userId);
    if (client?.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  });
}

export function initWebSocketServer(wss: WebSocketServer) {
  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    // Extract userId from query string (?userId=xxx)
    // In production use a short-lived token instead
    const url = new URL(req.url ?? "", `http://localhost`);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      ws.close(1008, "userId required");
      return;
    }

    // Register client
    const client: WSClient = { ws, userId, rooms: new Set() };
    clients.set(userId, client);

    // Mark user online in DB
    pingpalPool.query(
      `UPDATE pingpal.users SET is_online = true, last_seen = NOW() WHERE id = $1`,
      [userId],
    );

    // Load user's rooms and subscribe them
    pingpalPool
      .query(`SELECT room_id FROM pingpal.room_members WHERE user_id = $1`, [userId])
      .then(({ rows }) => {
        rows.forEach(({ room_id }) => {
          client.rooms.add(room_id);
          if (!roomClients.has(room_id)) roomClients.set(room_id, new Set());
          roomClients.get(room_id)?.add(userId);
        });
      });

    // Handle incoming messages
    ws.on("message", async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        await handleMessage(userId, msg);
      } catch (e) {
        console.error("WS message error:", e);
      }
    });

    // Handle disconnect
    ws.on("close", () => {
      clients.delete(userId);
      client.rooms.forEach((roomId) => {
        roomClients.get(roomId)?.delete(userId);
      });
      pingpalPool.query(
        `UPDATE pingpal.users SET is_online = false, last_seen = NOW() WHERE id = $1`,
        [userId],
      );
    });
  });
}

// biome-ignore lint/suspicious/noExplicitAny: <later>
async function handleMessage(userId: string, msg: any) {
  switch (msg.type) {
    case "send_message": {
      const { roomId, content, replyToId } = msg;

      // Verify sender is a member
      const { rows: membership } = await pingpalPool.query(
        `SELECT 1 FROM pingpal.room_members WHERE room_id = $1 AND user_id = $2`,
        [roomId, userId],
      );
      if (!membership.length) return;

      // Insert message
      const { rows } = await pingpalPool.query(
        `INSERT INTO pingpal.messages (room_id, sender_id, content, reply_to_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [roomId, userId, content, replyToId ?? null],
      );
      const message = rows[0];

      // Update room updated_at
      await pingpalPool.query(`UPDATE pingpal.rooms SET updated_at = NOW() WHERE id = $1`, [
        roomId,
      ]);

      // Broadcast to all room members
      broadcastToRoom(roomId, { type: "new_message", message });
      break;
    }

    case "typing": {
      const { roomId, isTyping } = msg;
      broadcastToRoom(roomId, { type: "typing", userId, isTyping }, userId);
      break;
    }

    case "mark_read": {
      const { roomId } = msg;
      await pingpalPool.query(
        `UPDATE pingpal.room_members
         SET last_read_at = NOW()
         WHERE room_id = $1 AND user_id = $2`,
        [roomId, userId],
      );
      break;
    }

    case "react": {
      const { messageId, emoji, roomId } = msg;
      await pingpalPool.query(
        `INSERT INTO pingpal.reactions (message_id, user_id, emoji)
         VALUES ($1, $2, $3)
         ON CONFLICT (message_id, user_id, emoji) DO NOTHING`,
        [messageId, userId, emoji],
      );
      broadcastToRoom(roomId, { type: "reaction", messageId, userId, emoji });
      break;
    }

    case "join_room": {
      const { roomId } = msg;
      const client = clients.get(userId);
      if (!client) return;
      client.rooms.add(roomId);
      if (!roomClients.has(roomId)) roomClients.set(roomId, new Set());
      roomClients.get(roomId)?.add(userId);
      break;
    }
  }
}
