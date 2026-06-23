"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { usePingPalWS, type WSMessage } from "@/components/pingpal/pingpal-ws-context";
import { stopIncomingCallRingtone } from "@/lib/pingpal/call-audio";
import { createPeerConnection } from "@/lib/webrtc/config";

export const CALL_RING_TIMEOUT_MS = 30_000;

export type CallType = "audio" | "video";
export type CallStatus = "idle" | "outgoing" | "incoming" | "connected" | "ended";

type CallState = {
  status: CallStatus;
  callId: string | null;
  roomId: string | null;
  remoteUserId: string | null;
  remoteUserName: string | null;
  callType: CallType;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  connectedAt: number | null;
};

type CallContextValue = {
  call: CallState;
  startCall: (opts: {
    roomId: string;
    toUserId: string;
    remoteUserName: string;
    callType: CallType;
  }) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
};

const initialCallState: CallState = {
  status: "idle",
  callId: null,
  roomId: null,
  remoteUserId: null,
  remoteUserName: null,
  callType: "video",
  localStream: null,
  remoteStream: null,
  isMuted: false,
  isVideoOff: false,
  connectedAt: null,
};

const CallContext = createContext<CallContextValue | null>(null);

async function attachStream(peer: RTCPeerConnection, stream: MediaStream) {
  for (const track of stream.getTracks()) {
    const existingSender = peer.getSenders().find((s) => s.track?.kind === track.kind);
    if (existingSender) {
      await existingSender.replaceTrack(track);
    } else {
      peer.addTrack(track, stream);
    }
  }
}

