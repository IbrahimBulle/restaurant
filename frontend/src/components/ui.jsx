import { LoaderCircle } from "lucide-react";

import { cn, orderStatusLabel, paymentStatusLabel } from "../lib/format";

const buttonVariants = {
  primary:
    "bg-primary text-white shadow-[0_16px_32px_rgba(15,61,47,0.24)] hover:bg-primary/90",
  secondary:
    "bg-accent text-slate-950 shadow-[0_16px_32px_rgba(226,126,30,0.18)] hover:bg-accent/90",
  ghost: "border border-border bg-white text-foreground hover:bg-muted",
  muted: "bg-muted text-slate-700 hover:bg-slate-200",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        size === "sm" && "h-10 px-4 text-sm",
        size === "md" && "h-11 px-5 text-sm",
        size === "lg" && "h-13 px-6 text-base",
        buttonVariants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Panel({ children, className = "" }) {
  return (
    <section className={cn("rounded-[30px] border border-border bg-white/96 p-5 shadow-soft", className)}>
      {children}
    </section>
  );
}

export function Notice({ title, children, tone = "neutral", className = "" }) {
  const tones = {
    neutral: "border-border bg-white text-foreground",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    danger: "border-red-200 bg-red-50 text-red-900",
    warning: "border-orange-200 bg-orange-50 text-orange-900",
  };
  return (
    <div className={cn("rounded-[24px] border p-4 shadow-soft", tones[tone], className)}>
      <p className="font-bold">{title}</p>
      {children ? <div className="mt-2 text-sm leading-6">{children}</div> : null}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
        ) : null}
        <h2 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function MetricCard({ label, value, hint }) {
  return (
    <Panel className="bg-[linear-gradient(180deg,#ffffff_0%,#f7f4ec_100%)]">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
      {hint ? <p className="mt-2 text-sm text-slate-500">{hint}</p> : null}
    </Panel>
  );
}

export function EmptyState({ title, children }) {
  return (
    <Panel className="border-dashed bg-white/80 text-center">
      <h3 className="text-lg font-bold text-slate-950">{title}</h3>
      {children ? <p className="mt-2 text-sm leading-6 text-slate-600">{children}</p> : null}
    </Panel>
  );
}

export function LoadingScreen({ label = "Loading QRDine..." }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,#fffdf7_0%,#f4efe5_100%)] px-4">
      <Panel className="max-w-sm text-center">
        <LoaderCircle className="mx-auto mb-4 h-10 w-10 animate-spin text-primary" />
        <p className="text-lg font-semibold text-slate-900">{label}</p>
      </Panel>
    </main>
  );
}

export function StatusBadge({ status, kind = "order" }) {
  const value = String(status || "").toLowerCase();
  const tones = {
    available: "bg-emerald-100 text-emerald-800",
    occupied: "bg-orange-100 text-orange-900",
    reserved: "bg-blue-100 text-blue-800",
    cleaning: "bg-slate-200 text-slate-700",
    new: "bg-orange-100 text-orange-900",
    accepted: "bg-blue-100 text-blue-900",
    preparing: "bg-amber-100 text-amber-900",
    ready: "bg-emerald-100 text-emerald-900",
    served: "bg-slate-200 text-slate-700",
    paid: "bg-emerald-100 text-emerald-900",
    unpaid: "bg-orange-100 text-orange-900",
    pending: "bg-blue-100 text-blue-900",
    failed: "bg-red-100 text-red-900",
    cancelled: "bg-red-100 text-red-900",
  };

  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]", tones[value] || "bg-slate-100 text-slate-700")}>
      {kind === "payment" ? paymentStatusLabel(value) : orderStatusLabel(value)}
    </span>
  );
}

export function BottomSheet({ open, title, onClose, children }) {
  return (
    <div className={cn("fixed inset-0 z-40 transition", open ? "pointer-events-auto" : "pointer-events-none")}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className={cn("absolute inset-0 bg-slate-950/45 transition", open ? "opacity-100" : "opacity-0")}
      />
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[32px] bg-[#fffdf7] p-5 shadow-[0_-18px_48px_rgba(17,24,39,0.18)] transition",
          open ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-slate-300" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold text-slate-950">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
