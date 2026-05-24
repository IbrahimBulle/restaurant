import { Component } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";

import { Notice } from "./components/ui";
import { ROLE_HOME } from "./lib/config";
import { useAuthStore } from "./store/auth-store";
import { CustomerOrderPage } from "./pages/CustomerOrderPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";

function roleHome(role) {
  return ROLE_HOME[role] || "/app/admin";
}

function RootRedirect() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  if (!token) return <Navigate to="/app/login" replace />;
  if (user?.role) return <Navigate to={roleHome(user.role)} replace />;
  return <Navigate to="/app/admin" replace />;
}

function ProtectedRoute({ roles }) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/app/login" replace state={{ from: location }} />;
  }
  if (user?.role && roles?.length && !roles.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />;
  }
  return <Outlet />;
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="grid min-h-screen place-items-center bg-background px-4">
          <Notice title="QRDine could not render this screen" tone="danger">
            {this.state.error.message}
          </Notice>
        </main>
      );
    }
    return this.props.children;
  }
}

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/order/:tableSlug" element={<CustomerOrderPage />} />
          <Route path="/app/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<RootRedirect />} />
          </Route>

          <Route element={<ProtectedRoute roles={["admin", "manager"]} />}>
            <Route path="/app/admin" element={<DashboardPage mode="admin" />} />
          </Route>

          <Route element={<ProtectedRoute roles={["chef"]} />}>
            <Route path="/app/chef" element={<DashboardPage mode="chef" />} />
          </Route>

          <Route element={<ProtectedRoute roles={["waiter"]} />}>
            <Route path="/app/waiter" element={<DashboardPage mode="waiter" />} />
          </Route>

          <Route element={<ProtectedRoute roles={["cashier"]} />}>
            <Route path="/app/cashier" element={<DashboardPage mode="cashier" />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
