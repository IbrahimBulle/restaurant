import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  Boxes,
  Copy,
  CreditCard,
  ExternalLink,
  Home,
  ImagePlus,
  LayoutGrid,
  Package,
  Pencil,
  Printer,
  QrCode,
  ReceiptText,
  Search,
  Settings2,
  ShoppingBag,
  Smartphone,
  Store,
  Tag,
  Trash2,
  Wallet,
} from "lucide-react";

import { useQrCode } from "../hooks/useQrCode";
import { cn, formatDateTime, fromPriceCents, money, paymentMethodLabel, paymentStatusLabel, readFileAsDataUrl, toPriceCents } from "../lib/format";
import { escapeHtml, openPrintWindow } from "../lib/print";
import { Button, EmptyState, MetricCard, Notice, Panel, SectionHeading, StatusBadge } from "./ui";

const sectionMeta = {
  overview: { label: "Home", title: "Overview", icon: Home },
  orders: { label: "Orders", title: "Orders", icon: ShoppingBag },
  products: { label: "Products", title: "Products", icon: Package },
  inventory: { label: "Stock", title: "Inventory", icon: Boxes },
  more: { label: "More", title: "More", icon: LayoutGrid },
  qr: { label: "QR", title: "QR", icon: QrCode },
  payments: { label: "Payments", title: "Payments", icon: Wallet },
  analytics: { label: "Analytics", title: "Analytics", icon: BarChart3 },
  receipts: { label: "Receipts", title: "Receipts", icon: ReceiptText },
  settings: { label: "Settings", title: "Settings", icon: Settings2 },
};

export const desktopSections = ["overview", "orders", "products", "inventory", "qr", "payments", "analytics", "receipts", "settings"];
export const mobileSections = ["overview", "orders", "products", "inventory", "more"];
export const moreSections = ["qr", "payments", "analytics", "receipts", "settings"];

