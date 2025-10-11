import React from "react";
import { Table, Button, Typography } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

const { Text } = Typography;

const ProductTable = ({ products, onEdit, onDelete }) => {
  const columns = [
    {
      title: "Tên món",
      dataIndex: "name",
      key: "name",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Size & Giá",
      key: "sizes",
      render: (_, record) => {
        if (!record.sizes || record.sizes.length === 0)
          return <Text type="secondary">—</Text>;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {record.sizes.map((s, idx) => (
              <Text key={idx} style={{ fontSize: 13 }}>
                {s.name}: <Text strong>{s.price?.toLocaleString()}đ</Text>
              </Text>
            ))}
          </div>
        );
      },
    },
    {
      title: "Danh mục",
      dataIndex: "category",
      key: "category",
      render: (cat) =>
        typeof cat === "object" ? cat.name : cat || <Text type="secondary">—</Text>,
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Button
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => onDelete(record._id)}
          />
        </div>
      ),
    },
  ];

  return (
    <Table
      dataSource={products}
      columns={columns}
      rowKey={(record) => record._id}
      pagination={{ pageSize: 5 }}
      size="small"
    />
  );
};

export default ProductTable;