export function CallProvider({ children }: { children: ReactNode }) {
  const { send, subscribe } = usePingPalWS();
  const [call, setCall] = useState<CallState>(initialCallState);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const callRef = useRef(call);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const ringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    callRef.current = call;
  }, [call]);

  const clearRingTimeout = useCallback(() => {
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
  }, []);

  const cleanupPeer = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;
  }, []);

  const stopLocalStream = useCallback((stream: MediaStream | null) => {
    if (!stream) return;
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }, []);

  const resetCall = useCallback(() => {
    const current = callRef.current;
    stopLocalStream(current.localStream);
    cleanupPeer();
    clearRingTimeout();
    stopIncomingCallRingtone();
    pendingOfferRef.current = null;
    pendingIceCandidatesRef.current = [];
    setCall(initialCallState);
  }, [cleanupPeer, clearRingTimeout, stopLocalStream]);

  const endCall = useCallback(() => {
    const current = callRef.current;
    if (current.remoteUserId && current.callId) {
      send({
        type: "call_end",
        toUserId: current.remoteUserId,
        callId: current.callId,
      });
    }
    resetCall();
  }, [resetCall, send]);

  const setupPeer = useCallback(
    (remoteUserId: string, callId: string) => {
      cleanupPeer();
      const peer = createPeerConnection();
      peerRef.current = peer;

      peer.onicecandidate = (ev) => {
        if (ev.candidate) {
          send({
            type: "ice_candidate",
            toUserId: remoteUserId,
            callId,
            candidate: ev.candidate.toJSON(),
          });
        }
      };

      peer.ontrack = (ev) => {
        const stream = ev.streams[0] ?? new MediaStream([ev.track]);
        setCall((prev) => ({
          ...prev,
          remoteStream: stream,
          status: "connected",
          connectedAt: prev.connectedAt ?? Date.now(),
        }));
      };

      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "failed" || peer.connectionState === "disconnected") {
          endCall();
        }
      };

      return peer;
    },
    [cleanupPeer, endCall, send],
  );

  const getMediaStream = useCallback(async (callType: CallType) => {
    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === "video",
    });
  }, []);

  const resolveRemoteName = useCallback(async (remoteUserId: string) => {
    try {
      const res = await fetch(`/api/pingpal/users?ids=${remoteUserId}`);
      const data = (await res.json()) as {
        users?: Array<{ id: string; name: string | null; email: string }>;
      };
      const user = data.users?.[0];
      return user?.name ?? user?.email ?? "Unknown";
    } catch {
      return "Unknown";
    }
  }, []);

  const startCall = useCallback(
    async ({
      roomId,
      toUserId,
      remoteUserName,
      callType,
    }: {
      roomId: string;
      toUserId: string;
      remoteUserName: string;
      callType: CallType;
    }) => {
      if (callRef.current.status !== "idle") return;

      const callId = crypto.randomUUID();
      const stream = await getMediaStream(callType);
      const peer = setupPeer(toUserId, callId);
      await attachStream(peer, stream);

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      setCall({
        status: "outgoing",
        callId,
        roomId,
        remoteUserId: toUserId,
        remoteUserName,
        callType,
        localStream: stream,
        remoteStream: null,
        isMuted: false,
        isVideoOff: callType === "audio",
        connectedAt: null,
      });

      send({
        type: "call_user",
        toUserId,
        roomId,
        callId,
        offer,
        callType,
      });
    },
    [getMediaStream, send, setupPeer],
  );

  const acceptCall = useCallback(async () => {
    const current = callRef.current;
    const offer = pendingOfferRef.current;
    if (current.status !== "incoming" || !offer || !current.remoteUserId || !current.callId) {
      return;
    }

    const stream = await getMediaStream(current.callType);
    const peer = setupPeer(current.remoteUserId, current.callId);
    await attachStream(peer, stream);

    if (peer.signalingState === "have-local-offer") {
      await peer.setLocalDescription({ type: "rollback" });
    }
    await peer.setRemoteDescription(offer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    for (const candidate of pendingIceCandidatesRef.current) {
      try {
        await peer.addIceCandidate(candidate);
      } catch {
        // ignore stale candidates
      }
    }
    pendingIceCandidatesRef.current = [];

    setCall((prev) => ({
      ...prev,
      status: "connected",
      localStream: stream,
      isVideoOff: prev.callType === "audio",
      connectedAt: Date.now(),
    }));

    send({
      type: "call_accepted",
      toUserId: current.remoteUserId,
      callId: current.callId,
      answer,
    });

    pendingOfferRef.current = null;
  }, [getMediaStream, send, setupPeer]);

  const rejectCall = useCallback(() => {
    const current = callRef.current;
    if (current.remoteUserId && current.callId) {
      send({
        type: "call_rejected",
        toUserId: current.remoteUserId,
        callId: current.callId,
        reason: "declined",
      });
    }
    resetCall();
  }, [resetCall, send]);

  const toggleMute = useCallback(() => {
    setCall((prev) => {
      const nextMuted = !prev.isMuted;
      for (const track of prev.localStream?.getAudioTracks() ?? []) {
        track.enabled = !nextMuted;
      }
      return { ...prev, isMuted: nextMuted };
    });
  }, []);

  const toggleVideo = useCallback(() => {
    setCall((prev) => {
      if (prev.callType === "audio") return prev;
      const nextVideoOff = !prev.isVideoOff;
      for (const track of prev.localStream?.getVideoTracks() ?? []) {
        track.enabled = !nextVideoOff;
      }
      return { ...prev, isVideoOff: nextVideoOff };
    });
  }, []);

  const handleWSMessage = useCallback(
    async (msg: WSMessage) => {
      switch (msg.type) {
        case "incoming_call": {
          if (callRef.current.status !== "idle") {
            send({
              type: "call_rejected",
              toUserId: msg.fromUserId,
              callId: msg.callId,
              reason: "declined",
            });
            return;
          }

          pendingOfferRef.current = msg.offer;
          const remoteUserName = await resolveRemoteName(msg.fromUserId);

          setCall({
            status: "incoming",
            callId: msg.callId,
            roomId: msg.roomId,
            remoteUserId: msg.fromUserId,
            remoteUserName,
            callType: msg.callType ?? "video",
            localStream: null,
            remoteStream: null,
            isMuted: false,
            isVideoOff: false,
            connectedAt: null,
          });
          break;
        }

        case "call_accepted": {
          const current = callRef.current;
          if (current.callId !== msg.callId || current.status !== "outgoing") return;

          const peer = peerRef.current;
          if (!peer || peer.signalingState !== "have-local-offer") return;

          await peer.setRemoteDescription(msg.answer);
          setCall((prev) => ({
            ...prev,
            status: "connected",
            connectedAt: prev.connectedAt ?? Date.now(),
          }));
          break;
        }

        case "call_rejected": {
          if (callRef.current.callId !== msg.callId) return;
          resetCall();
          break;
        }

        case "call_result": {
          if (callRef.current.callId !== msg.callId) return;
          toast.error(msg.message ?? "Call failed");
          resetCall();
          break;
        }

        case "ice_candidate": {
          if (callRef.current.callId !== msg.callId || !msg.candidate) return;
          const peer = peerRef.current;
          if (!peer) {
            if (callRef.current.status === "incoming") {
              pendingIceCandidatesRef.current.push(msg.candidate);
            }
            return;
          }
          try {
            await peer.addIceCandidate(msg.candidate);
          } catch {
            // ICE candidates can arrive after negotiation; ignore stale ones.
          }
          break;
        }

        case "call_end": {
          if (callRef.current.callId !== msg.callId) return;
          resetCall();
          break;
        }
      }
    },
    [resetCall, resolveRemoteName, send],
  );

  useEffect(() => {
    return subscribe(handleWSMessage);
  }, [subscribe, handleWSMessage]);

  useEffect(() => {
    if (call.status !== "outgoing" && call.status !== "incoming") {
      clearRingTimeout();
      return;
    }

    clearRingTimeout();
    ringTimeoutRef.current = setTimeout(() => {
      const current = callRef.current;
      if (current.status === "outgoing") {
        if (current.remoteUserId && current.callId) {
          send({
            type: "call_end",
            toUserId: current.remoteUserId,
            callId: current.callId,
          });
        }
        toast.error("No answer");
        resetCall();
      } else if (current.status === "incoming") {
        if (current.remoteUserId && current.callId) {
          send({
            type: "call_rejected",
            toUserId: current.remoteUserId,
            callId: current.callId,
            reason: "timeout",
          });
        }
        resetCall();
      }
    }, CALL_RING_TIMEOUT_MS);

    return clearRingTimeout;
  }, [call.status, clearRingTimeout, resetCall, send]);

  useEffect(() => {
    return () => {
      stopLocalStream(callRef.current.localStream);
      cleanupPeer();
    };
  }, [cleanupPeer, stopLocalStream]);

  return (
    <CallContext.Provider
      value={{ call, startCall, acceptCall, rejectCall, endCall, toggleMute, toggleVideo }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) {
    throw new Error("useCall must be used within CallProvider");
  }
  return ctx;
}
