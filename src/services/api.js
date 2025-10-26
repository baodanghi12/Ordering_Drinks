import axios from "axios";
import { message } from "antd";

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

// ✅ Sửa: Chỉ lấy phiếu nhập có mã IMP-
export const fetchImportHistory = async (query = "") => {
  const res = await axios.get(`${API_URL}/inventory/import-history${query}`);
  return res.data;
};


// 🆕 Xem lịch sử xuất hàng
export const fetchExportHistory = async (query = "") => {
  const res = await axios.get(`${API_URL}/inventory/export-history${query}`);
  return res.data;
};

// =========================
// 📦 SERVICES LẤY DỮ LIỆU
// =========================
export const loadInventory = async () => {
  try {
    const res = await fetchInventory();
    return res || [];
  } catch (err) {
    console.error(err);
    message.error("Lỗi khi tải dữ liệu kho");
    return [];
  }
};

export const loadImportHistory = async (start, end) => {
  try {
    let query = "";
    if (start && end) query = `?start=${start}&end=${end}`;
    const res = await fetchImportHistory(query);
    return res || [];
  } catch (err) {
    console.error(err);
    message.error("Lỗi khi tải lịch sử nhập kho");
    return [];
  }
};

// 🆕 Thêm mới: Lịch sử xuất kho
export const loadExportHistory = async (start, end) => {
  try {
    let query = "";
    if (start && end) query = `?start=${start}&end=${end}`;
    const res = await fetchExportHistory(query);
    return res || [];
  } catch (err) {
    console.error(err);
    message.error("Lỗi khi tải lịch sử xuất kho");
    return [];
  }
};

// Nhập thêm kho
export const addInventoryStock = async (values) => {
  try {
    await importInventory({
      items: [
        {
          name: values.name,
          quantity: values.stock,
          unitCost: values.cost_per_unit,
          unitWeight: values.unitWeight,
          note: values.note,
          unit: values.unit,
          usageUnit: values.usageUnit,
          deductType: values.deductType || "byUsage",
        },
      ],
    });
    message.success("Nhập kho thành công");
  } catch (err) {
    console.error(err);
    message.error("Lỗi khi nhập kho");
  }
};
// =========================
// 📦 EXPORT INVENTORY (Xuất kho)
// =========================
export const exportInventory = async (payload) => {
  try {
    const res = await axios.post(`${API_URL}/inventory/export`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data;
  } catch (error) {
    console.error("Export inventory error:", error);
    throw error;
  }
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

// 🆕 Cập nhật trạng thái đơn hàng
export const updateOrderStatus = async (orderId, status) => {
  const res = await axios.put(`${API_URL}/orders/${orderId}/status`, { status });
  return res.data;
};
// 🆕 Cập nhật paymentMethod
export const updateOrderPayment = async (orderId, paymentMethod) => {
  const res = await axios.put(`${API_URL}/orders/${orderId}/payment`, { paymentMethod });
  return res.data;
};