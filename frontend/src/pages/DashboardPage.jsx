import { LayoutDashboard, LogOut, RefreshCw, Utensils } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AdminOverview, CashierBoard, KitchenQueue, MenuManager, StaffManager, TablesManager, WaiterBoard } from "../components/dashboard";
import { Button, LoadingScreen, Notice, Panel } from "../components/ui";
import { useRealtime } from "../hooks/useRealtime";
import { api } from "../lib/api";
import { ROLE_HOME } from "../lib/config";
import { escapeHtml, openPrintWindow } from "../lib/print";
import { formatDateTime, money, safeArray } from "../lib/format";
import { useAuthStore } from "../store/auth-store";

const emptyReports = {
  daily_sales: [],
  best_sellers: [],
  low_stock: [],
  payment_methods: [],
  daily_total_cents: 0,
  weekly_total_cents: 0,
  monthly_total_cents: 0,
  open_orders: 0,
  active_sessions: 0,
};

const adminTabs = [
  ["overview", "Overview"],
  ["menu", "Menu"],
  ["tables", "Tables"],
  ["staff", "Staff"],
];

const managerTabs = [
  ["overview", "Overview"],
  ["kitchen", "Kitchen"],
  ["waiter", "Floor"],
  ["cashier", "Cashier"],
  ["menu", "Menu"],
  ["tables", "Tables"],
];

const roleViews = {
  chef: "kitchen",
  waiter: "waiter",
  cashier: "cashier",
};

