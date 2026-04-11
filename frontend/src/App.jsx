import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe } from "./features/auth/authSlice.js";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Payment from "./pages/Payment.jsx";
import PaymentReturn from "./pages/PaymentReturn.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import BookReader from "./pages/BookReader.jsx";

export default function App() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const stored = localStorage.getItem("biblionerd-theme");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    if (token) {
      dispatch(fetchMe());
    }
  }, [dispatch, token]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("biblionerd-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  return (
    <Layout theme={theme} onToggleTheme={toggleTheme}>
      <Routes>
        <Route
          path="/"
          element={<Home />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pricing" element={<Payment />} />
        <Route
          path="/payment/return"
          element={
            <ProtectedRoute>
              <PaymentReturn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />
        <Route
          path="/read/:bookId"
          element={
            <ProtectedRoute>
              <BookReader />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
