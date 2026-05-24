import { LogOut, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  AnalyticsBoard,
  DesktopSidebar,
  InventoryBoard,
  MobileBottomNav,
  MoreBoard,
  moreSections,
  OrderPointsBoard,
  OrdersBoard,
  OverviewBoard,
  PaymentsBoard,
  ProductsBoard,
  ReceiptsBoard,
  SecondarySectionNav,
  SettingsBoard,
} from "../components/dashboard";
import { Button, LoadingScreen, Notice, Panel } from "../components/ui";
import { useRealtime } from "../hooks/useRealtime";
import { api } from "../lib/api";
import { OWNER_HOME } from "../lib/config";
import { escapeHtml, openPrintWindow } from "../lib/print";
import { formatDateTime, money, safeArray } from "../lib/format";
import { useAuthStore } from "../store/auth-store";

const validSections = new Set(["overview", "orders", "products", "inventory", "more", "qr", "payments", "analytics", "receipts", "settings"]);

export function DashboardPage() {
  const { section = "overview" } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const patchUser = useAuthStore((state) => state.patchUser);
  const logout = useAuthStore((state) => state.logout);

  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tables, setTables] = useState([]);
  const [settings, setSettings] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const activeSection = validSections.has(section) ? section : "overview";
  const showSecondaryNav = activeSection === "more" || moreSections.includes(activeSection);

  useEffect(() => {
    if (!token) {
      navigate("/app/login", { replace: true });
    }
  }, [navigate, token]);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [me, dashboardData, orderData, productData, categoryData, tableData, settingsData, movementData] = await Promise.all([
        api.get("/api/me"),
        api.get("/api/dashboard"),
        api.get("/api/orders", { params: { limit: 200 } }),
        api.get("/api/products"),
        api.get("/api/categories"),
        api.get("/api/tables"),
        api.get("/api/settings"),
        api.get("/api/inventory/movements", { params: { limit: 30 } }),
      ]);

      patchUser({ id: me.id, email: me.email, role: me.role, name: me.name || user?.name });
      setDashboard(dashboardData);
      setOrders(safeArray(orderData));
      setProducts(safeArray(productData));
      setCategories(safeArray(categoryData));
      setTables(safeArray(tableData));
      setSettings(settingsData);
      setMovements(safeArray(movementData));
    } catch (refreshError) {
      setError(refreshError.message);
      if (/token|unauthorized|refresh/i.test(refreshError.message)) {
        logout();
        navigate("/app/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [logout, navigate, patchUser, token, user?.name]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtime(Boolean(token), (event) => {
    if (event.type.startsWith("order.") || event.type.startsWith("payment.") || event.type.startsWith("table.") || event.type.startsWith("receipt.")) {
      refresh();
    }
  });

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const businessName = dashboard?.business?.business_name || settings?.business_name || user?.name || "MauzoHub";

  const paidOrders = useMemo(() => orders.filter((order) => order.payment_status === "paid"), [orders]);

  function goToSection(nextSection) {
    navigate(`${OWNER_HOME}/${nextSection}`, { replace: false });
  }

  function notify(message) {
    setToast(message);
  }

  async function updateStatus(orderId, status) {
    await api.patch(`/api/orders/${orderId}/status`, { status });
    notify("Order updated.");
    await refresh();
  }

  async function createTable(data) {
    await api.post("/api/tables", data);
    notify("Order point created.");
    await refresh();
  }

  async function persistQrImage(tableId, imageData) {
    const updated = await api.put(`/api/tables/${tableId}/qrcode`, { image_data: imageData });
    setTables((current) => current.map((table) => (table.id === updated.id ? updated : table)));
  }

  async function createCategory(data) {
    await api.post("/api/categories", data);
    notify("Category created.");
    await refresh();
  }

  async function saveProduct(id, data) {
    if (id) {
      await api.put(`/api/products/${id}`, data);
      notify("Product updated.");
    } else {
      await api.post("/api/products", data);
      notify("Product created.");
    }
    await refresh();
  }

  async function archiveProduct(id) {
    await api.delete(`/api/products/${id}`);
    notify("Product archived.");
    await refresh();
  }

  async function adjustInventory(data) {
    await api.post("/api/inventory/adjust", data);
    notify("Inventory adjusted.");
    await refresh();
  }

  async function markCashPaid(orderId, amountCents) {
    await api.post("/api/payments/cash", {
      order_id: orderId,
      amount_cents: amountCents,
      reference: "owner-cash",
    });
    notify("Cash payment recorded.");
    await refresh();
  }

  async function confirmMpesa(paymentId) {
    await api.post(`/api/payments/${paymentId}/confirm`, { reference: "" });
    notify("M-Pesa payment confirmed.");
    await refresh();
  }

  async function saveBusinessSettings(data) {
    const saved = await api.put("/api/settings", data);
    setSettings(saved);
    notify("Settings saved.");
    await refresh();
  }

  function printReceipt(order) {
    const footer = settings?.receipt_footer || dashboard?.business?.receipt_footer || "Thank you for your purchase.";
    const business = settings?.business_name || dashboard?.business?.business_name || "MauzoHub";
    openPrintWindow(
      `Receipt ${escapeHtml(order.receipt?.receipt_number || `Order ${order.id}`)}`,
      `
      <div class="sheet">
        <article class="card">
          <p class="eyebrow">${escapeHtml(business)}</p>
          <h1>Receipt ${escapeHtml(order.receipt?.receipt_number || `Order ${order.id}`)}</h1>
          <p class="muted">${escapeHtml(order.table_number ? `Order point ${order.table_number}` : "Walk-in order")}</p>
          <p class="muted">Issued ${escapeHtml(formatDateTime(order.updated_at || order.created_at))}</p>
          <div class="code">${escapeHtml(order.payments?.[0]?.reference || "Payment confirmed")}</div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items || [])
                .map(
                  (item) => `
                <tr>
                  <td>${escapeHtml(`${item.quantity} x ${item.menu_item_name}`)}</td>
                  <td>${escapeHtml(money(item.quantity * item.unit_price_cents))}</td>
                </tr>`,
                )
                .join("")}
            </tbody>
          </table>
          <p class="muted">VAT included: ${escapeHtml(money(order.vat_cents))}</p>
          <h2 style="margin-top:16px;">Total ${escapeHtml(money(order.total_cents))}</h2>
          <p class="muted" style="margin-top:18px;">${escapeHtml(footer)}</p>
        </article>
      </div>`,
    );
  }

  if (!token) return null;

  if (loading && !dashboard) {
    return <LoadingScreen label="Loading your business dashboard..." />;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,232,202,0.72),transparent_38%),linear-gradient(180deg,#fffdf7_0%,#f4efe5_100%)]">
      <div className="mx-auto flex max-w-[1500px] gap-6 px-4 pb-28 pt-4 lg:px-6 lg:pb-8">
        <DesktopSidebar activeSection={activeSection} businessName={businessName} onNavigate={goToSection} />

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 mb-5 rounded-[28px] border border-white/70 bg-white/84 px-4 py-4 shadow-soft backdrop-blur lg:px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Owner dashboard</p>
                <h1 className="mt-1 text-2xl font-bold text-slate-950">{businessName}</h1>
                <p className="mt-1 text-sm text-slate-500">
                  {user?.email || "Signed in"} • {sectionLabel(activeSection)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" className="border border-border" onClick={refresh}>
                  <RefreshCw size={16} />
                  Refresh
                </Button>
                <Button
                  variant="ghost"
                  className="border border-border"
                  onClick={() => {
                    logout();
                    navigate("/app/login", { replace: true });
                  }}
                >
                  <LogOut size={16} />
                  Logout
                </Button>
              </div>
            </div>
          </header>

          {toast ? (
            <div className="mb-4">
              <Notice title="Saved" tone="success">{toast}</Notice>
            </div>
          ) : null}

          {error ? (
            <Notice title="Dashboard sync needs attention" tone="danger" className="mb-5">
              {error}
            </Notice>
          ) : null}

          {loading ? (
            <Panel className="mb-5 flex items-center gap-3">
              <RefreshCw size={18} className="animate-spin text-primary" />
              <span className="text-sm font-semibold">Refreshing business data...</span>
            </Panel>
          ) : null}

          {showSecondaryNav ? <SecondarySectionNav activeSection={activeSection === "more" ? "qr" : activeSection} onNavigate={goToSection} /> : null}

          {activeSection === "overview" ? <OverviewBoard dashboard={dashboard} onNavigate={goToSection} /> : null}
          {activeSection === "orders" ? <OrdersBoard orders={orders} onStatus={updateStatus} onCashPaid={markCashPaid} onConfirmMpesa={confirmMpesa} onPrintReceipt={printReceipt} /> : null}
          {activeSection === "products" ? <ProductsBoard products={products} categories={categories} onCreateCategory={createCategory} onSaveProduct={saveProduct} onArchiveProduct={archiveProduct} /> : null}
          {activeSection === "inventory" ? <InventoryBoard products={products} movements={movements} onAdjustInventory={adjustInventory} /> : null}
          {activeSection === "qr" ? <OrderPointsBoard tables={tables} onCreateTable={createTable} onPersistQrImage={persistQrImage} /> : null}
          {activeSection === "payments" ? <PaymentsBoard orders={orders} onCashPaid={markCashPaid} onConfirmMpesa={confirmMpesa} onPrintReceipt={printReceipt} /> : null}
          {activeSection === "analytics" ? <AnalyticsBoard dashboard={dashboard} /> : null}
          {activeSection === "receipts" ? <ReceiptsBoard orders={paidOrders} onPrintReceipt={printReceipt} /> : null}
          {activeSection === "settings" ? <SettingsBoard settings={settings} onSave={saveBusinessSettings} /> : null}
          {activeSection === "more" ? <MoreBoard onNavigate={goToSection} /> : null}
        </div>
      </div>

      <MobileBottomNav activeSection={activeSection} onNavigate={goToSection} />
    </main>
  );
}

function sectionLabel(section) {
  switch (section) {
    case "overview":
      return "Overview";
    case "orders":
      return "Orders";
    case "products":
      return "Products";
    case "inventory":
      return "Inventory";
    case "qr":
      return "QR order points";
    case "payments":
      return "Payments";
    case "analytics":
      return "Analytics";
    case "receipts":
      return "Receipts";
    case "settings":
      return "Settings";
    default:
      return "More";
  }
}
