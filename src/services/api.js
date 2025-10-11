import axios from "axios";

// 🔗 URL của backend server
const API_URL = "http://localhost:5000/api";

// =========================
// 🧠 AUTH
// =========================

// Test kết nối backend
export const testConnection = async () => {
  try {
    const res = await axios.get(`${API_URL}/`);
    return res.data;
  } catch (error) {
    console.error("Lỗi kết nối tới backend:", error);
    return null;
  }
};

// Đăng nhập
export const loginUser = async (email, password) => {
  try {
    const res = await axios.post(
      `${API_URL}/auth/login`,
      { email, password },
      { headers: { "Content-Type": "application/json" } }
    );
    return res.data;
  } catch (error) {
    throw error.response?.data?.message || "Đăng nhập thất bại";
  }
};

// =========================
// ☕ PRODUCTS (Menu)
// =========================
export const fetchProducts = async () => {
  const res = await axios.get(`${API_URL}/products`);
  return res.data;
};

export const createProduct = async (payload) => {
  const res = await axios.post(`${API_URL}/products`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
};
export const updateProduct = async (id, payload) => {
  const res = await axios.put(`${API_URL}/products/${id}`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
};
// =========================
// 📦 INVENTORY (Nguyên vật liệu)
// =========================
export const fetchInventory = async () => {
  const res = await axios.get(`${API_URL}/inventory`);
  return res.data;
};

// Nhập hàng (tạo phiếu nhập)
export const importInventory = async (payload) => {
  const res = await axios.post(`${API_URL}/inventory/import`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
};

// Xem lịch sử nhập hàng
export const fetchImportHistory = async () => {
  const res = await axios.get(`${API_URL}/inventory/history`);
  return res.data;
};

// =========================
// 🧾 ORDERS (Đơn hàng)
// =========================
export const createOrder = async (payload) => {
  const res = await axios.post(`${API_URL}/orders`, payload, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
};

export const fetchOrders = async () => {
  const res = await axios.get(`${API_URL}/orders`);
  return res.data;
};
