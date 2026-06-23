"use client";

import { Phone, PhoneOff, Video } from "lucide-react";
import { useEffect, useRef } from "react";
import { useCall } from "@/components/pingpal/call/call-context";
import { Button } from "@/components/ui/button";
import { startIncomingCallRingtone, stopIncomingCallRingtone } from "@/lib/pingpal/call-audio";
import { showIncomingCallNotification } from "@/lib/pingpal/notifications";

export default function IncomingCallDialog() {
  const { call, acceptCall, rejectCall } = useCall();
  const notifiedCallIdRef = useRef<string | null>(null);

  const open = call.status === "incoming";

  useEffect(() => {
    if (call.status !== "incoming") {
      stopIncomingCallRingtone();
      return;
    }

    startIncomingCallRingtone();

    const showNotificationIfHidden = () => {
      if (!call.callId || notifiedCallIdRef.current === call.callId) return;
      if (document.hidden) {
        notifiedCallIdRef.current = call.callId;
        showIncomingCallNotification({
          title: `Incoming ${call.callType === "video" ? "video" : "audio"} call`,
          body: `${call.remoteUserName ?? "Someone"} is calling you`,
          callId: call.callId,
        });
      }
    };

    showNotificationIfHidden();
    document.addEventListener("visibilitychange", showNotificationIfHidden);

    return () => {
      stopIncomingCallRingtone();
      document.removeEventListener("visibilitychange", showNotificationIfHidden);
    };
  }, [call.status, call.callId, call.callType, call.remoteUserName]);

  useEffect(() => {
    if (call.status === "idle") {
      notifiedCallIdRef.current = null;
    }
  }, [call.status]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm"
        aria-hidden
        onClick={rejectCall}
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="incoming-call-title"
        className="fixed inset-0 z-[121] flex items-center justify-center p-4"
      >
        <div className="w-full max-w-sm rounded-2xl border border-primary/20 bg-background p-6 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 font-semibold text-3xl text-primary">
                {(call.remoteUserName ?? "?").charAt(0).toUpperCase()}
              </div>
            </div>

            <h2 id="incoming-call-title" className="font-semibold text-foreground text-lg">
              Incoming {call.callType === "video" ? "video" : "audio"} call
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              {call.remoteUserName ?? "Someone"} is calling you
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              type="button"
              variant="destructive"
              size="lg"
              className="w-full sm:w-auto sm:min-w-[120px]"
              onClick={rejectCall}
            >
              <PhoneOff size={18} />
              Decline
            </Button>
            <Button
              type="button"
              size="lg"
              className="w-full sm:w-auto sm:min-w-[120px]"
              onClick={() => void acceptCall()}
            >
              {call.callType === "video" ? <Video size={18} /> : <Phone size={18} />}
              Accept
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
