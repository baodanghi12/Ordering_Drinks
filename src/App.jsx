import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import './App.css';
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";
import Order from "./pages/Order";
import Orders from "./pages/Orders";
import Inventory from "./pages/Inventory";
import Settings from "./pages/Settings";
import ProductAdmin from "./pages/ProductAdmin"; // ✅ thêm trang quản lý món (admin)
import Payment from "./pages/Payment";
import ProductManagement from "./pages/ProductManagement";
import Recipes from "./pages/Recipes";
import ExpenseManagement from "./components/ExpenseManagement";
import PromotionList from "./pages/PromotionList";
// ✅ Component trung gian để kiểm soát hiển thị Navbar
const AppContent = () => {
  const location = useLocation();

  // Ẩn Navbar ở trang Login
  const hideNavbar = location.pathname === "/";

  return (
    <>
      <Routes>
        {/* Đăng nhập */}
        <Route path="/" element={<Login />} />

        {/* Trang chính */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/order" element={<Order />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/products" element={<ProductManagement/>} />
        <Route path="/product-admin" element={<ProductAdmin />} /> {/* ✅ thêm route quản lý menu */}
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/expenses" element={<ExpenseManagement />} />
        <Route path="/promotions" element={<PromotionList />} />
      </Routes>

      {/* Navbar hiển thị ở mọi trang trừ trang Login */}
      {!hideNavbar && <Navbar />}
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
