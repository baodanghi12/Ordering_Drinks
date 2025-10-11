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

        {/* Nút đăng xuất */}
        <Button type="primary" danger block onClick={handleLogout}>
          Đăng xuất
        </Button>
      </Card>
    </div>
  );
};

export default Settings;
