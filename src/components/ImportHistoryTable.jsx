import React from "react";
import { Table, Tooltip } from "antd";
import dayjs from "dayjs";

const ImportHistoryTable = ({ data }) => {
  const columns = [
    {
      title: "Ngày nhập",
      dataIndex: "date",
      render: (text) => dayjs(text).format("YYYY-MM-DD HH:mm"),
    },
    { title: "Tên NVL", dataIndex: "name" },
    { title: "Số lượng", dataIndex: "quantity" },
    { title: "Đơn vị", dataIndex: "unit" },
    {
      title: "Giá vốn",
      dataIndex: "unitCost",
      render: (text, record) => (
        <Tooltip
          title={`Trọng lượng/1 đơn vị: ${record.unitWeight ?? "-"}\nGhi chú: ${
            record.note ?? "-"
          }`}
        >
          {text?.toLocaleString() + "đ"}
        </Tooltip>
      ),
    },
  ];

  return (
    <Table
      dataSource={data}
      columns={columns}
      size="small"
      pagination={{ pageSize: 5 }}
    />
  );
};

export default ImportHistoryTable;
