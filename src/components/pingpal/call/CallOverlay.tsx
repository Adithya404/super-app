"use client";

import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCall } from "@/components/pingpal/call/call-context";
import { playRemoteStream } from "@/lib/pingpal/call-audio";
import { cn } from "@/lib/utils";

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function CallOverlay() {
  const { call, endCall, toggleMute, toggleVideo } = useCall();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const [elapsed, setElapsed] = useState(0);

  const isActive = call.status === "outgoing" || call.status === "connected";

  useEffect(() => {
    if (call.status !== "connected" || !call.connectedAt) {
      setElapsed(0);
      return;
    }

    const connectedAt = call.connectedAt;
    const tick = () => {
      setElapsed(Math.floor((Date.now() - connectedAt) / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [call.status, call.connectedAt]);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = call.localStream;
    }
  }, [call.localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = call.remoteStream;
    }
  }, [call.remoteStream]);

  useEffect(() => {
    if (!call.remoteStream || !remoteAudioRef.current) return;
    void playRemoteStream(call.remoteStream, remoteAudioRef.current);
  }, [call.remoteStream]);

  if (!isActive) return null;

  const statusLabel =
    call.status === "outgoing"
      ? "Calling..."
      : call.status === "connected"
        ? formatElapsed(elapsed)
        : "";

  return (
    <div className="fixed inset-0 z-[100] flex max-h-[100dvh] flex-col overflow-hidden bg-zinc-950 text-white">
      <header className="shrink-0 border-white/10 border-b px-4 py-3">
        <p className="truncate font-medium text-sm">{call.remoteUserName ?? "Call"}</p>
        <p className="text-white/60 text-xs">
          {call.status === "connected" ? (
            <span className="font-mono tabular-nums">{statusLabel}</span>
          ) : (
            statusLabel
          )}
          {" · "}
          {call.callType === "video" ? "Video" : "Audio"} call
        </p>
      </header>

      <main className="relative min-h-0 flex-1 overflow-hidden">
        {call.callType === "video" ? (
          <div className="flex h-full w-full items-center justify-center p-2 sm:p-4">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "max-h-full max-w-full rounded-xl bg-zinc-900 object-contain",
                !call.remoteStream && "opacity-40",
              )}
            />
            {!call.remoteStream && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-white/50">Waiting for remote video...</p>
              </div>
            )}
            <div className="absolute right-3 bottom-3 z-10 h-24 w-20 overflow-hidden rounded-lg border border-white/20 bg-zinc-900 shadow-lg sm:right-4 sm:bottom-4 sm:h-32 sm:w-24">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={cn(
                  "h-full w-full object-cover",
                  (call.isVideoOff || !call.localStream) && "opacity-30",
                )}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/20 font-semibold text-2xl text-primary sm:h-24 sm:w-24 sm:text-3xl">
              {(call.remoteUserName ?? "?").charAt(0).toUpperCase()}
            </div>
            <p className="truncate text-center text-base sm:text-lg">{call.remoteUserName}</p>
            <p className="font-mono text-sm text-white/80 tabular-nums">{statusLabel}</p>
          </div>
        )}
      </main>

      {/* biome-ignore lint/a11y/useMediaCaption: WebRTC live call audio has no captions track */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      <footer className="relative z-20 shrink-0 border-white/10 border-t bg-zinc-950 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:py-6">
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={toggleMute}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors sm:h-12 sm:w-12",
              call.isMuted ? "bg-red-500 text-white" : "bg-white/10 text-white hover:bg-white/20",
            )}
            title={call.isMuted ? "Unmute" : "Mute"}
          >
            {call.isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {call.callType === "video" && (
            <button
              type="button"
              onClick={toggleVideo}
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors sm:h-12 sm:w-12",
                call.isVideoOff
                  ? "bg-red-500 text-white"
                  : "bg-white/10 text-white hover:bg-white/20",
              )}
              title={call.isVideoOff ? "Turn camera on" : "Turn camera off"}
            >
              {call.isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
            </button>
          )}

          <button
            type="button"
            onClick={endCall}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 sm:h-12 sm:w-12"
            title="End call"
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
}
