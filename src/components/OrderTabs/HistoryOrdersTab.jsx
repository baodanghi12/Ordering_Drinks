import React from "react";
import { List, Card, Typography, Tag, Divider } from "antd";
import dayjs from "dayjs";

const getStatusColor = (status) => {
  switch (status) {
    case "completed":
      return "green";
    case "cancelled":
      return "red";
    default:
      return "default";
  }
};

const HistoryOrdersTab = ({ orders, onShowDetail }) => {
  return (
    <List
      dataSource={orders}
      renderItem={(order) => (
        <Card
          key={order._id}
          hoverable
          onClick={() => onShowDetail(order)}
          style={{
            marginBottom: "0.75rem",
            borderRadius: 12,
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}
          bodyStyle={{ padding: "0.75rem 1rem" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div
                style={{
                  backgroundColor: "#f9fafb",
                  color: "#333",
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: "8px",
                  fontWeight: 500,
                  fontSize: "0.9rem",
                  marginBottom: "0.25rem",
                }}
              >
                🧾 {order.orderCode || `#${order._id.slice(-5)}`}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#666" }}>
                {dayjs(order.createdAt).format("DD/MM - HH:mm")}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <Typography.Text strong style={{ fontSize: "1rem" }}>
                {order.total?.toLocaleString()} ₫
              </Typography.Text>
              <Tag
                color={getStatusColor(order.status)}
                style={{ marginTop: "0.25rem", borderRadius: "6px" }}
              >
                {order.status === "completed" ? "Hoàn tất" : "Đã hủy"}
              </Tag>
            </div>
          </div>

          <Divider style={{ margin: "0.5rem 0" }} />

          {order.items?.slice(0, 2).map((item, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "4px 0",
              }}
            >
              <Typography.Text>{item.name}</Typography.Text>
              <Typography.Text type="secondary">x{item.qty}</Typography.Text>
            </div>
          ))}
        </Card>
      )}
    />
  );
};

export default HistoryOrdersTab;
