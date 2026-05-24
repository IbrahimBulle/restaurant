import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  ChefHat,
  Copy,
  CreditCard,
  ExternalLink,
  ImagePlus,
  Printer,
  QrCode,
  ReceiptText,
  Timer,
  UserRoundPlus,
  Users,
} from "lucide-react";

import { useQrCode } from "../hooks/useQrCode";
import { cn, formatDateTime, formatElapsed, fromPriceCents, money, orderStatusLabel, paymentMethodLabel, readFileAsDataUrl, toPriceCents } from "../lib/format";
import { escapeHtml, openPrintWindow } from "../lib/print";
import { Button, EmptyState, MetricCard, Notice, Panel, SectionHeading, StatusBadge } from "./ui";

function categoryMap(categories) {
  return Object.fromEntries(categories.map((category) => [category.id, category]));
}

export function KitchenQueue({ orders, onStatus }) {
  const active = orders.filter((order) => ["new", "accepted", "preparing"].includes(order.status));
  return (
    <div>
      <SectionHeading
        eyebrow="Kitchen"
        title="Live prep queue"
        description="New QR orders land here immediately, with clear notes for the kitchen and fast status actions."
        action={
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary shadow-soft">
            <Bell size={16} />
            Live feed
          </div>
        }
      />
      {active.length === 0 ? (
        <EmptyState title="No active kitchen tickets">As soon as a guest places an order from a table QR code, it will appear here.</EmptyState>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {active.map((order) => (
          <OrderTicket key={order.id} order={order} onStatus={onStatus} />
        ))}
      </div>
    </div>
  );
}

function OrderTicket({ order, onStatus }) {
  return (
    <Panel className="bg-[linear-gradient(180deg,#ffffff_0%,#f7f4ec_100%)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold">Order #{order.id}</h3>
          <p className="mt-1 text-sm text-slate-600">Table {order.table_number || order.table_id || "Walk-in"}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
            {order.source} order • {formatElapsed(order.created_at)}
          </p>
        </div>
        <StatusBadge status={order.status} />
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
        <Button onClick={() => onStatus(order.id, "accepted")}>
          <Timer size={16} />
          Accept
        </Button>
        <Button variant="secondary" onClick={() => onStatus(order.id, "preparing")}>
          <ChefHat size={16} />
          Cook
        </Button>
        <Button variant="ghost" className="border border-border" onClick={() => onStatus(order.id, "ready")}>
          Ready
        </Button>
      </div>
    </Panel>
  );
}

export function WaiterBoard({ orders, tables, onStatus }) {
  const readyOrders = orders.filter((order) => order.status === "ready");
  const servedOrders = orders.filter((order) => order.status === "served").slice(0, 6);

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <section>
        <SectionHeading
          eyebrow="Floor"
          title="Ready-to-serve queue"
          description="When the kitchen marks an order ready, it lands here instantly for handoff to the table."
        />
        {readyOrders.length === 0 ? (
          <EmptyState title="No ready plates right now">The next completed dishes will show up here for delivery.</EmptyState>
        ) : null}
        <div className="space-y-4">
          {readyOrders.map((order) => (
            <Panel key={order.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold">Order #{order.id}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Table {order.table_number || order.table_id || "Walk-in"} • {order.items?.length || 0} items
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                    Ready since {formatDateTime(order.updated_at)}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {order.items?.map((item) => (
                  <div key={item.id} className="rounded-[20px] bg-muted/60 p-3 text-sm">
                    <p className="font-semibold text-slate-900">
                      {item.quantity} x {item.menu_item_name}
                    </p>
                    {item.notes ? <p className="mt-2 text-slate-600">{item.notes}</p> : null}
                  </div>
                ))}
              </div>
              <Button className="mt-5" onClick={() => onStatus(order.id, "served")}>
                Mark served
              </Button>
            </Panel>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <SectionHeading
          eyebrow="Tables"
          title="Dining room snapshot"
          description="Quick view of table occupancy and recent served orders."
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          {tables.map((table) => (
            <Panel key={table.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Table</p>
                  <h3 className="mt-1 text-xl font-bold text-slate-950">{table.number}</h3>
                  <p className="mt-2 text-sm text-slate-600">{table.seats} seats</p>
                </div>
                <StatusBadge status={table.status} kind="table" />
              </div>
            </Panel>
          ))}
        </div>
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">Recently served</p>
              <h3 className="text-xl font-bold text-slate-950">Completed handoffs</h3>
            </div>
            <Users className="text-primary" />
          </div>
          <div className="mt-4 space-y-3">
            {servedOrders.length === 0 ? (
              <p className="text-sm text-slate-500">Served orders will appear here as the shift progresses.</p>
            ) : null}
            {servedOrders.map((order) => (
              <div key={order.id} className="rounded-[20px] bg-muted/60 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-950">
                    Order #{order.id} • Table {order.table_number || order.table_id || "Walk-in"}
                  </p>
                  <StatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}

export function CashierBoard({ orders, onCashPaid, onConfirmMpesa, onPrintReceipt }) {
  const openBills = orders.filter((order) => order.payment_status !== "paid" && order.status !== "cancelled");
  const paidOrders = orders.filter((order) => order.payment_status === "paid").slice(0, 8);

  return (
    <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <section>
        <SectionHeading
          eyebrow="Cashier"
          title="Open bills and payment actions"
          description="Collect cash, confirm pending M-Pesa payments, and keep the customer receipt ready."
        />
        {openBills.length === 0 ? (
          <EmptyState title="No open bills">Orders awaiting payment will show up here automatically.</EmptyState>
        ) : null}
        <div className="space-y-4">
          {openBills.map((order) => {
            const pendingMpesa = order.payments?.find((payment) => payment.method === "mpesa" && payment.status !== "paid");
            return (
              <Panel key={order.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold">Order #{order.id}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Table {order.table_number || order.table_id || "Walk-in"} • {money(order.total_cents)}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                      {order.items?.length || 0} items • VAT {money(order.vat_cents)} included
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={order.status} />
                    <StatusBadge status={order.payment_status} kind="payment" />
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  {(order.payments || []).map((payment) => (
                    <div key={payment.id} className="rounded-[18px] bg-muted/60 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">
                          {paymentMethodLabel(payment.method)} • {money(payment.amount_cents)}
                        </p>
                        <StatusBadge status={payment.status} kind="payment" />
                      </div>
                      {payment.reference ? <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">{payment.reference}</p> : null}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => onCashPaid(order.id, order.total_cents)}>
                    <CreditCard size={16} />
                    Mark cash paid
                  </Button>
                  {pendingMpesa ? (
                    <Button variant="ghost" className="border border-border" onClick={() => onConfirmMpesa(pendingMpesa.id)}>
                      Confirm M-Pesa
                    </Button>
                  ) : null}
                </div>
              </Panel>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Receipts"
          title="Recently settled orders"
          description="Print a receipt or save a PDF from the browser as soon as payment is complete."
        />
        {paidOrders.length === 0 ? (
          <EmptyState title="No paid orders yet">Finished payments and receipts will appear here.</EmptyState>
        ) : null}
        <div className="space-y-4">
          {paidOrders.map((order) => (
            <Panel key={order.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold">Order #{order.id}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Table {order.table_number || order.table_id || "Walk-in"} • {money(order.total_cents)}
                  </p>
                  {order.receipt?.receipt_number ? (
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">{order.receipt.receipt_number}</p>
                  ) : null}
                </div>
                <StatusBadge status={order.payment_status} kind="payment" />
              </div>
              <Button className="mt-4" variant="ghost" onClick={() => onPrintReceipt(order)}>
                <Printer size={16} />
                Print receipt
              </Button>
            </Panel>
          ))}
        </div>
      </section>
    </div>
  );
}

export function AdminOverview({ reports, tables, orders }) {
  const paymentBreakdown = reports?.payment_methods || [];
  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Overview"
        title="Restaurant control tower"
        description="Daily sales, payment mix, table throughput, and operational hotspots in one place."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Today" value={money(reports?.daily_total_cents)} hint="Paid revenue today" />
        <MetricCard label="This week" value={money(reports?.weekly_total_cents)} hint="Last 7 days" />
        <MetricCard label="This month" value={money(reports?.monthly_total_cents)} hint="Current month" />
        <MetricCard label="Open orders" value={reports?.open_orders || 0} hint={`${reports?.active_sessions || 0} active guest sessions`} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">Payment methods</p>
              <h3 className="text-2xl font-bold text-slate-950">How guests are paying</h3>
            </div>
            <CreditCard className="text-primary" />
          </div>
          <div className="mt-5 space-y-3">
            {paymentBreakdown.length === 0 ? <p className="text-sm text-slate-500">Payment activity will appear after the first completed bills.</p> : null}
            {paymentBreakdown.map((item) => (
              <div key={item.method} className="rounded-[22px] bg-muted/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{paymentMethodLabel(item.method)}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.count} completed payments</p>
                  </div>
                  <p className="text-lg font-bold text-primary">{money(item.revenue_cents)}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">Best sellers</p>
              <h3 className="text-2xl font-bold text-slate-950">Top menu movers</h3>
            </div>
            <ReceiptText className="text-primary" />
          </div>
          <div className="mt-5 space-y-3">
            {(reports?.best_sellers || []).length === 0 ? <p className="text-sm text-slate-500">Best sellers will show up after a few completed orders.</p> : null}
            {(reports?.best_sellers || []).map((item) => (
              <div key={item.name} className="rounded-[22px] bg-muted/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{item.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.quantity} portions sold</p>
                  </div>
                  <p className="font-bold text-primary">{money(item.revenue_cents)}</p>
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
              <p className="text-sm font-semibold text-slate-500">Tables</p>
              <h3 className="text-2xl font-bold text-slate-950">Dining room inventory</h3>
            </div>
            <QrCode className="text-primary" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {tables.map((table) => (
              <div key={table.id} className="rounded-[22px] bg-muted/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Table {table.number}</p>
                    <p className="mt-1 font-bold text-slate-950">{table.seats} seats</p>
                  </div>
                  <StatusBadge status={table.status} kind="table" />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">Low stock</p>
              <h3 className="text-2xl font-bold text-slate-950">Items that need attention</h3>
            </div>
            <Bell className="text-primary" />
          </div>
          <div className="mt-5 space-y-3">
            {(reports?.low_stock || []).length === 0 ? <p className="text-sm text-slate-500">Kitchen stock levels are healthy right now.</p> : null}
            {(reports?.low_stock || []).map((item) => (
              <div key={item.id} className="rounded-[22px] bg-muted/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{item.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.stock_qty} {item.unit} left
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-orange-800">Reorder at {item.low_stock_qty} {item.unit}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

export function TableQrCard({ table, onPersistImage, compact = false }) {
  const generatedQr = useQrCode(table.qr_url, compact ? 220 : 320);
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
      `Table ${table.number} QR Card`,
      `
      <div class="sheet">
        <article class="card">
          <p class="eyebrow">QRDine Table Card</p>
          <h1>Table ${escapeHtml(table.number)}</h1>
          <p class="muted">${escapeHtml(String(table.seats))} seats • Scan to open the live menu.</p>
          <img src="${escapeHtml(qrImage)}" alt="QR code for table ${escapeHtml(table.number)}" />
          <div class="scan-url">${escapeHtml(table.qr_url)}</div>
        </article>
      </div>`,
    );
  }

  return (
    <Panel className="overflow-hidden">
      <div className={cn("grid gap-4", compact ? "sm:grid-cols-[160px_1fr]" : "lg:grid-cols-[220px_1fr]")}>
        <div className="rounded-[24px] bg-[linear-gradient(180deg,#f7f3ea_0%,#eef6f1_100%)] p-3">
          <div className="grid aspect-square place-items-center rounded-[18px] bg-white">
            {qrImage ? (
              <img src={qrImage} alt={`QR code for table ${table.number}`} className="h-full w-full rounded-[18px] object-contain p-3" />
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
            <StatusBadge status={table.status} kind="table" />
          </div>
          <p className="mt-2 text-sm text-slate-600">{table.seats} seats linked to one customer ordering page.</p>
          <div className="mt-4 rounded-[20px] bg-muted/70 p-3 text-xs break-all text-slate-600">{table.qr_url}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="ghost" className="border border-border" onClick={copyLink}>
              <Copy size={16} />
              Copy link
            </Button>
            <Button variant="ghost" className="border border-border" onClick={printCard} disabled={!qrImage}>
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

export function TablesManager({ tables, onCreateTable, onPersistQrImage }) {
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
      setFeedback("Table created and ready for QR printing.");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Tables"
        title="Create and print table QR cards"
        description="Each table gets a dedicated scan destination that opens the customer ordering screen with the right session context."
      />
      {feedback ? <Notice title="Table ready" tone="success">{feedback}</Notice> : null}
      {error ? <Notice title="Could not create table" tone="danger">{error}</Notice> : null}
      <Panel>
        <form className="grid gap-4 md:grid-cols-[1fr_180px_180px]" onSubmit={submit}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Table number</label>
            <input
              className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="7"
              value={form.number}
              onChange={(event) => setForm((current) => ({ ...current, number: event.target.value }))}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Seats</label>
            <input
              className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              type="number"
              min="1"
              value={form.seats}
              onChange={(event) => setForm((current) => ({ ...current, seats: event.target.value }))}
            />
          </div>
          <div className="self-end">
            <Button type="submit" className="w-full" disabled={submitting}>
              <QrCode size={16} />
              {submitting ? "Creating..." : "Add table"}
            </Button>
          </div>
        </form>
      </Panel>
      {tables.length === 0 ? <EmptyState title="No table QR cards yet">Create your first table above.</EmptyState> : null}
      <div className="grid gap-4 xl:grid-cols-2">
        {tables.map((table) => (
          <TableQrCard key={table.id} table={table} onPersistImage={onPersistQrImage} />
        ))}
      </div>
    </div>
  );
}

export function MenuManager({ menu, onCreateCategory, onCreateItem, onUpdateItem }) {
  const categories = menu?.categories || [];
  const items = menu?.items || [];
  const categoriesById = useMemo(() => categoryMap(categories), [categories]);
  const [categoryForm, setCategoryForm] = useState({ name: "", sort_order: String(categories.length + 1 || 1) });
  const [itemForm, setItemForm] = useState({
    id: null,
    category_id: String(categories[0]?.id || ""),
    name: "",
    description: "",
    price: "",
    image_url: "",
    active: true,
  });
  const [submitting, setSubmitting] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setCategoryForm((current) => ({ ...current, sort_order: current.sort_order || String(categories.length + 1 || 1) }));
    setItemForm((current) => ({
      ...current,
      category_id: current.category_id || String(categories[0]?.id || ""),
    }));
  }, [categories]);

  async function handleCategorySubmit(event) {
    event.preventDefault();
    setSubmitting("category");
    setFeedback("");
    setError("");
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

  async function handleItemSubmit(event) {
    event.preventDefault();
    setSubmitting("item");
    setFeedback("");
    setError("");
    try {
      const payload = {
        category_id: Number(itemForm.category_id),
        name: itemForm.name,
        description: itemForm.description,
        price_cents: toPriceCents(itemForm.price),
        image_url: itemForm.image_url,
        active: itemForm.active,
      };
      if (itemForm.id) {
        await onUpdateItem(itemForm.id, payload);
        setFeedback("Menu item updated.");
      } else {
        await onCreateItem(payload);
        setFeedback("Menu item published.");
      }
      setItemForm({
        id: null,
        category_id: String(categories[0]?.id || ""),
        name: "",
        description: "",
        price: "",
        image_url: "",
        active: true,
      });
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
    setItemForm((current) => ({ ...current, image_url: imageUrl }));
  }

  function editItem(item) {
    setItemForm({
      id: item.id,
      category_id: String(item.category_id),
      name: item.name,
      description: item.description,
      price: fromPriceCents(item.price_cents),
      image_url: item.image_url,
      active: Boolean(item.active),
    });
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Menu"
        title="Publish mobile-friendly menu cards"
        description="Upload food imagery or paste image URLs, then push the dish live to the customer ordering experience."
      />
      {feedback ? <Notice title="Saved" tone="success">{feedback}</Notice> : null}
      {error ? <Notice title="Menu update failed" tone="danger">{error}</Notice> : null}

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel>
          <form onSubmit={handleCategorySubmit}>
            <SectionHeading
              eyebrow="Categories"
              title="Add a menu section"
              description="Breakfast, mains, drinks, sides, desserts, or any structure your restaurant needs."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Category name</label>
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
            <Button type="submit" className="mt-4" disabled={submitting === "category"}>
              {submitting === "category" ? "Saving..." : "Save category"}
            </Button>
          </form>
        </Panel>

        <Panel>
          <form onSubmit={handleItemSubmit}>
            <SectionHeading
              eyebrow="Dishes"
              title={itemForm.id ? "Edit menu item" : "Create a menu item"}
              description="Guests will see this card on the QR ordering page, including its image, price, and description."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Category</label>
                <select
                  className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  value={itemForm.category_id}
                  onChange={(event) => setItemForm((current) => ({ ...current, category_id: event.target.value }))}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Price</label>
                <input
                  className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  placeholder="650"
                  value={itemForm.price}
                  onChange={(event) => setItemForm((current) => ({ ...current, price: event.target.value }))}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Item name</label>
              <input
                className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                value={itemForm.name}
                onChange={(event) => setItemForm((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div className="mt-4">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Description</label>
              <textarea
                rows="4"
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                value={itemForm.description}
                onChange={(event) => setItemForm((current) => ({ ...current, description: event.target.value }))}
              />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
              <input
                className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                placeholder="https://... or upload below"
                value={itemForm.image_url}
                onChange={(event) => setItemForm((current) => ({ ...current, image_url: event.target.value }))}
              />
              <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-border bg-white px-4 text-sm font-semibold text-foreground transition hover:bg-muted">
                <ImagePlus size={16} />
                Upload photo
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            <label className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={itemForm.active}
                onChange={(event) => setItemForm((current) => ({ ...current, active: event.target.checked }))}
              />
              Visible on customer menu
            </label>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="submit" disabled={submitting === "item"}>
                {submitting === "item" ? "Saving..." : itemForm.id ? "Update item" : "Publish item"}
              </Button>
              {itemForm.id ? (
                <Button
                  variant="ghost"
                  className="border border-border"
                  onClick={() =>
                    setItemForm({
                      id: null,
                      category_id: String(categories[0]?.id || ""),
                      name: "",
                      description: "",
                      price: "",
                      image_url: "",
                      active: true,
                    })
                  }
                >
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </form>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {items.map((item) => (
          <Panel key={item.id} className="overflow-hidden">
            <div className="flex gap-4">
              <div className="h-24 w-24 overflow-hidden rounded-[20px] bg-muted">
                {item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" /> : null}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{categoriesById[item.category_id]?.name || "Menu"}</p>
                    <h3 className="mt-1 text-xl font-bold text-slate-950">{item.name}</h3>
                  </div>
                  <StatusBadge status={item.active ? "ready" : "cancelled"} />
                </div>
                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="font-bold text-primary">{money(item.price_cents)}</p>
                  <Button variant="ghost" className="border border-border" onClick={() => editItem(item)}>
                    Edit item
                  </Button>
                </div>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

export function StaffManager({ users, onCreateUser }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "Password123",
    role: "chef",
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback("");
    setError("");
    try {
      await onCreateUser(form);
      setForm((current) => ({ ...current, name: "", email: "" }));
      setFeedback("Staff account created.");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Team"
        title="Manage staff accounts"
        description="Create dedicated roles for chef, waiter, cashier, and admin workflows."
      />
      {feedback ? <Notice title="Team updated" tone="success">{feedback}</Notice> : null}
      {error ? <Notice title="Could not create user" tone="danger">{error}</Notice> : null}

      <Panel>
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={submit}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Name</label>
            <input
              className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
            <input
              className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Role</label>
            <select
              className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              value={form.role}
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
            >
              <option value="chef">Chef</option>
              <option value="waiter">Waiter</option>
              <option value="cashier">Cashier</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="self-end">
            <Button type="submit" className="w-full" disabled={submitting}>
              <UserRoundPlus size={16} />
              {submitting ? "Creating..." : "Create user"}
            </Button>
          </div>
        </form>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        {users.map((user) => (
          <Panel key={user.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-slate-950">{user.name}</p>
                <p className="mt-1 text-sm text-slate-600">{user.email}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">Created {formatDateTime(user.created_at)}</p>
              </div>
              <StatusBadge status={user.active ? "ready" : "cancelled"} />
            </div>
            <p className="mt-4 text-sm font-semibold text-primary">{String(user.role || "").toUpperCase()}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
