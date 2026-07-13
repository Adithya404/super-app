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
          className={`flex min-w-[180px] items-center gap-3 px-3 py-2.5 shadow-[0_4px_18px_rgba(16,185,129,0.25)] ${
            isOwn
              ? "rounded-[1.25rem_1.25rem_0.375rem_1.25rem] bg-gradient-to-br from-emerald-500 to-teal-700"
              : "rounded-[1.25rem_1.25rem_1.25rem_0.375rem] bg-gradient-to-br from-emerald-600 to-teal-800"
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/25 ring-1 ring-white/20">
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

        <span className="px-1 text-[10px] text-slate-500">
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
