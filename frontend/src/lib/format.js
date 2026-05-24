import clsx from "clsx";

export function cn(...values) {
  return clsx(values);
}

export function money(cents = 0) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format((Number(cents) || 0) / 100);
}

export function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-KE", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatTimeOnly(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-KE", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatElapsed(fromDate) {
  if (!fromDate) return "0 min";
  const from = new Date(fromDate).getTime();
  if (Number.isNaN(from)) return "0 min";
  const minutes = Math.max(0, Math.round((Date.now() - from) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours}h ${remaining}m`;
}

export function orderStatusLabel(status) {
  const key = String(status || "").toLowerCase();
  switch (key) {
    case "new":
      return "Pending";
    case "accepted":
      return "Accepted";
    case "preparing":
      return "Preparing";
    case "ready":
      return "Ready";
    case "served":
      return "Completed";
    case "paid":
      return "Paid";
    case "cancelled":
      return "Cancelled";
    default:
      return key || "Unknown";
  }
}

export function paymentStatusLabel(status) {
  const key = String(status || "").toLowerCase();
  switch (key) {
    case "unpaid":
      return "Awaiting payment";
    case "pending":
      return "Payment pending";
    case "paid":
      return "Paid";
    case "failed":
      return "Payment failed";
    default:
      return key || "Unknown";
  }
}

export function paymentMethodLabel(method) {
  switch (String(method || "").toLowerCase()) {
    case "mpesa":
      return "M-Pesa";
    case "cash":
      return "Cash";
    default:
      return method || "Unknown";
  }
}

export function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function toPriceCents(value) {
  const amount = Number(String(value || "").replace(/,/g, "").trim());
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

export function fromPriceCents(value) {
  return ((Number(value) || 0) / 100).toFixed(2).replace(/\.00$/, "");
}

export async function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}
