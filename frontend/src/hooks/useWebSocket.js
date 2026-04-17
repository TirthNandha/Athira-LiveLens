import { useRef, useEffect, useCallback, useState } from "react";

export default function useWebSocket(sessionId) {
  const wsRef = useRef(null);
  const listenersRef = useRef(new Map());
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef(null);
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;

  useEffect(() => {
    const token = localStorage.getItem("athira_token");
    if (!token || !sessionId) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = window.location.host;
    const url = `${protocol}://${host}/api/ws/session/${sessionId}?token=${token}`;

    let ws;
    let disposed = false;

    const doConnect = () => {
      if (disposed) return;
      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const handlers = listenersRef.current.get(msg.type);
          if (handlers) handlers.forEach((fn) => fn(msg.data, msg));
          const wildcards = listenersRef.current.get("*");
          if (wildcards) wildcards.forEach((fn) => fn(msg.data, msg));
        } catch {
          // ignore non-JSON
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (!disposed) {
          reconnectTimer.current = setTimeout(doConnect, 2000);
        }
      };

      ws.onerror = () => ws.close();
    };

    doConnect();

    return () => {
      disposed = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [sessionId]);

  const send = useCallback((type, data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    }
  }, []);

  const on = useCallback((type, handler) => {
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, new Set());
    }
    listenersRef.current.get(type).add(handler);
    return () => listenersRef.current.get(type)?.delete(handler);
  }, []);

  return { send, on, connected };
}
