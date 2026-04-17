import { useRef, useState, useEffect, useCallback } from "react";
import Peer from "peerjs";

export default function usePeer(sessionId, role) {
  const peerRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerReady, setPeerReady] = useState(false);
  const callRef = useRef(null);
  const localStreamRef = useRef(null);

  const peerId = sessionId && role ? `athira-${sessionId}-${role}` : null;
  const remotePeerId = sessionId && role
    ? `athira-${sessionId}-${role === "student" ? "tutor" : "student"}`
    : null;

  useEffect(() => {
    if (!peerId) return;

    let stream = null;
    let peer = null;
    let destroyed = false;

    const init = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
          stream = new MediaStream();
        }
      }

      if (destroyed) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      localStreamRef.current = stream;
      setLocalStream(stream);

      peer = new Peer(peerId, { debug: 0 });
      peerRef.current = peer;

      peer.on("open", () => {
        if (!destroyed) setPeerReady(true);
      });

      peer.on("call", (incomingCall) => {
        incomingCall.answer(localStreamRef.current);
        callRef.current = incomingCall;
        incomingCall.on("stream", (remote) => {
          if (!destroyed) setRemoteStream(remote);
        });
        incomingCall.on("close", () => {
          if (!destroyed) setRemoteStream(null);
        });
      });

      peer.on("error", (err) => {
        console.warn("PeerJS error:", err.type, err.message);
      });
    };

    init();

    return () => {
      destroyed = true;
      if (callRef.current) callRef.current.close();
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop());
      if (peer) peer.destroy();
      localStreamRef.current = null;
      setLocalStream(null);
      setRemoteStream(null);
      setPeerReady(false);
    };
  }, [peerId]);

  const callPeer = useCallback(() => {
    if (!peerRef.current || !localStreamRef.current || !remotePeerId) return;
    const outgoing = peerRef.current.call(remotePeerId, localStreamRef.current);
    if (!outgoing) return;
    callRef.current = outgoing;
    outgoing.on("stream", (remote) => setRemoteStream(remote));
    outgoing.on("close", () => setRemoteStream(null));
  }, [remotePeerId]);

  return { localStream, remoteStream, peerReady, callPeer };
}
