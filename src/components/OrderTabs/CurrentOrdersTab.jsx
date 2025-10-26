import React from "react";
import { List, Card, Typography, Tag, Divider, Button, Popconfirm } from "antd";
import dayjs from "dayjs";

const getStatusColor = (status) => {
  switch (status) {
    case "paid":
      return "blue";
    default:
      return "default";
  }
};

const CurrentOrdersTab = ({ orders, onUpdateStatus, onShowDetail }) => {
  return (
    <List
      dataSource={orders}
      renderItem={(order) => (
        <Card
          key={order._id}
          hoverable
          onClick={() => onShowDetail(order)}
          style={{
            marginBottom: "0.9rem",
            borderRadius: 14,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
          bodyStyle={{ padding: "1rem" }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              {/* ✅ Hiển thị mã đơn ngắn gọn # + 3 số cuối */}
              <div
                style={{
                  backgroundColor: "#e6f4ff",
                  color: "#1677ff",
                  display: "inline-block",
                  padding: "5px 12px",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "1rem",
                  marginBottom: "0.3rem",
                }}
              >
                #{order.orderCode?.slice(-3) || order._id.slice(-3)}
              </div>

              <div style={{ fontSize: "0.85rem", color: "#666" }}>
                {dayjs(order.createdAt).format("DD/MM - HH:mm")}
              </div>
            </div>

<div
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    textAlign: "right",
  }}
>
  <Typography.Text
    strong
    style={{
      fontSize: "1.1rem",
      color: "#1677ff",
      marginBottom: "0.25rem",
    }}
  >
    {order.total?.toLocaleString()} ₫
  </Typography.Text>

  <Tag
    color={getStatusColor(order.status)}
    style={{
      borderRadius: "6px",
      fontSize: "0.85rem",
      padding: "2px 8px",
    }}
  >
    {order.paymentMethod === "cash"
      ? "Đã thanh toán (Tiền mặt)"
      : "Đã thanh toán"}
  </Tag>
</div>

          </div>

          <Divider style={{ margin: "0.5rem 0" }} />

          {/* ✅ Hiển thị món + size */}
          {order.items?.slice(0, 3).map((item, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "4px 0",
                fontSize: "0.95rem",
              }}
            >
              <Typography.Text>
                {item.name}{" "}
                <Typography.Text type="secondary" style={{ fontSize: "0.85rem" }}>
                  ({item.size || "M"})
                </Typography.Text>
              </Typography.Text>
              <Typography.Text type="secondary">x{item.qty}</Typography.Text>
            </div>
          ))}

          {order.items?.length > 3 && (
            <Typography.Text type="secondary" style={{ fontSize: "0.8rem" }}>
              +{order.items.length - 3} món khác...
            </Typography.Text>
          )}

          {/* ✅ Buttons lớn và căn giữa cho mobile */}
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              justifyContent: "center",
              gap: "0.75rem",
            }}
          >
            <Button
              type="primary"
              size="large"
              style={{
                fontWeight: "600",
                borderRadius: "10px",
                padding: "0.8rem 1.5rem",
                fontSize: "1rem",
              }}
              onClick={(e) => {
                e.stopPropagation(); // tránh mở modal khi bấm nút
                onUpdateStatus(order._id, "completed");
              }}
            >
              Hoàn tất
            </Button>

            <Popconfirm
              title="Xác nhận hủy đơn?"
              onConfirm={(e) => {
                e.stopPropagation();
                onUpdateStatus(order._id, "cancelled");
              }}
              okText="Hủy đơn"
              cancelText="Không"
            >
              <Button
                danger
                size="large"
                style={{
                  fontWeight: "600",
                  borderRadius: "10px",
                  padding: "0.8rem 1.5rem",
                  fontSize: "1rem",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                Hủy đơn
              </Button>
            </Popconfirm>
          </div>
        </Card>
      )}
    />
  );
};

export default CurrentOrdersTab;
