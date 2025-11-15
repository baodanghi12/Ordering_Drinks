import React from "react";
import { Input, Button, Card, message } from "antd";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    message.success("Đã đăng xuất!");
    navigate("/");
  };

  return (
    <div style={{ padding: "1rem", marginBottom: "70px" }}>
      <Card>
        <h3>⚙️ Cài đặt hệ thống</h3>
        <p>Tài khoản hiện tại: admin@matcha.com</p>

        {/* Nút quản lý sản phẩm */}
        <Button
          type="primary"
          block
          style={{ marginBottom: "0.5rem" }}
          onClick={() => navigate("/products")}
        >
          Quản lý sản phẩm
        </Button>

        {/* Nút quản lý công thức */}
        <Button
          type="default"
          block
          style={{ marginBottom: "0.5rem" }}
          onClick={() => navigate("/recipes")}
        >
          Quản lý công thức
        </Button>
        {/* 🆕 Nút quản lý chi phí */}
        <Button
          type="default"
          block
          style={{ marginBottom: "0.5rem", backgroundColor: "#fff7e6", borderColor: "#ffa940" }}
          onClick={() => navigate("/expenses")}
        >
          Quản lý Chi phí
        </Button>
         {/* 🆕 Nút quản lý khuyến mãi */}
        <Button
          type="default"
          block
          style={{ marginBottom: "0.5rem", backgroundColor: "#e6f7ff", borderColor: "#91d5ff" }}
          onClick={() => navigate("/promotions")}
        >
          Quản lý khuyến mãi
        </Button>
        {/* Nút đăng xuất */}
        <Button type="primary" danger block onClick={handleLogout}>
          Đăng xuất
        </Button>
      </Card>
    </div>
  );
};

export default Settings;
