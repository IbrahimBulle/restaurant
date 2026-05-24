import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { CreditCard, ReceiptText, Smartphone } from "lucide-react";
import { useParams } from "react-router-dom";

import { CustomerHero, CartFloatingBar, CartLine, CategoryChips, MenuCard, OrderTimeline, SearchBar } from "../components/customer";
import { BottomSheet, Button, EmptyState, LoadingScreen, Notice, Panel, SectionHeading, StatusBadge } from "../components/ui";
import { useRealtime } from "../hooks/useRealtime";
import { api } from "../lib/api";
import { formatDateTime, money, paymentMethodLabel, paymentStatusLabel, safeArray } from "../lib/format";
import { useCustomerStore } from "../store/customer-store";

export function CustomerOrderPage() {
  const { tableSlug = "" } = useParams();
  const customerState = useCustomerStore((state) => state.tables[tableSlug]);
  const setSessionToken = useCustomerStore((state) => state.setSessionToken);
  const setCustomerName = useCustomerStore((state) => state.setCustomerName);
  const addToCart = useCustomerStore((state) => state.addToCart);
  const setItemQuantity = useCustomerStore((state) => state.setItemQuantity);
  const setItemNotes = useCustomerStore((state) => state.setItemNotes);
  const clearCart = useCustomerStore((state) => state.clearCart);
  const setActiveOrderId = useCustomerStore((state) => state.setActiveOrder);

  const sessionToken = customerState?.sessionToken || "";
  const customerName = customerState?.customerName || "";
  const cart = customerState?.cart || [];
  const storedOrderId = customerState?.activeOrderId || null;

  const [menu, setMenu] = useState({ categories: [], items: [] });
  const [table, setTable] = useState(null);
  const [session, setSession] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState("");
  const [cashFeedback, setCashFeedback] = useState("");
  const [error, setError] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentPhone, setPaymentPhone] = useState("+2547");
  const [nameDraft, setNameDraft] = useState(customerName);
  const customerNameRef = useRef(customerName);

  const deferredSearch = useDeferredValue(search);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.quantity * item.price_cents, 0);
  const categoryLookup = useMemo(
    () => Object.fromEntries(safeArray(menu.categories).map((category) => [category.id, category])),
    [menu.categories],
  );
  const showCartPanel = cart.length > 0 || !activeOrder;

  const filteredItems = useMemo(() => {
    const needle = deferredSearch.trim().toLowerCase();
    return safeArray(menu.items).filter((item) => {
      const matchesCategory = !activeCategory || String(item.category_id) === String(activeCategory);
      const matchesSearch =
        !needle ||
        item.name.toLowerCase().includes(needle) ||
        item.description.toLowerCase().includes(needle);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, deferredSearch, menu.items]);

  useEffect(() => {
    customerNameRef.current = customerName;
  }, [customerName]);

  useEffect(() => {
    setNameDraft(customerName);
  }, [customerName, tableSlug]);

  const commitCustomerName = useCallback(
    (value) => {
      const normalized = value.trim();
      if (normalized !== customerName) {
        setCustomerName(tableSlug, normalized);
      }
      return normalized;
    },
    [customerName, setCustomerName, tableSlug],
  );

  const fetchOrder = useCallback(
    async (orderId, currentSessionToken) => {
      if (!orderId || !currentSessionToken) return;
      try {
        const order = await api.get(`/api/public/orders/${orderId}`, {
          params: { session_token: currentSessionToken },
        });
        setActiveOrder(order);
        setActiveOrderId(tableSlug, order.id);
      } catch (fetchError) {
        if (!/session token/i.test(fetchError.message)) {
          setError(fetchError.message);
        }
      }
    },
    [setActiveOrderId, tableSlug],
  );

  const refreshContext = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [menuData, contextData] = await Promise.all([
        api.get("/api/public/menu"),
        api.get(`/api/public/tables/${tableSlug}`, {
          params: {
            session_token: sessionToken,
            customer_name: customerNameRef.current,
          },
        }),
      ]);

      setMenu({
        categories: safeArray(menuData.categories),
        items: safeArray(menuData.items),
      });
      setTable(contextData.table);
      setSession(contextData.session);
      setSessionToken(tableSlug, contextData.session.token);
      if (contextData.active_order) {
        setActiveOrder(contextData.active_order);
        setActiveOrderId(tableSlug, contextData.active_order.id);
      } else if (storedOrderId && contextData.session?.token) {
        await fetchOrder(storedOrderId, contextData.session.token);
      } else {
        setActiveOrder(null);
      }
      if (!activeCategory && contextData.table) {
        startTransition(() => {
          const firstCategory = safeArray(menuData.categories)[0];
          if (firstCategory?.id) {
            setActiveCategory(String(firstCategory.id));
          }
        });
      }
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, fetchOrder, sessionToken, setActiveOrderId, setSessionToken, storedOrderId, tableSlug]);

  useEffect(() => {
    refreshContext();
  }, [refreshContext]);

  useEffect(() => {
    if (activeCategory || !menu.categories?.length) return;
    setActiveCategory(String(menu.categories[0].id));
  }, [activeCategory, menu.categories]);

  useRealtime(Boolean(sessionToken || activeOrder?.id), (event) => {
    if (!activeOrder?.id) return;
    if ((event.type === "order.updated" || event.type === "payment.updated" || event.type === "receipt.created")) {
      if (event.type === "payment.updated" && event.data?.order_id !== activeOrder.id) return;
      if (event.type !== "payment.updated" && event.data?.id !== activeOrder.id && event.data?.order_id !== activeOrder.id) return;
      fetchOrder(activeOrder.id, sessionToken || session?.token || "");
    }
  });

  async function placeOrder() {
    if (!cart.length) return;
    setPlacing(true);
    setError("");
    try {
      const submittedName = commitCustomerName(nameDraft);
      const order = await api.post("/api/public/orders", {
        table_id: table?.id,
        session_token: sessionToken,
        customer_name: submittedName || "Guest",
        source: "qr",
        items: cart.map((item) => ({
          menu_item_id: item.id,
          quantity: item.quantity,
          notes: item.notes,
        })),
      });
      setActiveOrder(order);
      setActiveOrderId(tableSlug, order.id);
      clearCart(tableSlug);
      setCartOpen(false);
      setCashFeedback("");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setPlacing(false);
    }
  }

  async function requestCashPayment() {
    if (!activeOrder?.id || !sessionToken) return;
    setPaymentLoading("cash");
    setError("");
    setCashFeedback("");
    try {
      const result = await api.post(
        `/api/public/orders/${activeOrder.id}/payments/cash?session_token=${encodeURIComponent(sessionToken)}`,
        {
          amount_cents: activeOrder.total_cents,
          reference: "cash-request",
        },
      );
      setActiveOrder(result.order);
      setCashFeedback("Cash request sent. A cashier can settle this order from the payment dashboard.");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setPaymentLoading("");
    }
  }

  async function requestMpesaPayment() {
    if (!activeOrder?.id || !sessionToken) return;
    setPaymentLoading("mpesa");
    setError("");
    setCashFeedback("");
    try {
      const result = await api.post(
        `/api/public/orders/${activeOrder.id}/payments/mpesa?session_token=${encodeURIComponent(sessionToken)}`,
        {
          amount_cents: activeOrder.total_cents,
          phone_number: paymentPhone,
        },
      );
      setActiveOrder(result.order);
      if (result.order.payment_status === "paid") {
        setCashFeedback("M-Pesa payment confirmed. Your receipt is now available.");
      } else {
        setCashFeedback("M-Pesa request sent. The cashier will see the update instantly.");
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setPaymentLoading("");
    }
  }

  if (loading) {
    return <LoadingScreen label="Loading your table menu..." />;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,232,202,0.7),transparent_38%),linear-gradient(180deg,#fffdf7_0%,#f3eee4_100%)] text-foreground">
      <CustomerHero table={table} itemCount={cartCount} activeOrder={activeOrder} />

      <div className="mx-auto max-w-6xl px-4 py-6">
        {error ? (
          <Notice title="Ordering needs attention" tone="danger" className="mb-5">
            {error}
          </Notice>
        ) : null}

        {cashFeedback ? (
          <Notice title="Payment update" tone="success" className="mb-5">
            {cashFeedback}
          </Notice>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            {activeOrder ? (
              <div className="lg:hidden">
                <ActiveOrderPanel
                  activeOrder={activeOrder}
                  paymentPhone={paymentPhone}
                  onPaymentPhoneChange={setPaymentPhone}
                  paymentLoading={paymentLoading}
                  onRequestCash={requestCashPayment}
                  onRequestMpesa={requestMpesaPayment}
                />
              </div>
            ) : null}

            <Panel className="overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(246,243,234,0.98))]">
              <SectionHeading
                eyebrow="Menu"
                title="Choose your dishes"
                description="Search, tap add, and send the order when you are ready."
                action={<SearchBar value={search} onChange={(event) => setSearch(event.target.value)} />}
              />
              <CategoryChips categories={safeArray(menu.categories)} activeCategory={activeCategory} onSelect={setActiveCategory} />
            </Panel>

            {menu.categories.length === 0 ? (
              <EmptyState title="No dishes are live yet">The restaurant team still needs to publish the menu.</EmptyState>
            ) : null}
            {filteredItems.length === 0 && menu.categories.length > 0 ? (
              <EmptyState title="No dishes matched that search">Try another keyword or switch to a different category.</EmptyState>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  categoryName={categoryLookup[item.category_id]?.name}
                  onAdd={(menuItem) => addToCart(tableSlug, menuItem)}
                />
              ))}
            </div>
          </div>

          <aside className="hidden space-y-4 lg:block">
            {showCartPanel ? (
              <CartPanel
                cart={cart}
                cartTotal={cartTotal}
                customerName={nameDraft}
                onNameChange={setNameDraft}
                onNameCommit={commitCustomerName}
                onDecrease={(item) => setItemQuantity(tableSlug, item.id, item.quantity - 1)}
                onIncrease={(item) => setItemQuantity(tableSlug, item.id, item.quantity + 1)}
                onNotesChange={(item, value) => setItemNotes(tableSlug, item.id, value)}
                onSubmit={placeOrder}
                placing={placing}
              />
            ) : null}
            {activeOrder ? (
              <ActiveOrderPanel
                activeOrder={activeOrder}
                paymentPhone={paymentPhone}
                onPaymentPhoneChange={setPaymentPhone}
                paymentLoading={paymentLoading}
                onRequestCash={requestCashPayment}
                onRequestMpesa={requestMpesaPayment}
              />
            ) : null}
          </aside>
        </div>
      </div>

      {cartCount > 0 ? <CartFloatingBar itemCount={cartCount} total={cartTotal} onOpen={() => setCartOpen(true)} /> : null}

      <BottomSheet open={cartOpen} title="Your cart" onClose={() => setCartOpen(false)}>
        <div className="space-y-4">
          <CartPanel
            cart={cart}
            cartTotal={cartTotal}
            customerName={nameDraft}
            onNameChange={setNameDraft}
            onNameCommit={commitCustomerName}
            onDecrease={(item) => setItemQuantity(tableSlug, item.id, item.quantity - 1)}
            onIncrease={(item) => setItemQuantity(tableSlug, item.id, item.quantity + 1)}
            onNotesChange={(item, value) => setItemNotes(tableSlug, item.id, value)}
            onSubmit={placeOrder}
            placing={placing}
          />
          {activeOrder ? (
            <ActiveOrderPanel
              activeOrder={activeOrder}
              paymentPhone={paymentPhone}
              onPaymentPhoneChange={setPaymentPhone}
              paymentLoading={paymentLoading}
              onRequestCash={requestCashPayment}
              onRequestMpesa={requestMpesaPayment}
            />
          ) : null}
        </div>
      </BottomSheet>
    </main>
  );
}

