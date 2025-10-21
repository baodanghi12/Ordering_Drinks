import React from "react";
import { Table, Tag } from "antd";
import dayjs from "dayjs";

const ExportHistoryTable = ({ data = [] }) => {
  const isMobile = window.innerWidth < 768;

  const columns = [
    {
      title: "Ngày xuất",
      dataIndex: "date",
      key: "date",
      render: (text) => dayjs(text).format("DD/MM/YYYY HH:mm"),
      width: 160,
    },
    {
  title: "Mã phiếu",
  dataIndex: "invoiceId",
  key: "invoiceId",
  render: (text) => {
  if (!text) return "-";
  const color = text.startsWith("OUT-")
    ? "red"
    : text.startsWith("IMP-")
    ? "green"
    : "blue";

  // 🪄 Rút gọn mã phiếu cho gọn (hiển thị OUT-xxxx cuối)
  const shortCode = text.length > 10 ? text.slice(0, 4) + "-" + text.slice(-4) : text;

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

  width: 130,
},
    {
      title: "Nguyên liệu",
      dataIndex: "name",
      key: "name",
      width: 220,
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
      render: (qty) => <span>{Number(qty).toLocaleString()}</span>,
      width: 90,
    },
    {
      title: "Đơn vị",
      dataIndex: "unit",
      key: "unit",
      width: 90,
      align: "center",
    },
    {
      title: "Giá vốn / Đơn vị",
      dataIndex: "unitCost",
      key: "unitCost",
      align: "right",
      render: (val) => `${val ? val.toLocaleString() : 0}₫`,
      width: 130,
    },
    {
      title: "Thành tiền",
      key: "totalCost",
      align: "right",
      render: (_, record) =>
        `${((record.quantity || 0) * (record.unitCost || 0)).toLocaleString()}₫`,
      width: 140,
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      render: (note) =>
        note ? (
          <Tag color="blue" style={{ whiteSpace: "normal" }}>
            {note}
          </Tag>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <div style={{ overflowX: "auto", borderRadius: 8 }}>
      <Table
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: isMobile ? 5 : 10 }}
        size={isMobile ? "small" : "middle"}
        bordered
        scroll={{ x: isMobile ? 700 : 950 }}
        style={{
          fontSize: isMobile ? "0.75rem" : "0.85rem",
          borderRadius: 8,
          overflow: "hidden",
        }}
        locale={{ emptyText: "Không có dữ liệu xuất kho" }}
      />
    </div>
  );
};

export default ExportHistoryTable;