export function DesktopSidebar({ activeSection, businessName, onNavigate }) {
  return (
    <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:rounded-[32px] lg:border lg:border-white/70 lg:bg-white/88 lg:p-5 lg:shadow-soft lg:backdrop-blur">
      <div className="rounded-[28px] bg-[linear-gradient(160deg,rgba(15,61,47,0.98),rgba(20,86,67,0.94))] p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/12">
            <Store size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-100">MauzoHub</p>
            <h1 className="mt-1 text-xl font-bold">{businessName || "Your business"}</h1>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-emerald-50/85">
          One fast dashboard for products, orders, payments, QR ordering, inventory, and receipts.
        </p>
      </div>

      <nav className="mt-5 space-y-2">
        {desktopSections.map((section) => {
          const Icon = sectionMeta[section].icon;
          const selected = section === activeSection;
          return (
            <button
              key={section}
              type="button"
              onClick={() => onNavigate(section)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition",
                selected ? "bg-primary text-white shadow-[0_14px_28px_rgba(15,61,47,0.2)]" : "text-slate-700 hover:bg-muted",
              )}
            >
              <Icon size={18} />
              <span>{sectionMeta[section].title}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileBottomNav({ activeSection, onNavigate }) {
  const current = mobileSections.includes(activeSection) ? activeSection : "more";
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/70 bg-white/92 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-18px_48px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {mobileSections.map((section) => {
          const Icon = sectionMeta[section].icon;
          const selected = current === section;
          return (
            <button
              key={section}
              type="button"
              onClick={() => onNavigate(section)}
              className={cn(
                "flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] font-semibold transition",
                selected ? "bg-primary text-white" : "text-slate-500 hover:bg-muted",
              )}
            >
              <Icon size={18} />
              <span className="mt-1">{sectionMeta[section].label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function SecondarySectionNav({ activeSection, onNavigate }) {
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
      {moreSections.map((section) => (
        <button
          key={section}
          type="button"
          onClick={() => onNavigate(section)}
          className={cn(
            "whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition",
            activeSection === section ? "bg-primary text-white" : "bg-white text-slate-600 shadow-soft hover:bg-muted",
          )}
        >
          {sectionMeta[section].title}
        </button>
      ))}
    </div>
  );
}

export function MoreBoard({ onNavigate }) {
  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="More tools"
        title="Everything else you need"
        description="Jump into QR order points, payments, analytics, receipts, and business settings."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {moreSections.map((section) => {
          const Icon = sectionMeta[section].icon;
          return (
            <button
              key={section}
              type="button"
              onClick={() => onNavigate(section)}
              className="rounded-[28px] border border-border bg-white p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(15,23,42,0.08)]"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon size={20} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-950">{sectionMeta[section].title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {section === "qr" ? "Create order points and print QR codes." : null}
                {section === "payments" ? "Track cash and M-Pesa collections." : null}
                {section === "analytics" ? "See sales and profit trends fast." : null}
                {section === "receipts" ? "Print and review settled receipts." : null}
                {section === "settings" ? "Set business name, phone, and receipt footer." : null}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function OverviewBoard({ dashboard, onNavigate }) {
  const business = dashboard?.business || {};
  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Business overview"
        title={business.business_name || "Your business at a glance"}
        description="Daily sales, live orders, low stock, and quick actions in one fast owner screen."
        action={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => onNavigate("products")}>Add product</Button>
            <Button size="sm" variant="ghost" className="border border-border" onClick={() => onNavigate("qr")}>Create QR point</Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Today revenue" value={money(dashboard?.daily_revenue_cents)} hint={`${dashboard?.paid_orders_today || 0} paid orders today`} />
        <MetricCard label="Today profit" value={money(dashboard?.daily_profit_cents)} hint="Estimated using selling price minus cost" />
        <MetricCard label="Open orders" value={dashboard?.open_orders || 0} hint={`${dashboard?.active_order_points || 0} active order points`} />
        <MetricCard label="Live products" value={dashboard?.products_count || 0} hint="Active items in your catalog" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">Recent orders</p>
              <h3 className="text-2xl font-bold text-slate-950">What needs attention now</h3>
            </div>
            <Button size="sm" variant="ghost" className="border border-border" onClick={() => onNavigate("orders")}>
              Open orders
            </Button>
          </div>
          <div className="mt-5 space-y-3">
            {(dashboard?.recent_orders || []).length === 0 ? <p className="text-sm text-slate-500">Orders will appear here as soon as customers buy.</p> : null}
            {(dashboard?.recent_orders || []).slice(0, 5).map((order) => (
              <div key={order.id} className="rounded-[22px] bg-muted/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">
                      Order #{order.id} {order.table_number ? `• ${order.table_number}` : ""}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {order.items?.length || 0} items • {money(order.total_cents)}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                      Updated {formatDateTime(order.updated_at)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={order.status} />
                    <StatusBadge status={order.payment_status} kind="payment" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">Low stock</p>
              <h3 className="text-2xl font-bold text-slate-950">Restock soon</h3>
            </div>
            <Button size="sm" variant="ghost" className="border border-border" onClick={() => onNavigate("inventory")}>
              Inventory
            </Button>
          </div>
          <div className="mt-5 space-y-3">
            {(dashboard?.low_stock_products || []).length === 0 ? <p className="text-sm text-slate-500">No stock alerts right now.</p> : null}
            {(dashboard?.low_stock_products || []).map((product) => (
              <div key={product.id} className="rounded-[22px] bg-muted/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{product.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {product.stock_qty} {product.unit} left
                    </p>
                  </div>
                  <p className="text-sm font-bold text-orange-800">Reorder at {product.reorder_level} {product.unit}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">Best sellers</p>
              <h3 className="text-2xl font-bold text-slate-950">Top movers</h3>
            </div>
            <Tag className="text-primary" />
          </div>
          <div className="mt-5 space-y-3">
            {(dashboard?.best_sellers || []).length === 0 ? <p className="text-sm text-slate-500">Best sellers will appear after your first sales.</p> : null}
            {(dashboard?.best_sellers || []).slice(0, 5).map((item) => (
              <div key={item.name} className="rounded-[22px] bg-muted/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{item.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.quantity} sold</p>
                  </div>
                  <p className="font-bold text-primary">{money(item.revenue_cents)}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">Payment mix</p>
              <h3 className="text-2xl font-bold text-slate-950">How customers pay</h3>
            </div>
            <CreditCard className="text-primary" />
          </div>
          <div className="mt-5 space-y-4">
            {(dashboard?.payment_methods || []).length === 0 ? <p className="text-sm text-slate-500">Payments will show up here once orders are settled.</p> : null}
            {(dashboard?.payment_methods || []).map((payment) => (
              <div key={payment.method}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-slate-950">{paymentMethodLabel(payment.method)}</span>
                  <span className="text-slate-500">{money(payment.revenue_cents)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${Math.min(100, Math.max(12, (payment.count / Math.max(1, dashboard.payment_methods[0]?.count || 1)) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function OrdersBoard({ orders, onStatus, onCashPaid, onConfirmMpesa, onPrintReceipt }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesFilter = filter === "all" || order.status === filter || (filter === "unpaid" && order.payment_status !== "paid");
      const matchesQuery =
        !needle ||
        String(order.id).includes(needle) ||
        String(order.table_number || "").toLowerCase().includes(needle) ||
        String(order.customer_name || "").toLowerCase().includes(needle);
      return matchesFilter && matchesQuery;
    });
  }, [filter, orders, query]);

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Orders"
        title="Live customer orders"
        description="Manage new, preparing, ready, completed, and paid orders from one screen."
      />

      <Panel>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {["all", "new", "preparing", "ready", "served", "unpaid", "paid"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  filter === status ? "bg-primary text-white" : "bg-muted text-slate-700 hover:bg-slate-200",
                )}
              >
                {status === "all" ? "All" : status === "served" ? "Completed" : status === "unpaid" ? "Awaiting payment" : status.replace(/^\w/, (char) => char.toUpperCase())}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="h-11 w-full rounded-2xl border border-border bg-white pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="Search order or order point"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
      </Panel>

      {filtered.length === 0 ? <EmptyState title="No orders matched that filter">Try another order status or search term.</EmptyState> : null}
      <div className="space-y-4">
        {filtered.map((order) => (
          <OrderCard key={order.id} order={order} onStatus={onStatus} onCashPaid={onCashPaid} onConfirmMpesa={onConfirmMpesa} onPrintReceipt={onPrintReceipt} />
        ))}
      </div>
    </div>
  );
}

function OrderCard({ order, onStatus, onCashPaid, onConfirmMpesa, onPrintReceipt }) {
  const pendingMpesa = order.payments?.find((payment) => payment.method === "mpesa" && payment.status !== "paid");
  const actions = [
    ["new", "Pending"],
    ["preparing", "Preparing"],
    ["ready", "Ready"],
    ["served", "Completed"],
    ["paid", "Paid"],
  ];

  return (
    <Panel>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xl font-bold text-slate-950">Order #{order.id}</p>
            <StatusBadge status={order.status} />
            <StatusBadge status={order.payment_status} kind="payment" />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {order.table_number ? `Order point ${order.table_number}` : "Walk-in"} • {order.customer_name || "Guest"} • {money(order.total_cents)}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">Updated {formatDateTime(order.updated_at)}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(order.items || []).map((item) => (
              <div key={item.id} className="rounded-[20px] bg-muted/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-950">
                    {item.quantity} x {item.menu_item_name}
                  </p>
                  <p className="text-sm font-bold text-primary">{money(item.quantity * item.unit_price_cents)}</p>
                </div>
                {item.notes ? <p className="mt-2 text-sm text-slate-600">{item.notes}</p> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="w-full xl:w-72">
          <div className="grid grid-cols-2 gap-2">
            {actions.map(([status, label]) => (
              <Button
                key={status}
                size="sm"
                variant={order.status === status ? "primary" : "ghost"}
                className={cn(order.status !== status && "border border-border")}
                onClick={() => onStatus(order.id, status)}
              >
                {label}
              </Button>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            {order.payment_status !== "paid" ? (
              <Button size="sm" className="w-full" onClick={() => onCashPaid(order.id, order.total_cents)}>
                <CreditCard size={16} />
                Mark cash paid
              </Button>
            ) : null}
            {pendingMpesa ? (
              <Button size="sm" variant="ghost" className="w-full border border-border" onClick={() => onConfirmMpesa(pendingMpesa.id)}>
                <Smartphone size={16} />
                Confirm M-Pesa
              </Button>
            ) : null}
            {order.receipt ? (
              <Button size="sm" variant="ghost" className="w-full border border-border" onClick={() => onPrintReceipt(order)}>
                <Printer size={16} />
                Print receipt
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function ProductsBoard({ products, categories, onCreateCategory, onSaveProduct, onArchiveProduct }) {
  const [categoryForm, setCategoryForm] = useState({ name: "", sort_order: String(categories.length + 1 || 1) });
  const [productForm, setProductForm] = useState(makeProductForm(categories[0]));
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setCategoryForm((current) => ({ ...current, sort_order: current.sort_order || String(categories.length + 1 || 1) }));
    setProductForm((current) => ({
      ...current,
      category_id: current.category_id || String(categories[0]?.id || ""),
    }));
  }, [categories]);

  const visibleProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      if (!needle) return true;
      return [product.name, product.category_name, product.sku, product.item_type].some((value) =>
        String(value || "").toLowerCase().includes(needle),
      );
    });
  }, [products, query]);

  async function submitCategory(event) {
    event.preventDefault();
    setSubmitting("category");
    setError("");
    setFeedback("");
    try {
      await onCreateCategory({
        name: categoryForm.name,
        sort_order: Number(categoryForm.sort_order) || categories.length + 1,
      });
      setCategoryForm({ name: "", sort_order: String(categories.length + 2) });
      setFeedback("Category saved.");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting("");
    }
  }

  async function submitProduct(event) {
    event.preventDefault();
    setSubmitting("product");
    setError("");
    setFeedback("");
    try {
      await onSaveProduct(editingId, {
        category_id: Number(productForm.category_id),
        name: productForm.name,
        description: productForm.description,
        price_cents: toPriceCents(productForm.price),
        cost_cents: toPriceCents(productForm.cost),
        image_url: productForm.image_url,
        sku: productForm.sku,
        item_type: productForm.item_type,
        sort_order: Number(productForm.sort_order) || 0,
        stock_qty: Number(productForm.stock_qty) || 0,
        reorder_level: Number(productForm.reorder_level) || 0,
        unit: productForm.unit || "pcs",
        track_stock: productForm.track_stock,
        active: productForm.active,
      });
      setFeedback(editingId ? "Product updated." : "Product created.");
      setEditingId(null);
      setProductForm(makeProductForm(categories[0]));
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting("");
    }
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const imageUrl = await readFileAsDataUrl(file);
    setProductForm((current) => ({ ...current, image_url: imageUrl }));
  }

  function editProduct(product) {
    setEditingId(product.id);
    setProductForm({
      category_id: String(product.category_id),
      name: product.name,
      description: product.description,
      price: fromPriceCents(product.price_cents),
      cost: fromPriceCents(product.cost_cents),
      image_url: product.image_url,
      sku: product.sku,
      item_type: product.item_type || "food",
      sort_order: String(product.sort_order || 0),
      stock_qty: String(product.stock_qty ?? 0),
      reorder_level: String(product.reorder_level ?? 0),
      unit: product.unit || "pcs",
      track_stock: Boolean(product.track_stock),
      active: Boolean(product.active),
    });
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Products"
        title="Manage what you sell"
        description="Add food, drinks, retail items, or services with prices, costs, images, and stock levels."
      />

      {feedback ? <Notice title="Saved" tone="success">{feedback}</Notice> : null}
      {error ? <Notice title="Could not save changes" tone="danger">{error}</Notice> : null}

      <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <Panel>
          <form onSubmit={submitCategory}>
            <SectionHeading eyebrow="Categories" title="Create a category" description="Keep products grouped for quick browsing and cleaner QR menus." />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Name</label>
                <input
                  className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  value={categoryForm.name}
                  onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Sort order</label>
                <input
                  className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  type="number"
                  value={categoryForm.sort_order}
                  onChange={(event) => setCategoryForm((current) => ({ ...current, sort_order: event.target.value }))}
                />
              </div>
            </div>
            <Button className="mt-4" type="submit" disabled={submitting === "category"}>
              {submitting === "category" ? "Saving..." : "Save category"}
            </Button>
          </form>
        </Panel>

        <Panel>
          <form onSubmit={submitProduct}>
            <SectionHeading
              eyebrow="Catalog"
              title={editingId ? "Edit product" : "Add a product"}
              description="Everything here appears in your owner dashboard and can be shown on the QR customer page."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <select
                  className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  value={productForm.category_id}
                  onChange={(event) => setProductForm((current) => ({ ...current, category_id: event.target.value }))}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Item type">
                <select
                  className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  value={productForm.item_type}
                  onChange={(event) => setProductForm((current) => ({ ...current, item_type: event.target.value }))}
                >
                  <option value="food">Food</option>
                  <option value="drink">Drink</option>
                  <option value="retail">Retail item</option>
                  <option value="service">Service</option>
                </select>
              </Field>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Product name">
                <input
                  className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  value={productForm.name}
                  onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
                />
              </Field>
              <Field label="SKU">
                <input
                  className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  value={productForm.sku}
                  onChange={(event) => setProductForm((current) => ({ ...current, sku: event.target.value }))}
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Description">
                <textarea
                  rows="3"
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  value={productForm.description}
                  onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))}
                />
              </Field>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Selling price">
                <input className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" value={productForm.price} onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))} />
              </Field>
              <Field label="Cost price">
                <input className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" value={productForm.cost} onChange={(event) => setProductForm((current) => ({ ...current, cost: event.target.value }))} />
              </Field>
              <Field label="Opening stock">
                <input className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" value={productForm.stock_qty} onChange={(event) => setProductForm((current) => ({ ...current, stock_qty: event.target.value }))} />
              </Field>
              <Field label="Reorder level">
                <input className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" value={productForm.reorder_level} onChange={(event) => setProductForm((current) => ({ ...current, reorder_level: event.target.value }))} />
              </Field>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_1fr]">
              <Field label="Unit">
                <input className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" value={productForm.unit} onChange={(event) => setProductForm((current) => ({ ...current, unit: event.target.value }))} />
              </Field>
              <Field label="Sort order">
                <input className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" value={productForm.sort_order} onChange={(event) => setProductForm((current) => ({ ...current, sort_order: event.target.value }))} />
              </Field>
              <Field label="Image URL">
                <input className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" value={productForm.image_url} onChange={(event) => setProductForm((current) => ({ ...current, image_url: event.target.value }))} />
              </Field>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={productForm.track_stock} onChange={(event) => setProductForm((current) => ({ ...current, track_stock: event.target.checked }))} />
                Track stock
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={productForm.active} onChange={(event) => setProductForm((current) => ({ ...current, active: event.target.checked }))} />
                Visible to customers
              </label>
              <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-2xl border border-border bg-white px-4 text-sm font-semibold text-foreground transition hover:bg-muted">
                <ImagePlus size={16} />
                Upload image
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="submit" disabled={submitting === "product"}>{submitting === "product" ? "Saving..." : editingId ? "Update product" : "Create product"}</Button>
              {editingId ? (
                <Button
                  variant="ghost"
                  className="border border-border"
                  onClick={() => {
                    setEditingId(null);
                    setProductForm(makeProductForm(categories[0]));
                  }}
                >
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </form>
        </Panel>
      </div>

      <Panel>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">Catalog list</p>
            <h3 className="text-2xl font-bold text-slate-950">All products</h3>
          </div>
          <div className="relative w-full lg:max-w-sm">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="h-11 w-full rounded-2xl border border-border bg-white pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="Search name, SKU, or category" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {visibleProducts.map((product) => (
            <Panel key={product.id} className="overflow-hidden border-none bg-[linear-gradient(180deg,#ffffff_0%,#f9f5ec_100%)] shadow-[inset_0_0_0_1px_rgba(221,229,222,0.8)]">
              <div className="flex gap-4">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[20px] bg-muted">
                  {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{product.category_name || "Category"}</p>
                      <h4 className="mt-1 text-lg font-bold text-slate-950">{product.name}</h4>
                    </div>
                    <StatusBadge status={product.active ? "ready" : "cancelled"} />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{product.description}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
                    <span>{product.item_type}</span>
                    <span>{money(product.price_cents)}</span>
                    <span>{product.stock_qty} {product.unit}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="ghost" className="border border-border" onClick={() => editProduct(product)}>
                      <Pencil size={15} />
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="border border-border text-red-700 hover:bg-red-50" onClick={() => onArchiveProduct(product.id)}>
                      <Trash2 size={15} />
                      Archive
                    </Button>
                  </div>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export function InventoryBoard({ products, movements, onAdjustInventory }) {
  const [adjustments, setAdjustments] = useState({});
  const inventoryProducts = useMemo(() => products.filter((product) => product.track_stock), [products]);
  const lowStock = inventoryProducts.filter((product) => product.stock_qty <= product.reorder_level);

  async function submitAdjustment(productId, presetReason) {
    const row = adjustments[productId] || { change_qty: "", reason: presetReason || "manual_adjustment", reference: "" };
    await onAdjustInventory({
      product_id: productId,
      change_qty: Number(row.change_qty),
      reason: row.reason || presetReason || "manual_adjustment",
      reference: row.reference || "",
    });
    setAdjustments((current) => ({ ...current, [productId]: { change_qty: "", reason: presetReason || "manual_adjustment", reference: "" } }));
  }

  return (
    <div className="space-y-5">
      <SectionHeading eyebrow="Inventory" title="Stock on hand" description="Track stock, fix counts fast, and see recent stock movement from sales and manual adjustments." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Tracked products" value={inventoryProducts.length} hint="Products using stock control" />
        <MetricCard label="Low stock alerts" value={lowStock.length} hint="Products at or below reorder level" />
        <MetricCard label="Recent movements" value={movements.length} hint="Latest stock changes" />
        <MetricCard label="Out of stock" value={inventoryProducts.filter((product) => product.out_of_stock).length} hint="Products that need restocking" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.92fr]">
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">Low stock</p>
              <h3 className="text-2xl font-bold text-slate-950">Restock priority</h3>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {inventoryProducts.length === 0 ? <EmptyState title="No tracked inventory yet">Enable stock tracking on products and they will appear here.</EmptyState> : null}
            {inventoryProducts.map((product) => {
              const row = adjustments[product.id] || { change_qty: "", reason: "manual_adjustment", reference: "" };
              return (
                <div key={product.id} className="rounded-[24px] bg-muted/60 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-950">{product.name}</p>
                        {product.stock_qty <= product.reorder_level ? <span className="rounded-full bg-orange-100 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-orange-900">Low</span> : null}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {product.stock_qty} {product.unit} left • reorder at {product.reorder_level} {product.unit}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="border border-border" onClick={() => onAdjustInventory({ product_id: product.id, change_qty: 10, reason: "restock", reference: "quick-add" })}>
                        <ArrowUpCircle size={15} />
                        +10
                      </Button>
                      <Button size="sm" variant="ghost" className="border border-border" onClick={() => onAdjustInventory({ product_id: product.id, change_qty: -1, reason: "shrinkage", reference: "quick-minus" })}>
                        <ArrowDownCircle size={15} />
                        -1
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-[120px_1fr_1fr_auto]">
                    <input
                      className="h-10 rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                      placeholder="+5 / -2"
                      value={row.change_qty}
                      onChange={(event) =>
                        setAdjustments((current) => ({
                          ...current,
                          [product.id]: { ...row, change_qty: event.target.value },
                        }))
                      }
                    />
                    <input
                      className="h-10 rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                      placeholder="Reason"
                      value={row.reason}
                      onChange={(event) =>
                        setAdjustments((current) => ({
                          ...current,
                          [product.id]: { ...row, reason: event.target.value },
                        }))
                      }
                    />
                    <input
                      className="h-10 rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                      placeholder="Reference"
                      value={row.reference}
                      onChange={(event) =>
                        setAdjustments((current) => ({
                          ...current,
                          [product.id]: { ...row, reference: event.target.value },
                        }))
                      }
                    />
                    <Button size="sm" disabled={!row.change_qty} onClick={() => submitAdjustment(product.id, "manual_adjustment")}>
                      Save
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">Movement log</p>
              <h3 className="text-2xl font-bold text-slate-950">Recent stock changes</h3>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {movements.length === 0 ? <p className="text-sm text-slate-500">Sales and manual adjustments will show up here.</p> : null}
            {movements.map((movement) => (
              <div key={movement.id} className="rounded-[22px] bg-muted/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{movement.product_name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {movement.reason.replaceAll("_", " ")} {movement.reference ? `• ${movement.reference}` : ""}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">{formatDateTime(movement.created_at)}</p>
                  </div>
                  <p className={cn("font-bold", movement.change_qty >= 0 ? "text-emerald-700" : "text-red-700")}>
                    {movement.change_qty > 0 ? "+" : ""}{movement.change_qty}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function OrderPointsBoard({ tables, onCreateTable, onPersistQrImage }) {
  const [form, setForm] = useState({ number: "", seats: "4" });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback("");
    setError("");
    try {
      await onCreateTable({
        number: form.number,
        seats: Number(form.seats) || 4,
      });
      setForm({ number: "", seats: "4" });
      setFeedback("Order point created and ready for QR printing.");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeading eyebrow="QR ordering" title="Create order points and QR links" description="Tables, counter pickup codes, or small shop ordering points all work from the same QR flow." />
      {feedback ? <Notice title="QR ready" tone="success">{feedback}</Notice> : null}
      {error ? <Notice title="Could not create order point" tone="danger">{error}</Notice> : null}

      <Panel>
        <form className="grid gap-4 md:grid-cols-[1fr_160px_160px]" onSubmit={submit}>
          <Field label="Order point name / table number">
            <input className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="Table 4" value={form.number} onChange={(event) => setForm((current) => ({ ...current, number: event.target.value }))} />
          </Field>
          <Field label="Capacity">
            <input className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" type="number" min="1" value={form.seats} onChange={(event) => setForm((current) => ({ ...current, seats: event.target.value }))} />
          </Field>
          <div className="self-end">
            <Button type="submit" className="w-full" disabled={submitting}>
              <QrCode size={16} />
              {submitting ? "Creating..." : "Add point"}
            </Button>
          </div>
        </form>
      </Panel>

      {tables.length === 0 ? <EmptyState title="No QR order points yet">Create your first point above and print the QR card.</EmptyState> : null}
      <div className="grid gap-4 xl:grid-cols-2">
        {tables.map((table) => (
          <OrderPointCard key={table.id} table={table} onPersistImage={onPersistQrImage} />
        ))}
      </div>
    </div>
  );
}

function OrderPointCard({ table, onPersistImage }) {
  const generatedQr = useQrCode(table.qr_url, 280);
  const qrImage = table.qr_image_data || generatedQr;
  const persistedRef = useRef(false);

  useEffect(() => {
    if (!qrImage || table.qr_image_data || persistedRef.current || !onPersistImage) return;
    persistedRef.current = true;
    onPersistImage(table.id, qrImage).catch(() => {
      persistedRef.current = false;
    });
  }, [onPersistImage, qrImage, table.id, table.qr_image_data]);

  async function copyLink() {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(table.qr_url);
  }

  function printCard() {
    if (!qrImage) return;
    openPrintWindow(
      `QR Card ${table.number}`,
      `
      <div class="sheet">
        <article class="card">
          <p class="eyebrow">MauzoHub QR</p>
          <h1>${escapeHtml(String(table.number))}</h1>
          <p class="muted">${escapeHtml(String(table.seats))} seats or pickup capacity</p>
          <img src="${escapeHtml(qrImage)}" alt="QR code for ${escapeHtml(table.number)}" />
          <div class="scan-url">${escapeHtml(table.qr_url)}</div>
        </article>
      </div>`,
    );
  }

  return (
    <Panel className="overflow-hidden">
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="rounded-[24px] bg-[linear-gradient(180deg,#f7f3ea_0%,#eef6f1_100%)] p-3">
          <div className="grid aspect-square place-items-center rounded-[18px] bg-white">
            {qrImage ? <img src={qrImage} alt={`QR code for ${table.number}`} className="h-full w-full rounded-[18px] object-contain p-3" /> : <QrCode className="text-slate-400" />}
          </div>
        </div>
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Order point</p>
              <h3 className="mt-1 text-2xl font-bold text-slate-950">{table.number}</h3>
            </div>
            <StatusBadge status={table.status} kind="table" />
          </div>
          <p className="mt-2 text-sm text-slate-600">Public customer route linked to one live ordering session.</p>
          <div className="mt-4 rounded-[20px] bg-muted/70 p-3 text-xs break-all text-slate-600">{table.qr_url}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="ghost" className="border border-border" onClick={copyLink}>
              <Copy size={16} />
              Copy
            </Button>
            <Button variant="ghost" className="border border-border" onClick={printCard} disabled={!qrImage}>
              <Printer size={16} />
              Print
            </Button>
            <a href={table.qr_url} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted">
              <ExternalLink size={16} />
              Open
            </a>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function PaymentsBoard({ orders, onCashPaid, onConfirmMpesa, onPrintReceipt }) {
  const openBills = orders.filter((order) => order.payment_status !== "paid" && order.status !== "cancelled");
  const recentPayments = orders.filter((order) => order.payments?.length).slice(0, 12);

  return (
    <div className="space-y-5">
      <SectionHeading eyebrow="Payments" title="Cash and M-Pesa" description="See unpaid bills, confirm pending M-Pesa collections, and print receipts after payment settles." />

      <div className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">Open bills</p>
              <h3 className="text-2xl font-bold text-slate-950">Awaiting payment</h3>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {openBills.length === 0 ? <p className="text-sm text-slate-500">All current bills are settled.</p> : null}
            {openBills.map((order) => {
              const pendingMpesa = order.payments?.find((payment) => payment.method === "mpesa" && payment.status !== "paid");
              return (
                <div key={order.id} className="rounded-[22px] bg-muted/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-950">Order #{order.id}</p>
                      <p className="mt-1 text-sm text-slate-600">{order.table_number ? `Order point ${order.table_number}` : "Walk-in"} • {money(order.total_cents)}</p>
                    </div>
                    <StatusBadge status={order.payment_status} kind="payment" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => onCashPaid(order.id, order.total_cents)}>
                      <CreditCard size={15} />
                      Cash paid
                    </Button>
                    {pendingMpesa ? (
                      <Button size="sm" variant="ghost" className="border border-border" onClick={() => onConfirmMpesa(pendingMpesa.id)}>
                        <Smartphone size={15} />
                        Confirm M-Pesa
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">Recent payment activity</p>
              <h3 className="text-2xl font-bold text-slate-950">Latest collections</h3>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {recentPayments.length === 0 ? <p className="text-sm text-slate-500">Payments will show up here as they happen.</p> : null}
            {recentPayments.map((order) => (
              <div key={order.id} className="rounded-[22px] bg-muted/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-950">Order #{order.id}</p>
                    <p className="mt-1 text-sm text-slate-600">{money(order.total_cents)} • {paymentStatusLabel(order.payment_status)}</p>
                  </div>
                  {order.receipt ? (
                    <Button size="sm" variant="ghost" className="border border-border" onClick={() => onPrintReceipt(order)}>
                      <Printer size={15} />
                      Print
                    </Button>
                  ) : null}
                </div>
                <div className="mt-3 space-y-2">
                  {(order.payments || []).map((payment) => (
                    <div key={payment.id} className="rounded-[18px] bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">
                          {paymentMethodLabel(payment.method)} • {money(payment.amount_cents)}
                        </p>
                        <StatusBadge status={payment.status} kind="payment" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function AnalyticsBoard({ dashboard }) {
  const trend = [...(dashboard?.sales_trend || [])].reverse();
  const maxRevenue = Math.max(1, ...trend.map((point) => point.revenue_cents));

  return (
    <div className="space-y-5">
      <SectionHeading eyebrow="Analytics" title="Revenue and profit trends" description="See how the business is performing across sales, profit, best sellers, and payment channels." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="This week" value={money(dashboard?.weekly_revenue_cents)} hint="Revenue in the last 7 days" />
        <MetricCard label="This month" value={money(dashboard?.monthly_revenue_cents)} hint="Revenue this month" />
        <MetricCard label="Weekly profit" value={money(dashboard?.weekly_profit_cents)} hint="Estimated profit" />
        <MetricCard label="Monthly profit" value={money(dashboard?.monthly_profit_cents)} hint="Estimated profit" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">Sales trend</p>
              <h3 className="text-2xl font-bold text-slate-950">Last 30 days</h3>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-7 gap-3 sm:grid-cols-10 xl:grid-cols-12">
            {trend.slice(-12).map((point) => (
              <div key={point.day} className="flex flex-col items-center gap-2">
                <div className="flex h-40 items-end">
                  <div className="w-5 rounded-t-full bg-[linear-gradient(180deg,#e27e1e_0%,#0f6b52_100%)]" style={{ height: `${Math.max(10, (point.revenue_cents / maxRevenue) * 100)}%` }} />
                </div>
                <p className="text-[11px] font-semibold text-slate-500">{point.day.slice(5)}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">Payment channels</p>
              <h3 className="text-2xl font-bold text-slate-950">Collected by method</h3>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {(dashboard?.payment_methods || []).length === 0 ? <p className="text-sm text-slate-500">No settled payments yet.</p> : null}
            {(dashboard?.payment_methods || []).map((payment) => (
              <div key={payment.method} className="rounded-[22px] bg-muted/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{paymentMethodLabel(payment.method)}</p>
                    <p className="mt-1 text-sm text-slate-500">{payment.count} transactions</p>
                  </div>
                  <p className="text-lg font-bold text-primary">{money(payment.revenue_cents)}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">Best sellers</p>
              <h3 className="text-2xl font-bold text-slate-950">What customers choose most</h3>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {(dashboard?.best_sellers || []).length === 0 ? <p className="text-sm text-slate-500">Top products will appear after a few sales.</p> : null}
            {(dashboard?.best_sellers || []).map((item) => (
              <div key={item.name} className="rounded-[22px] bg-muted/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{item.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.quantity} units sold</p>
                  </div>
                  <p className="font-bold text-primary">{money(item.revenue_cents)}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">Quick reads</p>
              <h3 className="text-2xl font-bold text-slate-950">Owner snapshot</h3>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            <div className="rounded-[22px] bg-muted/60 p-4">
              <p className="text-sm font-semibold text-slate-500">Avg revenue today vs week</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">
                {dashboard?.weekly_revenue_cents ? `${Math.round((dashboard.daily_revenue_cents / Math.max(1, dashboard.weekly_revenue_cents / 7)) * 100)}%` : "0%"}
              </p>
            </div>
            <div className="rounded-[22px] bg-muted/60 p-4">
              <p className="text-sm font-semibold text-slate-500">Paid orders today</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{dashboard?.paid_orders_today || 0}</p>
            </div>
            <div className="rounded-[22px] bg-muted/60 p-4">
              <p className="text-sm font-semibold text-slate-500">Open order points</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{dashboard?.active_order_points || 0}</p>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function ReceiptsBoard({ orders, onPrintReceipt }) {
  const receipts = orders.filter((order) => order.receipt);
  return (
    <div className="space-y-5">
      <SectionHeading eyebrow="Receipts" title="Printable proof of sale" description="View settled orders and print clean receipts whenever customers ask for them." />
      {receipts.length === 0 ? <EmptyState title="No receipts yet">Receipts will appear here after orders are paid.</EmptyState> : null}
      <div className="grid gap-4 xl:grid-cols-2">
        {receipts.map((order) => (
          <Panel key={order.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-slate-950">{order.receipt?.receipt_number || `Order #${order.id}`}</p>
                <p className="mt-1 text-sm text-slate-600">{order.table_number ? `Order point ${order.table_number}` : "Walk-in"} • {money(order.total_cents)}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">{formatDateTime(order.updated_at || order.created_at)}</p>
              </div>
              <StatusBadge status={order.payment_status} kind="payment" />
            </div>
            <div className="mt-4 space-y-2">
              {(order.items || []).map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-[18px] bg-muted/60 px-3 py-2 text-sm">
                  <span>{item.quantity} x {item.menu_item_name}</span>
                  <span className="font-semibold">{money(item.quantity * item.unit_price_cents)}</span>
                </div>
              ))}
            </div>
            <Button className="mt-4 w-full" variant="ghost" onClick={() => onPrintReceipt(order)}>
              <Printer size={16} />
              Print receipt
            </Button>
          </Panel>
        ))}
      </div>
    </div>
  );
}

export function SettingsBoard({ settings, onSave }) {
  const [form, setForm] = useState(settings || {});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(settings || {});
  }, [settings]);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setFeedback("");
    setError("");
    try {
      await onSave(form);
      setFeedback("Business settings saved.");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeading eyebrow="Settings" title="Business profile and receipts" description="Set the business details used across the dashboard, QR experience, and receipts." />
      {feedback ? <Notice title="Saved" tone="success">{feedback}</Notice> : null}
      {error ? <Notice title="Could not save settings" tone="danger">{error}</Notice> : null}

      <Panel>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <Field label="Business name">
            <input className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" value={form.business_name || ""} onChange={(event) => setForm((current) => ({ ...current, business_name: event.target.value }))} />
          </Field>
          <Field label="Business type">
            <select
              className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              value={form.business_type || "Business"}
              onChange={(event) => setForm((current) => ({ ...current, business_type: event.target.value }))}
            >
              {["Business", "Restaurant", "Cafe", "Shop", "Mini market", "Kiosk", "Bakery", "Salon"].map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </Field>
          <Field label="Phone">
            <input className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" value={form.phone || ""} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
          </Field>
          <Field label="Currency">
            <input className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" value={form.currency_code || "KES"} onChange={(event) => setForm((current) => ({ ...current, currency_code: event.target.value }))} />
          </Field>
          <Field label="M-Pesa till / paybill">
            <input className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" value={form.mpesa_till || ""} onChange={(event) => setForm((current) => ({ ...current, mpesa_till: event.target.value }))} />
          </Field>
          <Field label="Receipt footer">
            <textarea rows="4" className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" value={form.receipt_footer || ""} onChange={(event) => setForm((current) => ({ ...current, receipt_footer: event.target.value }))} />
          </Field>
          <div className="md:col-span-2">
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save settings"}</Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function makeProductForm(category) {
  return {
    category_id: String(category?.id || ""),
    name: "",
    description: "",
    price: "",
    cost: "",
    image_url: "",
    sku: "",
    item_type: "food",
    sort_order: "0",
    stock_qty: "0",
    reorder_level: "0",
    unit: "pcs",
    track_stock: true,
    active: true,
  };
}
