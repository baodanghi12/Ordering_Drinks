import React from "react";
import { List, Tag } from "antd";

const Orders = () => {
  const orders = [
    { id: 1, item: "Matcha Latte", status: "Hoàn thành" },
    { id: 2, item: "Cacao Đá", status: "Đang pha" },
  ];

  return (
    <div style={{ padding: "1rem", marginBottom: "70px" }}>
      <h2>📋 Danh sách đơn hàng</h2>
      <List
        itemLayout="horizontal"
        dataSource={orders}
        renderItem={(order) => (
          <List.Item>
            <List.Item.Meta
              title={order.item}
              description={`Mã đơn: #${order.id}`}
            />
            <Tag color={order.status === "Hoàn thành" ? "green" : "orange"}>
              {order.status}
            </Tag>
          </List.Item>
        )}
      />
    </div>
  );
};

export default Orders;