export function DashboardPage({ mode = "admin" }) {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const patchUser = useAuthStore((state) => state.patchUser);
  const logout = useAuthStore((state) => state.logout);

  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [reports, setReports] = useState(emptyReports);
  const [menu, setMenu] = useState({ categories: [], items: [] });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminTab, setAdminTab] = useState("overview");

  const role = user?.role || "";
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const adminLike = isAdmin || isManager;
  const currentView = adminLike ? adminTab : roleViews[role] || mode;

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const me = await api.get("/api/me");
      patchUser({ id: me.id, email: me.email, role: me.role });

      const nextRole = me.role;
      const [orderData, tableData, menuData, reportData, userData] = await Promise.all([
        api.get("/api/orders", { params: { limit: 200 } }),
        api.get("/api/tables"),
        api.get("/api/menu"),
        nextRole === "admin" || nextRole === "manager" || nextRole === "cashier"
          ? api.get("/api/reports/summary")
          : Promise.resolve(emptyReports),
        nextRole === "admin" || nextRole === "manager" ? api.get("/api/users") : Promise.resolve([]),
      ]);

      setOrders(safeArray(orderData));
      setTables(safeArray(tableData));
      setMenu({
        categories: safeArray(menuData.categories),
        items: safeArray(menuData.items),
      });
      setReports({ ...emptyReports, ...(reportData || {}) });
      setUsers(safeArray(userData));
    } catch (refreshError) {
      setError(refreshError.message);
      if (/token|unauthorized|refresh/i.test(refreshError.message)) {
        logout();
        navigate("/app/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [logout, navigate, patchUser, token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useRealtime(Boolean(token), (event) => {
    if (event.type.startsWith("order.") || event.type.startsWith("payment.") || event.type.startsWith("table.") || event.type.startsWith("receipt.")) {
      refresh();
    }
  });

  useEffect(() => {
    if (!user?.role) return;
    const home = ROLE_HOME[user.role] || "/app/admin";
    if (!adminLike && mode !== user.role) {
      navigate(home, { replace: true });
    }
  }, [adminLike, mode, navigate, user?.role]);

  const headerTabs = useMemo(() => {
    if (isAdmin) return adminTabs;
    if (isManager) return managerTabs;
    switch (role) {
      case "chef":
        return [["kitchen", "Kitchen"]];
      case "waiter":
        return [["waiter", "Floor"]];
      case "cashier":
        return [["cashier", "Cashier"]];
      default:
        return [];
    }
  }, [isAdmin, isManager, role]);

  useEffect(() => {
    if (!headerTabs.length) return;
    if (!headerTabs.some(([tabId]) => tabId === adminTab)) {
      setAdminTab(headerTabs[0][0]);
    }
  }, [adminTab, headerTabs]);

  async function updateStatus(orderId, status) {
    await api.patch(`/api/orders/${orderId}/status`, { status });
    await refresh();
  }

  async function createTable(data) {
    await api.post("/api/tables", data);
    await refresh();
  }

  async function persistQrImage(tableId, imageData) {
    const updated = await api.put(`/api/tables/${tableId}/qrcode`, { image_data: imageData });
    setTables((current) => current.map((table) => (table.id === updated.id ? updated : table)));
  }

  async function createCategory(data) {
    await api.post("/api/menu/categories", data);
    await refresh();
  }

  async function createMenuItem(data) {
    await api.post("/api/menu/items", data);
    await refresh();
  }

  async function updateMenuItem(id, data) {
    await api.patch(`/api/menu/items/${id}`, data);
    await refresh();
  }

  async function createUser(data) {
    await api.post("/api/users", data);
    await refresh();
  }

  async function markCashPaid(orderId, amountCents) {
    await api.post("/api/payments/cash", {
      order_id: orderId,
      amount_cents: amountCents,
      reference: "cashier-cash",
    });
    await refresh();
  }

  async function confirmMpesa(paymentId) {
    await api.post(`/api/payments/${paymentId}/confirm`, { reference: "" });
    await refresh();
  }

  function printReceipt(order) {
    openPrintWindow(
      `Receipt ${escapeHtml(order.receipt?.receipt_number || `Order ${order.id}`)}`,
      `
      <div class="sheet">
        <article class="card">
          <p class="eyebrow">QRDine Receipt</p>
          <h1>Receipt ${escapeHtml(order.receipt?.receipt_number || `Order ${order.id}`)}</h1>
          <p class="muted">Table ${escapeHtml(order.table_number || String(order.table_id || "Walk-in"))}</p>
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
        </article>
      </div>`,
    );
  }

  if (!token) return null;

  if (loading && orders.length === 0 && tables.length === 0) {
    return <LoadingScreen label="Loading live restaurant data..." />;
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffdf7_0%,#f4efe5_100%)]">
      <header className="sticky top-0 z-20 border-b border-border bg-white/88 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
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

          <div className="flex flex-col gap-3 lg:items-end">
            <nav className="flex flex-wrap gap-2">
              {headerTabs.map(([tabId, label]) => (
                <Button
                  key={tabId}
                  variant={currentView === tabId ? "primary" : "ghost"}
                  onClick={() => setAdminTab(tabId)}
                >
                  <LayoutDashboard size={16} />
                  {label}
                </Button>
              ))}
            </nav>
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
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {error ? (
          <Notice title="Dashboard sync needs attention" tone="danger" className="mb-5">
            {error}
          </Notice>
        ) : null}

        {loading ? (
          <Panel className="mb-5 flex items-center gap-3">
            <RefreshCw size={18} className="animate-spin text-primary" />
            <span className="text-sm font-semibold">Refreshing restaurant data...</span>
          </Panel>
        ) : null}

        {currentView === "overview" ? <AdminOverview reports={reports} tables={tables} orders={orders} /> : null}
        {currentView === "kitchen" ? <KitchenQueue orders={orders} onStatus={updateStatus} /> : null}
        {currentView === "waiter" ? <WaiterBoard orders={orders} tables={tables} onStatus={updateStatus} /> : null}
        {currentView === "cashier" ? (
          <CashierBoard
            orders={orders}
            onCashPaid={markCashPaid}
            onConfirmMpesa={confirmMpesa}
            onPrintReceipt={printReceipt}
          />
        ) : null}
        {currentView === "tables" ? (
          <TablesManager tables={tables} onCreateTable={createTable} onPersistQrImage={persistQrImage} />
        ) : null}
        {currentView === "menu" ? (
          <MenuManager menu={menu} onCreateCategory={createCategory} onCreateItem={createMenuItem} onUpdateItem={updateMenuItem} />
        ) : null}
        {currentView === "staff" ? <StaffManager users={users} onCreateUser={createUser} /> : null}
      </div>
    </main>
  );
}
