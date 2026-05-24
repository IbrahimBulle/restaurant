import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: "",
      refreshToken: "",
      user: null,
      setSession(session) {
        set((state) => ({
          token: session.token || session.access_token || state.token,
          refreshToken: session.refresh_token || state.refreshToken,
          user: session.user || state.user,
        }));
      },
      patchUser(userPatch) {
        set((state) => ({
          user: { ...(state.user || {}), ...(userPatch || {}) },
        }));
      },
      logout() {
        set({ token: "", refreshToken: "", user: null });
      },
      hasRole(role) {
        return get().user?.role === role;
      },
    }),
    {
      name: "qrdine-auth",
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
);
