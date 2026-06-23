import { pingpalPool } from "@/lib/db";
import { MESSAGE_SELECT } from "@/lib/pingpal/message-query";

export type CallTerminalStatus = "completed" | "rejected" | "no_answer" | "cancelled" | "missed";

export const CALL_RESULT_MESSAGES: Record<CallTerminalStatus, string> = {
  completed: "Call ended",
  rejected: "Call declined",
  no_answer: "No answer",
  cancelled: "Call cancelled",
  missed: "Missed call",
};

type CallRow = {
  id: string;
  room_id: string;
  initiator_id: string;
  recipient_id: string;
  call_type: "audio" | "video";
  status: string;
  started_at: string;
  answered_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  message_id: string | null;
};

export async function createCallRecord(params: {
  callId: string;
  roomId: string;
  initiatorId: string;
  recipientId: string;
  callType: "audio" | "video";
}) {
  await pingpalPool.query(
    `INSERT INTO pingpal.calls (id, room_id, initiator_id, recipient_id, call_type, status)
     VALUES ($1, $2, $3, $4, $5, 'ringing')
     ON CONFLICT (id) DO NOTHING`,
    [params.callId, params.roomId, params.initiatorId, params.recipientId, params.callType],
  );
}

export async function markCallAnswered(callId: string) {
  await pingpalPool.query(
    `UPDATE pingpal.calls
     SET status = 'answered', answered_at = NOW()
     WHERE id = $1 AND status = 'ringing'`,
    [callId],
  );
}

async function fetchCall(callId: string): Promise<CallRow | null> {
  const { rows } = await pingpalPool.query<CallRow>(
    `SELECT id, room_id, initiator_id, recipient_id, call_type, status,
            started_at, answered_at, ended_at, duration_seconds, message_id
     FROM pingpal.calls WHERE id = $1`,
    [callId],
  );
  return rows[0] ?? null;
}

async function insertCallMessage(call: CallRow, terminalStatus: CallTerminalStatus) {
  const payload = {
    callId: call.id,
    callType: call.call_type,
    status: terminalStatus,
    durationSeconds: call.duration_seconds,
    initiatorId: call.initiator_id,
  };

  const { rows: inserted } = await pingpalPool.query<{ id: string }>(
    `INSERT INTO pingpal.messages (room_id, sender_id, content, type)
     VALUES ($1, $2, $3, 'call')
     RETURNING id`,
    [call.room_id, call.initiator_id, JSON.stringify(payload)],
  );

  const messageId = inserted[0].id;

  await pingpalPool.query(`UPDATE pingpal.calls SET message_id = $1 WHERE id = $2`, [
    messageId,
    call.id,
  ]);

  await pingpalPool.query(`UPDATE pingpal.rooms SET updated_at = NOW() WHERE id = $1`, [
    call.room_id,
  ]);

  const { rows } = await pingpalPool.query(`${MESSAGE_SELECT} WHERE m.id = $1`, [messageId]);
  return rows[0];
}

export async function finalizeCall(params: {
  callId: string;
  terminalStatus: CallTerminalStatus;
  endedByUserId: string;
}) {
  const call = await fetchCall(params.callId);
  if (!call || call.message_id) return null;

  if (!["ringing", "answered"].includes(call.status)) return null;

  let durationSeconds: number | null = null;
  if (params.terminalStatus === "completed" && call.answered_at) {
    durationSeconds = Math.max(
      0,
      Math.floor((Date.now() - new Date(call.answered_at).getTime()) / 1000),
    );
  }

  const { rows: updated } = await pingpalPool.query<CallRow>(
    `UPDATE pingpal.calls
     SET status = $2,
         ended_at = NOW(),
         duration_seconds = $3,
         ended_by = $4
     WHERE id = $1 AND status IN ('ringing', 'answered') AND message_id IS NULL
     RETURNING id, room_id, initiator_id, recipient_id, call_type, status,
               started_at, answered_at, ended_at, duration_seconds, message_id`,
    [params.callId, params.terminalStatus, durationSeconds, params.endedByUserId],
  );

  const finalized = updated[0];
  if (!finalized) return null;

  const message = await insertCallMessage(finalized, params.terminalStatus);

  const shouldNotifyInitiator =
    params.terminalStatus === "rejected" ||
    params.terminalStatus === "no_answer" ||
    params.terminalStatus === "missed";

  return {
    call: finalized,
    message,
    notifyInitiator: shouldNotifyInitiator ? finalized.initiator_id : null,
    resultMessage: CALL_RESULT_MESSAGES[params.terminalStatus],
  };
}

export function resolveTerminalStatus(params: {
  event: "call_rejected" | "call_end";
  callStatus: string;
  initiatorId: string;
  endedByUserId: string;
  reason?: "declined" | "timeout";
}): CallTerminalStatus {
  if (params.event === "call_rejected") {
    if (params.endedByUserId === params.initiatorId) return "cancelled";
    if (params.reason === "timeout") return "no_answer";
    return "rejected";
  }

  if (params.callStatus === "answered") {
    return "completed";
  }

  if (params.endedByUserId === params.initiatorId) {
    return "no_answer";
  }

  return "missed";
}

export async function getCallStatus(callId: string): Promise<string | null> {
  const call = await fetchCall(callId);
  return call?.status ?? null;
}

export async function getCallInitiator(callId: string): Promise<string | null> {
  const call = await fetchCall(callId);
  return call?.initiator_id ?? null;
}
