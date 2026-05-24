import { create } from "zustand";
import { persist } from "zustand/middleware";

function makeTableState() {
  return {
    sessionToken: "",
    customerName: "",
    cart: [],
    activeOrderId: null,
  };
}

function withTable(state, tableSlug) {
  return state.tables[tableSlug] || makeTableState();
}

export const useCustomerStore = create(
  persist(
    (set, get) => ({
      tables: {},
      setSessionToken(tableSlug, sessionToken) {
        set((state) => ({
          tables: {
            ...state.tables,
            [tableSlug]: {
              ...withTable(state, tableSlug),
              sessionToken,
            },
          },
        }));
      },
      setCustomerName(tableSlug, customerName) {
        set((state) => ({
          tables: {
            ...state.tables,
            [tableSlug]: {
              ...withTable(state, tableSlug),
              customerName,
            },
          },
        }));
      },
      addToCart(tableSlug, item) {
        set((state) => {
          const table = withTable(state, tableSlug);
          const existing = table.cart.find((entry) => entry.id === item.id);
          const cart = existing
            ? table.cart.map((entry) =>
                entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry,
              )
            : [...table.cart, { ...item, quantity: 1, notes: "" }];
          return {
            tables: {
              ...state.tables,
              [tableSlug]: { ...table, cart },
            },
          };
        });
      },
      setItemQuantity(tableSlug, itemId, quantity) {
        set((state) => {
          const table = withTable(state, tableSlug);
          const cart = table.cart
            .map((item) => (item.id === itemId ? { ...item, quantity } : item))
            .filter((item) => item.quantity > 0);
          return {
            tables: {
              ...state.tables,
              [tableSlug]: { ...table, cart },
            },
          };
        });
      },
      setItemNotes(tableSlug, itemId, notes) {
        set((state) => {
          const table = withTable(state, tableSlug);
          const cart = table.cart.map((item) =>
            item.id === itemId ? { ...item, notes } : item,
          );
          return {
            tables: {
              ...state.tables,
              [tableSlug]: { ...table, cart },
            },
          };
        });
      },
      clearCart(tableSlug) {
        set((state) => ({
          tables: {
            ...state.tables,
            [tableSlug]: {
              ...withTable(state, tableSlug),
              cart: [],
            },
          },
        }));
      },
      setActiveOrder(tableSlug, activeOrderId) {
        set((state) => ({
          tables: {
            ...state.tables,
            [tableSlug]: {
              ...withTable(state, tableSlug),
              activeOrderId,
            },
          },
        }));
      },
      resetTable(tableSlug) {
        set((state) => ({
          tables: {
            ...state.tables,
            [tableSlug]: makeTableState(),
          },
        }));
      },
      getTable(tableSlug) {
        return withTable(get(), tableSlug);
      },
    }),
    {
      name: "qrdine-customer",
      partialize: (state) => ({ tables: state.tables }),
    },
  ),
);
