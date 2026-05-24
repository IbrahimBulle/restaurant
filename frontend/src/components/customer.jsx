import { Minus, Plus, QrCode, Search, ShoppingBag, Sparkles } from "lucide-react";

import { ORDER_STATUS_FLOW } from "../lib/config";
import { cn, formatDateTime, money, orderStatusLabel } from "../lib/format";
import { Button, Panel, StatusBadge } from "./ui";

export function CustomerHero({ table, business, itemCount, activeOrder }) {
  const pointLabel = orderPointLabel(business?.business_type);
  const capacityLabel = pointLabel === "Table" ? "seats" : "capacity";

  return (
    <header className="relative overflow-hidden border-b border-border bg-white/92 backdrop-blur">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_top_right,rgba(226,126,30,0.12),transparent_30%),radial-gradient(circle_at_top_left,rgba(15,61,47,0.12),transparent_24%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-5">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_320px] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              {business?.business_name || "MauzoHub"} • {pointLabel} {table?.number || "..."}
            </p>
            <h1 className="mt-2 max-w-2xl text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Browse, order, and pay in a few taps.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Live products, fast order updates, and M-Pesa or cash payment when you are ready.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold text-slate-700">
              <span className="rounded-full bg-white px-3 py-2 shadow-soft">{table?.seats || "-"} {capacityLabel}</span>
              <span className="rounded-full bg-white px-3 py-2 shadow-soft">{itemCount} in cart</span>
              <span className="rounded-full bg-white px-3 py-2 shadow-soft">Live order tracking</span>
            </div>
          </div>

          <Panel className="bg-[linear-gradient(160deg,rgba(15,61,47,0.95),rgba(20,86,67,0.92))] p-4 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-100">This {pointLabel.toLowerCase()}</p>
                <h2 className="mt-2 text-xl font-bold">One live order stream</h2>
              </div>
              <QrCode className="text-emerald-100" />
            </div>
            <p className="mt-3 text-sm leading-6 text-emerald-50/90">
              Your scan is already linked, so the business sees the same order and payment updates instantly.
            </p>
            {activeOrder ? (
              <div className="mt-4 rounded-[22px] bg-white/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-emerald-100">Active order</p>
                    <p className="text-lg font-bold">Order #{activeOrder.id}</p>
                  </div>
                  <StatusBadge status={activeOrder.status} />
                </div>
                <p className="mt-2 text-sm text-emerald-50/90">
                  Last updated {formatDateTime(activeOrder.updated_at || activeOrder.created_at)}
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-[22px] bg-white/10 p-4 text-sm text-emerald-50/90">
                Send your order when you are ready.
              </div>
            )}
          </Panel>
        </div>
      </div>
    </header>
  );
}

export function SearchBar({ value, onChange }) {
  return (
    <div className="relative w-full">
      <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        className="h-10 w-full rounded-xl border border-border bg-white pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15"
        placeholder="Search products"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

export function CategoryChips({ categories, activeCategory, onSelect }) {
  return (
    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect(String(category.id))}
          className={cn(
            "whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition",
            String(category.id) === String(activeCategory)
              ? "bg-primary text-white shadow-[0_10px_24px_rgba(15,61,47,0.18)]"
              : "bg-muted text-slate-700 hover:bg-slate-200",
          )}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}

function MenuArtwork({ item, categoryName }) {
  if (item?.image_url) {
    return <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />;
  }
  return (
    <div className="flex h-full w-full flex-col justify-between bg-[radial-gradient(circle_at_top_left,rgba(226,126,30,0.95),rgba(15,61,47,0.95))] p-3 text-white">
      <Sparkles size={16} className="opacity-80" />
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-white/80">{categoryName || "Top pick"}</p>
        <h3 className="mt-2 text-lg font-bold leading-tight">{item?.name || "Featured item"}</h3>
      </div>
    </div>
  );
}

export function MenuCard({ item, categoryName, onAdd }) {
  return (
    <Panel className="group overflow-hidden rounded-[24px] p-3">
      <div className="flex gap-3">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[18px] bg-muted">
          <MenuArtwork item={item} categoryName={categoryName} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">{categoryName || "Catalog"}</p>
              <h3 className="mt-1 text-base font-bold leading-tight text-slate-950">{item.name}</h3>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary">{money(item.price_cents)}</span>
          </div>
          <p className="mt-2 text-sm leading-5 text-slate-600">{item.description}</p>
          <Button className="mt-3 h-10 w-full" size="sm" onClick={() => onAdd(item)}>
            <Plus size={15} />
            Add to cart
          </Button>
        </div>
      </div>
    </Panel>
  );
}

export function CartFloatingBar({ itemCount, total, onOpen }) {
  return (
    <div className="fixed inset-x-0 bottom-4 z-30 px-4 lg:hidden">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center justify-between rounded-[28px] bg-slate-950 px-5 py-4 text-left text-white shadow-[0_18px_40px_rgba(15,23,42,0.28)]"
      >
        <span className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
            <ShoppingBag size={18} />
          </span>
          <div>
            <span className="block text-sm font-semibold text-slate-300">{itemCount} items selected</span>
            <span className="block text-lg font-bold">{money(total)}</span>
          </div>
        </span>
        <span className="text-sm font-semibold text-emerald-200">Open cart</span>
      </button>
    </div>
  );
}

export function CartLine({ item, onDecrease, onIncrease, onNotesChange }) {
  return (
    <div className="rounded-[22px] border border-border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-slate-950">{item.name}</p>
          <p className="mt-1 text-sm text-slate-500">{money(item.price_cents)} each</p>
        </div>
        <p className="font-bold text-primary">{money(item.price_cents * item.quantity)}</p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="inline-flex items-center rounded-full border border-border bg-muted/80 p-1">
          <button
            type="button"
            onClick={onDecrease}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-700 transition hover:bg-white"
          >
            <Minus size={16} />
          </button>
          <span className="min-w-10 text-center text-sm font-bold">{item.quantity}</span>
          <button
            type="button"
            onClick={onIncrease}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-700 transition hover:bg-white"
          >
            <Plus size={16} />
          </button>
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Order note</span>
      </div>
      <input
        className="mt-3 h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15"
        placeholder="Special request, color, size, pickup note..."
        value={item.notes}
        onChange={(event) => onNotesChange(event.target.value)}
      />
    </div>
  );
}

function orderPointLabel(businessType) {
  const type = String(businessType || "").toLowerCase();
  if (/(restaurant|cafe|hotel|bar|grill|diner)/.test(type)) {
    return "Table";
  }
  return "Order point";
}

export function OrderTimeline({ status }) {
  const currentIndex = Math.max(ORDER_STATUS_FLOW.indexOf(status), 0);
  return (
    <div className="flex flex-wrap gap-2">
      {ORDER_STATUS_FLOW.map((step, index) => {
        const active = index <= currentIndex;
        const current = step === status;
        return (
          <div
            key={step}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em]",
              current
                ? "border-primary bg-primary text-white"
                : active
                  ? "border-primary/20 bg-primary/10 text-primary"
                  : "border-border bg-white text-slate-400",
            )}
          >
            <div
              className={cn(
                "grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold",
                current ? "bg-white/20 text-current" : active ? "bg-primary/15 text-current" : "bg-muted text-slate-500",
              )}
            >
              {index + 1}
            </div>
            <span>{orderStatusLabel(step)}</span>
          </div>
        );
      })}
    </div>
  );
}
