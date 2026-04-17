import { useRef, useEffect, useCallback, useState } from "react";

let connectionId = 0;

export default function useWebSocket(sessionId) {
  const wsRef = useRef(null);
  const listenersRef = useRef(new Map());
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("athira_token");
    if (!token || !sessionId) return;

    const myId = ++connectionId;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = window.location.host;
    const url = `${protocol}://${host}/api/ws/session/${sessionId}?token=${token}`;

    let disposed = false;
    let ws = null;

    const doConnect = () => {
      if (disposed || myId !== connectionId) return;

      if (ws) {
        try { ws.onclose = null; ws.onerror = null; ws.close(); } catch {}
      }

      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!disposed && myId === connectionId) setConnected(true);
      };

      ws.onmessage = (event) => {
        if (disposed || myId !== connectionId) return;
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
        if (disposed || myId !== connectionId) return;
        setConnected(false);
        reconnectTimer.current = setTimeout(doConnect, 2000);
      };

      ws.onerror = () => {};
    };

    doConnect();

    return () => {
      disposed = true;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      if (ws) {
        ws.onclose = null;
        ws.onerror = null;
        ws.onmessage = null;
        ws.close();
      }
      wsRef.current = null;
      setConnected(false);
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
