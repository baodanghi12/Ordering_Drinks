import React from "react";
import { Table, Tag } from "antd";

const formatWeight = (value) => {
  if (!value && value !== 0) return "0";
  return Number.isInteger(value) ? value : value.toFixed(2);
};

const InventoryTable = ({ inventory = [], loading, onRowClick }) => {
  const isMobile = window.innerWidth < 768;
const columns = [
  {
    title: "Nguyên liệu",
    dataIndex: "name",
    width: isMobile ? 140 : 200, // ✅ vừa đủ chữ hiển thị
    render: (text) => (
      <strong
        style={{
          fontSize: isMobile ? "0.8rem" : "0.9rem",
          whiteSpace: "nowrap", // ✅ tránh xuống dòng
        }}
      >
        {text}
      </strong>
    ),
    fixed: "left",
  },
  {
    title: "Tồn (đv)",
    dataIndex: "stock",
    align: "center",
    width: isMobile ? 90 : 120, // ✅ vừa đủ Tag
    render: (text, record) => (
      <Tag
        color={text > 3 ? "green" : "volcano"}
        style={{
          fontSize: isMobile ? "0.7rem" : "0.8rem",
          padding: "0 4px",
          whiteSpace: "nowrap",
        }}
      >
        {text} {record.unit}
      </Tag>
    ),
    sorter: (a, b) => a.stock - b.stock,
  },
  // 🧩 Ẩn 2 cột sau trên mobile
  !isMobile && {
    title: "Trọng lượng còn lại",
    align: "center",
    width: 130,
    render: (_, record) => {
      const unitWeight = record.unitWeight || 0;
      const total =
        (record.stock || 0) * unitWeight + (record.remainingWeight || 0);
      return (
        <span>
          {formatWeight(total)} {record.usageUnit || record.unit}
        </span>
      );
    },
  },
  !isMobile && {
    title: "Phần dư",
    align: "center",
    width: 100,
    render: (_, record) => {
      const remaining =
        record.remainingWeight > 0 ? record.remainingWeight : record.stock;
      return `${remaining} ${record.usageUnit || record.unit}`;
    },
  },
  {
    title: "Giá vốn",
    align: "right",
    width: isMobile ? 100 : 150, // ✅ fit giá tiền
    render: (_, record) => {
      const stockCost = (record.stock || 0) * (record.cost_per_unit || 0);
      const remainingCost =
        record.remainingWeight && record.unitWeight
          ? (record.remainingWeight / record.unitWeight) *
            (record.averageCostPerUnit || record.cost_per_unit || 0)
          : 0;
      const totalCost = stockCost + remainingCost;
      return (
        <span
          style={{
            fontSize: isMobile ? "0.75rem" : "0.85rem",
            whiteSpace: "nowrap",
          }}
        >
          {totalCost.toLocaleString()} ₫
        </span>
      );
    },
  },
].filter(Boolean);


  return (
    <div style={{ overflowX: "auto", padding: "0 0.5rem" }}>
      <Table
  dataSource={inventory.map((i) => ({ ...i, key: i._id }))}
  columns={columns}
  loading={loading}
  size="medium"
  pagination={false}
  bordered={false}
  onRow={(record) => ({
    onClick: () => onRowClick && onRowClick(record),
  })}
  rowClassName="clickable-row"
  scroll={{ x: isMobile ? false : 700 }}
  style={{
    fontSize: isMobile ? "0.75rem" : "0.85rem",
    borderRadius: "8px",
    tableLayout: "fixed",
  }}
/>

    </div>
  );
};

export default InventoryTable;
