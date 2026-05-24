import { Minus, Plus, QrCode, Search, ShoppingBag, Sparkles } from "lucide-react";

import { ORDER_STATUS_FLOW } from "../lib/config";
import { cn, formatDateTime, money, orderStatusLabel } from "../lib/format";
import { Button, Panel, StatusBadge } from "./ui";

export function CustomerHero({ table, itemCount, activeOrder }) {
  return (
    <header className="relative overflow-hidden border-b border-border bg-white/88 backdrop-blur">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_top_right,rgba(226,126,30,0.18),transparent_32%),radial-gradient(circle_at_top_left,rgba(15,61,47,0.18),transparent_28%)]" />
      <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-6">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_360px] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Table {table?.number || "..."}</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Smooth QR ordering for dine-in guests.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Browse the live menu, add kitchen notes, and track every update from the kitchen to payment without reloading the page.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-slate-700">
              <span className="rounded-full bg-white px-4 py-2 shadow-soft">{table?.seats || "-"} seats</span>
              <span className="rounded-full bg-white px-4 py-2 shadow-soft">{itemCount} items in cart</span>
              <span className="rounded-full bg-white px-4 py-2 shadow-soft">Live kitchen updates</span>
            </div>
          </div>

          <Panel className="bg-[linear-gradient(160deg,rgba(15,61,47,0.95),rgba(20,86,67,0.92))] text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-100">Dining flow</p>
                <h2 className="mt-2 text-2xl font-bold">One scan, one table, one live order stream</h2>
              </div>
              <QrCode className="text-emerald-100" />
            </div>
            <p className="mt-4 text-sm leading-6 text-emerald-50/90">
              Your table is already attached to this order session, so the kitchen, waiter, and cashier all work from the same source of truth.
            </p>
            {activeOrder ? (
              <div className="mt-5 rounded-[22px] bg-white/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-emerald-100">Active order</p>
                    <p className="text-lg font-bold">Order #{activeOrder.id}</p>
                  </div>
                  <StatusBadge status={activeOrder.status} />
                </div>
                <p className="mt-3 text-sm text-emerald-50/90">
                  Last updated {formatDateTime(activeOrder.updated_at || activeOrder.created_at)}
                </p>
              </div>
            ) : (
              <div className="mt-5 rounded-[22px] bg-white/10 p-4 text-sm text-emerald-50/90">
                Send your first order and this panel will start tracking it in real time.
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
        className="h-12 w-full rounded-2xl border border-border bg-white pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15"
        placeholder="Search meals, juices, or chef specials"
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
            "whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition",
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
    <div className="flex h-full w-full flex-col justify-between bg-[radial-gradient(circle_at_top_left,rgba(226,126,30,0.95),rgba(15,61,47,0.95))] p-5 text-white">
      <Sparkles size={18} className="opacity-80" />
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-white/80">{categoryName || "Chef's pick"}</p>
        <h3 className="mt-2 text-2xl font-bold leading-tight">{item?.name || "Signature Dish"}</h3>
      </div>
    </div>
  );
}

export function MenuCard({ item, categoryName, onAdd }) {
  return (
    <Panel className="group overflow-hidden p-0">
      <div className="aspect-[4/3] overflow-hidden">
        <MenuArtwork item={item} categoryName={categoryName} />
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{categoryName || "Menu"}</p>
            <h3 className="mt-1 text-xl font-bold leading-tight text-slate-950">{item.name}</h3>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-2 text-sm font-bold text-primary">{money(item.price_cents)}</span>
        </div>
        <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">{item.description}</p>
        <Button className="mt-5 w-full" onClick={() => onAdd(item)}>
          <Plus size={16} />
          Add to order
        </Button>
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
          <span>
            <span className="block text-sm font-semibold text-slate-300">{itemCount} items selected</span>
            <span className="block text-lg font-bold">{money(total)}</span>
          </span>
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
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Kitchen note</span>
      </div>
      <input
        className="mt-3 h-10 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15"
        placeholder="No onions, extra spicy, split plate..."
        value={item.notes}
        onChange={(event) => onNotesChange(event.target.value)}
      />
    </div>
  );
}

export function OrderTimeline({ status }) {
  const currentIndex = Math.max(ORDER_STATUS_FLOW.indexOf(status), 0);
  return (
    <div className="space-y-3">
      {ORDER_STATUS_FLOW.map((step, index) => {
        const active = index <= currentIndex;
        const current = step === status;
        return (
          <div key={step} className="flex items-center gap-3">
            <div
              className={cn(
                "grid h-8 w-8 place-items-center rounded-full border text-xs font-bold capitalize",
                active ? "border-primary bg-primary text-white" : "border-border bg-white text-slate-400",
              )}
            >
              {index + 1}
            </div>
            <div>
              <p className={cn("text-sm font-semibold", current ? "text-foreground" : "text-slate-500")}>{orderStatusLabel(step)}</p>
              <p className="text-xs text-slate-500">{current ? "Current stage" : "Queued next"}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
