import React, { Component, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import QRCode from "qrcode";
import {
  Bell,
  ChefHat,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  ImagePlus,
  LayoutDashboard,
  LogIn,
  Minus,
  PencilLine,
  Plus,
  Printer,
  QrCode,
  ReceiptText,
  RefreshCw,
  Search,
  Sparkles,
  Timer,
  Upload,
  Users,
  Utensils,
} from "lucide-react";
import "./styles.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";
const WS = API.replace(/^http/, "ws") + "/ws";
const inputClass = "h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15";
const areaClass = "w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15";
const statusOrder = ["new", "accepted", "preparing", "ready", "served", "paid"];

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function createEmptyMenu() {
  return { categories: [], items: [] };
}

function normalizeMenu(value) {
  return {
    categories: asArray(value?.categories),
    items: asArray(value?.items),
  };
}

function createEmptyReports() {
  return { daily_sales: [], best_sellers: [], low_stock: [] };
}

function normalizeReports(value) {
  return {
    daily_sales: asArray(value?.daily_sales),
    best_sellers: asArray(value?.best_sellers),
    low_stock: asArray(value?.low_stock),
  };
}

function normalizeOrder(value) {
  if (!value || typeof value !== "object") return value;
  return { ...value, items: asArray(value.items) };
}

function normalizeOrders(value) {
  return asArray(value).map((item) => normalizeOrder(item));
}

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

function money(cents = 0) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(cents / 100);
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-KE", {
    hour: "numeric",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(date);
}

