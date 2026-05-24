export const API_URL = ("https://restaurantbackend-w0jj.onrender.com" ).replace(/\/$/, "");
export const WS_URL = ("wss://restaurantbackend-w0jj.onrender.com/ws" || API_URL.replace(/^http/, "ws") + "/ws").replace(/\/$/, "");

export const ORDER_STATUS_FLOW = ["new", "accepted", "preparing", "ready", "served", "paid"];
export const OWNER_HOME = "/app/dashboard";
