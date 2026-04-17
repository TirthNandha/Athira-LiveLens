import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useWebSocket from "../hooks/useWebSocket";
import usePeer from "../hooks/usePeer";
import CodeEditor from "../components/session/CodeEditor";
import OutputPanel from "../components/session/OutputPanel";
import VideoPanel from "../components/session/VideoPanel";
import ChatPanel from "../components/session/ChatPanel";

export default function SessionRoom() {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { send, on, connected } = useWebSocket(sessionId);
  const { localStream, remoteStream, peerReady, callPeer } = usePeer(
    sessionId,
    user?.role
  );

  const [outputs, setOutputs] = useState([]);
  const [running, setRunning] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const workerRef = useRef(null);
  const hasCalledRef = useRef(false);

  // Auto-call video when the other user joins
  useEffect(() => {
    const off = on("user:joined", (data) => {
      setChatMessages((prev) => [
        ...prev,
        {
          text: `${data.role} joined the session`,
          sender: "System",
          isOwn: false,
        },
      ]);
      // Auto-initiate video call when the other person arrives
      if (peerReady && !hasCalledRef.current) {
        hasCalledRef.current = true;
        setTimeout(() => callPeer(), 1500);
      }
    });
    return off;
  }, [on, peerReady, callPeer]);

  // Also try to call if we arrived second (peer is already ready)
  useEffect(() => {
    if (peerReady && connected && !remoteStream && !hasCalledRef.current) {
      hasCalledRef.current = true;
      setTimeout(() => callPeer(), 2000);
    }
  }, [peerReady, connected, callPeer, remoteStream]);

  // Pyodide worker
  useEffect(() => {
    const worker = new Worker("/pyodide-worker.js");
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { stdout, stderr, error } = e.data;
      const result = { stdout, stderr, error };
      setOutputs([result]);
      setRunning(false);
      send("code:output", result);
    };

    return () => worker.terminate();
  }, [send]);

  // WS event listeners for code output and chat
  useEffect(() => {
    const offOutput = on("code:output", (data) => {
      setOutputs([data]);
    });

    const offChat = on("chat:message", (data) => {
      setChatMessages((prev) => [
        ...prev,
        { text: data.text, sender: data.sender, isOwn: false },
      ]);
    });

    const offLeave = on("user:left", (data) => {
      setChatMessages((prev) => [
        ...prev,
        {
          text: `${data.role} left the session`,
          sender: "System",
          isOwn: false,
        },
      ]);
    });

    return () => {
      offOutput();
      offChat();
      offLeave();
    };
  }, [on]);

  const handleRun = useCallback((code) => {
    if (!workerRef.current) return;
    setRunning(true);
    workerRef.current.postMessage({ id: Date.now(), code });
  }, []);

  const handleSendChat = useCallback(
    (text) => {
      const name = user?.full_name || user?.email || "Unknown";
      send("chat:message", { text, sender: name });
      setChatMessages((prev) => [
        ...prev,
        { text, sender: "You", isOwn: true },
      ]);
    },
    [send, user]
  );

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-indigo-600">Athira</span>
          <span className="text-sm text-gray-500">Session Room</span>
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-green-500" : "bg-red-500"
            }`}
            title={connected ? "Connected" : "Disconnected"}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user.full_name}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 capitalize">
            {user.role}
          </span>
          <button
            onClick={() =>
              navigate(user.role === "student" ? "/student" : "/tutor")
            }
            className="text-sm text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Dual-pane body */}
      <div className="flex-1 flex min-h-0 p-3 gap-3">
        {/* Left pane: Video + Chat */}
        <div className="w-80 shrink-0 flex flex-col gap-3">
          <VideoPanel
            localStream={localStream}
            remoteStream={remoteStream}
            peerReady={peerReady}
            onCall={callPeer}
          />
          <div className="flex-1 min-h-0">
            <ChatPanel messages={chatMessages} onSend={handleSendChat} />
          </div>
        </div>

        {/* Right pane: Code + Output */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div className="flex-1 min-h-0">
            <CodeEditor send={send} on={on} onRun={handleRun} running={running} />
          </div>
          <div className="h-48 shrink-0">
            <OutputPanel outputs={outputs} running={running} />
          </div>
        </div>
      </div>
    </div>
  );
}