function CartPanel({
  cart,
  cartTotal,
  customerName,
  onNameChange,
  onNameCommit,
  onDecrease,
  onIncrease,
  onNotesChange,
  onSubmit,
  placing,
}) {
  return (
    <Panel className="bg-[linear-gradient(180deg,#ffffff_0%,#f8f4ec_100%)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <ReceiptText size={18} />
            Cart
          </h2>
          <p className="mt-1 text-sm text-slate-500">{cart.length} dishes selected</p>
        </div>
        <span className="rounded-full bg-accent/15 px-3 py-2 text-sm font-bold text-orange-800">{money(cartTotal)}</span>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-semibold text-slate-700">Guest name</label>
        <input
          className="h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          placeholder="Optional"
          value={customerName}
          onChange={(event) => onNameChange(event.target.value)}
          onBlur={(event) => onNameCommit(event.target.value)}
        />
      </div>

      <div className="mt-4 space-y-3">
        {cart.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-border bg-white/70 p-5 text-sm text-slate-600">
            Add dishes to start your order.
          </div>
        ) : null}

        {cart.map((item) => (
          <CartLine
            key={item.id}
            item={item}
            onDecrease={() => onDecrease(item)}
            onIncrease={() => onIncrease(item)}
            onNotesChange={(value) => onNotesChange(item, value)}
          />
        ))}
      </div>

      <div className="mt-5 rounded-[22px] bg-slate-950 p-4 text-white">
        <div className="flex items-center justify-between text-sm text-slate-300">
          <span>Total</span>
          <span>{money(cartTotal)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm text-slate-300">
          <span>VAT included</span>
          <span>{money((cartTotal * 16) / 116)}</span>
        </div>
      </div>

      <Button className="mt-5 h-12 w-full text-base" disabled={!cart.length || placing} onClick={onSubmit}>
        {placing ? "Sending order..." : "Place order"}
      </Button>
    </Panel>
  );
}

