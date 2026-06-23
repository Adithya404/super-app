/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/websocket/server.ts

import type { IncomingMessage } from "node:http";
import { WebSocket, type WebSocketServer } from "ws";
import { pingpalPool } from "@/lib/db";
import {
  createCallRecord,
  finalizeCall,
  markCallAnswered,
  resolveTerminalStatus,
} from "@/lib/pingpal/call-log";
import { MESSAGE_SELECT } from "@/lib/pingpal/message-query";
import { verifyWsToken } from "@/lib/websocket/token";

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

export function sendToUser(userId: string, payload: object) {
  const client = clients.get(userId);
  if (client?.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(payload));
  }
}

async function verifyRoomMembership(roomId: string, userId: string) {
  const { rows } = await pingpalPool.query(
    `SELECT 1 FROM pingpal.room_members WHERE room_id = $1 AND user_id = $2`,
    [roomId, userId],
  );
  return rows.length > 0;
}

async function handleCallTermination(params: {
  callId: string;
  event: "call_rejected" | "call_end";
  endedByUserId: string;
  toUserId: string;
  reason?: "declined" | "timeout";
}) {
  const { rows } = await pingpalPool.query<{
    initiator_id: string;
    status: string;
    room_id: string;
  }>(`SELECT initiator_id, status, room_id FROM pingpal.calls WHERE id = $1`, [params.callId]);
  const callMeta = rows[0];

  if (callMeta) {
    const terminalStatus = resolveTerminalStatus({
      event: params.event,
      callStatus: callMeta.status,
      initiatorId: callMeta.initiator_id,
      endedByUserId: params.endedByUserId,
      reason: params.reason,
    });

    const result = await finalizeCall({
      callId: params.callId,
      terminalStatus,
      endedByUserId: params.endedByUserId,
    });

    if (result) {
      broadcastToRoom(result.call.room_id, { type: "new_message", message: result.message });
      if (result.notifyInitiator && result.notifyInitiator !== params.endedByUserId) {
        sendToUser(result.notifyInitiator, {
          type: "call_result",
          callId: params.callId,
          status: terminalStatus,
          message: result.resultMessage,
        });
      }
    }
  }

  sendToUser(params.toUserId, {
    type: params.event,
    fromUserId: params.endedByUserId,
    callId: params.callId,
  });
}

export function initWebSocketServer(wss: WebSocketServer) {
  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    void acceptConnection(ws, req);
  });
}

async function acceptConnection(ws: WebSocket, req: IncomingMessage) {
  const url = new URL(req.url ?? "", "http://localhost");
  const token = url.searchParams.get("token");

  if (!token) {
    ws.close(1008, "token required");
    return;
  }

  const userId = await verifyWsToken(token);
  if (!userId) {
    ws.close(1008, "invalid token");
    return;
  }

  // Register client (replaces any stale socket for this user)
  const client: WSClient = { ws, userId, rooms: new Set() };
  clients.set(userId, client);

  pingpalPool.query(
    `INSERT INTO pingpal.user_presence (user_id, is_online, last_seen)
     VALUES ($1, true, NOW())
     ON CONFLICT (user_id) DO UPDATE SET is_online = true, last_seen = NOW()`,
    [userId],
  );

  pingpalPool
    .query(`SELECT room_id FROM pingpal.room_members WHERE user_id = $1`, [userId])
    .then(({ rows }) => {
      rows.forEach(({ room_id }) => {
        client.rooms.add(room_id);
        if (!roomClients.has(room_id)) roomClients.set(room_id, new Set());
        roomClients.get(room_id)?.add(userId);
      });
    });

  ws.on("message", async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      await handleMessage(userId, msg);
    } catch (e) {
      console.error("WS message error:", e);
    }
  });

  ws.on("close", () => {
    clients.delete(userId);
    client.rooms.forEach((roomId) => {
      roomClients.get(roomId)?.delete(userId);
    });
    pingpalPool.query(
      `INSERT INTO pingpal.user_presence (user_id, is_online, last_seen)
       VALUES ($1, false, NOW())
       ON CONFLICT (user_id) DO UPDATE SET is_online = false, last_seen = NOW()`,
      [userId],
    );
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

      const { rows: inserted } = await pingpalPool.query(
        `INSERT INTO pingpal.messages (room_id, sender_id, content, reply_to_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [roomId, userId, content, replyToId ?? null],
      );
      const messageId = inserted[0].id;

      const { rows } = await pingpalPool.query(
        `${MESSAGE_SELECT}
         WHERE m.id = $1`,
        [messageId],
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
      broadcastToRoom(roomId, { type: "typing", roomId, userId, isTyping }, userId);
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

      const { rows: existing } = await pingpalPool.query(
        `SELECT 1 FROM pingpal.reactions
         WHERE message_id = $1 AND user_id = $2 AND emoji = $3`,
        [messageId, userId, emoji],
      );

      if (existing.length) {
        await pingpalPool.query(
          `DELETE FROM pingpal.reactions
           WHERE message_id = $1 AND user_id = $2 AND emoji = $3`,
          [messageId, userId, emoji],
        );
        broadcastToRoom(roomId, { type: "reaction", messageId, userId, emoji, removed: true });
      } else {
        await pingpalPool.query(
          `INSERT INTO pingpal.reactions (message_id, user_id, emoji)
           VALUES ($1, $2, $3)`,
          [messageId, userId, emoji],
        );
        broadcastToRoom(roomId, { type: "reaction", messageId, userId, emoji, removed: false });
      }
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

    case "call_user": {
      const { toUserId, roomId, callId, offer, callType } = msg;
      if (!toUserId || !roomId || !callId || !offer) return;
      if (!(await verifyRoomMembership(roomId, userId))) return;
      if (!(await verifyRoomMembership(roomId, toUserId))) return;

      await createCallRecord({
        callId,
        roomId,
        initiatorId: userId,
        recipientId: toUserId,
        callType: callType ?? "video",
      });

      sendToUser(toUserId, {
        type: "incoming_call",
        fromUserId: userId,
        roomId,
        callId,
        offer,
        callType: callType ?? "video",
      });
      break;
    }

    case "call_accepted": {
      const { toUserId, callId, answer } = msg;
      if (!toUserId || !callId || !answer) return;

      await markCallAnswered(callId);

      sendToUser(toUserId, {
        type: "call_accepted",
        fromUserId: userId,
        callId,
        answer,
      });
      break;
    }

    case "call_rejected": {
      const { toUserId, callId, reason } = msg;
      if (!toUserId || !callId) return;

      await handleCallTermination({
        callId,
        event: "call_rejected",
        endedByUserId: userId,
        toUserId,
        reason: reason === "timeout" ? "timeout" : "declined",
      });
      break;
    }

    case "ice_candidate": {
      const { toUserId, callId, candidate } = msg;
      if (!toUserId || !callId || !candidate) return;

      sendToUser(toUserId, {
        type: "ice_candidate",
        fromUserId: userId,
        callId,
        candidate,
      });
      break;
    }

    case "call_end": {
      const { toUserId, callId } = msg;
      if (!toUserId || !callId) return;

      await handleCallTermination({
        callId,
        event: "call_end",
        endedByUserId: userId,
        toUserId,
      });
      break;
    }
  }
}
