export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "");
export const WS_URL = (import.meta.env.VITE_WS_URL || API_URL.replace(/^http/, "ws") + "/ws").replace(/\/$/, "");

export const ORDER_STATUS_FLOW = ["new", "accepted", "preparing", "ready", "served", "paid"];
export const OWNER_HOME = "/app/dashboard";
