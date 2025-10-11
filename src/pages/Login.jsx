import React, { useState, useEffect } from "react";
import { Button, Input, Card, message } from "antd";
import { loginUser } from "../services/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      message.warning("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    setLoading(true);
    console.log("🚀 Gửi request login với dữ liệu:", { email, password });

    try {
      const data = await loginUser(email, password);
      console.log("✅ Phản hồi từ backend:", data);

      message.success("Đăng nhập thành công!");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      window.location.href = "/dashboard"; // chuyển sang giao diện admin
    } catch (error) {
      console.error("❌ Lỗi khi đăng nhập:", error);

      // Hiển thị lỗi chi tiết
      if (error.response) {
        console.error("📩 Lỗi từ backend:", error.response.data);
        message.error(`Lỗi backend: ${error.response.data.message || "Không xác định"}`);
      } else {
        message.error(error.message || "Lỗi kết nối server");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("token") && localStorage.getItem("user")) {
      window.location.href = "/dashboard";
    }
  }, []);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        justifyContent: "center",
        alignItems: "center",
        background: "#f2f2f2",
        padding: "1rem",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: "400px",
          textAlign: "center",
          borderRadius: "16px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        }}
      >
        <img
          src="/logo.png"
          alt="logo"
          style={{
            width: 80,
            marginBottom: "1rem",
          }}
        />
        <h2 style={{ marginBottom: "1rem" }}>Đăng nhập hệ thống</h2>

        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginBottom: "1rem" }}
        />
        <Input.Password
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginBottom: "1rem" }}
        />

        <Button
          type="primary"
          loading={loading}
          onClick={handleLogin}
          block
          style={{ borderRadius: "8px" }}
        >
          Đăng nhập
        </Button>
      </Card>
    </div>
  );
};

export default Login;
