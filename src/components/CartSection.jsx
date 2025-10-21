import React, { useState, useRef, useEffect, useMemo } from "react";
import { Button, Tooltip } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

const CartSection = ({
  cart,
  cartExpanded,
  setCartExpanded,
  updateCart,
  onEditItem,
  onPlaceOrder,
}) => {
  if (!cart.length) return null;

  const sheetRef = useRef(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const startY = useRef(0);

  // ✅ Tính tổng tiền toàn bộ giỏ hàng (bao gồm extras)
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const base = (item.price || 0) * (item.qty || 0);
      const extras = item.extras
        ? item.extras.reduce(
            (sub, e) => sub + (e.price || 0) * (e.qty || 1),
            0
          ) * (item.qty || 1)
        : 0;
      return sum + base + extras;
    }, 0);
  }, [cart]);

  // 🔹 Cập nhật chiều cao nội dung thật
  useEffect(() => {
    if (sheetRef.current) {
      const inner = sheetRef.current.querySelector(".cart-inner");
      setContentHeight(inner ? inner.scrollHeight : 0);
    }
  }, [cart, cartExpanded]);

  const handleTouchStart = (e) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diffY = currentY - startY.current;
    if ((diffY < 0 && !cartExpanded) || (diffY > 0 && cartExpanded)) {
      setDragY(diffY);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    if (Math.abs(dragY) > 50) {
      setCartExpanded(dragY < 0);
    }
    setIsDragging(false);
    setDragY(0);
  };

  const translateY = isDragging ? dragY : 0;
  const maxHeight = Math.min(contentHeight + 100, window.innerHeight * 0.7);

  // ✅ Lấy tên món đầu tiên để hiển thị ở header
  const firstItemName = cart[0]?.name || "Đơn hàng";

  return (
    <div
      ref={sheetRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        background: "#fff",
        borderTop: "1px solid #eee",
        boxShadow: "0 -3px 15px rgba(0,0,0,0.1)",
        borderRadius: "16px 16px 0 0",
        zIndex: 1000,
        overflow: "hidden",
        height: cartExpanded ? maxHeight : "80px",
        transform: `translateY(${translateY}px)`,
        transition: isDragging ? "none" : "transform 0.3s ease, height 0.3s ease",
        touchAction: "none",
      }}
    >
      {/* Thanh kéo nhỏ */}
      <div
        onClick={() => setCartExpanded((p) => !p)}
        style={{
          width: 40,
          height: 5,
          borderRadius: 3,
          background: "#ccc",
          margin: "6px auto",
        }}
      />

      {/* Header */}
      <div
        onClick={() => setCartExpanded((p) => !p)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.5rem 1rem",
          borderBottom: "1px solid #f0f0f0",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontWeight: "600", fontSize: "1rem" }}>
            🧾 {firstItemName} {cart.length > 1 ? `+${cart.length - 1}` : ""}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#888" }}>
            {cart.length} món trong giỏ
          </div>
        </div>

        <div style={{ color: "#1677ff", fontWeight: "700", fontSize: "1.1rem" }}>
          {cartTotal.toLocaleString()}đ
        </div>
      </div>

      {/* Nội dung giỏ hàng */}
      {cartExpanded && (
        <div className="cart-inner" style={{ padding: "0.5rem 1rem 1rem" }}>
          {cart.map((item, index) => {
            const baseTotal = (item.price || 0) * (item.qty || 0);
            const extraTotal = item.extras
              ? item.extras.reduce(
                  (sum, e) => sum + (e.price || 0) * (e.qty || 1),
                  0
                ) * (item.qty || 1)
              : 0;
            const totalPrice = baseTotal + extraTotal;

            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid #eee",
                  padding: "0.6rem 0",
                }}
              >
                {/* Thông tin món */}
               <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
  {/* ✅ Tên món nằm trên */}
  <div style={{ fontSize: "1rem", fontWeight: "600", color: "#222" }}>
    {item.name} {item.size && `(${item.size})`}
  </div>

  {/* ✅ Dòng hiển thị số lượng, giá từng phần */}
  <div style={{ fontSize: "0.9rem", color: "#666" }}>
    Số lượng: {item.qty} × {item.price.toLocaleString()}đ
  </div>


                  {/* Hiển thị topping */}
                  {item.extras && item.extras.length > 0 && (
                    <ul
                      style={{
                        margin: "0.3rem 0 0 0.8rem",
                        padding: 0,
                        listStyleType: "circle",
                        color: "#888",
                        fontSize: "0.9rem",
                      }}
                    >
                      {item.extras.map((e, idx) => (
                        <li key={idx}>
                         {e.name} × {e.qty} ({(e.price * e.qty).toLocaleString()}đ)
                        </li>
                      ))}
                    </ul>
                  )}

                  {item.note && (
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "#999",
                        marginTop: "0.2rem",
                        fontStyle: "italic",
                      }}
                    >
                      📝 {item.note}
                    </div>
                  )}
                </div>

                {/* Giá + nút hành động */}
                <div style={{ textAlign: "right" }}>
                  <b style={{ fontSize: "1rem", color: "#1677ff" }}>
                    {totalPrice.toLocaleString()}đ
                  </b>
                  <div
                    style={{
                      marginTop: 4,
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 6,
                    }}
                  >
                    <Tooltip title="Sửa">
                      <Button
                        type="text"
                        icon={
                          <EditOutlined
                            style={{ fontSize: "1.2rem", color: "#1677ff" }}
                          />
                        }
                        onClick={() => onEditItem(item, index)}
                      />
                    </Tooltip>
                    <Tooltip title="Xóa">
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined style={{ fontSize: "1.2rem" }} />}
                        onClick={() =>
                          updateCart(cart.filter((_, i) => i !== index))
                        }
                      />
                    </Tooltip>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Nút thanh toán */}
          <Button
            type="primary"
            block
            style={{
              marginTop: "0.8rem",
              borderRadius: "10px",
              height: "45px",
              fontSize: "1rem",
            }}
            onClick={onPlaceOrder}
          >
            ✅ Xác nhận & Thanh toán
          </Button>
        </div>
      )}
    </div>
  );
};

export default CartSection;
