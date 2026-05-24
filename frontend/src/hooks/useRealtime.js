import { useEffect, useRef } from "react";

import { WS_URL } from "../lib/config";

export function useRealtime(enabled, onEvent) {
  const callbackRef = useRef(onEvent);

  useEffect(() => {
    callbackRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled) return undefined;

    let active = true;
    let socket;
    let reconnectTimer;

    const connect = () => {
      socket = new WebSocket(WS_URL);
      socket.onmessage = (message) => {
        try {
          callbackRef.current?.(JSON.parse(message.data));
        } catch {
          // Ignore malformed events.
        }
      };
      socket.onclose = () => {
        if (!active) return;
        reconnectTimer = window.setTimeout(connect, 1200);
      };
      socket.onerror = () => socket.close();
    };

    connect();

    return () => {
      active = false;
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      if (socket && socket.readyState < 2) {
        socket.close();
      }
    };
  }, [enabled]);
}
