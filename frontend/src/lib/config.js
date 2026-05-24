export const API_URL = ("https://restaurantbackend-w0jj.onrender.com" || "http://localhost:8080").replace(/\/$/, "");
export const WS_URL = (import.meta.env.VITE_WS_URL || API_URL.replace(/^http/, "ws") + "/ws").replace(/\/$/, "");

export const ORDER_STATUS_FLOW = ["new", "accepted", "preparing", "ready", "served", "paid"];

export const ROLE_HOME = {
  admin: "/app/admin",
  manager: "/app/admin",
  chef: "/app/chef",
  waiter: "/app/waiter",
  cashier: "/app/cashier",
};

export const STAFF_ROLES = ["admin", "manager", "chef", "waiter", "cashier"];