function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(API + path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    const text = await response.text();
    const data = text ? safeParseJSON(text) : null;
    if (!response.ok) {
      const message =
        (data && typeof data === "object" && "error" in data && data.error) ||
        (typeof data === "string" ? data : "") ||
        response.statusText ||
        "Request failed";
      throw new Error(message);
    }
    return data ?? {};
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Could not reach the API at ${API}. Start the backend and try again.`);
    }
    throw error;
  }
}

function priceInputToCents(value) {
  const normalized = String(value).replace(/,/g, "").trim();
  if (!normalized) return 0;
  const amount = Number(normalized);
  if (!Number.isFinite(amount)) return NaN;
  return Math.round(amount * 100);
}

function centsToPriceInput(cents = 0) {
  return (cents / 100).toFixed(2).replace(/\.00$/, "");
}

async function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function generateQRCodeDataURL(value, size = 240) {
  return QRCode.toDataURL(value, {
    width: size,
    margin: 1,
    color: {
      dark: "#0f3d2f",
      light: "#fffdf7",
    },
  });
}

function openPrintWindow(title, content) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1100,height=900");
  if (!printWindow) return;
  printWindow.document.write(`<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 32px;
            font-family: "Segoe UI", Arial, sans-serif;
            background: #f6f3ea;
            color: #13211d;
          }
          .sheet {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 24px;
          }
          .card {
            background: white;
            border: 1px solid #dde5de;
            border-radius: 28px;
            padding: 24px;
            box-shadow: 0 18px 45px rgba(16, 28, 24, 0.08);
            page-break-inside: avoid;
          }
          .eyebrow {
            color: #0f6b52;
            font-size: 12px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            font-weight: 700;
            margin: 0 0 8px;
          }
          h1 {
            margin: 0;
            font-size: 28px;
          }
          p {
            margin: 8px 0 0;
            color: #4c5b56;
          }
          img {
            display: block;
            width: 100%;
            max-width: 220px;
            margin: 18px auto;
            border-radius: 18px;
            border: 10px solid #f6f3ea;
          }
          .scan-url {
            word-break: break-word;
            font-size: 12px;
            padding: 12px 14px;
            border-radius: 16px;
            background: #f4f7f3;
            border: 1px solid #dde5de;
            margin-top: 16px;
          }
          .hint {
            margin-top: 14px;
            font-size: 13px;
            font-weight: 600;
            color: #815d1a;
          }
          @media print {
            body { padding: 0; background: white; }
          }
        </style>
      </head>
      <body>${content}</body>
    </html>`);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

function statusTone(status) {
  const colors = {
    available: "bg-emerald-100 text-emerald-800",
    occupied: "bg-orange-100 text-orange-800",
    reserved: "bg-blue-100 text-blue-800",
    cleaning: "bg-slate-200 text-slate-700",
    new: "bg-orange-100 text-orange-800",
    accepted: "bg-blue-100 text-blue-800",
    preparing: "bg-amber-100 text-amber-800",
    ready: "bg-emerald-100 text-emerald-800",
    served: "bg-slate-200 text-slate-700",
    paid: "bg-primary/15 text-primary",
    cancelled: "bg-red-100 text-red-700",
  };
  return colors[status] || "bg-muted text-slate-700";
}

function Button({ children, className = "", variant = "primary", type = "button", ...props }) {
  const styles = {
    primary: "bg-primary text-white hover:bg-emerald-900 shadow-[0_12px_28px_rgba(15,61,47,0.18)]",
    secondary: "bg-accent text-slate-950 hover:bg-orange-400 shadow-[0_10px_24px_rgba(226,126,30,0.24)]",
    ghost: "bg-transparent text-foreground hover:bg-muted",
    subtle: "bg-muted text-foreground hover:bg-slate-200",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  return (
    <button
      type={type}
      className={classNames(
        "inline-flex h-10 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55",
        styles[variant] || styles.primary,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Panel({ children, className = "" }) {
  return (
    <section className={classNames("rounded-[28px] border border-border bg-white/96 p-5 shadow-soft", className)}>
      {children}
    </section>
  );
}

function Notice({ title, children, tone = "neutral" }) {
  const styles =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-900"
      : tone === "success"
        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
        : "border-border bg-white text-foreground";
  return (
    <div className={classNames("rounded-[24px] border p-4 text-sm shadow-soft", styles)}>
      <p className="font-bold">{title}</p>
      {children ? <div className="mt-2 text-slate-700">{children}</div> : null}
    </div>
  );
}

function LoadingScreen({ label = "Loading QRDine..." }) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <Panel className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="font-bold">{label}</p>
      </Panel>
    </main>
  );
}

function StatusPill({ status, children }) {
  return (
    <span className={classNames("inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize", statusTone(status))}>
      {children || status}
    </span>
  );
}

function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">{eyebrow}</p> : null}
        <h2 className="mt-1 text-2xl font-bold text-foreground">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

function Metric({ label, value, hint }) {
  return (
    <Panel className="bg-[linear-gradient(135deg,rgba(15,61,47,0.04),rgba(226,126,30,0.08))]">
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </Panel>
  );
}

function EmptyState({ title, children }) {
  return (
    <Panel className="border-dashed bg-white/80 text-center">
      <p className="text-base font-bold">{title}</p>
      {children ? <p className="mt-2 text-sm text-slate-600">{children}</p> : null}
    </Panel>
  );
}

function useRealtime(enabled, onEvent) {
  const handlerRef = useRef(onEvent);
  useEffect(() => {
    handlerRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled) return undefined;
    const socket = new WebSocket(WS);
    socket.onmessage = (message) => {
      try {
        handlerRef.current(JSON.parse(message.data));
      } catch {
        // Ignore malformed realtime events. Polling still keeps the UI correct.
      }
    };
    socket.onerror = () => socket.close();
    return () => socket.close();
  }, [enabled]);
}

function useQrCode(value, size = 280) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let active = true;
    if (!value) {
      setSrc("");
      return undefined;
    }
    generateQRCodeDataURL(value, size)
      .then((data) => {
        if (active) setSrc(data);
      })
      .catch(() => {
        if (active) setSrc("");
      });
    return () => {
      active = false;
    };
  }, [size, value]);

  return src;
}

function MenuArtwork({ item, categoryName = "" }) {
  if (item?.image_url) {
    return <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />;
  }

  return (
    <div className="flex h-full w-full flex-col justify-between bg-[radial-gradient(circle_at_top_left,rgba(226,126,30,0.95),rgba(15,61,47,0.95))] p-5 text-white">
      <Sparkles size={18} className="opacity-80" />
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-white/80">{categoryName || "Chef's pick"}</p>
        <h3 className="mt-2 text-2xl font-bold leading-tight">{item?.name || "Signature Dish"}</h3>
      </div>
    </div>
  );
}

function StatusTimeline({ status }) {
  const currentIndex = Math.max(statusOrder.indexOf(status), 0);
  return (
    <div className="space-y-3">
      {statusOrder.map((step, index) => {
        const active = index <= currentIndex;
        const current = step === status;
        return (
          <div key={step} className="flex items-center gap-3">
            <div
              className={classNames(
                "grid h-8 w-8 place-items-center rounded-full border text-xs font-bold capitalize",
                active ? "border-primary bg-primary text-white" : "border-border bg-white text-slate-400",
              )}
            >
              {index + 1}
            </div>
            <div>
              <p className={classNames("text-sm font-semibold capitalize", current ? "text-foreground" : "text-slate-500")}>{step}</p>
              <p className="text-xs text-slate-500">{current ? "Current stage" : "Queued next"}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CustomerOrder({ tableToken }) {
  const [menu, setMenu] = useState(() => createEmptyMenu());
  const [table, setTable] = useState(null);
  const [cart, setCart] = useState([]);
  const [status, setStatus] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([request("/api/public/menu"), request(`/api/public/tables/${tableToken}`)])
      .then(([menuData, tableData]) => {
        if (!active) return;
        const nextMenu = normalizeMenu(menuData);
        setMenu(nextMenu);
        setTable(tableData);
        if (!activeCategory && nextMenu.categories[0]?.id) setActiveCategory(String(nextMenu.categories[0].id));
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tableToken]);

  useEffect(() => {
    if (activeCategory) return;
    if (menu.categories?.[0]?.id) setActiveCategory(String(menu.categories[0].id));
  }, [activeCategory, menu.categories]);

  useRealtime(Boolean(status), (event) => {
    if (event.type === "order.updated" && status?.id === event.data.id) {
      setStatus(normalizeOrder(event.data));
    }
  });

  const categoryMap = useMemo(
    () => Object.fromEntries(menu.categories.map((category) => [category.id, category])),
    [menu.categories],
  );

  const filteredItems = useMemo(() => {
    return menu.items.filter((item) => {
      const matchesCategory = !activeCategory || String(item.category_id) === String(activeCategory);
      const needle = search.trim().toLowerCase();
      const matchesSearch =
        !needle ||
        item.name.toLowerCase().includes(needle) ||
        item.description.toLowerCase().includes(needle);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, menu.items, search]);

  const total = cart.reduce((sum, item) => sum + item.price_cents * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  function add(item) {
    setCart((items) => {
      const existing = items.find((entry) => entry.id === item.id);
      if (existing) {
        return items.map((entry) =>
          entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry,
        );
      }
      return [...items, { ...item, quantity: 1, notes: "" }];
    });
  }

  function updateQuantity(id, delta) {
    setCart((items) =>
      items
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0),
    );
  }

  function updateNotes(id, notes) {
    setCart((items) => items.map((item) => (item.id === id ? { ...item, notes } : item)));
  }

  async function placeOrder() {
    if (!cart.length) return;
    setPlacing(true);
    try {
      const order = await request("/api/public/orders", {
        method: "POST",
        body: JSON.stringify({
          table_id: table?.id,
          customer_name: customerName.trim() || "Guest",
          source: "qr",
          items: cart.map((item) => ({
            menu_item_id: item.id,
            quantity: item.quantity,
            notes: item.notes,
          })),
        }),
      });
      setStatus(normalizeOrder(order));
      setCart([]);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  }

  if (loading) return <LoadingScreen label="Loading your table menu..." />;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,232,202,0.7),transparent_38%),linear-gradient(180deg,#fffdf7_0%,#f3eee4_100%)] text-foreground">
      <header className="relative overflow-hidden border-b border-border bg-white/85 backdrop-blur">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_top_right,rgba(226,126,30,0.18),transparent_32%),radial-gradient(circle_at_top_left,rgba(15,61,47,0.18),transparent_28%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1.2fr_360px] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Table {table?.number || "..."}</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Scan, browse, and send your order straight to the kitchen.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
              Explore the menu, add kitchen notes for each dish, and watch your order move live from acceptance to ready.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-slate-700">
              <span className="rounded-full bg-white px-4 py-2 shadow-soft">{menu.items.length} dishes live</span>
              <span className="rounded-full bg-white px-4 py-2 shadow-soft">{table?.seats || "-"} seats</span>
              <span className="rounded-full bg-white px-4 py-2 shadow-soft">{cartCount} items in cart</span>
            </div>
          </div>
          <Panel className="bg-[linear-gradient(160deg,rgba(15,61,47,0.95),rgba(20,86,67,0.92))] text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-100">Dining flow</p>
                <h2 className="mt-2 text-2xl font-bold">Your order, tracked in real time</h2>
              </div>
              <QrCode className="text-emerald-100" />
            </div>
            <p className="mt-4 text-sm text-emerald-50/90">
              Every QR is linked to one table, so the team knows where to deliver without you flagging anyone down.
            </p>
            {status ? (
              <div className="mt-5 rounded-[22px] bg-white/10 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold">Order #{status.id}</p>
                  <StatusPill status={status.status}>
                    <span className="text-current">{status.status}</span>
                  </StatusPill>
                </div>
                <StatusTimeline status={status.status} />
              </div>
            ) : (
              <div className="mt-5 rounded-[22px] bg-white/10 p-4 text-sm text-emerald-50/90">
                Once you place your order, this panel will update live as the team accepts, prepares, and finishes it.
              </div>
            )}
          </Panel>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {error ? (
            <Notice title="Ordering is temporarily unavailable" tone="danger">
              {error}
            </Notice>
          ) : null}

          <Panel className="overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(246,243,234,0.98))]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">Menu</p>
                <h2 className="text-2xl font-bold">Choose your dishes</h2>
              </div>
              <div className="relative w-full max-w-sm">
                <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  className={classNames(inputClass, "pl-11")}
                  placeholder="Search meals or drinks"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {menu.categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActiveCategory(String(category.id))}
                  className={classNames(
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    String(category.id) === String(activeCategory)
                      ? "bg-primary text-white shadow-[0_10px_24px_rgba(15,61,47,0.18)]"
                      : "bg-muted text-slate-700 hover:bg-slate-200",
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </Panel>

          {menu.categories.length === 0 ? (
            <EmptyState title="No dishes are active yet">The restaurant team still needs to publish the menu.</EmptyState>
          ) : null}

          {filteredItems.length === 0 && menu.categories.length > 0 ? (
            <EmptyState title="No dishes matched that search">Try another keyword or choose a different category.</EmptyState>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <Panel key={item.id} className="group overflow-hidden p-0">
                <div className="aspect-[4/3] overflow-hidden">
                  <MenuArtwork item={item} categoryName={categoryMap[item.category_id]?.name} />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
                        {categoryMap[item.category_id]?.name || "Menu"}
                      </p>
                      <h3 className="mt-1 text-xl font-bold leading-tight text-slate-950">{item.name}</h3>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-2 text-sm font-bold text-primary">
                      {money(item.price_cents)}
                    </span>
                  </div>
                  <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{item.description}</p>
                  <Button className="mt-5 w-full" onClick={() => add(item)}>
                    <Plus size={16} />
                    Add to order
                  </Button>
                </div>
              </Panel>
            ))}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-5 lg:self-start">
          <Panel className="bg-[linear-gradient(180deg,#ffffff_0%,#f8f4ec_100%)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <ReceiptText size={18} />
                  Your cart
                </h2>
                <p className="mt-1 text-sm text-slate-500">{cartCount} items selected</p>
              </div>
              <span className="rounded-full bg-accent/15 px-3 py-2 text-sm font-bold text-orange-800">{money(total)}</span>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Name for the order</label>
              <input
                className={inputClass}
                placeholder="Guest name"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
              />
            </div>

            <div className="mt-4 space-y-3">
              {cart.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-border bg-white/70 p-5 text-sm text-slate-600">
                  Add a few dishes and they will appear here with quantity controls and kitchen notes.
                </div>
              ) : null}

              {cart.map((item) => (
                <div key={item.id} className="rounded-[22px] border border-border bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-950">{item.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{money(item.price_cents)} each</p>
                    </div>
                    <p className="font-bold text-primary">{money(item.price_cents * item.quantity)}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-full border border-border bg-muted/80 p-1">
                      <button
                        type="button"
                        className="grid h-9 w-9 place-items-center rounded-full text-slate-700 transition hover:bg-white"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="min-w-10 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        type="button"
                        className="grid h-9 w-9 place-items-center rounded-full text-slate-700 transition hover:bg-white"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Kitchen note</span>
                  </div>
                  <input
                    className={classNames(inputClass, "mt-3 h-10")}
                    placeholder="No onions, extra spicy, split plate..."
                    value={item.notes}
                    onChange={(event) => updateNotes(item.id, event.target.value)}
                  />
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[22px] bg-slate-950 p-4 text-white">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Subtotal</span>
                <span>{money(total)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-slate-300">
                <span>VAT included</span>
                <span>{money(total * 16 / 116)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span>{money(total)}</span>
              </div>
            </div>

            <Button className="mt-5 h-12 w-full text-base" disabled={!cart.length || placing} onClick={placeOrder}>
              {placing ? "Sending order..." : "Send to kitchen"}
            </Button>
          </Panel>

          {status ? (
            <Panel className="bg-[linear-gradient(160deg,rgba(255,255,255,0.96),rgba(239,248,243,0.96))]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Live order status</p>
                  <h2 className="text-xl font-bold">Order #{status.id}</h2>
                </div>
                <StatusPill status={status.status} />
              </div>
              <div className="mt-4">
                <StatusTimeline status={status.status} />
              </div>
            </Panel>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("admin@qrdine.local");
  const [password, setPassword] = useState("Password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("qrdine-user", JSON.stringify(data.user));
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(226,126,30,0.22),transparent_25%),radial-gradient(circle_at_top_left,rgba(15,61,47,0.24),transparent_30%),linear-gradient(180deg,#fffdf7_0%,#f2ece2_100%)] px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.2fr_430px] lg:items-center">
        <div className="rounded-[34px] border border-white/70 bg-white/65 p-8 shadow-soft backdrop-blur sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Restaurant Control</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-bold tracking-tight text-slate-950">
            One place for table QR ordering, kitchen flow, and live service operations.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Admin can publish menu cards with food photos, generate table QR codes, and track every order from scan to payment.
          </p>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <Panel className="bg-white/90">
              <QrCode className="text-primary" />
              <p className="mt-3 font-bold">Table QR cards</p>
              <p className="mt-1 text-sm text-slate-600">Create, print, and place a code on every table.</p>
            </Panel>
            <Panel className="bg-white/90">
              <ImagePlus className="text-primary" />
              <p className="mt-3 font-bold">Visual menu</p>
              <p className="mt-1 text-sm text-slate-600">Add image-backed dishes customers can browse easily.</p>
            </Panel>
            <Panel className="bg-white/90">
              <Bell className="text-primary" />
              <p className="mt-3 font-bold">Live operations</p>
              <p className="mt-1 text-sm text-slate-600">See kitchen, floor, and billing updates as they happen.</p>
            </Panel>
          </div>
        </div>

        <Panel className="relative overflow-hidden p-7 sm:p-8">
          <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(135deg,rgba(15,61,47,0.08),rgba(226,126,30,0.14))]" />
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Staff login</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950">Sign in to QRDine</h2>
            <p className="mt-2 text-sm text-slate-600">Use the seeded admin account or any staff account you create later.</p>

            <div className="mt-5 rounded-[24px] border border-accent/25 bg-orange-50 p-4 text-sm">
              <p className="font-bold text-orange-900">Default admin login</p>
              <p className="mt-2 text-orange-800">
                Email: <code className="rounded bg-white/70 px-2 py-1 font-mono text-xs">admin@qrdine.local</code>
              </p>
              <p className="mt-1 text-orange-800">
                Password: <code className="rounded bg-white/70 px-2 py-1 font-mono text-xs">Password123</code>
              </p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={submit}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                <input
                  className={inputClass}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                <input
                  className={inputClass}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
              <Button className="h-12 w-full text-base" type="submit" disabled={loading}>
                <LogIn size={18} />
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </div>
        </Panel>
      </div>
    </main>
  );
}

function Kitchen({ orders, onRefresh }) {
  const active = orders.filter((order) => ["new", "accepted", "preparing"].includes(order.status));
  return (
    <div>
      <SectionHeader
        eyebrow="Kitchen"
        title="Live prep queue"
        description="New QR and floor orders appear here in real time for the kitchen team."
        action={
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary shadow-soft">
            <Bell size={16} />
            Live feed
          </div>
        }
      />
      {active.length === 0 ? (
        <EmptyState title="No active kitchen tickets">Once guests place orders, the queue will start filling automatically.</EmptyState>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {active.map((order) => (
          <OrderTicket key={order.id} order={order} onRefresh={onRefresh} />
        ))}
      </div>
    </div>
  );
}

function OrderTicket({ order, onRefresh }) {
  async function setStatus(status) {
    await request(`/api/orders/${order.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await onRefresh?.();
  }

  return (
    <Panel className="bg-[linear-gradient(180deg,#ffffff_0%,#f7f4ec_100%)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold">Order #{order.id}</h3>
          <p className="mt-1 text-sm text-slate-600">Table {order.table_number || order.table_id || "Walk-in"}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{order.source} order</p>
        </div>
        <StatusPill status={order.status} />
      </div>
      <div className="space-y-3">
        {order.items?.map((item) => (
          <div key={item.id} className="rounded-[22px] bg-white p-3 shadow-[inset_0_0_0_1px_rgba(221,229,222,0.8)]">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-slate-950">
                {item.quantity} x {item.menu_item_name}
              </p>
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{item.status}</span>
            </div>
            {item.notes ? <p className="mt-2 text-sm text-slate-600">{item.notes}</p> : null}
          </div>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <Button onClick={() => setStatus("accepted")}>
          <Timer size={16} />
          Accept
        </Button>
        <Button variant="secondary" onClick={() => setStatus("preparing")}>
          <ChefHat size={16} />
          Cook
        </Button>
        <Button variant="ghost" className="border border-border" onClick={() => setStatus("ready")}>
          Ready
        </Button>
      </div>
    </Panel>
  );
}

function Staff({ tables, orders, onRefresh }) {
  const outstanding = orders.filter((order) => !["paid", "cancelled"].includes(order.status));
  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <section>
        <SectionHeader
          eyebrow="Floor"
          title="Table readiness and QR links"
          description="View each table's scan destination and quickly open or print customer-facing cards."
        />
        {tables.length === 0 ? (
          <EmptyState title="No tables yet">Create tables from the Admin view and the QR cards will appear here automatically.</EmptyState>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          {tables.map((table) => (
            <TableCard key={table.id} table={table} compact />
          ))}
        </div>
      </section>
      <section>
        <SectionHeader
          eyebrow="Billing"
          title="Open bills and payments"
          description="Cashier and floor teams can mark completed orders as paid from here."
        />
        {outstanding.length === 0 ? (
          <EmptyState title="No open bills right now">Orders that still need collection will appear here.</EmptyState>
        ) : null}
        <div className="space-y-4">
          {outstanding.slice(0, 8).map((order) => (
            <Panel key={order.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold">Order #{order.id}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Table {order.table_number || order.table_id || "Walk-in"} • {money(order.total_cents)}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                    VAT {money(order.vat_cents)} included
                  </p>
                </div>
                <StatusPill status={order.status} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  onClick={async () => {
                    await request("/api/payments", {
                      method: "POST",
                      body: JSON.stringify({
                        order_id: order.id,
                        method: "cash",
                        amount_cents: order.total_cents,
                      }),
                    });
                    await request(`/api/orders/${order.id}/status`, {
                      method: "PATCH",
                      body: JSON.stringify({ status: "paid" }),
                    });
                    await onRefresh?.();
                  }}
                >
                  <CreditCard size={16} />
                  Mark as paid
                </Button>
              </div>
            </Panel>
          ))}
        </div>
      </section>
    </div>
  );
}

function TableCard({ table, compact = false }) {
  const qrSrc = useQrCode(table.qr_url, compact ? 220 : 320);

  async function copyLink() {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(table.qr_url);
  }

  function printCard() {
    if (!qrSrc) return;
    openPrintWindow(
      `Table ${table.number} QR Card`,
      `
      <div class="sheet">
        <article class="card">
          <p class="eyebrow">QRDine Table Card</p>
          <h1>Table ${escapeHtml(table.number)}</h1>
          <p>${escapeHtml(String(table.seats))} seats • Scan to open the live menu.</p>
          <img src="${escapeHtml(qrSrc)}" alt="QR code for table ${escapeHtml(table.number)}" />
          <div class="scan-url">${escapeHtml(table.qr_url)}</div>
          <p class="hint">Guests scan this code to open the customer ordering screen for this table.</p>
        </article>
      </div>`,
    );
  }

  return (
    <Panel className="overflow-hidden">
      <div className={classNames("grid gap-4", compact ? "sm:grid-cols-[160px_1fr]" : "lg:grid-cols-[220px_1fr]")}>
        <div className="rounded-[24px] bg-[linear-gradient(180deg,#f7f3ea_0%,#eef6f1_100%)] p-3">
          <div className="grid aspect-square place-items-center rounded-[18px] bg-white">
            {qrSrc ? (
              <img src={qrSrc} alt={`QR code for table ${table.number}`} className="h-full w-full rounded-[18px] object-contain p-3" />
            ) : (
              <div className="grid h-full w-full place-items-center rounded-[18px] bg-muted text-slate-400">
                <QrCode />
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Table QR</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-950">Table {table.number}</h3>
            </div>
            <StatusPill status={table.status} />
          </div>
          <p className="mt-2 text-sm text-slate-600">{table.seats} seats linked to one customer ordering page.</p>
          <div className="mt-4 rounded-[20px] bg-muted/70 p-3 text-xs break-all text-slate-600">{table.qr_url}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="ghost" className="border border-border" onClick={copyLink}>
              <Copy size={16} />
              Copy link
            </Button>
            <Button variant="ghost" className="border border-border" onClick={printCard} disabled={!qrSrc}>
              <Printer size={16} />
              Print card
            </Button>
            <a
              href={table.qr_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              <ExternalLink size={16} />
              Open
            </a>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function Admin({ reports, tables, orders, menu, onRefresh }) {
  const categories = asArray(menu?.categories);
  const menuItems = asArray(menu?.items);
  const reportSales = asArray(reports?.daily_sales);
  const reportBestSellers = asArray(reports?.best_sellers);
  const reportLowStock = asArray(reports?.low_stock);
  const tableList = asArray(tables);
  const orderList = asArray(orders);

  const [categoryForm, setCategoryForm] = useState({ name: "", sort_order: String(categories.length + 1 || 1) });
  const [tableForm, setTableForm] = useState({ number: "", seats: "4" });
  const [itemForm, setItemForm] = useState(emptyItemForm(categories[0]?.id));
  const [submitting, setSubmitting] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setCategoryForm((current) => ({
      ...current,
      sort_order: current.sort_order || String(categories.length + 1 || 1),
    }));
    setItemForm((current) => {
      if (current.category_id) return current;
      return emptyItemForm(categories[0]?.id);
    });
  }, [categories]);

  const revenue = useMemo(
    () => reportSales.reduce((sum, row) => sum + row.revenue_cents, 0),
    [reportSales],
  );

  const itemsByCategory = useMemo(() => {
    return categories.map((category) => ({
      ...category,
      items: menuItems.filter((item) => item.category_id === category.id),
    }));
  }, [categories, menuItems]);

  function updateItemField(key, value) {
    setItemForm((current) => ({ ...current, [key]: value }));
  }

  function resetItemForm() {
    setItemForm(emptyItemForm(categories[0]?.id));
  }

  async function submitCategory(event) {
    event.preventDefault();
    setSubmitting("category");
    setError("");
    setFeedback("");
    try {
      await request("/api/menu/categories", {
        method: "POST",
        body: JSON.stringify({
          name: categoryForm.name,
          sort_order: Number(categoryForm.sort_order) || categories.length + 1,
        }),
      });
      setCategoryForm({ name: "", sort_order: String(categories.length + 2) });
      setFeedback("Category added.");
      await onRefresh?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting("");
    }
  }

  async function submitTable(event) {
    event.preventDefault();
    setSubmitting("table");
    setError("");
    setFeedback("");
    try {
      await request("/api/tables", {
        method: "POST",
        body: JSON.stringify({
          number: tableForm.number,
          seats: Number(tableForm.seats),
        }),
      });
      setTableForm({ number: "", seats: "4" });
      setFeedback("Table created and QR link generated.");
      await onRefresh?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting("");
    }
  }

  async function submitItem(event) {
    event.preventDefault();
    setSubmitting("item");
    setError("");
    setFeedback("");
    try {
      const priceCents = priceInputToCents(itemForm.price);
      if (!Number.isFinite(priceCents)) {
        throw new Error("Enter a valid price.");
      }
      const payload = {
        category_id: Number(itemForm.category_id),
        name: itemForm.name,
        description: itemForm.description,
        price_cents: priceCents,
        image_url: itemForm.image_url,
        active: itemForm.active,
      };
      if (itemForm.id) {
        await request(`/api/menu/items/${itemForm.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setFeedback("Menu item updated.");
      } else {
        await request("/api/menu/items", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setFeedback("Menu item created.");
      }
      resetItemForm();
      await onRefresh?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting("");
    }
  }

  async function uploadImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataURL(file);
      updateItemField("image_url", dataUrl);
      setFeedback("Food image attached to the form.");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(item) {
    setItemForm({
      id: item.id,
      category_id: String(item.category_id),
      name: item.name,
      description: item.description,
      price: centsToPriceInput(item.price_cents),
      image_url: item.image_url,
      active: item.active,
    });
    setFeedback("");
    setError("");
  }

  async function toggleItem(item) {
    setSubmitting(`toggle-${item.id}`);
    setError("");
    setFeedback("");
    try {
      await request(`/api/menu/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          category_id: item.category_id,
          name: item.name,
          description: item.description,
          price_cents: item.price_cents,
          image_url: item.image_url,
          active: !item.active,
        }),
      });
      setFeedback(`${item.name} ${item.active ? "hidden" : "published"} for customers.`);
      await onRefresh?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting("");
    }
  }

  async function printAllTableCards() {
    const cards = await Promise.all(
      tableList.map(async (table) => ({
        ...table,
        qrSrc: await generateQRCodeDataURL(table.qr_url, 300),
      })),
    );
    openPrintWindow(
      "QRDine Table Cards",
      `<div class="sheet">
        ${cards
          .map(
            (table) => `
              <article class="card">
                <p class="eyebrow">QRDine Table Card</p>
                <h1>Table ${escapeHtml(table.number)}</h1>
                <p>${escapeHtml(String(table.seats))} seats • Guests scan to open the menu for this exact table.</p>
                <img src="${escapeHtml(table.qrSrc)}" alt="QR code for table ${escapeHtml(table.number)}" />
                <div class="scan-url">${escapeHtml(table.qr_url)}</div>
                <p class="hint">Place this card on the table or near the bill holder.</p>
              </article>`,
          )
          .join("")}
      </div>`,
    );
  }

  async function downloadCSV() {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API}/api/reports/sales.csv`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "qrdine-sales.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Revenue" value={money(revenue)} hint="Served and paid orders" />
        <Metric label="Tables" value={tableList.length} hint="QR-ready dining spots" />
        <Metric label="Menu items" value={menuItems.length} hint="Draft and published dishes" />
        <Metric label="Open orders" value={orderList.filter((order) => order.status !== "paid").length} hint="Needs kitchen or cashier action" />
      </div>

      {error ? (
        <Notice title="Something needs attention" tone="danger">
          {error}
        </Notice>
      ) : null}
      {feedback ? (
        <Notice title="Update saved" tone="success">
          {feedback}
        </Notice>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <Panel>
            <SectionHeader
              eyebrow="QR Studio"
              title="Create and print table QR cards"
              description="Each table gets a unique scan destination that opens the customer menu for that table."
              action={
                <Button variant="ghost" className="border border-border" onClick={printAllTableCards} disabled={!tableList.length}>
                  <Printer size={16} />
                  Print all cards
                </Button>
              }
            />
            <form className="grid gap-3 md:grid-cols-[1fr_120px_auto]" onSubmit={submitTable}>
              <input
                className={inputClass}
                placeholder="Table number"
                value={tableForm.number}
                onChange={(event) => setTableForm((current) => ({ ...current, number: event.target.value }))}
              />
              <input
                className={inputClass}
                type="number"
                min="1"
                placeholder="Seats"
                value={tableForm.seats}
                onChange={(event) => setTableForm((current) => ({ ...current, seats: event.target.value }))}
              />
              <Button type="submit" disabled={submitting === "table"}>
                <Plus size={16} />
                {submitting === "table" ? "Creating..." : "Add table"}
              </Button>
            </form>
            <div className="mt-5 grid gap-4">
              {tableList.length === 0 ? <EmptyState title="No table QR cards yet">Create your first table above.</EmptyState> : null}
              {tableList.map((table) => (
                <TableCard key={table.id} table={table} />
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionHeader
              eyebrow="Categories"
              title="Organize the menu"
              description="Create customer-facing sections like Breakfast, Signature Plates, Drinks, or Desserts."
            />
            <form className="grid gap-3 md:grid-cols-[1fr_140px_auto]" onSubmit={submitCategory}>
              <input
                className={inputClass}
                placeholder="Category name"
                value={categoryForm.name}
                onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
              />
              <input
                className={inputClass}
                type="number"
                min="0"
                placeholder="Order"
                value={categoryForm.sort_order}
                onChange={(event) => setCategoryForm((current) => ({ ...current, sort_order: event.target.value }))}
              />
              <Button type="submit" disabled={submitting === "category"}>
                <Plus size={16} />
                {submitting === "category" ? "Adding..." : "Add category"}
              </Button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((category) => (
                <span key={category.id} className="rounded-full bg-muted px-4 py-2 text-sm font-semibold text-slate-700">
                  {category.name}
                </span>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel>
            <SectionHeader
              eyebrow="Menu Studio"
              title={itemForm.id ? "Edit menu item" : "Create a menu card"}
              description="Upload a food photo or paste an image URL, then publish the dish to the customer ordering screen."
            />
            <form className="space-y-4" onSubmit={submitItem}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Category</label>
                  <select
                    className={inputClass}
                    value={itemForm.category_id}
                    onChange={(event) => updateItemField("category_id", event.target.value)}
                  >
                    <option value="">Choose category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Price (KES)</label>
                  <input
                    className={inputClass}
                    placeholder="1450"
                    value={itemForm.price}
                    onChange={(event) => updateItemField("price", event.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Dish name</label>
                <input
                  className={inputClass}
                  placeholder="Grilled Chicken Pilau"
                  value={itemForm.name}
                  onChange={(event) => updateItemField("name", event.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
                <textarea
                  className={areaClass}
                  rows="4"
                  placeholder="A short customer-friendly description..."
                  value={itemForm.description}
                  onChange={(event) => updateItemField("description", event.target.value)}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Image URL or uploaded image</label>
                  <input
                    className={inputClass}
                    placeholder="https://... or upload below"
                    value={itemForm.image_url}
                    onChange={(event) => updateItemField("image_url", event.target.value)}
                  />
                  <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-border bg-white px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-muted">
                    <Upload size={16} />
                    Upload food image
                    <input type="file" accept="image/*" className="hidden" onChange={uploadImage} />
                  </label>
                </div>
                <div className="overflow-hidden rounded-[24px] border border-border bg-white">
                  <div className="aspect-[4/3] overflow-hidden">
                    <MenuArtwork item={itemForm} categoryName={categories.find((item) => String(item.id) === String(itemForm.category_id))?.name} />
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-slate-950">{itemForm.name || "Dish preview"}</p>
                    <p className="mt-1 text-sm text-slate-500">{itemForm.description || "This live preview mirrors the customer card layout."}</p>
                  </div>
                </div>
              </div>

              <label className="inline-flex items-center gap-3 rounded-2xl bg-muted/80 px-4 py-3 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={itemForm.active}
                  onChange={(event) => updateItemField("active", event.target.checked)}
                />
                Publish this dish to customers immediately
              </label>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={submitting === "item"}>
                  <ImagePlus size={16} />
                  {submitting === "item" ? "Saving..." : itemForm.id ? "Save changes" : "Create menu item"}
                </Button>
                {itemForm.id ? (
                  <Button variant="ghost" className="border border-border" onClick={resetItemForm}>
                    Cancel edit
                  </Button>
                ) : null}
              </div>
            </form>
          </Panel>

          <Panel>
            <SectionHeader
              eyebrow="Published Menu"
              title="Customer-facing cards"
              description="These are the menu cards guests see after scanning a table QR."
            />
            <div className="space-y-5">
              {itemsByCategory.map((category) => (
                <div key={category.id}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-bold">{category.name}</h3>
                    <span className="text-sm text-slate-500">{category.items.length} items</span>
                  </div>
                  {category.items.length === 0 ? (
                    <div className="rounded-[22px] border border-dashed border-border bg-white/80 p-4 text-sm text-slate-500">
                      No items in this category yet.
                    </div>
                  ) : null}
                  <div className="grid gap-4 md:grid-cols-2">
                    {category.items.map((item) => (
                      <Panel key={item.id} className="overflow-hidden p-0">
                        <div className="aspect-[4/3] overflow-hidden">
                          <MenuArtwork item={item} categoryName={category.name} />
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-lg font-bold text-slate-950">{item.name}</h4>
                              <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                            </div>
                            <StatusPill status={item.active ? "ready" : "cancelled"}>
                              {item.active ? "Live" : "Hidden"}
                            </StatusPill>
                          </div>
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-primary/10 px-3 py-2 text-sm font-bold text-primary">
                              {money(item.price_cents)}
                            </span>
                            <Button variant="ghost" className="border border-border" onClick={() => startEdit(item)}>
                              <PencilLine size={16} />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              className="border border-border"
                              onClick={() => toggleItem(item)}
                              disabled={submitting === `toggle-${item.id}`}
                            >
                              {item.active ? "Hide" : "Publish"}
                            </Button>
                          </div>
                        </div>
                      </Panel>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel>
              <SectionHeader
                eyebrow="Reports"
                title="Best-selling items"
                description="Use sales data to decide what to feature on the menu."
                action={
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
                    onClick={downloadCSV}
                  >
                    <Download size={16} />
                    Sales CSV
                  </button>
                }
              />
              <div className="space-y-3">
                {reportBestSellers.length === 0 ? (
                  <p className="text-sm text-slate-600">Sales will populate after a few completed orders.</p>
                ) : null}
                {reportBestSellers.map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-[18px] bg-muted/70 px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-950">{item.name}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.quantity} sold</p>
                    </div>
                    <p className="font-bold text-primary">{money(item.revenue_cents)}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel>
              <SectionHeader
                eyebrow="Inventory"
                title="Low-stock alerts"
                description="Ingredients at or below their threshold appear here."
              />
              <div className="space-y-3">
                {reportLowStock.length === 0 ? (
                  <p className="text-sm text-slate-600">No low-stock ingredients at the moment.</p>
                ) : null}
                {reportLowStock.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-[18px] bg-muted/70 px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-950">{item.name}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Reorder threshold {item.low_stock_qty} {item.unit}
                      </p>
                    </div>
                    <p className="font-bold text-orange-800">
                      {item.stock_qty} {item.unit}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

function emptyItemForm(categoryId) {
  return {
    id: null,
    category_id: categoryId ? String(categoryId) : "",
    name: "",
    description: "",
    price: "",
    image_url: "",
    active: true,
  };
}

function StaffApp() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("qrdine-user") || "null");
    } catch {
      return null;
    }
  });
  const [view, setView] = useState("kitchen");
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [reports, setReports] = useState(() => createEmptyReports());
  const [menu, setMenu] = useState(() => createEmptyMenu());
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("qrdine-user");
    setToken("");
    setUser(null);
    setOrders([]);
    setTables([]);
    setMenu(createEmptyMenu());
    setReports(createEmptyReports());
    setError("");
  }, []);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem("token")) return;
    setLoading(true);
    try {
      const [sessionData, orderData, tableData, reportData, menuData] = await Promise.all([
        request("/api/me"),
        request("/api/orders"),
        request("/api/tables"),
        request("/api/reports/summary"),
        request("/api/menu"),
      ]);
      setUser((current) => {
        const nextUser = {
          ...(current || {}),
          email: sessionData.email,
          role: sessionData.role,
          id: sessionData.user_id,
        };
        localStorage.setItem("qrdine-user", JSON.stringify(nextUser));
        return nextUser;
      });
      setOrders(normalizeOrders(orderData));
      setTables(asArray(tableData));
      setReports(normalizeReports(reportData));
      setMenu(normalizeMenu(menuData));
      setError("");
    } catch (err) {
      setError(err.message);
      if (/token|unauthorized|bearer/i.test(err.message)) logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    refresh();
  }, [refresh, token]);

  useRealtime(Boolean(token), (event) => {
    if (event.type.startsWith("order.") || event.type.startsWith("payment.") || event.type.startsWith("table.")) {
      refresh();
    }
  });

  if (!token) {
    return (
      <Login
        onLogin={(session) => {
          setToken(session.token);
          setUser(session.user);
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffdf7_0%,#f4efe5_100%)]">
      <header className="sticky top-0 z-20 border-b border-border bg-white/88 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-white shadow-[0_10px_24px_rgba(15,61,47,0.18)]">
              <Utensils size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-950">QRDine</h1>
              <p className="text-sm text-slate-500">
                {user?.email || "Signed in"} {user?.role ? `• ${user.role}` : ""}
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            {[
              ["kitchen", ChefHat, "Kitchen"],
              ["staff", Users, "Floor"],
              ["admin", LayoutDashboard, "Admin"],
            ].map(([id, Icon, label]) => (
              <Button key={id} variant={view === id ? "primary" : "ghost"} onClick={() => setView(id)}>
                <Icon size={16} />
                {label}
              </Button>
            ))}
            <Button variant="ghost" className="border border-border" onClick={refresh}>
              <RefreshCw size={16} />
              Refresh
            </Button>
            <Button variant="ghost" className="border border-border" onClick={logout}>
              Logout
            </Button>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {error ? (
          <div className="mb-5">
            <Notice title="QRDine API needs attention" tone="danger">
              {error}
            </Notice>
          </div>
        ) : null}
        {loading && orders.length === 0 && tables.length === 0 ? (
          <Panel className="mb-5 flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <span className="text-sm font-semibold">Loading live restaurant data...</span>
          </Panel>
        ) : null}

        {view === "kitchen" && <Kitchen orders={orders} onRefresh={refresh} />}
        {view === "staff" && <Staff tables={tables} orders={orders} onRefresh={refresh} />}
        {view === "admin" && <Admin reports={reports} tables={tables} orders={orders} menu={menu} onRefresh={refresh} />}
      </div>
    </main>
  );
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="grid min-h-screen place-items-center bg-background px-4">
          <Notice title="QRDine could not render this screen" tone="danger">
            {this.state.error.message}
          </Notice>
        </main>
      );
    }
    return this.props.children;
  }
}

function App() {
  const orderMatch = location.pathname.match(/^\/order\/([^/]+)$/);
  if (orderMatch) return <CustomerOrder tableToken={orderMatch[1]} />;
  return <StaffApp />;
}

createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
