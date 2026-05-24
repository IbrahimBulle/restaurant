import { Component } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";

import { Notice } from "./components/ui";
import { OWNER_HOME } from "./lib/config";
import { useAuthStore } from "./store/auth-store";
import { CustomerOrderPage } from "./pages/CustomerOrderPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";

function RootRedirect() {
  const token = useAuthStore((state) => state.token);
  if (!token) return <Navigate to="/app/login" replace />;
  return <Navigate to={OWNER_HOME} replace />;
}

function ProtectedRoute() {
  const token = useAuthStore((state) => state.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/app/login" replace state={{ from: location }} />;
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
          <Notice title="MauzoHub could not render this screen" tone="danger">
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
            <Route path="/app/dashboard" element={<DashboardPage />} />
            <Route path="/app/dashboard/:section" element={<DashboardPage />} />
            <Route path="/app/admin" element={<Navigate to={OWNER_HOME} replace />} />
            <Route path="/app/chef" element={<Navigate to={OWNER_HOME} replace />} />
            <Route path="/app/waiter" element={<Navigate to={OWNER_HOME} replace />} />
            <Route path="/app/cashier" element={<Navigate to={OWNER_HOME} replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
