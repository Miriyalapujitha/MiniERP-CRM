
import { Routes, Route, Link, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  Receipt,
  LogOut,
  Shield,
} from "lucide-react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Challans from "./pages/Challans";

// ---------------- Private Route ----------------
function PrivateRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles?: string[];
}) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || !role) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const [role, setRole] = useState(localStorage.getItem("role"));
  const userName = localStorage.getItem("userName") || "User";

  useEffect(() => {
    const sync = () => setRole(localStorage.getItem("role"));
    window.addEventListener("storage", sync);
    sync();
    return () => window.removeEventListener("storage", sync);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    setRole(null);
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold">Mini ERP</h1>
          <p className="text-slate-400 text-sm mt-1">
            CRM & Inventory Suite
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {!role && (
            <Link
              to="/"
              className="block rounded-xl px-4 py-3 hover:bg-slate-800 transition"
            >
              Login
            </Link>
          )}

          {role && (
            <Link
              to="/dashboard"
              className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-slate-800 transition"
            >
              <LayoutDashboard size={20} />
              Dashboard
            </Link>
          )}

          {(role === "ADMIN" || role === "SALES") && (
            <Link
              to="/customers"
              className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-slate-800 transition"
            >
              <Users size={20} />
              Customers
            </Link>
          )}

          {(role === "ADMIN" || role === "WAREHOUSE") && (
            <Link
              to="/products"
              className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-slate-800 transition"
            >
              <Package size={20} />
              Products
            </Link>
          )}

          {(role === "ADMIN" ||
            role === "SALES" ||
            role === "ACCOUNTS") && (
            <Link
              to="/challans"
              className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-slate-800 transition"
            >
              <Receipt size={20} />
              Challans
            </Link>
          )}
        </nav>

        {role && (
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{userName}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Shield size={12} />
                  {role}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 hover:bg-red-700 transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-slate-100">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Mini ERP Dashboard
            </h2>
            <p className="text-sm text-slate-500">
              {new Date().toLocaleString()}
            </p>
          </div>

          {role && (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-800">
                  {userName}
                </p>
                <p className="text-xs text-slate-500">
                  {role}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Page Content */}
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Login />} />

            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            <Route
              path="/customers"
              element={
                <PrivateRoute allowedRoles={["ADMIN", "SALES"]}>
                  <Customers />
                </PrivateRoute>
              }
            />

            <Route
              path="/products"
              element={
                <PrivateRoute allowedRoles={["ADMIN", "WAREHOUSE"]}>
                  <Products />
                </PrivateRoute>
              }
            />

            <Route
              path="/challans"
              element={
                <PrivateRoute
                  allowedRoles={["ADMIN", "SALES", "ACCOUNTS"]}
                >
                  <Challans />
                </PrivateRoute>
              }
            />
          </Routes>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white px-8 py-3 text-center text-sm text-slate-500">
          Mini ERP + CRM © 2026 | Built with React, Express, Prisma & PostgreSQL
        </footer>
      </main>
    </div>
  );
}
