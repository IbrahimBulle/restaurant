import { BarChart3, Boxes, LogIn, QrCode, ShoppingBag, Store } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { api } from "../lib/api";
import { OWNER_HOME } from "../lib/config";
import { Button, Notice, Panel } from "../components/ui";
import { useAuthStore } from "../store/auth-store";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  const token = useAuthStore((state) => state.token);
  const [email, setEmail] = useState("owner@mauzohub.local");
  const [password, setPassword] = useState("Password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      navigate(OWNER_HOME, { replace: true });
    }
  }, [navigate, token]);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const session = await api.post("/api/auth/login", { email, password });
      setSession(session);
      navigate(location.state?.from?.pathname || OWNER_HOME, { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,232,202,0.6),transparent_40%),linear-gradient(180deg,#fffdf7_0%,#f3eee4_100%)] px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="rounded-[34px] border border-white/70 bg-[linear-gradient(155deg,rgba(15,61,47,0.96),rgba(20,86,67,0.92))] p-8 text-white shadow-[0_28px_80px_rgba(15,23,42,0.12)] sm:p-10">
          <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-50">
            <Store size={16} />
            MauzoHub Business OS
          </div>
          <h1 className="mt-6 max-w-xl text-4xl font-bold leading-tight sm:text-5xl">
            One smooth dashboard for products, stock, QR ordering, payments, and daily profit.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-emerald-50/90 sm:text-lg">
            Built for small shops, cafes, kiosks, and restaurants that need one simple place to manage sales, inventory, receipts, and live customer orders.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <FeatureCard icon={QrCode} title="QR ordering" text="Customers scan, browse, order, and pay from a mobile page linked to the right table or order point." />
            <FeatureCard icon={ShoppingBag} title="Live orders" text="New orders appear instantly and move from pending to preparing, ready, completed, and paid." />
            <FeatureCard icon={Boxes} title="Inventory tracking" text="Stock adjusts after sales and low-stock alerts help you restock before products run out." />
            <FeatureCard icon={BarChart3} title="Owner analytics" text="See revenue, payment mix, top products, and estimated profit from one dashboard." />
          </div>
        </section>

        <section className="flex items-center">
          <Panel className="w-full rounded-[34px] border-white/80 bg-white/72 p-8 shadow-[0_28px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Owner login</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950">Open your business dashboard</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Sign in once and manage products, orders, QR codes, inventory, receipts, payments, and analytics from one place.
            </p>

            {error ? (
              <Notice title="Could not sign in" tone="danger" className="mt-5">
                {error}
              </Notice>
            ) : null}

            <form className="mt-6 space-y-4" onSubmit={submit}>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
                <input
                  className="h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
                <input
                  className="h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <Button type="submit" className="h-12 w-full text-base" disabled={loading}>
                <LogIn size={16} />
                {loading ? "Signing in..." : "Open dashboard"}
              </Button>
            </form>

            <div className="mt-6 rounded-[24px] border border-accent/30 bg-orange-50 p-4 text-sm text-orange-900">
              <p className="font-bold">Default local owner account</p>
              <p className="mt-2">`owner@mauzohub.local`</p>
              <p className="mt-1">Password: `Password123`</p>
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({ icon: Icon, title, text }) {
  return (
    <div className="rounded-[24px] border border-white/12 bg-white/8 p-4">
      <Icon size={18} className="text-emerald-100" />
      <h3 className="mt-3 text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-emerald-50/85">{text}</p>
    </div>
  );
}
