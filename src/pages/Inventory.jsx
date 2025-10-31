import React, { useEffect, useState, useMemo } from "react";
import { Tabs, Button, Input, DatePicker, Form ,Segmented, Card} from "antd";
import InventoryTable from "../components/InventoryTable";
import ImportHistoryTable from "../components/ImportHistoryTable";
import ExportHistoryTable from "../components/ExportHistoryTable"; // 🆕 thêm bảng xuất kho
import ImportModal from "../modals/ImportModal";
import IngredientDetailModal from "../modals/IngredientDetailModal";
import { loadInventory, loadImportHistory, loadExportHistory, addInventoryStock } from "../services/api";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const InventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [importHistory, setImportHistory] = useState([]);
  const [exportHistory, setExportHistory] = useState([]); // 🆕 thêm state
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
// ✅ Tính tổng giá trị NHẬP kho (đúng)
const totalImportCost = useMemo(() => {
  return (importHistory || []).reduce((acc, inv) => acc + (inv.totalCost || 0), 0);
}, [importHistory]);

// ✅ Tính tổng giá trị XUẤT kho thực tế (chỉ tính OUT chưa hoàn kho)
const totalExportCost = useMemo(() => {
  if (!exportHistory.length) return 0;

  const outExports = exportHistory.filter(doc => doc.invoiceId?.startsWith("OUT-"));
  const retExports = exportHistory.filter(doc => doc.invoiceId?.startsWith("RET-"));

  // ✅ Bắt mọi mã đơn (OD-..., DH-...) trong note
  const extractOrderCode = (note = "") => {
    const match = note.match(/(OD-[\w-]+|DH[\w-]+)/i);
    return match ? match[1] : null;
  };

  // 1️⃣ Lấy danh sách đơn đã hoàn
  const returnedOrderIds = retExports
    .map(ret => {
      const orderCode = extractOrderCode(ret.note);
      if (orderCode)
        console.log("🔁 Phát hiện phiếu hoàn:", ret.invoiceId, "→ đơn:", orderCode);
      return orderCode;
    })
    .filter(Boolean);

  // 2️⃣ Tính tổng OUT chưa bị hoàn
  const total = outExports.reduce((acc, exp) => {
    const orderCode = extractOrderCode(exp.note);
    if (returnedOrderIds.includes(orderCode)) {
      console.log("🧮 Bỏ qua OUT vì đã hoàn:", exp.invoiceId, "→", orderCode);
      return acc;
    }
    return acc + (exp.totalCost || 0);
  }, 0);

  console.log("📦 OUT-RET check → returnedOrderIds:", returnedOrderIds);
  console.log("📊 Tổng xuất (đã trừ hoàn):", total.toLocaleString());
  return total;
}, [exportHistory]);





const handleRowClick = (record) => {
  setSelectedIngredient(record);
  setDetailOpen(true);
};

// ✅ Tồn kho = Nhập - Xuất (theo giá trị thực)
const remainingValue = useMemo(() => {
  return totalImportCost - totalExportCost;
}, [totalImportCost, totalExportCost]);
  // ✅ Lấy danh sách kho
  const getInventory = async () => {
    setLoading(true);
    const res = await loadInventory();
    setInventory(res);
    setLoading(false);
  };

  // ✅ Lọc lịch sử nhập kho theo thời gian
  const handleImportDateChange = async (dates) => {
    if (!dates) return;
    const [start, end] = dates;
    const res = await loadImportHistory(start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"));
    setImportHistory(res);
  };

  // ✅ Lọc lịch sử xuất kho theo thời gian
  const handleExportDateChange = async (dates) => {
  if (!dates) return;
  const [start, end] = dates;
  const res = await loadExportHistory(start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"));
  setExportHistory(res); // ✅ exportHistory có dữ liệu → tổng giá bán tính đúng
};


  // ✅ Làm phẳng dữ liệu nhập kho
  const flattenImportHistory = importHistory.flatMap((inv) =>
    inv.items.map((i) => ({
      key: i.ingredientId + "-" + inv.invoiceId,
      date: inv.date,
      name: i.name,
      quantity: i.quantity,
      unit: i.unit || "-",
      unitCost: i.unitCost,
      note: i.note,
    }))
  );

  // ✅ Làm phẳng dữ liệu xuất kho
  const flattenExportHistory = exportHistory.flatMap((inv) =>
    inv.items.map((i) => ({
      key: i.ingredientId + "-" + inv.invoiceId,
      invoiceId: inv.invoiceId, // ✅ Thêm dòng này
      date: inv.date,
      name: i.name,
      quantity: i.quantity,
      unit: i.unit || "-",
      unitCost: i.unitCost,
      note: i.note,
    }))
  );

  const filteredImportHistory = useMemo(
    () => flattenImportHistory.filter((item) => item.name.toLowerCase().includes(searchText.toLowerCase())),
    [searchText, flattenImportHistory]
  );

  const filteredExportHistory = useMemo(
    () => flattenExportHistory.filter((item) => item.name.toLowerCase().includes(searchText.toLowerCase())),
    [searchText, flattenExportHistory]
  );

  const handleAddStock = async () => {
    const values = await form.validateFields();
    await addInventoryStock(values);
    setModalOpen(false);
    form.resetFields();
    getInventory();
  };
  useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth < 768);
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);

