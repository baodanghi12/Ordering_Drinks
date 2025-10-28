import React, { useState, useMemo } from "react";
import { Table, Tag } from "antd";
import dayjs from "dayjs";
import ExportDetailModal from "../modals/ExportDetailModal";

const ExportHistoryTable = ({ data = [], inventory = [] }) => {
  const isMobile = window.innerWidth < 768;
  const [selectedExport, setSelectedExport] = useState(null);

  // ✅ Sửa lại: Tính giá trị xuất thực tế DỰA TRÊN INVENTORY
  const groupedData = useMemo(() => {
    if (!Array.isArray(data)) return [];

    return data.map((record) => {
      const totalValue = (record.items || []).reduce((sum, item) => {
        const ingredient = inventory.find(inv => 
          inv._id === item.ingredientId || inv.name === item.name
        );
        
        if (!ingredient) {
          console.warn("Không tìm thấy nguyên liệu:", item.name);
          return sum + (item.totalCost || 0);
        }

        // ✅ Tính giá trị thực tế theo cost_per_unit từ inventory
        let actualValue = 0;
        const qty = Number(item.quantity || 0);
        const unitCost = Number(ingredient.cost_per_unit || 0);
        const unitWeight = Number(ingredient.unitWeight || 1);
        
        if (ingredient.unit === ingredient.usageUnit) {
          // Cùng đơn vị: tính trực tiếp
          actualValue = qty * unitCost;
        } else {
          // Khác đơn vị: tính theo unitWeight
          actualValue = (qty / unitWeight) * unitCost;
        }

        return sum + actualValue;
      }, 0);

      return {
        _id: record._id,
        invoiceId: record.invoiceId,
        date: record.date || record.createdAt,
        note: record.note || "",
        items: Array.isArray(record.items) ? record.items : [],
        totalValue: Math.round(totalValue),
      };
    });
  }, [data, inventory]); // ✅ Thêm inventory vào dependency

  // ✅ Các cột hiển thị (giữ nguyên)
  const columns = [
    {
      title: "Ngày xuất",
      dataIndex: "date",
      key: "date",
      render: (text) => dayjs(text).format("DD/MM HH:mm"),
      width: 110,
    },
    {
      title: "Mã phiếu",
      dataIndex: "invoiceId",
      key: "invoiceId",
      render: (text) => {
        const color = text.startsWith("OUT-")
          ? "red"
          : text.startsWith("IMP-")
          ? "green"
          : "blue";
        const shortCode =
          text.length > 10 ? text.slice(0, 4) + "-" + text.slice(-4) : text;
        return (
          <Tag
            color={color}
            style={{
              fontWeight: 600,
              fontSize: "0.85rem",
              letterSpacing: "0.5px",
              padding: "2px 8px",
              borderRadius: 6,
            }}
          >
            {shortCode}
          </Tag>
        );
      },
      width: 100,
    },
    {
      title: "Số NVL",
      dataIndex: "items",
      align: "center",
      render: (items) => items?.length || 0,
      width: 90,
    },
    {
      title: "Tổng giá trị",
      dataIndex: "totalValue",
      align: "right",
      render: (val) => (
        <span style={{ fontWeight: 500, color: "#1677ff" }}>
          {(val || 0).toLocaleString("vi-VN")}₫
        </span>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={groupedData}
        pagination={{ pageSize: isMobile ? 5 : 10 }}
        size="small"
        bordered
        rowKey="_id"
        style={{
          fontSize: "0.85rem",
          borderRadius: 8,
          overflow: "hidden",
        }}
        onRow={(record) => ({
          onClick: () => setSelectedExport(record),
          style: { cursor: "pointer" },
        })}
        locale={{ emptyText: "Không có dữ liệu xuất kho" }}
      />

      {selectedExport && (
        <ExportDetailModal
          exportData={selectedExport}
          onClose={() => setSelectedExport(null)}
        />
      )}
    </>
  );
};

export default ExportHistoryTable;