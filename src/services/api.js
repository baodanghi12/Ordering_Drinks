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

// Trong api.js - THÊM DEBUG
export const loadExportHistory = async (start, end) => {
  try {
    let query = "";
    if (start && end) query = `?start=${start}&end=${end}`;
    
    // ✅ LẤY TẤT CẢ (OUT- + RET-) để có thể so khớp
    const res = await fetchExportHistory(query);
    console.log("🔍 DEBUG - Tất cả dữ liệu từ API:", res?.map(item => ({
      invoiceId: item.invoiceId,
      note: item.note
    })));
    
    return res || []; // ✅ TRẢ VỀ TẤT CẢ, không lọc
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

// ✅ Cập nhật trạng thái đơn hàng với log chi tiết
export const updateOrderStatus = async (orderId, status) => {
  try {
    console.log(`📞 [API] Gọi updateOrderStatus: ${orderId} -> ${status}`);
    const response = await axios.put(`${API_URL}/orders/${orderId}/status`, {
      status: status
    });
    console.log(`✅ [API] updateOrderStatus thành công: ${orderId} -> ${status}`);
    return response.data;
  } catch (error) {
    console.error(`❌ [API] Lỗi updateOrderStatus: ${orderId} -> ${status}`, error);
    throw error;
  }
};
// 🆕 Cập nhật paymentMethod
export const updateOrderPayment = async (orderId, paymentMethod) => {
  const res = await axios.put(`${API_URL}/orders/${orderId}/payment`, { paymentMethod });
  return res.data;
};
// ✅ SỬA LẠI endpoint - dùng route orders thay vì inventory
export const exportInventoryFromOrder = async (orderId, cartItems) => {
  try {
    console.log(`📞 [API] Gọi exportInventoryFromOrder: ${orderId}`);
    
    // ✅ SỬA ENDPOINT: /api/orders/:id/export-inventory
    const response = await axios.post(`${API_URL}/orders/${orderId}/export-inventory`);
    
    console.log(`✅ [API] exportInventoryFromOrder thành công: ${orderId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ [API] Lỗi exportInventoryFromOrder: ${orderId}`, error);
    throw error;
  }
};
// 🆕 Thêm hàm hủy nguyên liệu đã khui
export const disposeOpenedIngredient = async (ingredientId, disposedWeight, reason) => {
  try {
    const response = await axios.post(`${API_URL}/inventory/${ingredientId}/dispose-opened`, {
      disposedWeight,
      reason
    });
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi hủy nguyên liệu đã khui:", error);
    throw error;
  }
};

// 🆕 Thêm hàm lấy chi tiết nguyên liệu đã khui
export const getOpenedIngredientDetails = async (ingredientId) => {
  try {
    const response = await axios.get(`${API_URL}/inventory/${ingredientId}/opened-details`);
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi lấy chi tiết nguyên liệu đã khui:", error);
    throw error;
  }
};
// 🆕 LẤY TOÀN BỘ PHIẾU XUẤT (OUT- và RET-) cho mục kiểm tra hoàn kho
export const fetchAllExportHistory = async (query = "") => {
  try {
    const res = await axios.get(`${API_URL}/inventory/export-history${query}`);
    const allData = res.data || [];
    console.log("🧾 Tất cả phiếu xuất (OUT + RET):", allData.map(d => d.invoiceId));
    return allData;
  } catch (error) {
    console.error("❌ Lỗi khi lấy toàn bộ export history:", error);
    return [];
  }
};

// 📊 DASHBOARD STATS
// =========================
export const fetchDashboardStats = async (startDate, endDate) => {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate);
    if (endDate) params.append('end', endDate);
    
    const res = await axios.get(`${API_URL}/dashboard/stats?${params}`);
    return res.data;
  } catch (error) {
    console.error("Dashboard stats error:", error);
    throw error.response?.data?.error || "Không thể tải thống kê dashboard";
  }
};
// =========================
// 💰 EXPENSE MANAGEMENT (Quản lý chi phí)
// =========================
export const fetchExpenses = async (query = "") => {
  try {
    const res = await axios.get(`${API_URL}/expenses${query}`);
    return res.data;
  } catch (error) {
    console.error("Fetch expenses error:", error);
    throw error.response?.data?.error || "Không thể tải danh sách chi phí";
  }
};

export const createExpense = async (payload) => {
  try {
    const res = await axios.post(`${API_URL}/expenses`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data;
  } catch (error) {
    console.error("Create expense error:", error);
    throw error.response?.data?.error || "Không thể tạo chi phí";
  }
};

export const loadExpenses = async (start, end) => {
  try {
    let query = "";
    if (start && end) query = `?start=${start}&end=${end}`;
    const res = await fetchExpenses(query);
    return res || [];
  } catch (err) {
    console.error(err);
    message.error("Lỗi khi tải danh sách chi phí");
    return [];
  }
};

// api.js - Thêm các functions còn thiếu
// services/api.js - Thêm functions mới
export const fetchPromotions = async (type = '') => {
  try {
    const url = type ? `${API_URL}/promotion?promotionType=${type}` : `${API_URL}/promotion`;
    const res = await axios.get(url);
    return res.data;
  } catch (err) {
    console.error("Lỗi khi fetch promotions:", err);
    return [];
  }
};
export const getPromotion = async (id) => {
  try {
    const res = await axios.get(`${API_URL}/promotion/${id}`);
    return res.data;
  } catch (err) {
    console.error("Lỗi khi lấy chi tiết promotion:", err);
    throw err;
  }
};

// ✅ Cập nhật applyPromoCode để hỗ trợ buy_x_get_y
export const applyPromoCode = async (code, total, items = []) => {
  try {
    const res = await axios.post(`${API_URL}/promotion/apply-promo`, {
      code,
      total,
      items
    });
    return res.data;
  } catch (err) {
    console.error("Lỗi khi áp dụng promotion:", err);
    throw err;
  }
};

export const createPromotion = async (payload) => {
  try {
    const res = await axios.post(`${API_URL}/promotion`, payload);
    return res.data;
  } catch (err) {
    console.error("Lỗi khi tạo promotion:", err);
    throw err;
  }
};

export const updatePromotion = async (id, payload) => {
  try {
    const res = await axios.put(`${API_URL}/promotion/${id}`, payload);
    return res.data;
  } catch (err) {
    console.error("Lỗi khi cập nhật promotion:", err);
    throw err;
  }
};

export const deletePromotion = async (id) => {
  try {
    const res = await axios.delete(`${API_URL}/promotion/${id}`);
    return res.data;
  } catch (err) {
    console.error("Lỗi khi xóa promotion:", err);
    throw err;
  }
};
// Thêm vào services/api.js
export const fetchProductCosts = async () => {
  try {
    const response = await axios.get('/api/products/costs');
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tải chi phí sản phẩm:', error);
    return {};
  }
};

export const getBusinessStats = async () => {
  try {
    const response = await axios.get('/api/business/stats');
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tải thống kê kinh doanh:', error);
    return {
      avgProductCost: 50000, // Giá trị mặc định
      profitMargin: 0.3,     // 30% mặc định
    };
  }
};