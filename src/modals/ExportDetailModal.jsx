import React from "react";
import { Modal, Table, Tag } from "antd";
import dayjs from "dayjs";

const ExportDetailModal = ({ exportData, onClose }) => {
  if (!exportData) return null;

  // ✅ Thêm dòng này
  const isMobile = window.innerWidth < 768;

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
      render: (val) => Number(val).toLocaleString(),
    },
    {
      title: "Đơn vị",
      dataIndex: "unit",
      align: "center",
    },
    {
      title: "Giá vốn / Đơn vị",
      dataIndex: "unitCost",
      align: "right",
      render: (val) => `${val?.toLocaleString() || 0}₫`,
    },
    {
      title: "Thành tiền",
      key: "total",
      align: "right",
      render: (_, record) =>
        `${((record.quantity || 0) * (record.unitCost || 0)).toLocaleString()}₫`,
    },
  ];

  const totalValue = exportData.items?.reduce(
    (sum, i) => sum + (i.quantity || 0) * (i.unitCost || 0),
    0
  );

  return (
    <Modal
      open={true}
      title={
        <div>
          Phiếu xuất:{" "}
          <Tag color="red" style={{ fontWeight: 600 }}>
            {exportData.invoiceId}
          </Tag>
          <div style={{ fontSize: "0.85rem", color: "#666" }}>
            Ngày: {dayjs(exportData.date).format("DD/MM/YYYY HH:mm")}
          </div>
        </div>
      }
      footer={null}
      onCancel={onClose}
      width={isMobile ? "95%" : 700} 
    >
     <Table
  dataSource={exportData.items}
  columns={columns}
  pagination={false}
  rowKey={(r) => r._id || r.name}
  size="small"
  style={{ marginBottom: "1rem" }}
/>

<div style={{ textAlign: "right", fontWeight: 600 }}>
  Tổng giá trị:{" "}
  <span style={{ color: "#1677ff" }}>
    {(totalValue || 0).toLocaleString("vi-VN")}₫
  </span>
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
