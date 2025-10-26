import React, { useState } from "react";
import { Card, InputNumber, Button, Radio } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { updateOrderPayment, updateOrderStatus } from "../services/api";
const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showSuccess, setShowSuccess] = useState(false);
  const [method, setMethod] = useState(null);
  const [customerPay, setCustomerPay] = useState(0);

  // ✅ Lấy dữ liệu từ location.state hoặc localStorage
  const savedCart = JSON.parse(localStorage.getItem("cartData") || "[]");
  const savedTotal = Number(localStorage.getItem("cartTotal") || 0);

  const { totalAmount = savedTotal, cart = savedCart } = location.state || {};
  const orderId = location.state?.orderId || localStorage.getItem("currentOrderId");

  const calculateTotalCost = (cart) => {
    return cart.reduce((sum, item) => {
      const sizeCost = item.size?.cost || 0;
      const quantity = item.quantity || 1;
      return sum + sizeCost * quantity;
    }, 0);
  };

  const qrImage =
    "https://res.cloudinary.com/drzyhqg1q/image/upload/v1759862613/n35pepabrqglambdjzcu.jpg";

  const change = Math.max(customerPay - totalAmount, 0);

  const handleConfirmPayment = async () => {
  if (!orderId) {
    alert("Không tìm thấy đơn hàng. Vui lòng tạo đơn hàng trước khi thanh toán!");
    return;
  }

  try {
    // 🔹 Dùng hàm api.js thay vì axios trực tiếp
    await updateOrderPayment(orderId, method);
await updateOrderStatus(orderId, "paid");

    localStorage.removeItem("cartData");
    localStorage.removeItem("cartTotal");
    localStorage.removeItem("currentOrderId");

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      navigate("/order", { replace: true });
    }, 2000);
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật order:", error);
  }
};


  return (
    <div
      style={{
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.5rem",
        marginBottom: "90px",
      }}
    >
      <Button
        type="default"
        onClick={() => navigate("/order")}
        style={{ alignSelf: "flex-start", borderRadius: 8, marginBottom: "0.5rem" }}
      >
        ← Quay lại
      </Button>

      <Card
        title="Chọn phương thức thanh toán"
        style={{
          width: "100%",
          maxWidth: 400,
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <Radio.Group
          onChange={(e) => setMethod(e.target.value)}
          value={method}
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <Radio value="cash">💵 Thanh toán bằng tiền mặt</Radio>
          <Radio value="transfer">🏦 Thanh toán bằng chuyển khoản (QR)</Radio>
        </Radio.Group>
      </Card>

      {method === "transfer" && (
        <Card
          title="Thanh toán qua mã QR"
          style={{
            width: "100%",
            maxWidth: 400,
            textAlign: "center",
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <img
            src={qrImage}
            alt="QR Thanh toán"
            style={{
              width: 220,
              height: 220,
              borderRadius: 8,
              border: "1px solid #ddd",
              marginBottom: "1rem",
              objectFit: "cover",
            }}
          />
          <p>
            Quét mã QR để chuyển khoản qua MoMo hoặc ngân hàng.
            <br />
            Vui lòng ghi rõ nội dung chuyển khoản.
          </p>

          <div style={{ marginBottom: "1rem", textAlign: "left" }}>
            <p>
              <strong>Số tiền sẽ chuyển:</strong>
            </p>
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              placeholder="Nhập số tiền chuyển khoản"
              value={customerPay}
              onChange={(value) => setCustomerPay(value)}
            />
          </div>

          <div style={{ marginBottom: "1rem", textAlign: "left" }}>
            <p>
              <strong>Chênh lệch so với tổng tiền:</strong>{" "}
              {change.toLocaleString("vi-VN")} ₫
            </p>
          </div>

          <Button
            type="primary"
            block
            onClick={handleConfirmPayment}
            disabled={!method || customerPay < totalAmount}
          >
            ✅ Xác nhận đã thanh toán
          </Button>
        </Card>
      )}

      {method === "cash" && (
        <Card
          title="Thanh toán bằng tiền mặt"
          style={{
            width: "100%",
            maxWidth: 400,
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ marginBottom: "1rem" }}>
            <p>
              <strong>Tổng tiền:</strong> {totalAmount.toLocaleString("vi-VN")} ₫
            </p>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <p>
              <strong>Khách đưa:</strong>
            </p>
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              placeholder="Nhập số tiền khách đưa"
              value={customerPay}
              onChange={(value) => setCustomerPay(value)}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <p>
              <strong>Tiền thừa:</strong> {change.toLocaleString("vi-VN")} ₫
            </p>
          </div>

          <Button
            type="primary"
            block
            onClick={handleConfirmPayment}
            disabled={customerPay < totalAmount}
          >
            ✅ Xác nhận thanh toán
          </Button>
        </Card>
      )}

      {showSuccess && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(255,255,255,0.9)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
            fontSize: "1.2rem",
            color: "#52c41a",
            animation: "fadeInOut 2s forwards",
          }}
        >
          <div
            style={{
              fontSize: "2rem",
              marginBottom: "1rem",
              animation: "bounce 1s infinite",
            }}
          >
            ✅
          </div>
          <div>Đơn hàng đã được tạo thành công!</div>
        </div>
      )}
    </div>
  );
};

export default Payment;