function ActiveOrderPanel({
  activeOrder,
  paymentPhone,
  onPaymentPhoneChange,
  paymentLoading,
  onRequestCash,
  onRequestMpesa,
}) {
  const phoneDigits = paymentPhone.replace(/\D/g, "");
  const mpesaDisabled = paymentLoading === "mpesa" || phoneDigits.length < 10;

  return (
    <Panel className="bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(239,248,243,0.96))]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">Live order</p>
          <h2 className="text-xl font-bold">Order #{activeOrder.id}</h2>
          <p className="mt-1 text-sm text-slate-500">{formatDateTime(activeOrder.updated_at || activeOrder.created_at)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={activeOrder.status} />
          <StatusBadge status={activeOrder.payment_status} kind="payment" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-[20px] bg-white px-4 py-3 shadow-[inset_0_0_0_1px_rgba(221,229,222,0.8)]">
        <div>
          <p className="text-sm font-semibold text-slate-500">Amount due</p>
          <p className="mt-1 text-lg font-bold text-slate-950">{money(activeOrder.total_cents)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-500">Payment</p>
          <p className="mt-1 text-sm font-bold text-slate-950">{paymentStatusLabel(activeOrder.payment_status)}</p>
        </div>
      </div>

      <div className="mt-4">
        <OrderTimeline status={activeOrder.status} />
      </div>

      {(activeOrder.payments || []).length > 0 ? (
        <div className="mt-4 space-y-2">
          {(activeOrder.payments || []).map((payment) => (
            <div key={payment.id} className="rounded-[18px] bg-white p-3 shadow-[inset_0_0_0_1px_rgba(221,229,222,0.8)]">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-slate-900">
                  {paymentMethodLabel(payment.method)} • {money(payment.amount_cents)}
                </p>
                <StatusBadge status={payment.status} kind="payment" />
              </div>
              {payment.reference ? <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">{payment.reference}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      {activeOrder.payment_status !== "paid" ? (
        <div className="mt-5 rounded-[22px] border border-border bg-white p-4">
          <div className="flex items-start gap-3">
            <Smartphone className="mt-0.5 text-primary" />
            <div>
              <p className="font-bold text-slate-950">Pay with M-Pesa STK push</p>
              <p className="text-sm text-slate-600">Use the phone number registered for M-Pesa.</p>
            </div>
          </div>
          <input
            className="mt-4 h-11 w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            placeholder="+2547..."
            value={paymentPhone}
            onChange={(event) => onPaymentPhoneChange(event.target.value)}
          />
          <Button className="mt-4 w-full" disabled={mpesaDisabled} onClick={onRequestMpesa}>
            {paymentLoading === "mpesa" ? "Sending STK push..." : "Pay now with M-Pesa"}
          </Button>
          <Button
            variant="ghost"
            className="mt-3 w-full border border-border"
            disabled={paymentLoading === "cash"}
            onClick={onRequestCash}
          >
            <CreditCard size={16} />
            {paymentLoading === "cash" ? "Sending cash request..." : "Pay with cash instead"}
          </Button>
        </div>
      ) : (
        <Notice title="Payment complete" tone="success" className="mt-5">
          Your order is settled.
        </Notice>
      )}
    </Panel>
  );
}