// Trong Inventory.jsx - THÊM DEBUG
useEffect(() => {
  getInventory();

  const loadExport = async () => {
  const res = await loadExportHistory();
  console.log("🧾 exportHistory từ API:", res.map(r => ({
    invoiceId: r.invoiceId,
    totalCost: r.totalCost,
    note: r.note
  })));
  setExportHistory(res || []);
};
  loadExport();

  const loadImport = async () => {
    const res = await loadImportHistory();
    setImportHistory(res || []);
  };
  loadImport();
}, []);

// THÊM useEffect để debug khi exportHistory thay đổi
useEffect(() => {
  console.log("🔄 exportHistory updated:", exportHistory);
  console.log("📊 Số lượng phiếu xuất:", exportHistory.length);
  console.log("🔍 Các phiếu có note 'hủy':", 
    exportHistory.filter(item => 
      item.note?.toLowerCase().includes('hủy') || 
      item.invoiceId?.startsWith('RET-')
    ).map(item => ({
      invoiceId: item.invoiceId,
      note: item.note
    }))
  );
}, [exportHistory]);



  return (
  <div
  style={{
    padding: isMobile ? "0.5rem" : "1rem",
    marginBottom: isMobile ? "60px" : "80px",
    overflowX: "hidden",
    maxWidth: "100%",
  }}
>

    <h3
  style={{
    marginBottom: "0.75rem",
    textAlign: "center",
    color: "Black",
    fontSize: isMobile ? "1rem" : "1.25rem",
  }}
>
  Quản lý kho
</h3>

    {/* 🔹 Thẻ tổng quan nhanh */}
    <Card
  size="small"
  style={{
  marginBottom: 12,
  borderRadius: 10,
  boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
  padding: isMobile ? "0.5rem" : "1rem",
}}
>
  <div
  style={{
      display: "flex",
      flexDirection: isMobile ? "column" : "row", // ✅ dọc trên mobile, ngang trên PC
      alignItems: "center",                       // ✅ canh giữa theo chiều ngang
      justifyContent: "center",                   // ✅ canh giữa tổng thể
      gap: isMobile ? 6 : 12,
      fontSize: isMobile ? "0.8rem" : "0.9rem",
      textAlign: "center",
      lineHeight: 1.5,
    }}
>
  <span>📋 <b>{inventory.length}</b> nguyên liệu</span>
  <span> Nhập: <b>{totalImportCost.toLocaleString()} ₫</b></span>
  <span> Xuất: <b>{totalExportCost.toLocaleString()} ₫</b></span>
  <span> Tồn: <b>{(totalImportCost - totalExportCost).toLocaleString()} ₫</b></span>
</div>

    </Card>

    {/* 🔹 Tabs chính */}
    <Tabs
  defaultActiveKey="1"
  tabPosition="top"
  centered={!isMobile}
  size={isMobile ? "small" : "middle"}
  tabBarStyle={{
    fontSize: isMobile ? "0.8rem" : "1rem",
    overflowX: "auto",
    whiteSpace: "nowrap",
  }}
>

      {/* ===== Danh sách kho ===== */}
      <TabPane tab="Kho" key="1">
  <div
    style={{
      maxHeight: isMobile ? "calc(100vh - 240px)" : "auto",
      overflowY: isMobile ? "auto" : "visible",
      paddingBottom: "0.5rem",
    }}
  >
    <InventoryTable
  inventory={inventory}
  loading={loading}
  onRowClick={handleRowClick}
/>

<IngredientDetailModal
  open={detailOpen}
  onClose={() => setDetailOpen(false)}
  ingredient={selectedIngredient}
/>
  </div>

      </TabPane>

      {/* ===== Lịch sử nhập ===== */}
      <TabPane tab="Nhập kho" key="2">
       <div
  style={{
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginBottom: 8,
  }}
>
          <RangePicker
            size="small"
            style={{ width: "100%" }}
            onChange={handleImportDateChange}
          />
          <Input
            placeholder="Tìm theo tên sản phẩm"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            size="small"
            style={{ width: "100%" }}
          />
        </div>
        <ImportHistoryTable data={filteredImportHistory} />
      </TabPane>

      {/* ===== Lịch sử xuất ===== */}
      <TabPane tab="Xuất kho" key="3">
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    <RangePicker
      size="small"
      style={{ width: "100%" }}
      onChange={handleExportDateChange}
    />
  </div>
  <ExportHistoryTable data={exportHistory} inventory={inventory} />

</TabPane>

    </Tabs>

    {/* 🔹 Nút hành động nổi (thay vì block) */}
    <Button
      type="primary"
      shape="circle"
      size="large"
      style={{
        position: "fixed",
        bottom: 80,
        right: 20,
        zIndex: 999,
        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
      }}
      onClick={() => setModalOpen(true)}
    >
      +
    </Button>

    {/* 🔹 Modal nhập hàng */}
    <ImportModal
      open={modalOpen}
      onCancel={() => setModalOpen(false)}
      onOk={handleAddStock}
      form={form}
      inventory={inventory}
    />
  </div>
);

};

export default InventoryPage;
