import React from "react";
import { Table } from "antd";
import dayjs from "dayjs";

const ImportHistoryTable = ({ data }) => {
  const columns = [
    {
      title: "Ngày nhập",
      dataIndex: "date",
      align: "center",
      render: (text) => (
        <div
          style={{
            fontWeight: 500,
            color: "#333",
            fontSize: "0.9rem",
          }}
        >
          {dayjs(text).format("DD/MM HH:mm")}
        </div>
      ),
      width: "40%", // ✅ cân đối hơn
    },
    {
      title: "Thông tin",
      dataIndex: "name",
      render: (_, record) => (
        <div
          style={{
            lineHeight: "1.6rem",
            whiteSpace: "normal",
            wordBreak: "break-word",
            paddingLeft: "6px",
          }}
        >
          <div style={{ fontWeight: 600, color: "#000", textTransform: "capitalize" }}>
            {record.name}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#666" }}>
            {record.quantity} {record.unit} ×{" "}
            {record.unitCost.toLocaleString("vi-VN")}₫
          </div>
          <div style={{ fontSize: "0.85rem", color: "#1677ff" }}>
            Tổng nhập:{" "}
            {(record.quantity * record.unitCost).toLocaleString("vi-VN")}₫
          </div>
          {record.note && (
            <div style={{ fontSize: "0.8rem", color: "#999" }}>
              Ghi chú: {record.note}
            </div>
          )}
        </div>
      ),
      width: "60%", // ✅ chiếm đều phần còn lại
    },
  ];

  return (
    <Table
      dataSource={data}
      columns={columns}
      size="small"
      pagination={{ pageSize: 5 }}
      rowKey="_id"
      style={{
        width: "100%",
      }}
      rowClassName={() => "import-row"}
      onRow={() => ({
        style: {
          height: "auto",
          padding: "14px 10px",
          verticalAlign: "middle",
          background: "#fff",
        },
      })}
      showHeader={true}
      bordered={false}
    />
  );
};

export default ImportHistoryTable;
