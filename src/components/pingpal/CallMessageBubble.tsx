"use client";

import { Phone, PhoneIncoming, PhoneOutgoing, Video } from "lucide-react";
import { type CallMessagePayload, getCallMessageDisplay } from "@/lib/pingpal/call-messages";
import type { Message } from "@/lib/pingpal/types";

type CallMessageBubbleProps = {
  message: Message;
  payload: CallMessagePayload;
  currentUserId: string;
};

export default function CallMessageBubble({
  message,
  payload,
  currentUserId,
}: CallMessageBubbleProps) {
  const { label, subtitle, isCaller } = getCallMessageDisplay(payload, currentUserId);
  const isOwn = isCaller;

  const Icon = payload.callType === "video" ? Video : Phone;
  const DirectionIcon = isCaller ? PhoneOutgoing : PhoneIncoming;

  return (
    <div className={`flex px-4 py-0.5 ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[75%] flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
        <div
          className={`flex min-w-[180px] items-center gap-3 rounded-2xl px-3 py-2.5 ${
            isOwn ? "rounded-tr-sm bg-emerald-700" : "rounded-tl-sm bg-emerald-800"
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/25">
            <span className="relative text-white">
              <Icon size={16} />
              <DirectionIcon size={10} className="absolute -top-1 -right-1 opacity-90" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm text-white leading-tight">{label}</p>
            {subtitle && <p className="text-[12px] text-white/85 leading-tight">{subtitle}</p>}
          </div>
        </div>

        <span className="px-1 text-[10px] text-muted-foreground/50">
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
