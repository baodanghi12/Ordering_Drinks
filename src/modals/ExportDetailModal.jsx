import React, { useMemo } from "react";
import { Modal, Table, Tag } from "antd";
import dayjs from "dayjs";

const ExportDetailModal = ({ exportData, onClose, inventory = [] }) => {
  if (!exportData) return null;
  const isMobile = window.innerWidth < 768;

  // 🆕 Hàm trích xuất orderCode từ note (ưu tiên dùng orderCode đã được tạo)
  const extractOrderCode = (text) => {
    if (!text) return null;
    
    // Ưu tiên tìm orderCode dạng "OD-20251029-003"
    const orderCodeMatch = text.match(/(OD-\d{8}-\d{3})/);
    if (orderCodeMatch) {
      return orderCodeMatch[1];
    }
    
    // Fallback: tìm orderId cũ (nếu có)
    const orderIdMatch = text.match(/[#\s]*(?:đơn|don)?\s*([a-f0-9]{24})/i);
    return orderIdMatch ? orderIdMatch[1] : null;
  };

  // Hàm tìm nguyên liệu trong inventory theo ingredientId hoặc name
  const findIngredient = (item) => {
    if (!inventory || inventory.length === 0) return null;
    return (
      inventory.find((inv) => inv._id === item.ingredientId) ||
      inventory.find((inv) => inv.name === item.name) ||
      null
    );
  };

  // Tính giá sử dụng cho từng item (trả về giá trên đơn vị sử dụng)
  const itemsWithUsagePrice = useMemo(() => {
    return (exportData.items || []).map((it) => {
      const ing = findIngredient(it);
      // fallback: nếu export item đã có unitCost chính xác (đã tính từ backend) thì dùng luôn
      let displayUnitCost = Number(it.unitCost || 0);

      if (ing) {
        const baseCost = Number(ing.averageCostPerUnit || ing.cost_per_unit || 0);
        const unitWeight = Number(ing.unitWeight || 1); // ví dụ: 1000 (1kg) hoặc 1000 ml...
        const ingUnit = (ing.unit || "").toString();
        const usageUnit = (ing.usageUnit || "").toString();

        if (usageUnit && unitWeight && ingUnit && ingUnit !== usageUnit) {
          // ví dụ: cost_per_unit là giá 1 cái/hộp, unitWeight là tổng gram trong 1 cái/hộp
          displayUnitCost = unitWeight > 0 ? baseCost / unitWeight : baseCost;
        } else {
          // cùng đơn vị hoặc không có unitWeight
          displayUnitCost = baseCost;
        }
      }

      // làm tròn, hiển thị theo đơn vị sử dụng
      displayUnitCost = Math.round(displayUnitCost);

      // total theo giá sử dụng
      const lineTotal = Math.round((it.quantity || 0) * displayUnitCost);

      return {
        ...it,
        _displayUnitCost: displayUnitCost,
        _lineTotal: lineTotal,
      };
    });
  }, [exportData.items, inventory]);

  const columns = [
    {
      title: "Nguyên liệu",
      dataIndex: "name",
      key: "name",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      align: "center",
      render: (v) => Number(v || 0).toLocaleString(),
    },
    {
      title: "Đơn vị",
      dataIndex: "unit",
      align: "center",
    },
    {
      title: "Giá (theo đơn vị sử dụng)",
      dataIndex: "_displayUnitCost",
      align: "right",
      render: (v) => `${Number(v || 0).toLocaleString("vi-VN")}₫`,
    },
    {
      title: "Tổng (theo giá sử dụng)",
      dataIndex: "_lineTotal",
      key: "total",
      align: "right",
      render: (v) => `${Number(v || 0).toLocaleString("vi-VN")}₫`,
    },
  ];

  const totalValue = itemsWithUsagePrice.reduce((s, i) => s + (i._lineTotal || 0), 0);

  const isExport = exportData.invoiceId?.startsWith("OUT-");
  const isReturn = exportData.invoiceId?.startsWith("RET-");
  
  // 🆕 Trích xuất orderCode từ note (sẽ có dạng "OD-20251029-003")
  const orderCode = extractOrderCode(exportData.note);

  return (
    <Modal
      open={true}
      title={
        <div>
          {/* Dòng 1: Mã phiếu xuất */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            {isExport ? (
              <Tag color="red" style={{ fontWeight: 600 }}>
                Phiếu xuất kho
              </Tag>
            ) : (
              <Tag color="default" style={{ backgroundColor: "#bfbfbf", color: "#fff", fontWeight: 600 }}>
                Phiếu hoàn kho
              </Tag>
            )}
            <span style={{ fontWeight: 500, fontSize: "0.9rem" }}>
              {exportData.invoiceId}
            </span>
          </div>

          {/* Dòng 2: MÃ ĐƠN HÀNG ĐẸP (đóng khung đỏ) + Trạng thái */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* 🆕 KHUNG ĐỎ với orderCode từ middleware */}
            {orderCode && (
              <div
                style={{
                  backgroundColor: "#ff4d4f",
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: "6px",
                  fontWeight: "600",
                  fontSize: "0.85rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <span>📦</span>
                <span>{orderCode}</span>
              </div>
            )}

            {/* Tag "ĐÃ HOÀN KHO" bên cạnh */}
            {exportData.isRefunded ? (
  <div
    style={{
      backgroundColor: "#52c41a",
      color: "#fff",
      padding: "4px 12px",
      borderRadius: "6px",
      fontWeight: "600",
      fontSize: "0.85rem",
    }}
  >
    ĐÃ HOÀN KHO + HOÀN TIỀN
  </div>
) : exportData.isCancelled ? (
  <div
    style={{
      backgroundColor: "#f0f0f0",
      color: "#555",
      padding: "4px 12px",
      borderRadius: "6px",
      fontWeight: "600",
      fontSize: "0.85rem",
      border: "1px solid #d9d9d9",
    }}
  >
    ĐÃ HOÀN KHO
  </div>
) : null}


            {/* Ngày tháng */}
            <div style={{ fontSize: "0.85rem", color: "#666" }}>
              {dayjs(exportData.date).format("DD/MM/YYYY HH:mm")}
            </div>
          </div>
        </div>
      }
      footer={null}
      onCancel={onClose}
      width={isMobile ? "95%" : 700}
    >
      <Table
        dataSource={itemsWithUsagePrice}
        columns={columns}
        pagination={false}
        rowKey={(r) => r._id || r.name}
        size="small"
        style={{ marginBottom: "1rem" }}
      />

      <div style={{ textAlign: "right", fontWeight: 600 }}>
        Tổng giá trị:{" "}
        <span style={{ color: "#1677ff" }}>{(totalValue || 0).toLocaleString("vi-VN")}₫</span>
      </div>

      {exportData.note && (
        <div style={{ marginTop: 10, color: "#555" }}>
          <strong>Ghi chú:</strong> {exportData.note}
        </div>
      )}
    </Modal>
  );
};

export default ExportDetailModal;