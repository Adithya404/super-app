export type CallMessageStatus = "completed" | "no_answer" | "rejected" | "cancelled" | "missed";

export type CallMessagePayload = {
  callId: string;
  callType: "audio" | "video";
  status: CallMessageStatus;
  durationSeconds: number | null;
  initiatorId: string;
};

export function parseCallMessage(content: string): CallMessagePayload | null {
  try {
    const parsed = JSON.parse(content) as CallMessagePayload;
    if (!parsed.callId || !parsed.callType || !parsed.initiatorId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function formatCallDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? "" : "s"}`;
  }
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (remaining === 0) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

export function getCallMessageDisplay(payload: CallMessagePayload, currentUserId: string) {
  const isCaller = currentUserId === payload.initiatorId;
  const label = payload.callType === "video" ? "Video call" : "Voice call";

  let subtitle = "";
  switch (payload.status) {
    case "completed":
      subtitle =
        payload.durationSeconds != null ? formatCallDuration(payload.durationSeconds) : "Completed";
      break;
    case "no_answer":
      subtitle = isCaller ? "No answer" : "Missed call";
      break;
    case "rejected":
      subtitle = isCaller ? "Declined" : "Declined call";
      break;
    case "cancelled":
      subtitle = isCaller ? "Cancelled" : "Missed call";
      break;
    case "missed":
      subtitle = isCaller ? "No answer" : "Missed call";
      break;
    default:
      subtitle = "";
  }

  return { label, subtitle, isCaller };
}
