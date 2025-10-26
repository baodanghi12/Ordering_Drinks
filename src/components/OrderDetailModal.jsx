import React from "react";
import { Modal, Typography, Divider, Tag, Descriptions, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

const getStatusInfo = (status) => {
  switch (status) {
    case "pending":
      return { color: "default", label: "Chờ xử lý" };
    case "paid":
      return { color: "blue", label: "Đã thanh toán" };
    case "processing":
      return { color: "orange", label: "Đang pha chế" };
    case "completed":
      return { color: "green", label: "Hoàn tất" };
    case "cancelled":
      return { color: "red", label: "Đã hủy" };
    default:
      return { color: "default", label: "Không xác định" };
  }
};

const OrderDetailModal = ({ open, onClose, order }) => {
  const [noteModalVisible, setNoteModalVisible] = React.useState(false);
  const [currentNote, setCurrentNote] = React.useState("");

  if (!order) return null;

  const statusInfo = getStatusInfo(order.status);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={380}
      bodyStyle={{ padding: "1rem 1.25rem" }}
      title={
        <div
          style={{
            textAlign: "center",
            fontWeight: 700,
            fontSize: "1.2rem",
            color: "#1677ff",
            letterSpacing: "0.5px",
          }}
        >
          🧾 Đơn hàng #{order.orderCode?.slice(-3) || order._id?.slice(-3)}
        </div>
      }
    >
      {/* --- Thông tin chung --- */}
      <Descriptions
        column={1}
        size="small"
        colon={false}
        labelStyle={{ fontWeight: 600 }}
        contentStyle={{ textAlign: "right" }}
        style={{
          background: "#fafafa",
          padding: "0.75rem",
          borderRadius: "10px",
          marginBottom: "1rem",
        }}
      >
        <Descriptions.Item label="🕒 Ngày tạo">
          {dayjs(order.createdAt).format("DD/MM/YYYY HH:mm")}
        </Descriptions.Item>
        <Descriptions.Item label="💳 Thanh toán">
          {order.paymentMethod === "cash"
            ? "Tiền mặt"
            : order.paymentMethod === "momo"
            ? "Momo"
            : "Khác"}
        </Descriptions.Item>
        <Descriptions.Item label="📦 Trạng thái">
          <Tag
            color={statusInfo.color}
            style={{
              fontSize: "0.9rem",
              padding: "3px 8px",
              borderRadius: "8px",
              fontWeight: 600,
            }}
          >
            {statusInfo.label}
          </Tag>
        </Descriptions.Item>
      </Descriptions>

      {/* --- Danh sách món --- */}
      {order.items?.map((item, idx) => (
  <div key={idx} style={{ marginBottom: "0.75rem" }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontWeight: 600,
      }}
    >
      {/* Tên món + icon ghi chú công thức */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Text>{item.name}</Text>
        
        {/* THAY ĐỔI 1: Luôn hiển thị icon dấu ? để xem recipe note */}
        {/* Lấy note từ size tương ứng */}
  {/* Lấy note từ size tương ứng */}
<Tooltip title={item.sizeNote || "Không có ghi chú"}>
  <InfoCircleOutlined
    style={{ 
      color: item.sizeNote ? "#1890ff" : "#d9d9d9",
      cursor: item.sizeNote ? "pointer" : "not-allowed",
      fontSize: 20
    }}
  />
</Tooltip>

      </div>

      {/* Giá */}
      <Text>{(item.price * item.qty).toLocaleString()} ₫</Text>
    </div>

    {/* THAY ĐỔI 2: Hiển thị ghi chú khách hàng (nếu có) */}
    {item.note && (
      <div style={{ fontSize: "0.8rem", color: "#999", marginTop: 2 }}>
        📝 Ghi chú: {item.note}
      </div>
    )}

    {/* THAY ĐỔI 3: Có thể thêm hiển thị ghi chú công thức ngắn (tuỳ chọn) */}
    {item.recipe?.note && (
      <div style={{ 
        fontSize: "0.8rem", 
        color: "#1890ff", 
        marginTop: 2,
        fontStyle: "italic"
      }}>
        🧪 Có ghi chú công thức
      </div>
    )}

    <div style={{ fontSize: "0.85rem", color: "#666", marginTop: 2 }}>
      Size: <b>{item.size || "M"}</b> · SL: {item.qty} × {item.price.toLocaleString()} ₫
    </div>

    {item.extras?.length > 0 && (
      <ul
        style={{
          paddingLeft: "1.2rem",
          margin: "4px 0",
          color: "#888",
          fontSize: "0.85rem",
        }}
      >
        {item.extras.map((ex, i) => (
          <li key={i}>
            {ex.name} × {ex.qty} ({ex.price.toLocaleString()} ₫)
          </li>
        ))}
      </ul>
    )}

    {idx < order.items.length - 1 && <Divider style={{ margin: "6px 0" }} />}
  </div>
))}

      {/* Modal note chỉ render 1 lần */}
      <Modal
  open={noteModalVisible}
  onCancel={() => setNoteModalVisible(false)}
  footer={null}
  title="📋 Ghi chú công thức pha chế"
>
  <div style={{ padding: "10px", background: "#f5f5f5", borderRadius: "6px" }}>
    <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{currentNote}</p>
  </div>
</Modal>

      {/* --- Tổng cộng --- */}
      <Divider />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: 700,
          fontSize: "1.1rem",
          color: "#222",
        }}
      >
        <span>Tổng cộng</span>
        <span style={{ color: "#1677ff" }}>
          {order.total?.toLocaleString()} ₫
        </span>
      </div>
    </Modal>
  );
};

export default OrderDetailModal;
